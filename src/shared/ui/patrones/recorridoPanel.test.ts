import { beforeEach, describe, expect, it } from "vitest";
import {
  CLAVE_RECORRIDO,
  HOLGURA,
  PARADAS,
  marcarRecorridoVisto,
  olvidarRecorrido,
  recorridoVisto,
  recuadroDe,
  ubicarTarjeta,
} from "./recorridoPanel";

describe("paradas del recorrido", () => {
  it("cada parada tiene clave unica", () => {
    const claves = PARADAS.map((parada) => parada.clave);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("cada parada apunta a un selector y trae texto", () => {
    for (const parada of PARADAS) {
      expect(parada.seleccion.length).toBeGreaterThan(0);
      expect(parada.titulo.length).toBeGreaterThan(0);
      expect(parada.detalle.length).toBeGreaterThan(0);
    }
  });
});

describe("ubicacion de la tarjeta", () => {
  const alto = 800;

  it("cae debajo cuando el foco esta en la parte alta", () => {
    const sitio = ubicarTarjeta({ arriba: 10, izquierda: 0, ancho: 40, alto: 40 }, alto);
    expect(sitio.lado).toBe("abajo");
    expect(sitio.desplazamiento).toBe(50 + HOLGURA);
  });

  it("sube cuando el foco esta en la parte baja", () => {
    const sitio = ubicarTarjeta({ arriba: 700, izquierda: 0, ancho: 40, alto: 40 }, alto);
    expect(sitio.lado).toBe("arriba");
    expect(sitio.desplazamiento).toBe(alto - 700 + HOLGURA);
  });
});

describe("recuadro con holgura", () => {
  it("agranda la caja del objetivo por los cuatro costados", () => {
    const falso = {
      getBoundingClientRect: () => ({ top: 100, left: 50, width: 30, height: 20 }),
    } as unknown as Element;
    expect(recuadroDe(falso)).toEqual({
      arriba: 100 - HOLGURA,
      izquierda: 50 - HOLGURA,
      ancho: 30 + HOLGURA * 2,
      alto: 20 + HOLGURA * 2,
    });
  });
});

describe("marca del recorrido", () => {
  beforeEach(() => olvidarRecorrido());

  it("arranca sin ver y queda visto al marcarlo", () => {
    expect(recorridoVisto()).toBe(false);
    marcarRecorridoVisto();
    expect(window.localStorage.getItem(CLAVE_RECORRIDO)).toBe("true");
    expect(recorridoVisto()).toBe(true);
  });
});
