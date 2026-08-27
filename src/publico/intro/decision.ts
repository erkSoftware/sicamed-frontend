import { anotar, CLAVE_INTRO } from "./diagnostico";

export { CLAVE_INTRO };

const HASH_INTRO = /^#animation$/i;

export type EntornoIntro = {
  ruta: string;
  hash: string;
  vista: boolean;
  reducido: boolean;
};

export const pedidaPorHash = (hash: string): boolean => HASH_INTRO.test(hash);

export const decidirCinematica = (entorno: EntornoIntro): boolean => {
  if (entorno.ruta !== "/") return false;
  if (pedidaPorHash(entorno.hash)) return true;
  if (entorno.reducido) return false;
  return !entorno.vista;
};

export const introVista = (): boolean => {
  try {
    return window.localStorage.getItem(CLAVE_INTRO) === "true";
  } catch (error) {
    void error;
    return false;
  }
};

export const marcarIntroVista = (): void => {
  try {
    window.localStorage.setItem(CLAVE_INTRO, "true");
  } catch (error) {
    void error;
  }
};

let resuelta: boolean | null = null;

export const cinematicaActiva = (): boolean => {
  if (typeof window === "undefined") return false;
  if (resuelta === null) {
    const entorno: EntornoIntro = {
      ruta: window.location.pathname,
      hash: window.location.hash,
      vista: introVista(),
      reducido: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
    resuelta = decidirCinematica(entorno);
    anotar("decision", { ...entorno, resultado: resuelta });
  }
  return resuelta;
};

export const limpiarHashIntro = (): void => {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") return;
  if (!pedidaPorHash(window.location.hash)) return;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  anotar("hash-retirado");
};
