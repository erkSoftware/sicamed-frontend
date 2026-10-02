import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OPCIONES, ORDEN } from "./escena/guion";
import narracionCadena from "./escena/narracion.json";
import {
  CLAVES_CADENA,
  LOCUCIONES_QUE_ESPERAN,
  locucionDeCadena,
  rutaCadena,
} from "./escena/sonido";
import { TRAMOS } from "./telemedicina/guion";
import narracionTelemedicina from "./telemedicina/narracion.json";
import {
  CLAVES_TELEMEDICINA,
  efectoDeRecorrido,
  locucionDeRecorrido,
  rutaTelemedicina,
} from "./telemedicina/sonido";

type Narracion = {
  modelo: string;
  voz: string;
  instrucciones: string;
  lineas: { clave: string; texto: string }[];
};

const PUBLICO = join(process.cwd(), "public");

const huella = (narracion: Narracion, texto: string) =>
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

const comprobarPistas = (
  narracion: Narracion,
  claves: readonly string[],
  ruta: (clave: string) => string,
  carpeta: string,
) => {
  expect(narracion.voz).toBe("marin");
  expect(narracion.lineas.map((linea) => linea.clave)).toEqual([...claves]);
  const manifiesto = JSON.parse(
    readFileSync(join(PUBLICO, "audio", carpeta, "manifiesto.json"), "utf-8"),
  ) as Record<string, { huella: string }>;
  for (const linea of narracion.lineas) {
    expect(existsSync(join(PUBLICO, ruta(linea.clave)))).toBe(true);
    expect(manifiesto[linea.clave]?.huella).toBe(huella(narracion, linea.texto));
  }
};

describe("historias sonoras del acceso", () => {
  it("la pelicula de telemedicina narra cada tramo con su propia pista", () => {
    expect(TRAMOS.map((tramo) => locucionDeRecorrido(tramo.fase))).toEqual([
      ...CLAVES_TELEMEDICINA,
    ]);
    expect(locucionDeRecorrido("reposo")).toBeNull();
    for (const tramo of TRAMOS) expect(efectoDeRecorrido(tramo.fase)).not.toBeNull();
  });

  it("las pistas de telemedicina existen y corresponden al texto vigente", () => {
    comprobarPistas(
      narracionTelemedicina,
      CLAVES_TELEMEDICINA,
      (clave) => rutaTelemedicina(clave as (typeof CLAVES_TELEMEDICINA)[number]),
      "telemedicina",
    );
  });

  it("la cadena usa cada locucion y cada rama tiene la suya", () => {
    const usadas = new Set<string>();
    for (const fase of ORDEN)
      for (const rama of [null, ...OPCIONES.map((opcion) => opcion.clave)]) {
        const clave = locucionDeCadena(fase, rama);
        if (clave) usadas.add(clave);
      }
    expect(usadas).toEqual(new Set(CLAVES_CADENA));
    for (const opcion of OPCIONES)
      expect(locucionDeCadena("rama-transito", opcion.clave)).toBe(opcion.clave);
    expect([...LOCUCIONES_QUE_ESPERAN].every((clave) => usadas.has(clave))).toBe(true);
  });

  it("las pistas de la cadena existen y corresponden al texto vigente", () => {
    comprobarPistas(
      narracionCadena,
      CLAVES_CADENA,
      (clave) => rutaCadena(clave as (typeof CLAVES_CADENA)[number]),
      "cadena",
    );
  });
});
