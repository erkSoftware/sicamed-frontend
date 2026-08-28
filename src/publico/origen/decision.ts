import { anotar } from "../intro/diagnostico";

export const CLAVE_ORIGEN = "SICAMED_vitrina_origen_seen";
export const CANAL_ORIGEN = "sicamed:origen";

const HASH_ORIGEN = /^#origen$/i;

export type EntornoOrigen = {
  ruta: string;
  hash: string;
  vista: boolean;
  reducido: boolean;
};

export type MotivoOrigen =
  "corre" | "pedida-por-hash" | "ruta-sin-pelicula" | "movimiento-reducido" | "ya-vista";

export const rutaConPelicula = (ruta: string): boolean => ruta.replace(/\/+$/, "") === "/vitrina";

export const pedidaPorHash = (hash: string): boolean => HASH_ORIGEN.test(hash);

export const motivoPelicula = (entorno: EntornoOrigen): MotivoOrigen => {
  if (!rutaConPelicula(entorno.ruta)) return "ruta-sin-pelicula";
  if (pedidaPorHash(entorno.hash)) return "pedida-por-hash";
  if (entorno.reducido) return "movimiento-reducido";
  if (entorno.vista) return "ya-vista";
  return "corre";
};

export const decidirPelicula = (entorno: EntornoOrigen): boolean => {
  const motivo = motivoPelicula(entorno);
  return motivo === "corre" || motivo === "pedida-por-hash";
};

export const peliculaVista = (): boolean => {
  try {
    return window.localStorage.getItem(CLAVE_ORIGEN) === "true";
  } catch (error) {
    void error;
    return false;
  }
};

export const marcarPeliculaVista = (): void => {
  try {
    window.localStorage.setItem(CLAVE_ORIGEN, "true");
  } catch (error) {
    void error;
  }
};

export const olvidarPelicula = (): void => {
  try {
    window.localStorage.removeItem(CLAVE_ORIGEN);
  } catch (error) {
    void error;
  }
  anotar("origen-marca-borrada");
};

export const entornoOrigen = (): EntornoOrigen => ({
  ruta: window.location.pathname,
  hash: window.location.hash,
  vista: peliculaVista(),
  reducido: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
});

let resuelta: boolean | null = null;

export const peliculaActiva = (): boolean => {
  if (typeof window === "undefined") return false;
  if (resuelta === null) {
    const entorno = entornoOrigen();
    resuelta = decidirPelicula(entorno);
    anotar("origen-decision", { ...entorno, motivo: motivoPelicula(entorno), resultado: resuelta });
  }
  return resuelta;
};

export const limpiarHashOrigen = (): void => {
  if (typeof window === "undefined") return;
  if (!pedidaPorHash(window.location.hash)) return;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  anotar("origen-hash-retirado");
};

export const pedirPelicula = (): void => {
  if (typeof window === "undefined") return;
  anotar("origen-peticion-manual");
  window.dispatchEvent(new CustomEvent(CANAL_ORIGEN));
};
