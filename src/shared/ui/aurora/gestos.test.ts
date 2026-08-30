import { describe, expect, it } from "vitest";
import {
  ESPERA_GESTO,
  GESTOS,
  HOLGURA_GESTO,
  crearRitmoGestos,
  envolvente,
  gestoAlAzar,
  trazarGesto,
} from "./gestos";
import type { Articulacion } from "./figura";

describe("envolvente", () => {
  it("arranca y termina en cero", () => {
    expect(envolvente(0)).toBe(0);
    expect(envolvente(1)).toBe(0);
    expect(envolvente(-0.2)).toBe(0);
    expect(envolvente(1.4)).toBe(0);
  });

  it("nunca pasa de uno y llega a uno en la meseta", () => {
    for (let u = 0; u <= 1; u += 0.01) {
      expect(envolvente(u)).toBeLessThanOrEqual(1);
      expect(envolvente(u)).toBeGreaterThanOrEqual(0);
    }
    expect(envolvente(0.5)).toBeCloseTo(1, 5);
  });
});

describe("trazarGesto", () => {
  it("no desplaza ninguna articulación al comenzar ni al terminar", () => {
    GESTOS.forEach((gesto) => {
      [0, gesto.duracion].forEach((instante) => {
        const ajuste = trazarGesto(gesto, instante);
        Object.values(ajuste).forEach((valor) => {
          valor.forEach((componente) => expect(Math.abs(componente)).toBe(0));
        });
      });
    });
  });

  it("mantiene los ángulos dentro de un rango discreto", () => {
    GESTOS.forEach((gesto) => {
      for (let paso = 0; paso <= 40; paso += 1) {
        const ajuste = trazarGesto(gesto, (gesto.duracion * paso) / 40);
        Object.values(ajuste).forEach((valor) => {
          valor.forEach((componente) => expect(Math.abs(componente)).toBeLessThanOrEqual(0.4));
        });
      }
    });
  });

  it("solo toca articulaciones declaradas por el gesto", () => {
    GESTOS.forEach((gesto) => {
      const declaradas = Object.keys(gesto.trazo(0.5)) as Articulacion[];
      const trazadas = Object.keys(trazarGesto(gesto, gesto.duracion / 2)) as Articulacion[];
      expect(trazadas.sort()).toEqual(declaradas.sort());
    });
  });
});

describe("gestoAlAzar", () => {
  it("nunca repite el gesto anterior", () => {
    const primero = GESTOS[0];
    if (!primero) throw new Error("faltan gestos");
    for (let intento = 0; intento < 200; intento += 1) {
      expect(gestoAlAzar(primero).clave).not.toBe(primero.clave);
    }
  });

  it("devuelve un gesto del catálogo sin anterior", () => {
    const claves = GESTOS.map((gesto) => gesto.clave);
    for (let intento = 0; intento < 200; intento += 1) {
      expect(claves).toContain(gestoAlAzar(null).clave);
    }
  });
});

const correr = (ritmo: ReturnType<typeof crearRitmoGestos>, segundos: number, habilitado = true) => {
  const claves: string[] = [];
  for (let paso = 0; paso < Math.round(segundos * 60); paso += 1) {
    ritmo.avanzar(1 / 60, habilitado);
    const clave = ritmo.claveActiva();
    if (clave) claves.push(clave);
  }
  return claves;
};

describe("crearRitmoGestos", () => {
  it("no mueve nada durante la espera mínima", () => {
    const ritmo = crearRitmoGestos(() => 0);
    for (let paso = 0; paso < Math.round(ESPERA_GESTO * 60) - 1; paso += 1) {
      expect(ritmo.avanzar(1 / 60, true)).toEqual({});
      expect(ritmo.claveActiva()).toBeNull();
    }
  });

  it("dispara un gesto antes del tope de espera y lo suelta al terminar", () => {
    const ritmo = crearRitmoGestos(() => 0.999);
    const tope = ESPERA_GESTO + HOLGURA_GESTO;
    expect(correr(ritmo, tope + 0.5).length).toBeGreaterThan(0);
    const maxima = Math.max(...GESTOS.map((gesto) => gesto.duracion));
    correr(ritmo, maxima + 0.5);
    expect(ritmo.claveActiva()).toBeNull();
  });

  it("encadena gestos distintos uno tras otro", () => {
    const ritmo = crearRitmoGestos(() => 0.5);
    const vistos = correr(ritmo, 120);
    const secuencia = vistos.filter((clave, indice) => clave !== vistos[indice - 1]);
    expect(secuencia.length).toBeGreaterThanOrEqual(4);
    secuencia.forEach((clave, indice) => {
      if (indice > 0) expect(clave).not.toBe(secuencia[indice - 1]);
    });
  });

  it("se queda quieto y se descarta el gesto en curso cuando se deshabilita", () => {
    const ritmo = crearRitmoGestos(() => 0.999);
    correr(ritmo, ESPERA_GESTO + HOLGURA_GESTO + 1);
    expect(ritmo.claveActiva()).not.toBeNull();
    expect(ritmo.avanzar(1 / 60, false)).toEqual({});
    expect(ritmo.claveActiva()).toBeNull();
    expect(correr(ritmo, 60, false)).toEqual([]);
  });
});
