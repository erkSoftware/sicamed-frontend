import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CodigoIdioma } from "../../shared/i18n/idioma";
import {
  CARPETA_POR_IDIOMA,
  CLAVES_LINEA,
  efectoDeFase,
  locucionDeFase,
  rutaLinea,
} from "./bandaSonora";
import { ROTULOS, TRAMOS } from "./guion";
import narracionEn from "./narracion.en.json";
import narracionEs from "./narracion.json";

const PUBLICO = join(process.cwd(), "public");

type Narracion = typeof narracionEs;

const GUIONES: readonly { idioma: CodigoIdioma; narracion: Narracion }[] = [
  { idioma: "es", narracion: narracionEs },
  { idioma: "en", narracion: narracionEn },
];

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

const manifiestoDe = (idioma: CodigoIdioma) =>
  JSON.parse(
    readFileSync(join(PUBLICO, CARPETA_POR_IDIOMA[idioma], "manifiesto.json"), "utf-8"),
  ) as Record<string, { huella: string; texto: string }>;

describe("banda sonora de la pelicula de la vitrina", () => {
  it("cada locucion pertenece a una sola fase y todas se usan", () => {
    const usadas = TRAMOS.map((tramo) => locucionDeFase(tramo.fase)).filter(
      (clave) => clave !== null,
    );
    expect(new Set(usadas).size).toBe(usadas.length);
    expect(new Set(usadas)).toEqual(new Set(CLAVES_LINEA));
  });

  it("toda fase con rotulo en pantalla tambien tiene voz", () => {
    for (const rotulo of ROTULOS) expect(locucionDeFase(rotulo.fase)).not.toBeNull();
  });

  it("la invitacion y la salida no tienen voz ni efecto propio", () => {
    expect(locucionDeFase("invitacion")).toBeNull();
    expect(locucionDeFase("salida")).toBeNull();
    expect(efectoDeFase("invitacion")).toBeNull();
    expect(efectoDeFase("salida")).toBeNull();
  });

  for (const { idioma, narracion } of GUIONES) {
    it(`el guion en ${idioma} usa la voz marin y declara las lineas que la banda pide`, () => {
      expect(narracion.voz).toBe("marin");
      expect(narracion.lineas.map((linea) => linea.clave)).toEqual([...CLAVES_LINEA]);
    });

    it(`cada linea en ${idioma} tiene su pista generada con el texto vigente`, () => {
      const manifiesto = manifiestoDe(idioma);
      for (const linea of narracion.lineas) {
        const clave = linea.clave as (typeof CLAVES_LINEA)[number];
        expect(existsSync(join(PUBLICO, rutaLinea(idioma, clave)))).toBe(true);
        expect(manifiesto[clave]?.huella).toBe(huella(narracion, linea.texto));
      }
    });
  }
});
