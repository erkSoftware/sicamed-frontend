import { describe, expect, it } from "vitest";
import { cumpleKAnonimato, suprimirCeldasPequenas } from "./kAnonimato";

const CORTE = [
  { etiqueta: "Cundinamarca", valor: 412 },
  { etiqueta: "Antioquia", valor: 208 },
  { etiqueta: "Cauca", valor: 3 },
  { etiqueta: "Vaupés", valor: 1 },
  { etiqueta: "Guainía", valor: 2 },
  { etiqueta: "Amazonas", valor: 0 },
];

describe("k-anonimato sobre los cortes publicados", () => {
  it("ninguna celda publicada cae entre uno y k menos uno", () => {
    const corte = suprimirCeldasPequenas(CORTE);
    expect(cumpleKAnonimato(corte.celdas)).toBe(true);
    expect(corte.celdas.map((celda) => celda.etiqueta)).not.toContain("Vaupés");
  });

  it("acumula la masa suprimida cuando el residuo alcanza el umbral", () => {
    const corte = suprimirCeldasPequenas(CORTE);
    expect(corte.suprimidas).toBe(3);
    expect(corte.celdas.find((celda) => celda.etiqueta === "Otros territorios")?.valor).toBe(6);
    expect(corte.masaSuprimida).toBe(0);
  });

  it("descarta el residuo que por sí solo reidentificaría", () => {
    const corte = suprimirCeldasPequenas([
      { etiqueta: "Chocó", valor: 40 },
      { etiqueta: "Vichada", valor: 2 },
    ]);
    expect(corte.celdas).toHaveLength(1);
    expect(corte.masaSuprimida).toBe(2);
  });

  it("conserva el cero, que no identifica a nadie", () => {
    const corte = suprimirCeldasPequenas(CORTE);
    expect(corte.celdas.find((celda) => celda.etiqueta === "Amazonas")?.valor).toBe(0);
  });

  it("detecta un corte que no cumple antes de publicarlo", () => {
    expect(cumpleKAnonimato([{ etiqueta: "Guaviare", valor: 4 }])).toBe(false);
    expect(cumpleKAnonimato([{ etiqueta: "Guaviare", valor: 4 }], 3)).toBe(true);
  });
});
