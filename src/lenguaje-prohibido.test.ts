import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = join(process.cwd(), "src");
const EXTENSIONES = new Set([".ts", ".tsx", ".css"]);

const TERMINOS_PROHIBIDOS = [
  "precio",
  "ordendecompra",
  "orden_de_compra",
  "carrito",
  "checkout",
  "pasarela",
  "facturacion",
];

const ARCHIVOS_QUE_EXPLICAN_LA_PROHIBICION = [
  join("publico", "paginas", "Inicio.tsx"),
  join("features", "vitrina", "modelo", "mapeo.test.ts"),
  "lenguaje-prohibido.test.ts",
];

const archivos = (directorio: string): readonly string[] =>
  readdirSync(directorio).flatMap((entrada) => {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return EXTENSIONES.has(extname(ruta)) ? [ruta] : [];
  });

const FUENTES = archivos(RAIZ);

const exento = (ruta: string): boolean =>
  ARCHIVOS_QUE_EXPLICAN_LA_PROHIBICION.some((sufijo) => ruta.endsWith(sufijo));

describe("lenguaje del dominio", () => {
  it("ningun archivo introduce vocabulario transaccional prohibido", () => {
    const hallazgos: string[] = [];
    for (const ruta of FUENTES.filter((archivo) => !exento(archivo))) {
      const contenido = readFileSync(ruta, "utf-8").toLowerCase();
      for (const termino of TERMINOS_PROHIBIDOS) {
        if (contenido.includes(termino)) hallazgos.push(`${ruta}: ${termino}`);
      }
    }
    expect(hallazgos).toEqual([]);
  });

  it("ningun archivo del codigo lleva comentarios", () => {
    const hallazgos: string[] = [];
    for (const ruta of FUENTES) {
      const lineas = readFileSync(ruta, "utf-8").split("\n");
      lineas.forEach((linea, indice) => {
        const limpia = linea.trim();
        if (limpia.startsWith("//") || limpia.startsWith("/*") || limpia.startsWith("*/"))
          hallazgos.push(`${ruta}:${indice + 1}`);
      });
    }
    expect(hallazgos).toEqual([]);
  });
});
