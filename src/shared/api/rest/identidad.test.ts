import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type * as IdentidadTipo from "./identidad";

let identidad: typeof IdentidadTipo;

const json = (cuerpo: unknown, estado = 200): Response =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json" },
  });

const acceso = {
  acceso: "eyJ",
  expiraEn: 900,
  tipo: "Bearer",
  cuenta: {
    id: "9381e129",
    nombre: "Ana Ruiz",
    correo: "ana@cultivos.co",
    rol: "PRODUCTOR",
    organizacionId: "28b56bf3",
  },
};

const responder = (cuerpo: unknown, estado = 200) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json(cuerpo, estado));

const peticionDe = (espia: ReturnType<typeof responder>) => ({
  url: new URL(String(espia.mock.calls[0]?.[0])),
  opciones: espia.mock.calls[0]?.[1] as RequestInit,
});

beforeAll(async () => {
  vi.stubEnv("VITE_TURNSTILE_CLAVE_SITIO", "");
  vi.resetModules();
  identidad = await import("./identidad");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("las rutas de identidad viven bajo /auth y no bajo /api/v1", () => {
  it("entra contra /auth/login con el comprobante en su cabecera", async () => {
    const espia = responder(acceso);
    await identidad.entrar({ correo: "ana@cultivos.co", clave: "la contrasena", captcha: "tok" });
    const { url, opciones } = peticionDe(espia);
    expect(url.pathname).toBe("/auth/login");
    expect(opciones.method).toBe("POST");
    expect((opciones.headers as Record<string, string>)["CF-Turnstile-Response"]).toBe("tok");
    expect(JSON.parse(String(opciones.body))).toEqual({
      correo: "ana@cultivos.co",
      clave: "la contrasena",
    });
  });

  it("el cuerpo del login no lleva rol ni organizacion: eso lo decide el servidor", async () => {
    const espia = responder(acceso);
    await identidad.entrar({ correo: "ana@cultivos.co", clave: "x" });
    const { opciones } = peticionDe(espia);
    const cuerpo = JSON.parse(String(opciones.body)) as Record<string, unknown>;
    expect(Object.keys(cuerpo).sort()).toEqual(["clave", "correo"]);
  });

  it("el refresco manda la cookie: sin credentials include no viaja", async () => {
    const espia = responder(acceso);
    await identidad.refrescar();
    const { url, opciones } = peticionDe(espia);
    expect(url.pathname).toBe("/auth/refresh");
    expect(opciones.credentials).toBe("include");
  });

  it("la salida de todas las sesiones va por parametro y no por cuerpo", async () => {
    const espia = responder(undefined, 204);
    await identidad.salir(true);
    const { url, opciones } = peticionDe(espia);
    expect(url.pathname).toBe("/auth/logout");
    expect(url.searchParams.get("todas")).toBe("true");
    expect(opciones.body).toBeUndefined();
  });

  it("el cambio de clave se ejerce sin sesion y no devuelve token", async () => {
    const espia = responder(undefined, 204);
    const respuesta = await identidad.cambiarClave({
      correo: "ana@cultivos.co",
      claveActual: "la provisional",
      claveNueva: "una-clave-de-al-menos-12",
      captcha: "tok",
    });
    const { url } = peticionDe(espia);
    expect(url.pathname).toBe("/auth/cambiar-clave");
    expect(respuesta).toBeUndefined();
  });

  it("quien soy consulta /auth/yo", async () => {
    const espia = responder({
      sujeto: "9381e129",
      nombre: "Ana Ruiz",
      correo: "ana@cultivos.co",
      tenantId: "018e",
      organizacionId: "28b5",
      roles: ["PRODUCTOR"],
      permisos: [],
      zonaClinica: false,
    });
    await identidad.quienSoy();
    expect(peticionDe(espia).url.pathname).toBe("/auth/yo");
  });
});
