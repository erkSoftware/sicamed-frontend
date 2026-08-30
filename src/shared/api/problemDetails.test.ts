import { describe, expect, it } from "vitest";
import type { ProblemDetail } from "./problemDetails";
import {
  admiteReintento,
  aProblema,
  erroresPorCampo,
  esCuentaSinOrganizacion,
  esLimiteDeTasa,
  esProblemDetail,
  esSesionInvalida,
  ErrorApi,
  segundosDeEspera,
} from "./problemDetails";

const invalido = {
  type: "https://sicamed.co/problemas/contenido-invalido",
  title: "La petición no cumple el contrato",
  detail: "Revise estos campos: nit, organizacion",
  status: 422,
  errores: [
    { campo: "nit", motivo: "Es más corto de lo admitido." },
    { campo: "organizacion", motivo: "Es obligatorio y no vino en la petición." },
  ],
};

describe("problem+json", () => {
  it("reconoce un problema por type, title y status", () => {
    expect(esProblemDetail(invalido)).toBe(true);
    expect(esProblemDetail({ mensaje: "algo salió mal" })).toBe(false);
  });

  it("indexa los errores del 422 por campo del formulario", () => {
    expect(erroresPorCampo(invalido)).toEqual({
      nit: "Es más corto de lo admitido.",
      organizacion: "Es obligatorio y no vino en la petición.",
    });
  });

  it("un problema sin errores no rompe el indexado", () => {
    expect(erroresPorCampo({ ...invalido, errores: null })).toEqual({});
  });

  it("extrae el problema de un ErrorApi sin envolverlo otra vez", () => {
    expect(aProblema(new ErrorApi(invalido))).toBe(invalido);
  });

  it("distingue la sesion invalida del 404 por cuenta sin organizacion", () => {
    expect(esSesionInvalida({ ...invalido, status: 401 })).toBe(true);
    expect(
      esCuentaSinOrganizacion({
        ...invalido,
        status: 404,
        type: "https://sicamed.co/problemas/organizacion-no-asociada",
      }),
    ).toBe(true);
    expect(esCuentaSinOrganizacion({ ...invalido, status: 404 })).toBe(false);
  });

  it("informa cuantos segundos hay que esperar tras un 429", () => {
    const limitado = { ...invalido, status: 429, reintentarEn: 60 };
    expect(esLimiteDeTasa(limitado)).toBe(true);
    expect(segundosDeEspera(limitado)).toBe(60);
    expect(segundosDeEspera(invalido)).toBe(0);
  });
});

describe("política de reintento", () => {
  const problema = (status: number): ProblemDetail => ({
    type: "https://sicamed.co/problemas/x",
    title: "x",
    detail: "x",
    status,
  });

  it("reintenta lo que puede cambiar por sí solo", () => {
    expect(admiteReintento(problema(500))).toBe(true);
    expect(admiteReintento(problema(0))).toBe(true);
    expect(admiteReintento(problema(409))).toBe(true);
  });

  it("no reintenta lo que el servidor ya decidió", () => {
    expect(admiteReintento(problema(401))).toBe(false);
    expect(admiteReintento(problema(403))).toBe(false);
    expect(admiteReintento(problema(422))).toBe(false);
    expect(admiteReintento(problema(429))).toBe(false);
  });
});
