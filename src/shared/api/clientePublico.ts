import { modoMock, solicitar } from "./transporte";
import {
  estadisticasVitrinaMock,
  paginaVitrinaMock,
  type ConsultaVitrina,
  type EstadisticasVitrina,
  type PaginaVitrina,
} from "./mock/servidorMock";
import { OFERTAS_PUBLICAS } from "./mock/datos";
import type { Oferta } from "./mock/tipos";

const LATENCIA_PUBLICA = 220;

const demorar = <T,>(valor: T): Promise<T> =>
  new Promise((resolver) => setTimeout(() => resolver(valor), LATENCIA_PUBLICA));

const aParametros = (
  consulta: ConsultaVitrina,
  cursor: string | null,
  limite: number,
): Record<string, string | number | undefined> => ({
  busqueda: consulta.busqueda,
  producto_tipo: consulta.tipoProducto,
  departamento: consulta.departamento,
  actor_tipo: consulta.tipoActor,
  disponibilidad: consulta.disponibilidad,
  orden: consulta.orden,
  cursor: cursor ?? undefined,
  limit: limite,
});

export const apiPublica = {
  ofertas: (consulta: ConsultaVitrina, cursor: string | null, limite: number) =>
    modoMock
      ? demorar(paginaVitrinaMock(consulta, cursor, limite))
      : solicitar<PaginaVitrina>("publico", "/ofertas", {
          parametros: aParametros(consulta, cursor, limite),
        }),

  estadisticas: (consulta: ConsultaVitrina) =>
    modoMock
      ? demorar(estadisticasVitrinaMock(consulta))
      : solicitar<EstadisticasVitrina>("publico", "/estadisticas", {
          parametros: aParametros(consulta, null, 0),
        }),

  oferta: (id: string) =>
    modoMock
      ? demorar(OFERTAS_PUBLICAS.find((oferta) => oferta.id === id) ?? null)
      : solicitar<Oferta | null>("publico", `/ofertas/${id}`),
};
