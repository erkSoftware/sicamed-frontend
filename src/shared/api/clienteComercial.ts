import { modoMock, solicitar } from "./transporte";
import { servidorMock } from "./mock/servidorMock";
import type { FiltroListado } from "./mock/servidorMock";

type Parametros = Record<string, string | number | undefined>;

type Metodo = "POST" | "PUT" | "PATCH";

const aParametros = (filtro: FiltroListado): Parametros => ({
  busqueda: filtro.busqueda,
  estado: filtro.estado,
  departamento: filtro.departamento,
  tipo: filtro.tipo,
  pagina: filtro.pagina,
  porPagina: filtro.porPagina,
});

const escribir = <F extends (entrada: never) => Promise<unknown>>(
  operacion: F,
  ruta: string,
  metodo: Metodo = "POST",
) =>
  ((cuerpo: Parameters<F>[0]) =>
    modoMock
      ? operacion(cuerpo)
      : solicitar<Awaited<ReturnType<F>>>("comercial", ruta, { metodo, cuerpo })) as (
    cuerpo: Parameters<F>[0],
  ) => Promise<Awaited<ReturnType<F>>>;

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

  publicarOferta: escribir(servidorMock.publicarOferta, "/ofertas"),

  actualizarOrganizacion: escribir(
    servidorMock.actualizarOrganizacion,
    "/organizaciones/actual",
    "PATCH",
  ),

  registrarAtestacion: escribir(servidorMock.registrarAtestacion, "/atestaciones"),

  registrarCultivo: escribir(servidorMock.registrarCultivo, "/cultivos"),

  cambiarEtapaCultivo: escribir(servidorMock.cambiarEtapaCultivo, "/cultivos/etapa", "PATCH"),

  registrarLote: escribir(servidorMock.registrarLote, "/lotes"),

  moverLote: escribir(servidorMock.moverLote, "/lotes/movimiento", "PATCH"),

  registrarPlanta: escribir(servidorMock.registrarPlanta, "/produccion/plantas"),

  registrarLabor: escribir(servidorMock.registrarLabor, "/produccion/labores"),

  cosecharPlanta: escribir(servidorMock.cosecharPlanta, "/produccion/plantas/cosecha", "PATCH"),

  registrarBeneficio: escribir(servidorMock.registrarBeneficio, "/produccion/beneficios"),

  avanzarBeneficio: escribir(servidorMock.avanzarBeneficio, "/produccion/beneficios/avance", "PATCH"),

  transformaciones: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.transformaciones(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.transformaciones>>>(
          "comercial",
          "/produccion/transformaciones",
          { parametros: aParametros(filtro) },
        ),

  registrarTransformacion: escribir(
    servidorMock.registrarTransformacion,
    "/produccion/transformaciones",
  ),

  destrucciones: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.destrucciones(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.destrucciones>>>(
          "comercial",
          "/produccion/destrucciones",
          { parametros: aParametros(filtro) },
        ),

  registrarDestruccion: escribir(servidorMock.registrarDestruccion, "/produccion/destrucciones"),

  decidirDocumento: escribir(
    servidorMock.decidirDocumento,
    "/cumplimiento/expedientes/documentos",
    "PATCH",
  ),

  resolverPaso: escribir(servidorMock.resolverPaso, "/cumplimiento/expedientes/pasos", "PATCH"),

  guardarPolitica: escribir(
    servidorMock.guardarPolitica,
    "/cumplimiento/politica-verificacion",
    "PUT",
  ),

  solicitudes: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.solicitudes(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.solicitudes>>>(
          "comercial",
          "/actores/solicitudes",
          { parametros: aParametros(filtro) },
        ),

  radicarSolicitud: escribir(servidorMock.radicarSolicitud, "/actores/solicitudes"),

  abrirExpediente: escribir(servidorMock.abrirExpediente, "/cumplimiento/expedientes"),

  cuentas: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.cuentas(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.cuentas>>>("comercial", "/iam/cuentas", {
          parametros: aParametros(filtro),
        }),

  invitarCuenta: escribir(servidorMock.invitarCuenta, "/iam/cuentas"),

  cambiarCuenta: escribir(servidorMock.cambiarCuenta, "/iam/cuentas", "PATCH"),

  cupos: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.cupos(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.cupos>>>("comercial", "/produccion/cupos", {
          parametros: aParametros(filtro),
        }),

  conciliarCupos: escribir(servidorMock.conciliarCupos, "/produccion/cupos/conciliacion"),

  declararMovimiento: escribir(servidorMock.declararMovimiento, "/vitrina/cierres", "PATCH"),

  manifestarInteres: escribir(servidorMock.manifestarInteres, "/vitrina/manifestaciones"),

  habilitarContacto: escribir(
    servidorMock.habilitarContacto,
    "/vitrina/manifestaciones/habilitacion",
    "PATCH",
  ),

  inscribirRueda: escribir(servidorMock.inscribirRueda, "/ruedas-negocio/inscripciones"),

  discrepancias: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.discrepancias(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMock.discrepancias>>>(
          "comercial",
          "/interoperabilidad/discrepancias",
          { parametros: aParametros(filtro) },
        ),

  resolverDiscrepancia: escribir(
    servidorMock.resolverDiscrepancia,
    "/interoperabilidad/discrepancias",
    "PATCH",
  ),

  sincronizarConexion: escribir(
    servidorMock.sincronizarConexion,
    "/interoperabilidad/conexiones/sincronizacion",
  ),

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
