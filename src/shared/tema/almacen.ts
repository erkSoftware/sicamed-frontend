import { create } from "zustand";
import type { Luminosidad } from "./tipos";
import { LUMINOSIDAD_INICIAL, esLuminosidad } from "./tipos";

const CLAVE_LUMINOSIDAD = "sicamed.tema.luminosidad";

const leer = (clave: string): string | null => {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
};

const escribir = (clave: string, valor: string): void => {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    return;
  }
};

const luminosidadGuardada = (): Luminosidad => {
  if (typeof window === "undefined") return LUMINOSIDAD_INICIAL;
  const valor = leer(CLAVE_LUMINOSIDAD);
  return esLuminosidad(valor) ? valor : LUMINOSIDAD_INICIAL;
};

type EstadoTema = {
  luminosidad: Luminosidad;
  elegirLuminosidad: (luminosidad: Luminosidad) => void;
  alternarLuminosidad: () => void;
};

export const useTema = create<EstadoTema>((set, get) => ({
  luminosidad: luminosidadGuardada(),
  elegirLuminosidad: (luminosidad) => {
    escribir(CLAVE_LUMINOSIDAD, luminosidad);
    set({ luminosidad });
  },
  alternarLuminosidad: () => {
    const siguiente: Luminosidad = get().luminosidad === "claro" ? "oscuro" : "claro";
    escribir(CLAVE_LUMINOSIDAD, siguiente);
    set({ luminosidad: siguiente });
  },
}));
