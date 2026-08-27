import { describe, expect, it } from "vitest";
import { iniciales, normalizar, numero } from "./formato";

describe("formato", () => {
  it("formatea numeros con separador de miles colombiano", () => {
    expect(numero(1500000)).toBe("1.500.000");
  });

  it("toma las iniciales de los dos primeros nombres", () => {
    expect(iniciales("María Inés Cardona")).toBe("MI");
  });

  it("normaliza tildes para la busqueda", () => {
    expect(normalizar("Nariño Atlántico")).toBe("narino atlantico");
  });
});
