import type { NombreIcono } from "../ui/primitivos/Icono";

export type Luminosidad = "claro" | "oscuro";

export type FichaLuminosidad = {
  id: Luminosidad;
  nombre: string;
  descripcion: string;
  icono: NombreIcono;
};

export const FICHAS_LUMINOSIDAD: Record<Luminosidad, FichaLuminosidad> = {
  claro: {
    id: "claro",
    nombre: "Claro",
    descripcion: "Lienzo en papel con marco institucional",
    icono: "sol",
  },
  oscuro: {
    id: "oscuro",
    nombre: "Oscuro",
    descripcion: "Panel completo en verde profundo",
    icono: "luna",
  },
};

export const LUMINOSIDADES: readonly FichaLuminosidad[] = [
  FICHAS_LUMINOSIDAD.claro,
  FICHAS_LUMINOSIDAD.oscuro,
];

export const LUMINOSIDAD_INICIAL: Luminosidad = "claro";

export const esLuminosidad = (valor: unknown): valor is Luminosidad =>
  typeof valor === "string" && valor in FICHAS_LUMINOSIDAD;
