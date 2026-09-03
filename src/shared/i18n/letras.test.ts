import { describe, expect, it } from "vitest";
import { enLetras } from "./letras";

describe("cantidad en letras", () => {
  it("escribe las unidades y la veintena contraída", () => {
    expect(enLetras(0)).toBe("cero");
    expect(enLetras(9)).toBe("nueve");
    expect(enLetras(16)).toBe("dieciséis");
    expect(enLetras(21)).toBe("veintiuno");
    expect(enLetras(28)).toBe("veintiocho");
  });

  it("une decenas y unidades con la conjunción", () => {
    expect(enLetras(31)).toBe("treinta y uno");
    expect(enLetras(90)).toBe("noventa");
    expect(enLetras(99)).toBe("noventa y nueve");
  });

  it("distingue cien de ciento", () => {
    expect(enLetras(100)).toBe("cien");
    expect(enLetras(101)).toBe("ciento uno");
    expect(enLetras(180)).toBe("ciento ochenta");
    expect(enLetras(543)).toBe("quinientos cuarenta y tres");
  });

  it("escribe los millares que puede tener una fórmula", () => {
    expect(enLetras(1000)).toBe("mil");
    expect(enLetras(1200)).toBe("mil doscientos");
    expect(enLetras(2400)).toBe("dos mil cuatrocientos");
  });

  it("descarta lo que no es una cantidad dispensable", () => {
    expect(enLetras(-3)).toBe("");
    expect(enLetras(Number.NaN)).toBe("");
  });
});
