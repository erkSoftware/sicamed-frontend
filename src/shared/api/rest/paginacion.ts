import type { PaginaApi } from "./contrato";
import type { Parametros } from "../transporte";

export type Pagina<T> = {
  datos: readonly T[];
  total: number;
  pagina: number;
  porPagina: number;
};

export type FiltroApi = {
  busqueda?: string;
  estado?: string;
  departamento?: string;
  tipo?: string;
  pagina?: number;
  porPagina?: number;
};

export const PAGINA_MAXIMA = 10_000;
export const POR_PAGINA_MAXIMO = 100;
export const POR_PAGINA_POR_DEFECTO = 10;

const acotar = (valor: number, minimo: number, maximo: number): number =>
  Math.min(Math.max(Math.trunc(valor), minimo), maximo);

export const limitarPagina = (pagina: number | undefined): number =>
  pagina === undefined || !Number.isFinite(pagina) ? 1 : acotar(pagina, 1, PAGINA_MAXIMA);

export const limitarPorPagina = (porPagina: number | undefined): number =>
  porPagina === undefined || !Number.isFinite(porPagina)
    ? POR_PAGINA_POR_DEFECTO
    : acotar(porPagina, 1, POR_PAGINA_MAXIMO);

export const aParametrosDeListado = (filtro: FiltroApi = {}): Parametros => ({
  busqueda: filtro.busqueda,
  estado: filtro.estado,
  departamento: filtro.departamento,
  tipo: filtro.tipo,
  pagina: limitarPagina(filtro.pagina),
  porPagina: limitarPorPagina(filtro.porPagina),
});

export const mapearPagina = <A, D>(
  sobre: PaginaApi<A>,
  mapear: (elemento: A) => D,
): Pagina<D> => {
  const datos = (sobre.datos ?? []).map(mapear);
  const pagina = limitarPagina(sobre.pagina);
  const porPagina = limitarPorPagina(sobre.porPagina);
  return {
    datos,
    total: sobre.total ?? (pagina - 1) * porPagina + datos.length,
    pagina,
    porPagina,
  };
};
