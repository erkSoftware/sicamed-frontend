import { modoMock, solicitar } from "./transporte";
import { servidorMock } from "./mock/servidorMock";
import type { FiltroListado } from "./mock/servidorMock";

type Parametros = Record<string, string | number | undefined>;

const aParametros = (filtro: FiltroListado): Parametros => ({
  busqueda: filtro.busqueda,
  estado: filtro.estado,
  departamento: filtro.departamento,
  tipo: filtro.tipo,
  pagina: filtro.pagina,
  porPagina: filtro.porPagina,
});

export const apiComercial = {
  indicadoresNacionales: () =>
    modoMock
      ? servidorMock.indicadoresNacionales()
      : solicitar<ReturnType<typeof servidorMock.indicadoresNacionales> extends Promise<infer T> ? T : never>(
          "comercial",
          "/indicadores/nacionales",
        ),

  organizacionActual: (id?: string) =>
    modoMock
      ? servidorMock.organizacionActual(id)
      : solicitar<Awaited<ReturnType<typeof servidorMock.organizacionActual>>>(
          "comercial",
          "/organizaciones/actual",
        ),

  organizaciones: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.organizaciones(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.organizaciones>>>("comercial", "/organizaciones", {
          parametros: aParametros(filtro),
        }),

  organizacion: (id: string) =>
    modoMock
      ? servidorMock.organizacion(id)
      : solicitar<Awaited<ReturnType<typeof servidorMock.organizacion>>>("comercial", `/organizaciones/${id}`),

  atestaciones: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.atestaciones(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.atestaciones>>>("comercial", "/atestaciones", {
          parametros: aParametros(filtro),
        }),

  cultivos: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.cultivos(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.cultivos>>>("comercial", "/cultivos", {
          parametros: aParametros(filtro),
        }),

  lotes: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.lotes(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.lotes>>>("comercial", "/lotes", {
          parametros: aParametros(filtro),
        }),

  ofertas: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.ofertas(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.ofertas>>>("comercial", "/ofertas", {
          parametros: aParametros(filtro),
        }),

  oferta: (id: string) =>
    modoMock
      ? servidorMock.oferta(id)
      : solicitar<Awaited<ReturnType<typeof servidorMock.oferta>>>("comercial", `/ofertas/${id}`),

  publicarOferta: (borrador: Parameters<typeof servidorMock.publicarOferta>[0]) =>
    modoMock
      ? servidorMock.publicarOferta(borrador)
      : solicitar<Awaited<ReturnType<typeof servidorMock.publicarOferta>>>("comercial", "/ofertas", {
          metodo: "POST",
          cuerpo: borrador,
        }),

  manifestaciones: () =>
    modoMock
      ? servidorMock.manifestaciones()
      : solicitar<Awaited<ReturnType<typeof servidorMock.manifestaciones>>>("comercial", "/manifestaciones"),

  eventos: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.eventos(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.eventos>>>("comercial", "/trazabilidad/eventos", {
          parametros: aParametros(filtro),
        }),

  ruedas: () =>
    modoMock
      ? servidorMock.ruedas()
      : solicitar<Awaited<ReturnType<typeof servidorMock.ruedas>>>("comercial", "/ruedas-negocio"),

  medicos: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.medicos(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.medicos>>>("comercial", "/directorio/medicos", {
          parametros: aParametros(filtro),
        }),

  directorio: (busqueda = "") =>
    modoMock
      ? servidorMock.directorio(busqueda)
      : solicitar<Awaited<ReturnType<typeof servidorMock.directorio>>>("comercial", "/directorio", {
          parametros: { busqueda },
        }),

  variedades: () =>
    modoMock
      ? servidorMock.variedades()
      : solicitar<Awaited<ReturnType<typeof servidorMock.variedades>>>("comercial", "/produccion/variedades"),

  agroinsumos: () =>
    modoMock
      ? servidorMock.agroinsumos()
      : solicitar<Awaited<ReturnType<typeof servidorMock.agroinsumos>>>("comercial", "/produccion/agroinsumos"),

  plantas: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.plantas(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.plantas>>>("comercial", "/produccion/plantas", {
          parametros: aParametros(filtro),
        }),

  planta: (id: string) =>
    modoMock
      ? servidorMock.planta(id)
      : solicitar<Awaited<ReturnType<typeof servidorMock.planta>>>("comercial", `/produccion/plantas/${id}`),

  beneficios: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.beneficios(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.beneficios>>>("comercial", "/produccion/beneficios", {
          parametros: aParametros(filtro),
        }),

  expedientes: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.expedientes(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.expedientes>>>("comercial", "/cumplimiento/expedientes", {
          parametros: aParametros(filtro),
        }),

  politicaVerificacion: () =>
    modoMock
      ? servidorMock.politicaVerificacion()
      : solicitar<Awaited<ReturnType<typeof servidorMock.politicaVerificacion>>>(
          "comercial",
          "/cumplimiento/politica-verificacion",
        ),

  cierres: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.cierres(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.cierres>>>("comercial", "/vitrina/cierres", {
          parametros: aParametros(filtro),
        }),

  conexiones: () =>
    modoMock
      ? servidorMock.conexiones()
      : solicitar<Awaited<ReturnType<typeof servidorMock.conexiones>>>("comercial", "/interoperabilidad/conexiones"),

  ambiente: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.ambiente(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.ambiente>>>("comercial", "/ambiente/lecturas", {
          parametros: aParametros(filtro),
        }),

  reportes: () =>
    modoMock
      ? servidorMock.reportes()
      : solicitar<Awaited<ReturnType<typeof servidorMock.reportes>>>("comercial", "/reportes/resumen"),
};
