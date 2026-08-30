import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baseDeZona, construirUrl, registrarCredencial, solicitar } from "./transporte";
import { ErrorApi } from "./problemDetails";

const respuesta = (
  cuerpo: unknown,
  estado = 200,
  cabeceras: Record<string, string> = {},
): Response =>
  new Response(estado === 204 ? null : JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json", ...cabeceras },
  });

const espia = () => vi.spyOn(globalThis, "fetch");

beforeEach(() => {
  registrarCredencial(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("forma de las URL", () => {
  it("cada zona cuelga de su prefijo /api/v1", () => {
    expect(baseDeZona("publico")).toMatch(/\/api\/v1\/publico$/);
    expect(baseDeZona("comercial")).toMatch(/\/api\/v1\/comercial$/);
    expect(baseDeZona("clinico")).toMatch(/\/api\/v1\/clinica$/);
  });

  it("la zona clinica usa el prefijo clinica y no clinico", () => {
    expect(baseDeZona("clinico")).not.toContain("/clinico");
  });

  it("omite los parametros vacios o indefinidos", () => {
    const url = construirUrl("comercial", "/lotes", {
      busqueda: "",
      estado: undefined,
      departamento: "Cauca",
      pagina: 2,
    });
    expect(url.searchParams.get("busqueda")).toBeNull();
    expect(url.searchParams.get("estado")).toBeNull();
    expect(url.searchParams.get("departamento")).toBe("Cauca");
    expect(url.searchParams.get("pagina")).toBe("2");
  });

  it("repite la clave cuando el parametro es una lista", () => {
    const url = construirUrl("comercial", "/organizaciones/resumen", { ids: ["ORG-1", "ORG-2"] });
    expect(url.searchParams.getAll("ids")).toEqual(["ORG-1", "ORG-2"]);
  });
});

describe("credenciales por zona", () => {
  it("manda el portador en la zona autenticada", async () => {
    registrarCredencial(() => "jwt-de-prueba");
    const peticion = espia().mockResolvedValue(respuesta({ ok: true }));
    await solicitar("comercial", "/iam/sesion");
    const cabeceras = peticion.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(cabeceras.Authorization).toBe("Bearer jwt-de-prueba");
  });

  it("nunca manda el portador ni cookies en la zona publica", async () => {
    registrarCredencial(() => "jwt-de-prueba");
    const peticion = espia().mockResolvedValue(respuesta({ ofertas: [] }));
    await solicitar("publico", "/ofertas");
    const opciones = peticion.mock.calls[0]?.[1];
    expect((opciones?.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(opciones?.credentials).toBe("omit");
  });

  it("la zona clinica no deja rastro en cache", async () => {
    const peticion = espia().mockResolvedValue(respuesta([]));
    await solicitar("clinico", "/agenda");
    expect(peticion.mock.calls[0]?.[1]?.cache).toBe("no-store");
  });

  it("no declara Content-Type cuando la peticion no lleva cuerpo", async () => {
    const peticion = espia().mockResolvedValue(respuesta([]));
    await solicitar("comercial", "/ruedas-negocio");
    const cabeceras = peticion.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(cabeceras["Content-Type"]).toBeUndefined();
  });

  it("serializa el cuerpo y declara el tipo cuando escribe", async () => {
    const peticion = espia().mockResolvedValue(respuesta({ id: "OFE-1" }));
    await solicitar("comercial", "/ofertas", { metodo: "POST", cuerpo: { titulo: "Lote" } });
    const opciones = peticion.mock.calls[0]?.[1];
    expect(opciones?.method).toBe("POST");
    expect(opciones?.body).toBe('{"titulo":"Lote"}');
    expect((opciones?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });
});

describe("errores", () => {
  it("propaga el problem+json tal como lo redacto el backend", async () => {
    espia().mockResolvedValue(
      respuesta(
        {
          type: "https://sicamed.co/problemas/permiso-denegado",
          title: "Acceso denegado",
          detail: "La operación exige el permiso 'produccion:cultivo:escribir'",
          status: 403,
          norma: "Res. 1241/2026 Art. 13b",
          accion: { etiqueta: "Solicitar habilitación", ruta: "/app/licencias" },
        },
        403,
      ),
    );
    await expect(solicitar("comercial", "/cultivos")).rejects.toMatchObject({
      problema: {
        status: 403,
        norma: "Res. 1241/2026 Art. 13b",
        accion: { ruta: "/app/licencias" },
      },
    });
  });

  it("conserva los errores por campo del 422", async () => {
    espia().mockResolvedValue(
      respuesta(
        {
          type: "https://sicamed.co/problemas/contenido-invalido",
          title: "La petición no cumple el contrato",
          detail: "Revise estos campos: nit",
          status: 422,
          errores: [{ campo: "nit", motivo: "Es más corto de lo admitido." }],
        },
        422,
      ),
    );
    const error = await solicitar("comercial", "/actores/solicitudes", {
      metodo: "POST",
      cuerpo: {},
    }).catch((fallo: unknown) => fallo as ErrorApi);
    expect(error).toBeInstanceOf(ErrorApi);
    expect((error as ErrorApi).problema.errores).toEqual([
      { campo: "nit", motivo: "Es más corto de lo admitido." },
    ]);
  });

  it("recoge la espera declarada por el limite de tasa", async () => {
    espia().mockResolvedValue(
      respuesta({ type: "t", title: "Demasiadas peticiones", detail: "", status: 429 }, 429, {
        "ratelimit-reset": "60",
      }),
    );
    const error = (await solicitar("comercial", "/iam/sesion").catch(
      (fallo: unknown) => fallo,
    )) as ErrorApi;
    expect(error.problema.reintentarEn).toBe(60);
  });

  it("inventa un problema legible cuando el cuerpo no es problem+json", async () => {
    espia().mockResolvedValue(new Response("<html>502</html>", { status: 502 }));
    const error = (await solicitar("comercial", "/lotes").catch((fallo: unknown) => fallo)) as ErrorApi;
    expect(error.problema.status).toBe(502);
    expect(error.problema.title).toBe("No fue posible completar la operación");
  });

  it("distingue el fallo de red del error del servicio", async () => {
    espia().mockRejectedValue(new TypeError("Failed to fetch"));
    const error = (await solicitar("publico", "/ofertas").catch((fallo: unknown) => fallo)) as ErrorApi;
    expect(error.problema.status).toBe(0);
    expect(error.problema.type).toContain("servicio-inalcanzable");
  });
});

describe("identificador de la solicitud", () => {
  it("guarda el x-request-id que viaja en la cabecera del error", async () => {
    espia().mockResolvedValue(
      respuesta({ type: "t", title: "Error inesperado", status: 500, detail: "d" }, 500, {
        "x-request-id": "f02cb987ba0f3f571b06f52bc9a2a76d",
      }),
    );
    const error = (await solicitar("comercial", "/lotes").catch((fallo: unknown) => fallo)) as ErrorApi;
    expect(error.problema.solicitudId).toBe("f02cb987ba0f3f571b06f52bc9a2a76d");
  });

  it("no inventa identificador cuando el borde no lo manda", async () => {
    espia().mockResolvedValue(respuesta({ type: "t", title: "x", status: 403, detail: "d" }, 403));
    const error = (await solicitar("comercial", "/lotes").catch((fallo: unknown) => fallo)) as ErrorApi;
    expect(error.problema.solicitudId).toBeUndefined();
  });
});

describe("respuestas sin cuerpo", () => {
  it("el 204 no intenta interpretar json", async () => {
    espia().mockResolvedValue(new Response(null, { status: 204 }));
    await expect(solicitar("comercial", "/medios/MED-1", { metodo: "DELETE" })).resolves.toBeUndefined();
  });
});
