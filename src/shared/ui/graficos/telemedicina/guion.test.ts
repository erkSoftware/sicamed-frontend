import { describe, expect, it } from "vitest";
import { DURACION_TOTAL, ESLABONES, ROTULOS, TRAMOS, avanceEn, faseEn, inicioDe } from "./guion";

describe("guion del recorrido de telemedicina", () => {
  it("recorre las fases en el orden del relato", () => {
    expect(TRAMOS.map((tramo) => tramo.fase)).toEqual([
      "colombia",
      "region",
      "cultivo",
      "laboratorio",
      "ips",
      "paciente",
      "cierre",
    ]);
  });

  it("resuelve la fase de cualquier instante dentro de la linea de tiempo", () => {
    expect(faseEn(0)).toBe("colombia");
    expect(faseEn(inicioDe("cultivo"))).toBe("cultivo");
    expect(faseEn(inicioDe("cultivo") - 1)).toBe("region");
    expect(faseEn(DURACION_TOTAL + 5000)).toBe("cierre");
  });

  it("acota el avance de la fase entre cero y uno", () => {
    expect(avanceEn(inicioDe("ips"), "ips")).toBe(0);
    expect(avanceEn(inicioDe("ips") + 999999, "ips")).toBe(1);
    expect(avanceEn(0, "ips")).toBe(0);
  });

  it("todas las fases tienen rotulo y los eslabones apuntan a fases reales", () => {
    for (const tramo of TRAMOS) expect(ROTULOS[tramo.fase].titulo).not.toBe("");
    const fases = new Set(TRAMOS.map((tramo) => tramo.fase));
    for (const eslabon of ESLABONES) expect(fases.has(eslabon.fase)).toBe(true);
  });
});
