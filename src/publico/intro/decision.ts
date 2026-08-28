import { anotar, CLAVE_INTRO } from "./diagnostico";

export { CLAVE_INTRO };

const HASH_INTRO = /^#animation$/i;

export type EntornoIntro = {
  ruta: string;
  hash: string;
  vista: boolean;
  reducido: boolean;
};

export type MotivoIntro =
  | "corre"
  | "pedida-por-hash"
  | "ruta-sin-intro"
  | "movimiento-reducido"
  | "ya-vista";

export const pedidaPorHash = (hash: string): boolean => HASH_INTRO.test(hash);

export const motivoCinematica = (entorno: EntornoIntro): MotivoIntro => {
  if (entorno.ruta !== "/") return "ruta-sin-intro";
  if (pedidaPorHash(entorno.hash)) return "pedida-por-hash";
  if (entorno.reducido) return "movimiento-reducido";
  if (entorno.vista) return "ya-vista";
  return "corre";
};

export const decidirCinematica = (entorno: EntornoIntro): boolean => {
  const motivo = motivoCinematica(entorno);
  return motivo === "corre" || motivo === "pedida-por-hash";
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

export const olvidarIntro = (): void => {
  try {
    window.localStorage.removeItem(CLAVE_INTRO);
  } catch (error) {
    void error;
  }
  anotar("marca-borrada");
};

export const entornoIntro = (): EntornoIntro => ({
  ruta: window.location.pathname,
  hash: window.location.hash,
  vista: introVista(),
  reducido: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
});

let resuelta: boolean | null = null;

export const cinematicaActiva = (): boolean => {
  if (typeof window === "undefined") return false;
  if (resuelta === null) {
    const entorno = entornoIntro();
    resuelta = decidirCinematica(entorno);
    anotar("decision", { ...entorno, motivo: motivoCinematica(entorno), resultado: resuelta });
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
