import { modoMock, modoMockRegistro, solicitar } from "./transporte";
import { CABECERA_CAPTCHA } from "../seguridad/turnstile";
import type { Parametros } from "./transporte";
import { servidorMock } from "./mock/servidorMock";
import type { FiltroListado } from "./mock/servidorMock";
import type {
  ActaDestruccionApi,
  AtestacionApi,
  BeneficioApi,
  CierreApi,
  ConexionApi,
  CuentaApi,
  CultivoApi,
  CupoApi,
  DiscrepanciaApi,
  EventoTrazabilidadApi,
  ExpedienteApi,
  IndicadoresNacionalesApi,
  LoteApi,
  ManifestacionApi,
  OfertaApi,
  OrganizacionApi,
  PaginaApi,
  PoliticaApi,
  PreparacionSoporteApi,
  RadicacionApi,
  RequisitosActorApi,
  RespuestaDirectorioApi,
  ResumenReportesApi,
  RuedaApi,
  SolicitudApi,
  SoporteApi,
  VerificacionCorreoApi,
  TransformacionApi,
} from "./rest/contrato";
import {
  aActaDestruccion,
  aAtestacion,
  aBeneficio,
  aCierre,
  aConexion,
  aCuenta,
  aCultivo,
  aCupo,
  aDiscrepancia,
  aEvento,
  aExpediente,
  aLote,
  aManifestacion,
  aMedico,
  aOferta,
  aDetallePlanta,
  aDirectorio,
  aOrganizacion,
  aPlanta,
  aPolitica,
  aRueda,
  aSolicitud,
  aTransformacion,
} from "./rest/mapeadores";
import type { DetallePlanta, Politica, RespuestaDirectorio } from "./rest/mapeadores";
import { aParametrosDeListado, mapearPagina } from "./rest/paginacion";
import {
  cuerpoActualizarOrganizacion,
  cuerpoAvanzarBeneficio,
  cuerpoCrearLote,
  cuerpoDeclararMovimiento,
  cuerpoDecidirDocumento,
  cuerpoGuardarPolitica,
  cuerpoInvitarCuenta,
  cuerpoLevantarActa,
  cuerpoModificarCuenta,
  cuerpoMoverLote,
  cuerpoRadicarSolicitud,
  cuerpoRegistrarAtestacion,
  cuerpoRegistrarBeneficio,
  cuerpoRegistrarCultivo,
  cuerpoRegistrarLabor,
  cuerpoRegistrarPlanta,
  cuerpoRegistrarTransformacion,
  cuerpoResolverDiscrepancia,
  cuerpoPublicarOferta,
  cuerpoResolverPaso,
  sinContrato,
} from "./rest/peticiones";
import type { ComprobantePublicacion } from "./rest/peticiones";
import { claveDeIdempotencia, subirAlAlmacenamiento } from "./rest/actores";
import type { ArchivoDeSoporte } from "./rest/actores";
import type { PlantaApi } from "./rest/contrato";

type Entrada<F> = F extends (entrada: infer E) => unknown ? E : never;

type Salida<F> = F extends (entrada: never) => Promise<infer S> ? S : never;

const listar = <A, D>(
  ruta: string,
  mapear: (elemento: A) => D,
  filtro: FiltroListado,
  extra: Parametros = {},
) =>
  solicitar<PaginaApi<A>>("comercial", ruta, {
    parametros: { ...aParametrosDeListado(filtro), ...extra },
  }).then((sobre) => mapearPagina(sobre, mapear));

export const apiComercial = {
  indicadoresNacionales: () =>
    modoMock
      ? servidorMock.indicadoresNacionales()
      : solicitar<IndicadoresNacionalesApi>("comercial", "/indicadores/nacionales"),

  organizacionActual: (id?: string) =>
    modoMock
      ? servidorMock.organizacionActual(id)
      : solicitar<OrganizacionApi>("comercial", "/organizaciones/actual").then(aOrganizacion),

  organizaciones: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.organizaciones(filtro)
      : listar<OrganizacionApi, ReturnType<typeof aOrganizacion>>(
          "/organizaciones",
          aOrganizacion,
          filtro,
        ),

  organizacion: (id: string) =>
    modoMock
      ? servidorMock.organizacion(id)
      : solicitar<OrganizacionApi>("comercial", `/organizaciones/${id}`).then(aOrganizacion),

  atestaciones: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.atestaciones(filtro)
      : listar<AtestacionApi, ReturnType<typeof aAtestacion>>(
          "/atestaciones",
          (atestacion) => aAtestacion(atestacion),
          filtro,
        ),

  cultivos: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.cultivos(filtro)
      : listar<CultivoApi, ReturnType<typeof aCultivo>>(
          "/cultivos",
          (cultivo) => aCultivo(cultivo),
          filtro,
        ),

  lotes: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.lotes(filtro)
      : listar<LoteApi, ReturnType<typeof aLote>>("/lotes", (lote) => aLote(lote), filtro),

  ofertas: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.ofertas(filtro)
      : listar<OfertaApi, ReturnType<typeof aOferta>>("/ofertas", aOferta, filtro),

  oferta: (id: string) =>
    modoMock
      ? servidorMock.oferta(id)
      : solicitar<OfertaApi>("comercial", `/ofertas/${id}`).then(aOferta),

  publicarOferta: (
    borrador: Entrada<typeof servidorMock.publicarOferta>,
  ): Promise<ComprobantePublicacion> =>
    modoMock
      ? servidorMock.publicarOferta(borrador)
      : solicitar<OfertaApi>("comercial", "/ofertas", {
          metodo: "POST",
          cuerpo: cuerpoPublicarOferta(borrador),
        }).then((oferta) => ({
          id: oferta.id,
          estado: oferta.estado,
          atestacionId: oferta.atestacionHabilitanteId ?? "",
        })),

  actualizarOrganizacion: (entrada: Entrada<typeof servidorMock.actualizarOrganizacion>) =>
    modoMock
      ? servidorMock.actualizarOrganizacion(entrada)
      : solicitar<OrganizacionApi>("comercial", "/organizaciones/actual", {
          metodo: "PATCH",
          cuerpo: cuerpoActualizarOrganizacion(entrada),
        }).then(aOrganizacion),

  registrarAtestacion: (entrada: Entrada<typeof servidorMock.registrarAtestacion>) =>
    modoMock
      ? servidorMock.registrarAtestacion(entrada)
      : solicitar<AtestacionApi>("comercial", "/atestaciones", {
          metodo: "POST",
          cuerpo: cuerpoRegistrarAtestacion(entrada),
        }).then((atestacion) => aAtestacion(atestacion)),

  registrarCultivo: (entrada: Entrada<typeof servidorMock.registrarCultivo>) =>
    modoMock
      ? servidorMock.registrarCultivo(entrada)
      : solicitar<CultivoApi>("comercial", "/cultivos", {
          metodo: "POST",
          cuerpo: cuerpoRegistrarCultivo(entrada),
        }).then((cultivo) => aCultivo(cultivo)),

  cambiarEtapaCultivo: (entrada: Entrada<typeof servidorMock.cambiarEtapaCultivo>) =>
    modoMock
      ? servidorMock.cambiarEtapaCultivo(entrada)
      : sinContrato("cambiar la etapa del cultivo"),

  registrarLote: (entrada: Entrada<typeof servidorMock.registrarLote>) =>
    modoMock
      ? servidorMock.registrarLote(entrada)
      : solicitar<LoteApi>("comercial", "/lotes", {
          metodo: "POST",
          cuerpo: cuerpoCrearLote(entrada),
        }).then((lote) => aLote(lote)),

  moverLote: (entrada: Entrada<typeof servidorMock.moverLote>) =>
    modoMock
      ? servidorMock.moverLote(entrada)
      : solicitar<LoteApi>("comercial", `/lotes/${entrada.id}/movimientos`, {
          metodo: "POST",
          cuerpo: cuerpoMoverLote(entrada),
        }).then((lote) => aLote(lote)),

  registrarPlanta: (entrada: Entrada<typeof servidorMock.registrarPlanta>) =>
    modoMock
      ? servidorMock.registrarPlanta(entrada)
      : solicitar<PlantaApi>("comercial", `/cultivos/${entrada.cultivoId}/plantas`, {
          metodo: "POST",
          cuerpo: cuerpoRegistrarPlanta(entrada),
        }).then((planta) => aPlanta(planta)),

  registrarLabor: (entrada: Entrada<typeof servidorMock.registrarLabor>) =>
    modoMock
      ? servidorMock.registrarLabor(entrada)
      : solicitar<Salida<typeof servidorMock.registrarLabor>>(
          "comercial",
          `/plantas/${entrada.plantaId}/labores`,
          { metodo: "POST", cuerpo: cuerpoRegistrarLabor(entrada) },
        ),

  cosecharPlanta: (entrada: Entrada<typeof servidorMock.cosecharPlanta>) =>
    modoMock
      ? servidorMock.cosecharPlanta(entrada)
      : solicitar<PlantaApi>("comercial", `/plantas/${entrada.id}/cosecha`, {
          metodo: "POST",
        }).then((planta) => aPlanta(planta)),

  registrarBeneficio: (entrada: Entrada<typeof servidorMock.registrarBeneficio>) =>
    modoMock
      ? servidorMock.registrarBeneficio(entrada)
      : solicitar<BeneficioApi>("comercial", "/beneficios", {
          metodo: "POST",
          cuerpo: cuerpoRegistrarBeneficio(entrada),
        }).then((beneficio) => aBeneficio(beneficio)),

  avanzarBeneficio: (entrada: Entrada<typeof servidorMock.avanzarBeneficio>) =>
    modoMock
      ? servidorMock.avanzarBeneficio(entrada)
      : solicitar<BeneficioApi>("comercial", `/beneficios/${entrada.id}/avances`, {
          metodo: "POST",
          cuerpo: cuerpoAvanzarBeneficio(entrada),
        }).then((beneficio) => aBeneficio(beneficio)),

  transformaciones: (filtro: FiltroListado & { loteId?: string } = {}) =>
    modoMock
      ? servidorMock.transformaciones(filtro)
      : filtro.loteId
        ? listar<TransformacionApi, ReturnType<typeof aTransformacion>>(
            `/lotes/${filtro.loteId}/transformaciones`,
            (transformacion) => aTransformacion(transformacion),
            filtro,
          )
        : sinContrato("listar las transformaciones de la organización"),

  registrarTransformacion: (entrada: Entrada<typeof servidorMock.registrarTransformacion>) =>
    modoMock
      ? servidorMock.registrarTransformacion(entrada)
      : solicitar<TransformacionApi>("comercial", "/transformaciones", {
          metodo: "POST",
          cuerpo: cuerpoRegistrarTransformacion(entrada),
        }).then((transformacion) => aTransformacion(transformacion)),

  destrucciones: (filtro: FiltroListado & { entidad?: string; entidadId?: string } = {}) =>
    modoMock
      ? servidorMock.destrucciones(filtro)
      : filtro.entidad && filtro.entidadId
        ? listar<ActaDestruccionApi, ReturnType<typeof aActaDestruccion>>(
            "/actas-destruccion",
            (acta) => aActaDestruccion(acta),
            filtro,
            { entidad: filtro.entidad, entidadId: filtro.entidadId },
          )
        : sinContrato("listar las actas de destrucción de la organización"),

  registrarDestruccion: (entrada: Entrada<typeof servidorMock.registrarDestruccion>) =>
    modoMock
      ? servidorMock.registrarDestruccion(entrada)
      : solicitar<ActaDestruccionApi>("comercial", "/actas-destruccion", {
          metodo: "POST",
          cuerpo: cuerpoLevantarActa(entrada),
        }).then((acta) => aActaDestruccion(acta)),

  decidirDocumento: (entrada: Entrada<typeof servidorMock.decidirDocumento>) =>
    modoMock
      ? servidorMock.decidirDocumento(entrada)
      : solicitar<ExpedienteApi>("comercial", "/cumplimiento/expedientes/documentos", {
          metodo: "PATCH",
          cuerpo: cuerpoDecidirDocumento(entrada),
        }).then((expediente) => aExpediente(expediente)),

  resolverPaso: (entrada: Entrada<typeof servidorMock.resolverPaso>) =>
    modoMock
      ? servidorMock.resolverPaso(entrada)
      : solicitar<ExpedienteApi>("comercial", "/cumplimiento/expedientes/pasos", {
          metodo: "PATCH",
          cuerpo: cuerpoResolverPaso(entrada),
        }).then((expediente) => aExpediente(expediente)),

  guardarPolitica: (entrada: Entrada<typeof servidorMock.guardarPolitica>): Promise<Politica> =>
    modoMock
      ? servidorMock.guardarPolitica(entrada)
      : solicitar<PoliticaApi>("comercial", "/cumplimiento/politica-verificacion", {
          metodo: "PUT",
          cuerpo: cuerpoGuardarPolitica(entrada),
        }).then(aPolitica),

  solicitudes: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.solicitudes(filtro)
      : listar<SolicitudApi, ReturnType<typeof aSolicitud>>(
          "/actores/solicitudes",
          aSolicitud,
          filtro,
        ),

  requisitosDeActor: (tipoActor: Entrada<typeof servidorMock.requisitosDeActor>) =>
    modoMockRegistro
      ? servidorMock.requisitosDeActor(tipoActor)
      : solicitar<RequisitosActorApi>("comercial", `/actores/requisitos/${tipoActor}`),

  prepararSoporte: ({
    captcha,
    ...entrada
  }: Entrada<typeof servidorMock.prepararSoporte> & { captcha?: string }) =>
    modoMockRegistro
      ? servidorMock.prepararSoporte(entrada)
      : solicitar<PreparacionSoporteApi>("comercial", "/actores/soportes:preparar", {
          metodo: "POST",
          cuerpo: entrada,
          ...(captcha ? { cabeceras: { [CABECERA_CAPTCHA]: captcha } } : {}),
        }),

  subirSoporte: (preparacion: PreparacionSoporteApi, archivo: ArchivoDeSoporte): Promise<void> =>
    modoMockRegistro ? Promise.resolve() : subirAlAlmacenamiento(preparacion.subida, archivo),

  confirmarSoporte: ({ soporteId, captcha }: { soporteId: string; captcha?: string }) =>
    modoMockRegistro
      ? servidorMock.confirmarSoporte(soporteId)
      : solicitar<SoporteApi>("comercial", `/actores/soportes/${soporteId}:confirmar`, {
          metodo: "POST",
          ...(captcha ? { cabeceras: { [CABECERA_CAPTCHA]: captcha } } : {}),
        }),

  radicarSolicitud: ({
    captcha,
    ...entrada
  }: Entrada<typeof servidorMock.radicarSolicitud> & { captcha?: string }): Promise<RadicacionApi> =>
    modoMockRegistro
      ? servidorMock.radicarSolicitud(entrada)
      : solicitar<RadicacionApi>("comercial", "/actores/solicitudes", {
          metodo: "POST",
          cuerpo: cuerpoRadicarSolicitud(entrada),
          cabeceras: {
            "Idempotency-Key": claveDeIdempotencia(),
            ...(captcha ? { [CABECERA_CAPTCHA]: captcha } : {}),
          },
        }),

  verificarCorreo: ({
    solicitudId,
    token,
    captcha,
  }: {
    solicitudId: string;
    token: string;
    captcha?: string;
  }): Promise<VerificacionCorreoApi> =>
    modoMockRegistro
      ? servidorMock.verificarCorreo({ solicitudId, token })
      : solicitar<VerificacionCorreoApi>(
          "comercial",
          `/actores/solicitudes/${solicitudId}/verificacion`,
          {
            metodo: "POST",
            cuerpo: { token },
            ...(captcha ? { cabeceras: { [CABECERA_CAPTCHA]: captcha } } : {}),
          },
        ),

  abrirExpediente: (entrada: Entrada<typeof servidorMock.abrirExpediente>) =>
    modoMock
      ? servidorMock.abrirExpediente(entrada)
      : solicitar<ExpedienteApi>("comercial", "/cumplimiento/expedientes", {
          metodo: "POST",
          cuerpo: { solicitudId: entrada.solicitudId },
        }).then((expediente) => aExpediente(expediente)),

  cuentas: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.cuentas(filtro)
      : listar<CuentaApi, ReturnType<typeof aCuenta>>(
          "/iam/cuentas",
          (cuenta) => aCuenta(cuenta),
          filtro,
        ),

  invitarCuenta: (entrada: Entrada<typeof servidorMock.invitarCuenta>) =>
    modoMock
      ? servidorMock.invitarCuenta(entrada)
      : solicitar<CuentaApi>("comercial", "/iam/cuentas", {
          metodo: "POST",
          cuerpo: cuerpoInvitarCuenta(entrada),
        }).then((cuenta) => aCuenta(cuenta)),

  cambiarCuenta: (entrada: Entrada<typeof servidorMock.cambiarCuenta>) =>
    modoMock
      ? servidorMock.cambiarCuenta(entrada)
      : solicitar<CuentaApi>("comercial", "/iam/cuentas", {
          metodo: "PATCH",
          cuerpo: cuerpoModificarCuenta(entrada),
        }).then((cuenta) => aCuenta(cuenta)),

  cupos: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.cupos(filtro)
      : listar<CupoApi, ReturnType<typeof aCupo>>("/cupos", (cupo) => aCupo(cupo), filtro),

  conciliarCupos: (entrada: Entrada<typeof servidorMock.conciliarCupos>) =>
    modoMock ? servidorMock.conciliarCupos(entrada) : sinContrato("conciliar todos los cupos"),

  declararMovimiento: (entrada: Entrada<typeof servidorMock.declararMovimiento>) =>
    modoMock
      ? servidorMock.declararMovimiento(entrada)
      : solicitar<CierreApi>("comercial", "/vitrina/cierres", {
          metodo: "PATCH",
          cuerpo: cuerpoDeclararMovimiento(entrada),
        }).then((cierre) => aCierre(cierre)),

  manifestarInteres: (entrada: Entrada<typeof servidorMock.manifestarInteres>) =>
    modoMock
      ? servidorMock.manifestarInteres(entrada)
      : solicitar<ManifestacionApi>("comercial", "/vitrina/manifestaciones", {
          metodo: "POST",
          cuerpo: {
            ofertaId: entrada.ofertaId,
            solicitante: entrada.solicitante,
            departamento: entrada.departamento,
          },
        }).then(aManifestacion),

  habilitarContacto: (entrada: Entrada<typeof servidorMock.habilitarContacto>) =>
    modoMock
      ? servidorMock.habilitarContacto(entrada)
      : solicitar<ManifestacionApi>("comercial", "/vitrina/manifestaciones/habilitacion", {
          metodo: "PATCH",
          cuerpo: { id: entrada.id },
        }).then(aManifestacion),

  inscribirRueda: (entrada: Entrada<typeof servidorMock.inscribirRueda>) =>
    modoMock
      ? servidorMock.inscribirRueda(entrada)
      : solicitar<RuedaApi>("comercial", "/ruedas-negocio/inscripciones", {
          metodo: "POST",
          cuerpo: { id: entrada.id },
        }).then(aRueda),

  discrepancias: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.discrepancias(filtro)
      : solicitar<readonly DiscrepanciaApi[]>("comercial", "/interoperabilidad/discrepancias", {
          parametros: { entidad: filtro.tipo },
        }).then((lista) => lista.map((discrepancia) => aDiscrepancia(discrepancia))),

  resolverDiscrepancia: (entrada: Entrada<typeof servidorMock.resolverDiscrepancia>) =>
    modoMock
      ? servidorMock.resolverDiscrepancia(entrada)
      : solicitar<DiscrepanciaApi>("comercial", "/interoperabilidad/discrepancias", {
          metodo: "PATCH",
          cuerpo: cuerpoResolverDiscrepancia(entrada),
        }).then((discrepancia) => aDiscrepancia(discrepancia)),

  sincronizarConexion: (entrada: Entrada<typeof servidorMock.sincronizarConexion>) =>
    modoMock
      ? servidorMock.sincronizarConexion(entrada)
      : solicitar<ConexionApi>("comercial", "/interoperabilidad/conexiones/sincronizacion", {
          metodo: "POST",
          cuerpo: { id: entrada.id },
        }).then(aConexion),

  manifestaciones: () =>
    modoMock
      ? servidorMock.manifestaciones()
      : solicitar<readonly ManifestacionApi[]>("comercial", "/manifestaciones").then((lista) =>
          lista.map(aManifestacion),
        ),

  eventos: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.eventos(filtro)
      : listar<EventoTrazabilidadApi, ReturnType<typeof aEvento>>(
          "/trazabilidad/eventos",
          aEvento,
          filtro,
        ),

  ruedas: () =>
    modoMock
      ? servidorMock.ruedas()
      : solicitar<readonly RuedaApi[]>("comercial", "/ruedas-negocio").then((lista) =>
          lista.map(aRueda),
        ),

  medicos: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.medicos(filtro)
      : solicitar<RespuestaDirectorioApi>("comercial", "/directorio", {
          parametros: { busqueda: filtro.busqueda },
        }).then((directorio) => directorio.medicos.map(aMedico)),

  directorio: (busqueda = ""): Promise<RespuestaDirectorio> =>
    modoMock
      ? servidorMock.directorio(busqueda)
      : solicitar<RespuestaDirectorioApi>("comercial", "/directorio", {
          parametros: { busqueda },
        }).then(aDirectorio),

  variedades: () =>
    modoMock ? servidorMock.variedades() : sinContrato("consultar el catálogo de variedades"),

  agroinsumos: () =>
    modoMock ? servidorMock.agroinsumos() : sinContrato("consultar el catálogo de agroinsumos"),

  plantas: (filtro: FiltroListado & { cultivoId?: string } = {}) =>
    modoMock
      ? servidorMock.plantas(filtro)
      : filtro.cultivoId
        ? listar<PlantaApi, ReturnType<typeof aPlanta>>(
            `/cultivos/${filtro.cultivoId}/plantas`,
            (planta) => aPlanta(planta),
            filtro,
          )
        : sinContrato("listar las plantas de la organización"),

  planta: (id: string): Promise<DetallePlanta> =>
    modoMock
      ? servidorMock.planta(id)
      : solicitar<PlantaApi>("comercial", `/plantas/${id}`).then((planta) =>
          aDetallePlanta(planta),
        ),

  beneficios: (filtro: FiltroListado & { cultivoId?: string } = {}) =>
    modoMock
      ? servidorMock.beneficios(filtro)
      : filtro.cultivoId
        ? listar<BeneficioApi, ReturnType<typeof aBeneficio>>(
            `/cultivos/${filtro.cultivoId}/beneficios`,
            (beneficio) => aBeneficio(beneficio),
            filtro,
          )
        : sinContrato("listar los beneficios de la organización"),

  expedientes: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.expedientes(filtro)
      : listar<ExpedienteApi, ReturnType<typeof aExpediente>>(
          "/cumplimiento/expedientes",
          (expediente) => aExpediente(expediente),
          filtro,
        ),

  politicaVerificacion: (): Promise<Politica> =>
    modoMock
      ? servidorMock.politicaVerificacion()
      : solicitar<PoliticaApi>("comercial", "/cumplimiento/politica-verificacion").then(aPolitica),

  cierres: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMock.cierres(filtro)
      : solicitar<readonly CierreApi[]>("comercial", "/vitrina/cierres").then((lista) =>
          lista.map((cierre) => aCierre(cierre)),
        ),

  conexiones: () =>
    modoMock
      ? servidorMock.conexiones()
      : solicitar<readonly ConexionApi[]>("comercial", "/interoperabilidad/conexiones").then(
          (lista) => lista.map(aConexion),
        ),

  ambiente: (filtro: FiltroListado = {}) =>
    modoMock ? servidorMock.ambiente(filtro) : sinContrato("consultar las lecturas de ambiente"),

  reportes: () =>
    modoMock
      ? servidorMock.reportes()
      : solicitar<ResumenReportesApi>("comercial", "/reportes/resumen"),
};
