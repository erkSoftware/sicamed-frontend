import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CAMPO_DEL_ARCHIVO,
  construirFormulario,
  motivoDeRechazo,
  subirAlAlmacenamiento,
  subirMedio,
} from "./medios";
import type { ArchivoASubir } from "./medios";
import type { PreparacionApi, RestriccionesApi, SubidaApi } from "./contrato";
import { ErrorApi } from "../problemDetails";

const subida: SubidaApi = {
  metodo: "POST",
  url: "https://almacenamiento.sicamed.co/medios",
  campos: { key: "medios/abc", policy: "firmada", "x-amz-signature": "abc123" },
  cabeceras: {},
  expira: "2026-08-29T20:00:00Z",
};

const restricciones: RestriccionesApi = {
  bytesMaximos: 5_242_880,
  cantidadMaxima: 8,
  ladoMaximo: 4096,
  mimes: ["image/jpeg", "image/png"],
  pixelesMaximos: 16_000_000,
  restantes: 3,
};

const archivo: ArchivoASubir = {
  nombre: "foto-lote.jpg",
  mime: "image/jpeg",
  bytes: 482_910,
  contenido: new Blob(["contenido"], { type: "image/jpeg" }),
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("orden del multipart", () => {
  it("los campos de la politica firmada van antes del archivo", () => {
    const formulario = construirFormulario(subida, archivo);
    const claves = [...formulario.keys()];
    expect(claves).toEqual(["key", "policy", "x-amz-signature", CAMPO_DEL_ARCHIVO]);
  });

  it("el archivo viaja siempre en el campo file y en ultimo lugar", () => {
    const claves = [...construirFormulario(subida, archivo).keys()];
    expect(claves[claves.length - 1]).toBe("file");
  });

  it("una politica sin campos sigue mandando el archivo", () => {
    const formulario = construirFormulario({ ...subida, campos: undefined }, archivo);
    expect([...formulario.keys()]).toEqual(["file"]);
  });
});

describe("validacion previa contra las restricciones", () => {
  it("acepta un archivo dentro de la politica", () => {
    expect(motivoDeRechazo(restricciones, archivo)).toBeNull();
  });

  it("rechaza un formato que el backend no admite", () => {
    expect(motivoDeRechazo(restricciones, { ...archivo, mime: "image/gif" })).toContain("image/gif");
  });

  it("rechaza un archivo mas pesado que el maximo", () => {
    expect(motivoDeRechazo(restricciones, { ...archivo, bytes: 9_000_000 })).toContain("supera");
  });

  it("rechaza la subida cuando la galeria ya esta llena", () => {
    expect(motivoDeRechazo({ ...restricciones, restantes: 0 }, archivo)).toContain("máximo de 8");
  });
});

describe("subida directa al almacenamiento", () => {
  it("no pasa por la API de SICAMED", async () => {
    const peticion = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await subirAlAlmacenamiento(subida, archivo);
    expect(peticion.mock.calls[0]?.[0]).toBe(subida.url);
    expect(peticion.mock.calls[0]?.[1]?.body).toBeInstanceOf(FormData);
  });

  it("una autorizacion vencida se explica al usuario, no se traga", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 403 }));
    const error = (await subirAlAlmacenamiento(subida, archivo).catch(
      (fallo: unknown) => fallo,
    )) as ErrorApi;
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.problema.detail).toContain("preparar la subida");
  });
});

describe("los tres pasos completos", () => {
  const preparacion: PreparacionApi = { medioId: "MED-1", restricciones, subida };

  it("prepara, sube y confirma en ese orden", async () => {
    const llamadas: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((entrada: RequestInfo | URL) => {
      const url = String(entrada);
      llamadas.push(url);
      if (url.includes("medios:preparar"))
        return Promise.resolve(
          new Response(JSON.stringify(preparacion), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          }),
        );
      if (url.startsWith("https://almacenamiento"))
        return Promise.resolve(new Response(null, { status: 204 }));
      return Promise.resolve(
        new Response(JSON.stringify({ id: "MED-1", alt: "Lote en secado" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    const medio = await subirMedio(
      {
        entidad: "LOTE",
        entidadId: "LOT-1",
        nombre: archivo.nombre,
        mime: archivo.mime,
        bytes: archivo.bytes,
        clasificacion: "PUBLICO",
      },
      archivo,
      { alt: "Lote 83035d en secado", sinPersonas: true },
    );

    expect(medio.id).toBe("MED-1");
    expect(llamadas[0]).toContain("/medios:preparar");
    expect(llamadas[1]).toBe(subida.url);
    expect(llamadas[2]).toContain("/medios/MED-1:confirmar");
  });

  it("no sube nada si el archivo no cumple las restricciones que devolvio el paso uno", async () => {
    const peticion = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ...preparacion, restricciones: { ...restricciones, restantes: 0 } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(
      subirMedio(
        { entidad: "LOTE", entidadId: "LOT-1", nombre: archivo.nombre, mime: archivo.mime, bytes: archivo.bytes },
        archivo,
        { alt: "Lote en secado", sinPersonas: true },
      ),
    ).rejects.toBeInstanceOf(ErrorApi);
    expect(peticion).toHaveBeenCalledTimes(1);
  });

  it("la declaracion de habeas data viaja en la confirmacion y no se rellena sola", async () => {
    let cuerpoDeConfirmacion = "";
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (entrada: RequestInfo | URL, opciones?: RequestInit) => {
        const url = String(entrada);
        if (url.includes("medios:preparar"))
          return Promise.resolve(
            new Response(JSON.stringify(preparacion), {
              status: 201,
              headers: { "Content-Type": "application/json" },
            }),
          );
        if (url.startsWith("https://almacenamiento"))
          return Promise.resolve(new Response(null, { status: 204 }));
        cuerpoDeConfirmacion = String(opciones?.body);
        return Promise.resolve(
          new Response(JSON.stringify({ id: "MED-1" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      },
    );

    await subirMedio(
      { entidad: "OFERTA", entidadId: "OFE-1", nombre: archivo.nombre, mime: archivo.mime, bytes: archivo.bytes },
      archivo,
      { alt: "Aceite en vitrina", sinPersonas: false },
    );

    expect(JSON.parse(cuerpoDeConfirmacion)).toMatchObject({
      alt: "Aceite en vitrina",
      sinPersonas: false,
    });
  });
});
