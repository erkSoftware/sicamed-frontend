import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { solicitar as SolicitarTipo } from "./transporte";

let solicitar: typeof SolicitarTipo;

const PERMITIDAS = new Set(
  [
    "accept",
    "accept-language",
    "authorization",
    "cf-turnstile-response",
    "content-type",
    "idempotency-key",
    "x-correlation-id",
    "x-motivo-consulta",
    "x-request-id",
  ].map((nombre) => nombre.toLowerCase()),
);

const responder = () =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );

const cabecerasEnviadas = (peticion: ReturnType<typeof responder>): string[] =>
  Object.keys((peticion.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>).map(
    (nombre) => nombre.toLowerCase(),
  );

beforeAll(async () => {
  vi.stubEnv("VITE_MODO_API", "http");
  vi.resetModules();
  solicitar = (await import("./transporte")).solicitar;
  (await import("./transporte")).registrarCredencial(() => "token-de-prueba");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cabeceras contra la lista blanca de CORS", () => {
  it.each(["identidad", "comercial", "clinico", "publico"] as const)(
    "la zona %s no manda ninguna cabecera fuera de la lista",
    async (zona) => {
      const peticion = responder();
      await solicitar(zona, "/prueba", { metodo: "POST", cuerpo: { dato: 1 } });
      const fuera = cabecerasEnviadas(peticion).filter((nombre) => !PERMITIDAS.has(nombre));
      expect(fuera).toEqual([]);
    },
  );

  it("no manda Cache-Control en la peticion de identidad y pide no-store al navegador", async () => {
    const peticion = responder();
    await solicitar("identidad", "/login", { metodo: "POST", cuerpo: { correo: "a@b.co" } });
    expect(cabecerasEnviadas(peticion)).not.toContain("cache-control");
    expect(peticion.mock.calls[0]?.[1]?.cache).toBe("no-store");
  });

  it("manda la cookie de refresco en identidad y la omite en la zona publica", async () => {
    const identidad = responder();
    await solicitar("identidad", "/refresh", { metodo: "POST" });
    expect(identidad.mock.calls[0]?.[1]?.credentials).toBe("include");
    vi.restoreAllMocks();
    const publica = responder();
    await solicitar("publico", "/ofertas");
    expect(publica.mock.calls[0]?.[1]?.credentials).toBe("omit");
  });
});
