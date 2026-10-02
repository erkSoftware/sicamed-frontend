import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEPARTAMENTOS } from "../../shared/api/mock/catalogos";
import { recortarSilencio } from "../../shared/ui/sonido/locutor";
import {
  CLAVES_LINEA,
  inauguraLocucion,
  locucionDelTramo,
  rutaDepartamento,
  rutaLinea,
} from "./bandaSonora";
import { TRAMOS } from "./guion";
import narracion from "./narracion.json";

const PUBLICO = join(process.cwd(), "public");

const manifiesto = JSON.parse(
  readFileSync(join(PUBLICO, "audio", "intro", "manifiesto.json"), "utf-8"),
) as Record<string, { huella: string; texto: string }>;

const huella = (texto: string) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        modelo: narracion.modelo,
        voz: narracion.voz,
        instrucciones: narracion.instrucciones,
        texto,
      }),
    )
    .digest("hex")
    .slice(0, 16);

const pronunciacion = narracion.departamento.pronunciacion as Record<string, string>;

describe("banda sonora de la introduccion", () => {
  it("recorta el silencio de los extremos con un margen corto", () => {
    const frecuencia = 1000;
    const muestras = new Float32Array(3000);
    muestras.fill(0.3, 1000, 2000);
    const recorte = recortarSilencio(muestras, frecuencia);
    expect(recorte.desde).toBeCloseTo(0.96, 2);
    expect(recorte.duracion).toBeCloseTo(1.079, 2);
  });

  it("deja entera una pista que es todo silencio", () => {
    expect(recortarSilencio(new Float32Array(500), 1000)).toEqual({ desde: 0, duracion: 0.5 });
  });

  it("cada tramo de la pelicula tiene una locucion y cada locucion se inaugura una vez", () => {
    const inauguradas = TRAMOS.filter((tramo) => inauguraLocucion(tramo.fase)).map((tramo) =>
      locucionDelTramo(tramo.fase),
    );
    expect(new Set(inauguradas).size).toBe(inauguradas.length);
    expect(new Set(TRAMOS.map((tramo) => locucionDelTramo(tramo.fase)))).toEqual(
      new Set([...CLAVES_LINEA, "departamento"]),
    );
  });

  it("el guion de narracion declara exactamente las lineas que la banda pide", () => {
    expect(narracion.voz).toBe("marin");
    expect(narracion.lineas.map((linea) => linea.clave)).toEqual([...CLAVES_LINEA]);
  });

  it("cada linea tiene su pista generada con el texto vigente", () => {
    for (const linea of narracion.lineas) {
      expect(
        existsSync(join(PUBLICO, rutaLinea(linea.clave as (typeof CLAVES_LINEA)[number]))),
      ).toBe(true);
      expect(manifiesto[linea.clave]?.huella).toBe(huella(linea.texto));
    }
  });

  it("cada departamento del catalogo tiene su pista generada con el texto vigente", () => {
    for (const departamento of DEPARTAMENTOS) {
      const texto = narracion.departamento.plantilla.replace(
        "{nombre}",
        pronunciacion[departamento.codigo] ?? departamento.nombre,
      );
      expect(existsSync(join(PUBLICO, rutaDepartamento(departamento.codigo)))).toBe(true);
      expect(manifiesto[`departamentos/${departamento.codigo}`]?.huella).toBe(huella(texto));
    }
  });
});
