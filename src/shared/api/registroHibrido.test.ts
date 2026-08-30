import { afterEach, describe, expect, it, vi } from "vitest";

const SOLICITUD = {
  nit: "900123456-8",
  organizacion: "Cultivos del Cauca SAS",
  tipoActor: "CULTIVADOR",
  departamento: "Cauca",
  municipio: "Popayán",
  representante: "Ana Gómez",
  correo: "ana@ejemplo.co",
  telefono: "3001234567",
  clave: "clave-de-prueba-larga",
} as const;

const cargarComercial = async (modoApi: string, modoAuth: string) => {
  vi.stubEnv("VITE_MODO_API", modoApi);
  vi.stubEnv("VITE_MODO_AUTH", modoAuth);
  vi.resetModules();
  return (await import("./clienteComercial")).apiComercial;
};

const responder = () =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ solicitudId: "sol-1", radicado: "R-1", estado: "RADICADA" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }),
  );

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("registro en modo hibrido", () => {
  it("radica contra el servidor aunque los datos del panel sean simulados", async () => {
    const comercial = await cargarComercial("mock", "servidor");
    const peticion = responder();
    await comercial.radicarSolicitud({ ...SOLICITUD });
    expect(peticion).toHaveBeenCalledTimes(1);
    expect(new URL(String(peticion.mock.calls[0]?.[0])).pathname).toBe(
      "/api/v1/comercial/actores/solicitudes",
    );
  });

  it("deja los listados del panel en el simulador", async () => {
    const comercial = await cargarComercial("mock", "servidor");
    const peticion = responder();
    await comercial.solicitudes({});
    expect(peticion).not.toHaveBeenCalled();
  });

  it("no sale a la red cuando tambien la identidad es simulada", async () => {
    const comercial = await cargarComercial("mock", "mock");
    const peticion = responder();
    await comercial.radicarSolicitud({ ...SOLICITUD });
    expect(peticion).not.toHaveBeenCalled();
  });
});
