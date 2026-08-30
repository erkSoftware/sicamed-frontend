import { describe, expect, it } from "vitest";
import { fecha, fechaCorta, fechaHora, fechaLarga, iniciales, normalizar, numero } from "./formato";

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

describe("fechas que el contrato puede no traer", () => {
  it("una fecha ausente se formatea como vacio y no revienta la pantalla", () => {
    for (const formatear of [fecha, fechaCorta, fechaHora, fechaLarga]) {
      expect(formatear("")).toBe("");
      expect(formatear("sin fecha")).toBe("");
    }
  });

  it("una fecha real se sigue formateando", () => {
    expect(fecha("2026-08-30T10:00:00.000Z")).toMatch(/2026/);
  });
});
