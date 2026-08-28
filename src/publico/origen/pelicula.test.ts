import { describe, expect, it } from "vitest";
import { decidirPelicula, motivoPelicula, pedidaPorHash, rutaConPelicula } from "./decision";
import { DURACION_TOTAL, FUNDIDO, INICIO_SALIDA, PLANOS, momentoEn, tomaEn } from "./guion";

const entorno = (parcial: Partial<Parameters<typeof decidirPelicula>[0]>) => ({
  ruta: "/vitrina",
  hash: "",
  vista: false,
  reducido: false,
  ...parcial,
});

describe("decision de la pelicula de la vitrina", () => {
  it("corre la primera vez que se entra a la vitrina", () => {
    expect(decidirPelicula(entorno({}))).toBe(true);
    expect(motivoPelicula(entorno({}))).toBe("corre");
  });

  it("no vuelve a salir una vez vista", () => {
    expect(decidirPelicula(entorno({ vista: true }))).toBe(false);
    expect(motivoPelicula(entorno({ vista: true }))).toBe("ya-vista");
  });

  it("el boton la pide con hash aunque ya se haya visto", () => {
    expect(decidirPelicula(entorno({ hash: "#origen", vista: true }))).toBe(true);
    expect(motivoPelicula(entorno({ hash: "#Origen", vista: true }))).toBe("pedida-por-hash");
  });

  it("no se cruza con la introduccion de la portada", () => {
    expect(decidirPelicula(entorno({ ruta: "/" }))).toBe(false);
    expect(motivoPelicula(entorno({ ruta: "/" }))).toBe("ruta-sin-pelicula");
    expect(pedidaPorHash("#animation")).toBe(false);
  });

  it("reconoce la vitrina con barra final y no sus subrutas", () => {
    expect(rutaConPelicula("/vitrina/")).toBe(true);
    expect(rutaConPelicula("/vitrina/oferta-1")).toBe(false);
  });

  it("no arranca sola con movimiento reducido", () => {
    expect(decidirPelicula(entorno({ reducido: true }))).toBe(false);
  });
});

describe("guion de la pelicula del origen", () => {
  it("arranca en negro y despues nunca se queda sin escena", () => {
    expect(PLANOS.some((plano) => tomaEn(plano, 0).opacidad > 0.01)).toBe(false);
    for (let tiempo = FUNDIDO; tiempo <= INICIO_SALIDA; tiempo += 100) {
      const visible = PLANOS.some((plano) => tomaEn(plano, tiempo).opacidad > 0.01);
      expect(visible, `sin escena visible en ${tiempo}ms`).toBe(true);
    }
  });

  it("encadena las fases en el orden del relato", () => {
    expect(momentoEn(0).fase).toBe("invitacion");
    expect(momentoEn(3000).fase).toBe("origen");
    expect(momentoEn(DURACION_TOTAL - 1).fase).toBe("salida");
  });

  it("cada plano entra y sale con un fundido y no salta", () => {
    for (const plano of PLANOS) {
      expect(tomaEn(plano, plano.entra).opacidad).toBe(0);
      expect(tomaEn(plano, plano.entra + FUNDIDO).opacidad).toBeCloseTo(1, 2);
      expect(tomaEn(plano, plano.sale).opacidad).toBe(0);
    }
  });

  it("los planos se solapan: nunca hay un corte seco entre escenas", () => {
    const ordenados = [...PLANOS].sort((a, b) => a.entra - b.entra);
    ordenados.forEach((plano, indice) => {
      const siguiente = ordenados[indice + 1];
      if (!siguiente) return;
      expect(siguiente.entra).toBeLessThan(plano.sale);
    });
  });
});
