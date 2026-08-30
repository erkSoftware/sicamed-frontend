import { describe, expect, it, vi, afterEach } from "vitest";
import {
  BYTES_MAXIMOS,
  CAMPO_DEL_ARCHIVO,
  construirFormulario,
  motivoDeRechazo,
  rechazoDeLaPreparacion,
  subirAlAlmacenamiento,
} from "./actores";
import type { PreparacionSoporteApi, SubidaSoporteApi } from "./contrato";

const SUBIDA: SubidaSoporteApi = {
  url: "https://almacen.example/sicamed-originales",
  metodo: "POST",
  expira: "2026-08-30T17:53:08Z",
  campos: {
    "Content-Type": "application/pdf",
    key: "originales/radicacion/6e/abc",
    "x-amz-signature": "firma",
  },
};

const archivo = (bytes: number, mime = "application/pdf") => ({
  nombre: "licencia.pdf",
  mime,
  bytes,
  contenido: new Blob(["x".repeat(Math.min(bytes, 16))], { type: mime }),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("subida de soportes de registro", () => {
  it("pone el archivo al final, despues de los campos firmados", () => {
    const formulario = construirFormulario(SUBIDA, archivo(4111));
    const claves = [...formulario.keys()];
    expect(claves.at(-1)).toBe(CAMPO_DEL_ARCHIVO);
    expect(claves.slice(0, -1)).toEqual([
      "Content-Type",
      "key",
      "x-amz-signature",
    ]);
  });

  it("no manda cabecera de autorizacion al almacenamiento", async () => {
    const peticion = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal("fetch", peticion);
    await subirAlAlmacenamiento(SUBIDA, archivo(4111));
    const opciones = peticion.mock.calls[0]?.[1] as RequestInit;
    expect(opciones.headers).toBeUndefined();
    expect(opciones.method).toBe("POST");
  });

  it("un rechazo del almacenamiento llega como problema legible, no como excepcion cruda", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    await expect(subirAlAlmacenamiento(SUBIDA, archivo(4111))).rejects.toMatchObject({
      problema: { status: 403 },
    });
  });

  it("rechaza antes de gastar una peticion lo que el contrato no admite", () => {
    expect(motivoDeRechazo(archivo(4111))).toBeNull();
    expect(motivoDeRechazo(archivo(0))).toContain("vacío");
    expect(motivoDeRechazo(archivo(4111, "application/zip"))).toContain("no está admitido");
    expect(motivoDeRechazo(archivo(BYTES_MAXIMOS + 1))).toContain("10 MB");
  });

  it("respeta los limites que declara la preparacion, no los que trae el portal", () => {
    const preparacion: PreparacionSoporteApi = {
      soporteId: "7de6cbf3",
      subida: SUBIDA,
      mimesAdmitidos: ["application/pdf"],
      bytesMaximos: 1024,
    };
    expect(rechazoDeLaPreparacion(preparacion, archivo(512))).toBeNull();
    expect(rechazoDeLaPreparacion(preparacion, archivo(512, "image/png"))?.problema.status).toBe(
      422,
    );
    expect(rechazoDeLaPreparacion(preparacion, archivo(2048))?.problema.status).toBe(422);
  });
});
