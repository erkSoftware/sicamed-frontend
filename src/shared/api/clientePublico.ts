import { modoMock, solicitar } from "./transporte";
import type { Parametros } from "./transporte";
import {
  estadisticasVitrinaMock,
  paginaVitrinaMock,
  type ConsultaVitrina,
  type EstadisticasVitrina,
  type PaginaVitrina,
} from "./mock/servidorMock";
import { OFERTAS_PUBLICAS } from "./mock/datos";
import type { Oferta } from "./mock/tipos";
import type {
  EstadisticasVitrinaApi,
  OfertaPublicaApi,
  PaginaCursorOfertasApi,
} from "./rest/contrato";
import { aOfertaPublica } from "./rest/mapeadores";
import { limitarPorPagina } from "./rest/paginacion";

const LATENCIA_PUBLICA = 220;

const demorar = <T,>(valor: T): Promise<T> =>
  new Promise((resolver) => setTimeout(() => resolver(valor), LATENCIA_PUBLICA));

const aParametros = (
  consulta: ConsultaVitrina,
  cursor: string | null,
  limite: number,
): Parametros => ({
  busqueda: consulta.busqueda,
  producto_tipo: consulta.tipoProducto,
  departamento: consulta.departamento,
  actor_tipo: consulta.tipoActor,
  disponibilidad: consulta.disponibilidad,
  orden: consulta.orden,
  cursor: cursor ?? undefined,
  porPagina: limite > 0 ? limitarPorPagina(limite) : undefined,
});

export const aPaginaVitrina = (sobre: PaginaCursorOfertasApi): PaginaVitrina => ({
  ofertas: (sobre.ofertas ?? []).map(aOfertaPublica),
  cursorSiguiente: sobre.cursorSiguiente ?? null,
  cursorAnterior: sobre.cursorAnterior ?? null,
  desde: sobre.desde ?? 0,
  hasta: sobre.hasta ?? (sobre.ofertas ?? []).length,
});

export const aEstadisticasVitrina = (api: EstadisticasVitrinaApi): EstadisticasVitrina => ({
  ofertas: api.ofertas,
  actores: api.actores,
  departamentos: api.departamentos,
  totales: api.totales,
  actualizacion: api.actualizacion ?? "",
  facetas: api.facetas,
});

export const apiPublica = {
  ofertas: (consulta: ConsultaVitrina, cursor: string | null, limite: number) =>
    modoMock
      ? demorar(paginaVitrinaMock(consulta, cursor, limite))
      : solicitar<PaginaCursorOfertasApi>("publico", "/ofertas", {
          parametros: aParametros(consulta, cursor, limite),
        }).then(aPaginaVitrina),

  estadisticas: (consulta: ConsultaVitrina) =>
    modoMock
      ? demorar(estadisticasVitrinaMock(consulta))
      : solicitar<EstadisticasVitrinaApi>("publico", "/estadisticas", {
          parametros: aParametros(consulta, null, 0),
        }).then(aEstadisticasVitrina),

  oferta: (id: string): Promise<Oferta | null> =>
    modoMock
      ? demorar(OFERTAS_PUBLICAS.find((oferta) => oferta.id === id) ?? null)
      : solicitar<OfertaPublicaApi>("publico", `/ofertas/${id}`).then(aOfertaPublica),
};
