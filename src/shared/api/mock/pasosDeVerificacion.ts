import type { PasoVerificacion } from "./tipos";

export type ReglaDePaso = {
  reglaId: string;
  etiqueta: string;
  orden: number;
  rol: PasoVerificacion["rol"];
  exigeDobleControl: boolean;
  slaHoras: number;
  descripcion: string;
};

export const PASOS_DE_LA_POLITICA: readonly ReglaDePaso[] = [
  {
    reglaId: "identidad-juridica",
    etiqueta: "Identidad jurídica",
    orden: 1,
    rol: "ANALISTA_DOCUMENTAL",
    exigeDobleControl: false,
    slaHoras: 72,
    descripcion: "Existencia y representación de la persona jurídica frente al RUES y el RUT.",
  },
  {
    reglaId: "representacion-legal",
    etiqueta: "Representación legal",
    orden: 2,
    rol: "ANALISTA_DOCUMENTAL",
    exigeDobleControl: false,
    slaHoras: 48,
    descripcion: "Quien firma la solicitud es quien puede obligar a la organización.",
  },
  {
    reglaId: "domicilio-operacion",
    etiqueta: "Domicilio de operación",
    orden: 3,
    rol: "ANALISTA_DOCUMENTAL",
    exigeDobleControl: false,
    slaHoras: 48,
    descripcion: "El predio o establecimiento declarado corresponde al municipio radicado.",
  },
  {
    reglaId: "licencia-competente",
    etiqueta: "Licencia de la autoridad competente",
    orden: 4,
    rol: "ANALISTA_DOCUMENTAL",
    exigeDobleControl: true,
    slaHoras: 24,
    descripcion:
      "El acto administrativo existe, está vigente y corresponde a la modalidad declarada. Lo cierra un segundo analista.",
  },
];

export const reglaDePaso = (reglaId: string): ReglaDePaso | undefined =>
  PASOS_DE_LA_POLITICA.find((regla) => regla.reglaId === reglaId);

export const pasosIniciales = (expedienteId: string): readonly PasoVerificacion[] =>
  PASOS_DE_LA_POLITICA.map((regla) => ({
    id: `${expedienteId}-P${regla.orden}`,
    reglaId: regla.reglaId,
    etiqueta: regla.etiqueta,
    orden: regla.orden,
    rol: regla.rol,
    exigeDobleControl: regla.exigeDobleControl,
    veredicto: "PENDIENTE",
    revisor: null,
    resuelto: null,
    observacion: null,
    slaHoras: regla.slaHoras,
    huella: null,
  }));
