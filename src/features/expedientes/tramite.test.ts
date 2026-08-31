import { describe, expect, it } from "vitest";
import { exigeObservacion, pasoEnTurno, porOrden, resueltosPor, tramiteCerrado } from "./tramite";
import { salidaDelProblema } from "../../shared/api/salidas";
import { pasosIniciales } from "../../shared/api/mock/pasosDeVerificacion";
import type { PasoVerificacion } from "../../shared/api/mock/tipos";

const resolver = (
  pasos: readonly PasoVerificacion[],
  orden: number,
  veredicto: PasoVerificacion["veredicto"],
  revisor: string,
): readonly PasoVerificacion[] =>
  pasos.map((paso) => (paso.orden === orden ? { ...paso, veredicto, revisor } : paso));

describe("el turno de los pasos", () => {
  const pasos = pasosIniciales("EXP-1");

  it("solo el primer paso sin resolver esta en turno, aunque lleguen desordenados", () => {
    const desordenados = [...pasos].reverse();
    expect(pasoEnTurno(desordenados)?.orden).toBe(1);
    expect(porOrden(desordenados).map((paso) => paso.orden)).toEqual([1, 2, 3, 4]);
  });

  it("el turno avanza al siguiente cuando el anterior queda resuelto", () => {
    const avanzados = resolver(pasos, 1, "VERIFICADO", "Lida Almeciga");
    expect(pasoEnTurno(avanzados)?.orden).toBe(2);
  });

  it("sin pasos pendientes no hay turno", () => {
    const todos = pasos.map((paso) => ({ ...paso, veredicto: "VERIFICADO" as const }));
    expect(pasoEnTurno(todos)).toBeNull();
  });

  it("el ultimo paso es el que exige doble control", () => {
    expect(pasos.filter((paso) => paso.exigeDobleControl).map((paso) => paso.orden)).toEqual([4]);
  });

  it("cuenta los pasos que ya resolvio una persona, que es lo que bloquea el doble control", () => {
    const conDos = resolver(
      resolver(pasos, 1, "VERIFICADO", "Lida Almeciga"),
      2,
      "VERIFICADO",
      "Lida Almeciga",
    );
    expect(resueltosPor(conDos, "Lida Almeciga")).toHaveLength(2);
    expect(resueltosPor(conDos, "Claudia Liliana Pardo")).toHaveLength(0);
  });
});

describe("la observacion segun la decision", () => {
  it("solo aceptar y aprobar la dejan opcional", () => {
    expect(exigeObservacion("APROBADO")).toBe(false);
    expect(exigeObservacion("VERIFICADO")).toBe(false);
    expect(exigeObservacion("DEVUELTO")).toBe(true);
    expect(exigeObservacion("RECHAZADO")).toBe(true);
  });
});

describe("el cierre del tramite", () => {
  it("aprobado y rechazado cierran; devuelto sigue abierto para subsanar", () => {
    expect(tramiteCerrado("APROBADO")).toBe(true);
    expect(tramiteCerrado("RECHAZADO")).toBe(true);
    expect(tramiteCerrado("DEVUELTO")).toBe(false);
    expect(tramiteCerrado("EN_VERIFICACION")).toBe(false);
  });
});

describe("la salida de cada rechazo del tramite", () => {
  const problema = (tipo: string) => ({
    type: `https://sicamed.co/problemas/${tipo}`,
    title: "",
    detail: "",
    status: 403,
  });

  it("los ocho rechazos del contrato tienen una salida propia, no un «no se pudo»", () => {
    const tipos = [
      "separacion-de-funciones",
      "expediente-propio",
      "paso-de-otro-rol",
      "doble-control",
      "rol-sin-verificacion",
      "paso-fuera-de-orden",
      "devolucion-sin-motivo",
      "solicitud-ya-tramitada",
    ];
    const salidas = tipos.map((tipo) => salidaDelProblema(problema(tipo)));
    expect(salidas.every((salida) => salida !== null)).toBe(true);
    expect(new Set(salidas).size).toBe(tipos.length);
  });

  it("un problema que no es del tramite no inventa una salida", () => {
    expect(salidaDelProblema(problema("error-inesperado"))).toBeNull();
  });
});
