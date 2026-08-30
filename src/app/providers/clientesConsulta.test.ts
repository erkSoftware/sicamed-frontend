import { describe, expect, it } from "vitest";
import { debeReintentar, esperaAntesDeReintentar } from "./clientesConsulta";
import { ErrorApi } from "../../shared/api/problemDetails";

const fallo = (status: number, reintentarEn?: number) =>
  new ErrorApi({
    type: "https://sicamed.co/problemas/x",
    title: "x",
    detail: "x",
    status,
    ...(reintentarEn === undefined ? {} : { reintentarEn }),
  });

describe("reintentos de las consultas", () => {
  it("no reintenta un rechazo del servidor", () => {
    expect(debeReintentar(0, fallo(403))).toBe(false);
    expect(debeReintentar(0, fallo(422))).toBe(false);
  });

  it("no reintenta el limite de tasa y evita el bucle de peticiones", () => {
    expect(debeReintentar(0, fallo(429, 60))).toBe(false);
  });

  it("reintenta un fallo de red hasta dos veces", () => {
    expect(debeReintentar(0, fallo(0))).toBe(true);
    expect(debeReintentar(1, fallo(0))).toBe(true);
    expect(debeReintentar(2, fallo(0))).toBe(false);
  });

  it("respeta la espera declarada por el borde antes que su propio retardo", () => {
    expect(esperaAntesDeReintentar(0, fallo(429, 60))).toBe(60_000);
  });

  it("crece de forma exponencial y se topa en treinta segundos", () => {
    expect(esperaAntesDeReintentar(0, fallo(500))).toBe(1_000);
    expect(esperaAntesDeReintentar(1, fallo(500))).toBe(2_000);
    expect(esperaAntesDeReintentar(9, fallo(500))).toBe(30_000);
  });
});
