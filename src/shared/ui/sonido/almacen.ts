import { create } from "zustand";
import { emitirTono } from "./tono";

const CLAVE_SONIDO = "sicamed.sonido.activo";

const leer = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(CLAVE_SONIDO) !== "no";
  } catch {
    return true;
  }
};

const escribir = (activo: boolean): void => {
  try {
    window.localStorage.setItem(CLAVE_SONIDO, activo ? "si" : "no");
  } catch {
    return;
  }
};

type EstadoSonido = {
  activo: boolean;
  alternar: () => void;
};

export const useSonido = create<EstadoSonido>((set, get) => ({
  activo: leer(),
  alternar: () => {
    const siguiente = !get().activo;
    escribir(siguiente);
    set({ activo: siguiente });
    if (siguiente) emitirTono(2);
  },
}));

export const sonar = (paso: number): void => {
  if (useSonido.getState().activo) emitirTono(paso);
};
