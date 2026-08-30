import { describe, expect, it } from "vitest";
import {
  aParametrosDeListado,
  limitarPagina,
  limitarPorPagina,
  mapearPagina,
} from "./paginacion";

describe("limites que el borde rechaza con 422", () => {
  it("nunca pide mas de cien elementos por pagina", () => {
    expect(limitarPorPagina(500)).toBe(100);
  });

  it("nunca pide una pagina mas alla de diez mil", () => {
    expect(limitarPagina(99_999)).toBe(10_000);
  });

  it("corrige la pagina cero, que el borde no admite", () => {
    expect(limitarPagina(0)).toBe(1);
    expect(limitarPorPagina(0)).toBe(1);
  });

  it("usa diez por pagina cuando el filtro no dice nada", () => {
    expect(limitarPorPagina(undefined)).toBe(10);
    expect(limitarPagina(undefined)).toBe(1);
  });
});

describe("parametros de listado", () => {
  it("traduce el filtro de la interfaz a los parametros del contrato", () => {
    expect(aParametrosDeListado({ busqueda: "cauca", estado: "HABILITADA", pagina: 3 })).toEqual({
      busqueda: "cauca",
      estado: "HABILITADA",
      departamento: undefined,
      tipo: undefined,
      pagina: 3,
      porPagina: 10,
    });
  });
});

describe("sobre paginado", () => {
  it("mapea los datos y conserva el total del servidor", () => {
    const pagina = mapearPagina(
      { datos: [{ n: 1 }, { n: 2 }], total: 42, pagina: 2, porPagina: 10 },
      (elemento) => elemento.n * 10,
    );
    expect(pagina).toEqual({ datos: [10, 20], total: 42, pagina: 2, porPagina: 10 });
  });

  it("deduce un total minimo cuando el contrato lo omite", () => {
    const pagina = mapearPagina(
      { datos: [{ n: 1 }, { n: 2 }, { n: 3 }], pagina: 3, porPagina: 10 },
      (elemento) => elemento.n,
    );
    expect(pagina.total).toBe(23);
  });

  it("tolera un sobre sin datos", () => {
    const pagina = mapearPagina<{ n: number }, number>(
      { datos: [], total: 0, pagina: 1, porPagina: 10 },
      (elemento) => elemento.n,
    );
    expect(pagina.datos).toEqual([]);
    expect(pagina.total).toBe(0);
  });
});
