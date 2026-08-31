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
    new Response(
      JSON.stringify({
        solicitudId: "sol-1",
        radicado: "R-1",
        estado: "RADICADA",
        datos: [],
        pagina: 1,
        porPagina: 10,
        total: 0,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    ),
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

  it("lee la bandeja de solicitudes de donde salió la radicación", async () => {
    const comercial = await cargarComercial("mock", "servidor");
    const peticion = responder();
    await comercial.solicitudes({});
    expect(peticion).toHaveBeenCalledTimes(1);
    expect(new URL(String(peticion.mock.calls[0]?.[0])).pathname).toBe(
      "/api/v1/comercial/actores/solicitudes",
    );
  });

  it("abre el expediente contra el mismo servidor que guarda la solicitud", async () => {
    const comercial = await cargarComercial("mock", "servidor");
    const peticion = responder();
    await comercial
      .abrirExpediente({
        solicitudId: "sol-1",
        autor: {
          usuarioId: "USR-1",
          nombre: "Ana Ruiz",
          organizacionId: "org-1",
          rol: "ANALISTA_DOCUMENTAL",
        },
      })
      .catch(() => undefined);
    expect(new URL(String(peticion.mock.calls[0]?.[0])).pathname).toBe(
      "/api/v1/comercial/cumplimiento/expedientes",
    );
  });

  it("deja en el simulador los listados que el registro no produce", async () => {
    const comercial = await cargarComercial("mock", "servidor");
    const peticion = responder();
    await comercial.cultivos({});
    await comercial.lotes({});
    expect(peticion).not.toHaveBeenCalled();
  });

  it("no sale a la red cuando tambien la identidad es simulada", async () => {
    const comercial = await cargarComercial("mock", "mock");
    const peticion = responder();
    await comercial.radicarSolicitud({ ...SOLICITUD });
    expect(peticion).not.toHaveBeenCalled();
  });
});
