import { describe, expect, it } from "vitest";
import { clasificarEvento, leerEvento } from "./eventos";
import { normalizarRms, seguir } from "./nivel";
import { envolventeHabla, trocear } from "./demostracion";
import { diagnosticar } from "./diagnostico";
import { FalloVoz } from "./sesion";
import { ErrorApi } from "../../../api/problemDetails";
import { enPerimetro } from "../HaloVoz";

describe("normalizarRms", () => {
  it("deja el silencio en cero y nunca pasa de uno", () => {
    expect(normalizarRms(0)).toBe(0);
    expect(normalizarRms(-1)).toBe(0);
    expect(normalizarRms(Number.NaN)).toBe(0);
    expect(normalizarRms(0.0001)).toBe(0);
    expect(normalizarRms(1)).toBe(1);
    expect(normalizarRms(9)).toBe(1);
  });

  it("crece con el volumen", () => {
    expect(normalizarRms(0.05)).toBeGreaterThan(normalizarRms(0.02));
    expect(normalizarRms(0.2)).toBeGreaterThan(normalizarRms(0.05));
  });
});

describe("seguir", () => {
  it("sube rápido y baja despacio", () => {
    const subida = seguir(0, 1, 0.4, 0.05);
    const bajada = seguir(1, 0, 0.4, 0.05);
    expect(subida).toBeCloseTo(0.4);
    expect(bajada).toBeCloseTo(0.95);
  });

  it("no se pasa del destino con factores fuera de rango", () => {
    expect(seguir(0, 1, 4, 0.05)).toBe(1);
    expect(seguir(1, 0, 0.4, -2)).toBe(1);
  });
});

describe("clasificarEvento", () => {
  it("despacha por sufijo y no por igualdad estricta", () => {
    expect(clasificarEvento("response.function_call_arguments.done")).toBe("herramienta");
    expect(clasificarEvento("conversation.item.function_call_arguments.done")).toBe("herramienta");
    expect(clasificarEvento("response.audio_transcript.delta")).toBe("transcripcion");
    expect(clasificarEvento("response.output_audio_transcript.delta")).toBe("transcripcion");
  });

  it("no confunde el fin de una transcripción con el fin de la respuesta", () => {
    expect(clasificarEvento("response.audio_transcript.done")).toBe("ignorado");
    expect(clasificarEvento("response.done")).toBe("respuesta-termina");
    expect(clasificarEvento("response.created")).toBe("respuesta-inicia");
  });

  it("reconoce la interrupción del usuario y el error", () => {
    expect(clasificarEvento("input_audio_buffer.speech_started")).toBe("habla-inicia");
    expect(clasificarEvento("input_audio_buffer.speech_stopped")).toBe("habla-termina");
    expect(clasificarEvento("error")).toBe("error");
    expect(clasificarEvento(undefined)).toBe("ignorado");
  });
});

describe("leerEvento", () => {
  it("devuelve null ante basura y objeto ante json válido", () => {
    expect(leerEvento("{")).toBeNull();
    expect(leerEvento("null")).toBeNull();
    expect(leerEvento("[1,2]")).not.toBeNull();
    expect(leerEvento(new ArrayBuffer(4))).toBeNull();
    expect(leerEvento('{"type":"error"}')).toEqual({ type: "error" });
  });
});

describe("trocear", () => {
  it("reparte la frase en fragmentos con espacio final", () => {
    const trozos = trocear("uno dos tres cuatro cinco");
    expect(trozos).toHaveLength(3);
    expect(trozos.join("").trim()).toBe("uno dos tres cuatro cinco");
    trozos.forEach((trozo) => expect(trozo.endsWith(" ")).toBe(true));
  });

  it("no produce fragmentos vacíos con espacios de más", () => {
    expect(trocear("  hola   mundo  ")).toEqual(["hola mundo "]);
    expect(trocear("")).toEqual([]);
  });
});

describe("envolventeHabla", () => {
  it("se mantiene dentro del rango dibujable", () => {
    for (let t = 0; t < 6; t += 0.017) {
      const valor = envolventeHabla(t);
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
  });
});

const problema = (status: number, type: string) =>
  new ErrorApi({
    type,
    title: "Título",
    detail: "Detalle",
    status,
  });

describe("diagnosticar", () => {
  it("esconde el micrófono cuando el rol no puede abrir sesión", () => {
    const salida = diagnosticar(problema(403, "https://sicamed.co/problemas/permiso-denegado"));
    expect(salida.vedar).toBe(true);
  });

  it("esconde el micrófono cuando el asistente está apagado en el despliegue", () => {
    const salida = diagnosticar(
      problema(503, "https://sicamed.co/problemas/asistente-deshabilitado"),
    );
    expect(salida.vedar).toBe(true);
    expect(salida.fallo.reintentable).toBe(false);
  });

  it("no esconde el micrófono cuando el proveedor no respondió", () => {
    const salida = diagnosticar(
      problema(503, "https://sicamed.co/problemas/proveedor-realtime-no-disponible"),
    );
    expect(salida.vedar).toBe(false);
    expect(salida.fallo.reintentable).toBe(true);
  });

  it("separa el permiso del micrófono del rechazo del proveedor", () => {
    const negado = diagnosticar(new FalloVoz("permiso-negado"));
    const rechazo = diagnosticar(new FalloVoz("proveedor", 401));
    expect(negado.fallo.titulo).not.toBe(rechazo.fallo.titulo);
    expect(negado.vedar).toBe(false);
    expect(rechazo.fallo.reintentable).toBe(true);
  });

  it("cae en un mensaje propio ante un motivo desconocido", () => {
    expect(diagnosticar(new Error("cualquiera")).fallo.reintentable).toBe(true);
  });
});

describe("enPerimetro", () => {
  it("recorre los cuatro bordes sin salirse del rectángulo", () => {
    for (let paso = 0; paso <= 200; paso += 1) {
      const { x, y } = enPerimetro(paso / 200, 320, 180);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(320);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(180);
      const enBorde = x === 0 || y === 0 || Math.abs(x - 320) < 1e-9 || Math.abs(y - 180) < 1e-9;
      expect(enBorde).toBe(true);
    }
  });

  it("cierra la vuelta y tolera avances negativos o mayores que uno", () => {
    expect(enPerimetro(0, 100, 50)).toEqual(enPerimetro(1, 100, 50));
    expect(enPerimetro(-0.25, 100, 50)).toEqual(enPerimetro(0.75, 100, 50));
    expect(enPerimetro(2.5, 100, 50)).toEqual(enPerimetro(0.5, 100, 50));
  });

  it("toca arriba, derecha, abajo e izquierda en ese orden", () => {
    expect(enPerimetro(0.125, 100, 50)).toEqual({ x: 37.5, y: 0 });
    expect(enPerimetro(0.375, 100, 50)).toEqual({ x: 100, y: 12.5 });
    expect(enPerimetro(0.625, 100, 50)).toEqual({ x: 62.5, y: 50 });
    expect(enPerimetro(0.875, 100, 50)).toEqual({ x: 0, y: 37.5 });
  });
});
