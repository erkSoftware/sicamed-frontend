import { ErrorApi } from "../problemDetails";
import type { ErrorDeCampo } from "../problemDetails";
import { normalizar } from "../../i18n/formato";
import type { RolPlataforma } from "./tipos";

export type Pagina<T> = {
  datos: readonly T[];
  total: number;
  pagina: number;
  porPagina: number;
};

const LATENCIA_MINIMA = 120;
const LATENCIA_MAXIMA = 420;

export const demorar = <T,>(valor: T): Promise<T> =>
  new Promise((resolver) =>
    setTimeout(
      () => resolver(valor),
      LATENCIA_MINIMA + Math.random() * (LATENCIA_MAXIMA - LATENCIA_MINIMA),
    ),
  );

export const paginar = <T,>(coleccion: readonly T[], pagina = 1, porPagina = 10): Pagina<T> => ({
  datos: coleccion.slice((pagina - 1) * porPagina, pagina * porPagina),
  total: coleccion.length,
  pagina,
  porPagina,
});

export const contiene = (texto: string, consulta: string): boolean =>
  normalizar(texto).includes(normalizar(consulta));

export const rechazar = (problema: {
  type: string;
  title: string;
  detail: string;
  status: number;
  norma?: string;
  accion?: { etiqueta: string; ruta: string };
  errores?: readonly ErrorDeCampo[];
}): Promise<never> => Promise.reject(new ErrorApi(problema));

export const rechazarNoEncontrado = (entidad: string, id: string): Promise<never> =>
  rechazar({
    type: "https://sicamed.co/problemas/recurso-no-encontrado",
    title: `${entidad} no encontrada`,
    detail: `No existe un registro de ${entidad.toLowerCase()} con el identificador ${id}, o no tienes permiso para consultarlo.`,
    status: 404,
  });

export type FiltroListado = {
  busqueda?: string;
  estado?: string;
  departamento?: string;
  tipo?: string;
  pagina?: number;
  porPagina?: number;
};

export type Autor = {
  usuarioId: string;
  nombre: string;
  organizacionId: string;
  rol: RolPlataforma;
};
