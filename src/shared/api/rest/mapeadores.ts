import type {
  ActaDestruccionApi,
  BloqueoAsistenteApi,
  ConfiguracionAsistenteApi,
  EstadoLlamadasAsistenteApi,
  AtestacionApi,
  BeneficioApi,
  CierreApi,
  ConexionApi,
  CuentaApi,
  CultivoApi,
  CupoApi,
  DiscrepanciaApi,
  DocumentoApi,
  EventoTrazabilidadApi,
  ExpedienteApi,
  LaborApi,
  LoteApi,
  ManifestacionApi,
  MedicoApi,
  OfertaApi,
  OfertaPublicaApi,
  OrganizacionApi,
  PasoApi,
  PlantaApi,
  PoliticaApi,
  RespuestaDirectorioApi,
  ReglaApi,
  RuedaApi,
  SolicitudApi,
  SolicitudDetalleApi,
  DescargaSoporteApi,
  TransformacionApi,
} from "./contrato";
import { aNumero, aNulo, aTexto, soloFecha } from "./conversiones";
import { CATALOGO_VACIO, cultivoDe, nombreDe, variedadDe } from "./catalogo";
import {
  LIMITES_DE_FABRICA,
  MODELOS_DEL_DESPLIEGUE,
  MODELO_DEL_DESPLIEGUE,
  VOZ_DEL_DESPLIEGUE,
} from "../mock/configuracionAsistente";
import type { Catalogo } from "./catalogo";
import type {
  ActaDestruccion,
  Atestacion,
  BloqueoAsistente,
  ConfiguracionAsistente,
  EstadoLlamadasAsistente,
  TipoBloqueoAsistente,
  Beneficio,
  CausalDestruccion,
  CierreExterno,
  Conexion,
  CuentaUsuario,
  Cultivo,
  CupoMicc,
  Discrepancia,
  DocumentoExpediente,
  EstadoBeneficio,
  EstadoCultivo,
  EstadoCupo,
  EstadoHabilitacion,
  EstadoLote,
  EstadoOferta,
  EstadoPlanta,
  EstadoSolicitud,
  EventoTrazabilidad,
  Expediente,
  Labor,
  Lote,
  ManifestacionInteres,
  Medico,
  Oferta,
  Organizacion,
  PasoVerificacion,
  Planta,
  ReglaVerificacion,
  RolPlataforma,
  RuedaNegocio,
  DescargaDeSoporte,
  SolicitudDetallada,
  SolicitudRegistro,
  TipoDocumento,
  TipoLote,
  Transformacion,
  VeredictoPaso,
} from "../mock/tipos";

const ESTADO_ORGANIZACION: Record<OrganizacionApi["estado"], EstadoHabilitacion> = {
  HABILITADA: "HABILITADA",
  EN_TRAMITE: "EN_TRAMITE",
  SUSPENDIDA: "SUSPENDIDA",
  VENCIDA: "VENCIDA",
  INACTIVA: "SUSPENDIDA",
};

export const tieneDatosDeContacto = (api: OrganizacionApi): boolean =>
  api.correo !== undefined && api.representante !== undefined && api.telefono !== undefined;

export const aOrganizacion = (api: OrganizacionApi): Organizacion => ({
  id: api.id,
  nit: api.nit,
  nombre: api.nombre,
  tipo: api.tipo,
  departamento: api.departamento,
  municipio: api.municipio,
  estado: ESTADO_ORGANIZACION[api.estado],
  registro: api.registro,
  representante: aTexto(api.representante),
  correo: aTexto(api.correo),
  telefono: aTexto(api.telefono),
  cultivos: api.cultivos ?? 0,
  lotes: api.lotes ?? 0,
  ofertas: api.ofertas ?? 0,
});

const ESTADO_OFERTA: Record<OfertaApi["estado"], EstadoOferta> = {
  BORRADOR: "BORRADOR",
  PUBLICADA: "PUBLICADA",
  PAUSADA: "SUSPENDIDA",
  DESPUBLICADA: "RECHAZADA",
  CERRADA: "CERRADA",
};

export const aOferta = (api: OfertaApi): Oferta => ({
  id: api.id,
  titulo: api.titulo,
  tipoProducto: api.tipoProducto,
  organizacionId: api.organizacionId,
  organizacion: api.organizacion,
  tipoActor: api.tipoActor,
  departamento: api.departamento,
  municipio: api.municipio,
  estado: ESTADO_OFERTA[api.estado],
  disponibilidad: api.disponibilidad,
  publicada: aTexto(api.publicada),
  vigencia: aTexto(api.vigencia),
  descripcion: api.descripcion,
  certificaciones: api.certificaciones ?? [],
  interesados: api.interesados ?? 0,
});

export const aOfertaPublica = (api: OfertaPublicaApi): Oferta => ({
  id: api.id,
  titulo: api.titulo,
  tipoProducto: api.tipoProducto,
  organizacionId: api.organizacionId,
  organizacion: api.organizacion,
  tipoActor: api.tipoActor,
  departamento: api.departamento,
  municipio: api.municipio,
  estado: "PUBLICADA",
  disponibilidad: api.disponibilidad,
  publicada: api.publicada,
  vigencia: api.vigencia,
  descripcion: api.descripcion,
  certificaciones: api.certificaciones ?? [],
  interesados: 0,
});

const ESTADO_ATESTACION = {
  VIGENTE: "VIGENTE",
  POR_VENCER: "POR_VENCER",
  VENCIDA: "VENCIDA",
  REVOCADA: "RECHAZADA",
} as const;

export const aAtestacion = (api: AtestacionApi, catalogo: Catalogo = CATALOGO_VACIO): Atestacion => ({
  id: api.id,
  organizacionId: api.organizacionId,
  organizacion: nombreDe(catalogo.organizaciones, api.organizacionId),
  tipo: api.tipo,
  acto: api.acto,
  autoridad: api.autoridad,
  expedicion: api.expedicion,
  vencimiento: api.vencimiento,
  estado: ESTADO_ATESTACION[api.estado],
  evidencia: api.evidencia,
  huella: api.huella,
});

const ESTADO_CULTIVO: Record<CultivoApi["estado"], EstadoCultivo> = {
  PLANIFICADO: "PREPARACION",
  SIEMBRA: "PREPARACION",
  VEGETATIVO: "VEGETATIVO",
  FLORACION: "FLORACION",
  COSECHA: "COSECHA",
  CERRADO: "CERRADO",
};

export const aCultivo = (api: CultivoApi, catalogo: Catalogo = CATALOGO_VACIO): Cultivo => {
  const variedad = variedadDe(catalogo, api.variedadId);
  return {
    id: api.id,
    nombre: api.nombre,
    organizacionId: api.organizacionId,
    organizacion: nombreDe(catalogo.organizaciones, api.organizacionId),
    departamento: api.departamento,
    municipio: api.municipio,
    variedad: variedad.nombre,
    psicoactivo: variedad.tipo === "PSICOACTIVO",
    areaHectareas: aNumero(api.areaHectareas),
    plantas: api.plantas,
    estado: ESTADO_CULTIVO[api.estado],
    siembra: api.siembra,
    cosechaEstimada: api.cosechaEstimada,
  };
};

const ESTADO_LOTE: Record<LoteApi["estado"], EstadoLote> = {
  EN_BODEGA: "EN_BODEGA",
  EN_TRANSITO: "EN_TRANSITO",
  DISPENSADO: "DISPENSADO",
  RETENIDO: "RETENIDO",
  DESTRUIDO: "DESTRUIDO",
  CONGELADO: "RETENIDO",
};

export const aLote = (api: LoteApi, catalogo: Catalogo = CATALOGO_VACIO): Lote => ({
  id: api.id,
  codigo: api.codigo,
  cultivoId: aTexto(api.cultivoId),
  organizacionId: api.organizacionId,
  organizacion: nombreDe(catalogo.organizaciones, api.organizacionId),
  tipo: api.tipo as TipoLote,
  cantidad: aNumero(api.existencia),
  unidad: api.unidad,
  estado: ESTADO_LOTE[api.estado],
  thc: aNumero(api.thc),
  cbd: aNumero(api.cbd),
  bodega: api.bodega,
  departamento: api.departamento,
  fecha: api.fecha,
  vencimiento: api.vencimiento,
});

const ESTADO_PLANTA: Record<PlantaApi["estado"], EstadoPlanta> = {
  VIVA: "VEGETATIVO",
  COSECHADA: "COSECHADA",
  DESTRUIDA: "DESTRUIDA",
};

export const aPlanta = (api: PlantaApi, catalogo: Catalogo = CATALOGO_VACIO): Planta => {
  const cultivo = cultivoDe(catalogo, api.cultivoId);
  const variedad = variedadDe(catalogo, api.variedadId);
  return {
    id: api.id,
    codigo: api.codigo,
    variedadId: api.variedadId,
    variedad: variedad.nombre,
    tipo: variedad.tipo,
    cultivoId: api.cultivoId,
    cultivo: cultivo.nombre,
    organizacionId: api.organizacionId,
    departamento: cultivo.departamento,
    origen: api.origen,
    madre: aNulo(api.madreId),
    estado: ESTADO_PLANTA[api.estado],
    siembra: api.siembra,
    bloque: api.bloque,
    labores: api.labores?.length ?? 0,
    aptaDesde: aTexto(api.aptaDesde),
    huella: "",
  };
};

const ESTADO_BENEFICIO: Record<BeneficioApi["estado"], EstadoBeneficio> = {
  SECADO: "SECADO",
  CURADO: "CURADO",
  ACONDICIONADO: "ACONDICIONADO",
  CERRADO: "ACONDICIONADO",
};

export const aBeneficio = (api: BeneficioApi, catalogo: Catalogo = CATALOGO_VACIO): Beneficio => {
  const cultivo = cultivoDe(catalogo, api.cultivoId);
  const variedad = variedadDe(catalogo, cultivo.variedadId);
  return {
    id: api.id,
    codigo: api.id,
    cultivoId: api.cultivoId,
    cultivo: cultivo.nombre,
    organizacionId: api.organizacionId,
    organizacion: nombreDe(catalogo.organizaciones, api.organizacionId),
    departamento: cultivo.departamento,
    variedad: variedad.nombre,
    tipo: variedad.tipo,
    plantas: api.plantas,
    pesoHumedo: aNumero(api.pesoHumedoKg),
    pesoSeco: aNumero(api.pesoSecoKg),
    pesoAcondicionado: aNumero(api.pesoAcondicionadoKg),
    humedad: aNumero(api.humedad),
    estado: ESTADO_BENEFICIO[api.estado],
    inicio: api.registro,
    fin: api.estado === "CERRADO" ? api.registro : "",
    loteCodigo: null,
    responsable: api.responsable,
    huella: "",
  };
};

const ESTADO_CUPO: Record<CupoApi["estado"], EstadoCupo> = {
  ASIGNADO: "VIGENTE",
  CONCILIADO: "VIGENTE",
  DISCREPANTE: "POR_VENCER",
  VENCIDO: "SIN_CUPO",
};

export const aCupo = (api: CupoApi, catalogo: Catalogo = CATALOGO_VACIO): CupoMicc => ({
  id: api.id,
  organizacionId: api.organizacionId,
  organizacion: nombreDe(catalogo.organizaciones, api.organizacionId),
  modalidad: catalogo.modalidades?.get(api.id) ?? "CULTIVO_NO_PSICOACTIVO",
  actoAsignacion: api.acto,
  plantasAutorizadas: api.plantasAsignadas,
  plantasSembradas: api.plantasUsadas,
  vigencia: api.vigenciaHasta,
  estado: api.plantasDisponibles === 0 ? "AGOTADO" : ESTADO_CUPO[api.estado],
  conciliado: api.plantasReportadasMicc === null ? "" : api.vigenciaDesde,
  norma: "Dec. 1138/2025 Art. 3",
});

export const aTransformacion = (
  api: TransformacionApi,
  catalogo: Catalogo = CATALOGO_VACIO,
): Transformacion => ({
  id: api.id,
  codigo: api.id,
  organizacionId: api.organizacionId,
  organizacion: nombreDe(catalogo.organizaciones, api.organizacionId),
  departamento: "",
  loteOrigen: nombreDe(catalogo.lotes, api.loteOrigenId),
  loteOrigenId: api.loteOrigenId,
  producto: api.producto,
  formula: api.formula,
  entradaKg: aNumero(api.entradaKg),
  salida: aNumero(api.salida),
  unidadSalida: api.unidadSalida,
  rendimiento: aNumero(api.rendimiento),
  registroInvima: aNulo(api.registroInvima),
  estado: api.loteResultanteId ? "LIBERADA" : "EN_PROCESO",
  loteResultante: api.loteResultanteId ? nombreDe(catalogo.lotes, api.loteResultanteId) : null,
  responsable: api.responsable,
  fecha: api.fecha,
  huella: "",
});

const CAUSALES: readonly CausalDestruccion[] = [
  "PLAGA_NO_CONTROLABLE",
  "FUERA_DE_ESPECIFICACION",
  "VENCIMIENTO",
  "ORDEN_AUTORIDAD",
  "EXCEDENTE_DE_CUPO",
];

const aCausal = (causal: string): CausalDestruccion =>
  (CAUSALES as readonly string[]).includes(causal)
    ? (causal as CausalDestruccion)
    : "ORDEN_AUTORIDAD";

export const aActaDestruccion = (
  api: ActaDestruccionApi,
  catalogo: Catalogo = CATALOGO_VACIO,
): ActaDestruccion => ({
  id: api.id,
  acta: api.id,
  organizacionId: api.organizacionId,
  organizacion: nombreDe(catalogo.organizaciones, api.organizacionId),
  departamento: "",
  entidad: api.entidad === "LOTE" ? "LOTE" : "PLANTA",
  entidadId: api.entidadId,
  referencia: nombreDe(catalogo.lotes, api.entidadId),
  cantidad: aNumero(api.cantidad),
  unidad: api.unidad,
  causal: aCausal(api.causal),
  metodo: api.metodo,
  testigo: api.testigo,
  cargoTestigo: api.cargoTestigo,
  responsable: api.responsable,
  fecha: api.fecha,
  norma: "Dec. 1138/2025 Art. 11",
  huella: "",
});

export const aEvento = (api: EventoTrazabilidadApi): EventoTrazabilidad => ({
  id: api.id,
  secuencia: api.secuencia,
  tipo: api.tipo,
  descripcion: api.descripcion,
  entidad: api.entidad,
  entidadId: api.entidadId,
  actor: api.actor,
  organizacionId: aTexto(api.organizacionId),
  fecha: api.fecha,
  huella: api.huella,
  huellaPrevia: api.huellaPrevia,
});

const ESTADO_CONEXION = {
  CONECTADA: "OPERATIVA",
  DEGRADADA: "DEGRADADA",
  NO_CONECTADA: "NO_CONECTADA",
} as const;

export const aConexion = (api: ConexionApi): Conexion => ({
  id: api.id,
  sigla: api.entidad,
  nombre: api.nombre,
  entidad: api.entidad,
  proposito: api.descripcion,
  direccion: "CONSULTA",
  estado: ESTADO_CONEXION[api.estado],
  ultimaLectura: aTexto(api.ultimaSincronizacion),
  conciliados: api.registrosSincronizados ?? 0,
  discrepancias: api.discrepanciasAbiertas ?? 0,
  mecanismo: "",
  norma: api.norma,
});

const ESTADO_DISCREPANCIA = {
  PENDIENTE: "ABIERTA",
  ESCALADA: "ABIERTA",
  ACEPTA_EXTERNO: "RESUELTA_EXTERNO",
  SUBSANADA: "RESUELTA_LOCAL",
} as const;

export const aDiscrepancia = (
  api: DiscrepanciaApi,
  catalogo: Catalogo = CATALOGO_VACIO,
): Discrepancia => ({
  id: api.id,
  conexionId: api.conexionId,
  sigla: api.entidad,
  organizacionId: api.entidadId,
  organizacion: nombreDe(catalogo.organizaciones, api.entidadId),
  campo: api.campo,
  valorLocal: api.valorLocal,
  valorExterno: api.valorExterno,
  autoritativo: api.resolucion === "SUBSANADA" ? "LOCAL" : "EXTERNO",
  estado: ESTADO_DISCREPANCIA[api.resolucion],
  detectada: api.detectada,
  resuelta: aNulo(api.resuelta),
  resueltaPor: api.resueltaPor === "" ? null : api.resueltaPor,
});

const ESTADO_MANIFESTACION = {
  RECIBIDA: "NUEVA",
  CONTACTO_HABILITADO: "HABILITADA",
  DECLINADA: "DESCARTADA",
  EXPIRADA: "DESCARTADA",
} as const;

export const aManifestacion = (api: ManifestacionApi): ManifestacionInteres => ({
  id: api.id,
  ofertaId: api.ofertaId,
  oferta: api.oferta,
  solicitante: api.solicitante,
  departamento: api.departamento,
  fecha: api.fecha,
  estado: ESTADO_MANIFESTACION[api.estado],
});

export const aCierre = (api: CierreApi, catalogo: Catalogo = CATALOGO_VACIO): CierreExterno => ({
  id: api.id,
  ofertaId: api.ofertaId,
  oferta: nombreDe(catalogo.ofertas, api.ofertaId),
  tipoProducto: "",
  tipo: "NO_PSICOACTIVO",
  organizacion: "",
  contraparte: "",
  departamento: "",
  via: api.canal,
  entidad: api.canal === "FNE" ? "Fondo Nacional de Estupefacientes" : "",
  norma: "Res. 1241/2026 Art. 18",
  estado:
    api.movimiento === "NO_DECLARADO"
      ? "SIN_DECLARAR"
      : api.movimiento === "EN_CONVERSACION"
        ? "TRAMITE_EXTERNO"
        : "MOVIMIENTO_DECLARADO",
  habilitado: api.abierto,
  declarado: aNulo(api.declaradoEn),
  movimiento: api.movimiento === "NO_DECLARADO" ? null : api.movimiento,
});

const ESTADO_RUEDA = {
  CONVOCATORIA: "ABIERTA",
  INSCRIPCIONES: "ABIERTA",
  CERRADA: "CERRADA",
  REALIZADA: "CERRADA",
} as const;

export const aRueda = (api: RuedaApi): RuedaNegocio => ({
  id: api.id,
  nombre: api.nombre,
  fecha: api.fecha,
  modalidad: "PRESENCIAL",
  sede: api.municipio,
  departamento: api.departamento,
  estado: api.estado === "INSCRIPCIONES" ? "ABIERTA" : ESTADO_RUEDA[api.estado],
  cupos: api.cupos,
  inscritos: api.cupos - api.cuposDisponibles,
  enfoque: "",
});

export const aMedico = (api: MedicoApi): Medico => ({
  id: api.id,
  nombre: api.nombre,
  rethus: api.registro,
  especialidad: api.especialidad,
  ips: "",
  departamento: api.departamento,
  prescripciones: 0,
  estado: api.estado,
});

const ROLES_DEL_BACKEND: Record<CuentaApi["rol"], RolPlataforma> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN_INSTITUCIONAL: "ADMIN_INSTITUCIONAL",
  ANALISTA_CUMPLIMIENTO: "ANALISTA_DOCUMENTAL",
  REPRESENTANTE_LEGAL: "REPRESENTANTE_LEGAL",
  PRODUCTOR: "REPRESENTANTE_LEGAL",
  COMPRADOR: "OBSERVADOR_INSTITUCIONAL",
  OPERADOR: "OPERARIO_CAMPO",
  AUDITOR: "OBSERVADOR_INSTITUCIONAL",
  AUTORIDAD_COMPETENTE: "OBSERVADOR_INSTITUCIONAL",
  PROFESIONAL_SALUD: "EQUIPO_CLINICO",
  INTEGRACION: "OBSERVADOR_INSTITUCIONAL",
  SERVICIO_INTERNO: "OBSERVADOR_INSTITUCIONAL",
};

export const aRolPlataforma = (rol: string): RolPlataforma =>
  ROLES_DEL_BACKEND[rol as CuentaApi["rol"]] ?? "OBSERVADOR_INSTITUCIONAL";

export const aCuenta = (api: CuentaApi, catalogo: Catalogo = CATALOGO_VACIO): CuentaUsuario => ({
  id: api.id,
  nombre: api.nombre,
  correo: api.correo,
  rol: aRolPlataforma(api.rol),
  organizacionId: api.organizacionId,
  organizacion: nombreDe(catalogo.organizaciones, api.organizacionId),
  estado: api.estado,
  creada: api.creada,
  ultimoAcceso: aNulo(api.ultimoAcceso),
  invitadaPor: "",
  autenticacion: api.vinculadaAlIdp ? "OIDC" : "DEMOSTRACION",
});

const ESTADO_SOLICITUD: Record<SolicitudApi["estado"], EstadoSolicitud> = {
  RECIBIDA: "RECIBIDA",
  EN_TRAMITE: "EN_TRAMITE",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
};

const DOCUMENTOS_CONOCIDOS: readonly TipoDocumento[] = [
  "CAMARA_COMERCIO",
  "RUT",
  "LICENCIA_CULTIVO",
  "LICENCIA_FABRICACION",
  "CERTIFICADO_BPA",
  "CUPO_FNE",
  "AUTORIZACION_SANITARIA",
  "PLANO_PREDIO",
];

export const aTipoDocumento = (tipo: string): TipoDocumento =>
  (DOCUMENTOS_CONOCIDOS as readonly string[]).includes(tipo)
    ? (tipo as TipoDocumento)
    : "CAMARA_COMERCIO";

export const aSolicitud = (api: SolicitudApi): SolicitudRegistro => ({
  id: api.id,
  nit: api.nit,
  organizacion: api.organizacion,
  tipoActor: api.tipoActor,
  departamento: api.departamento,
  municipio: api.municipio,
  representante: api.representante,
  correo: api.correo,
  telefono: api.telefono,
  estado: ESTADO_SOLICITUD[api.estado],
  recibida: api.radicada,
  expedienteId: aNulo(api.expedienteId),
  motivoRechazo: api.motivoRechazo === "" ? null : (api.motivoRechazo ?? null),
  documentos: [],
  huella: "",
});

export const aSolicitudDetallada = (api: SolicitudDetalleApi): SolicitudDetallada => ({
  ...aSolicitud(api),
  organizacionId: aNulo(api.organizacionId),
  declarados: (api.documentosDeclarados ?? []).map((documento) => ({
    tipo: documento.tipo,
    nombre: documento.nombre,
    soporteId: documento.soporteId ?? "",
  })),
});

export const aDescargaDeSoporte = (api: DescargaSoporteApi): DescargaDeSoporte => ({
  soporteId: aTexto(api.soporteId),
  url: aTexto(api.url),
  nombre: aTexto(api.nombre),
  mime: aTexto(api.mime),
  bytes: aNumero(api.bytes),
  expiraEn: aTexto(api.expiraEn),
});

const ESTADO_DOCUMENTO = {
  ACEPTADO: "APROBADO",
  DEVUELTO: "DEVUELTO",
  RECHAZADO: "RECHAZADO",
} as const;

export const aDocumentoExpediente = (api: DocumentoApi): DocumentoExpediente => ({
  id: api.id,
  tipo: aTipoDocumento(api.tipo),
  archivo: api.nombre,
  estado: api.decision ? ESTADO_DOCUMENTO[api.decision] : "PENDIENTE",
  cargado: aTexto(api.decididoEn),
  vence: null,
  verificadoPor: api.decididoPor === "" ? null : (api.decididoPor ?? null),
  observacion: api.observacion === "" ? null : (api.observacion ?? null),
  huella: "",
});

const VEREDICTOS = {
  APROBADO: "VERIFICADO",
  DEVUELTO: "DEVUELTO",
  RECHAZADO: "RECHAZADO",
} as const;

export const aPaso = (api: PasoApi): PasoVerificacion => ({
  id: api.id,
  reglaId: api.reglaId,
  etiqueta: api.etiqueta,
  orden: api.orden,
  exigeDobleControl: api.exigeDobleControl,
  rol: api.rolResponsable === "ADMIN_INSTITUCIONAL" ? "ADMIN_INSTITUCIONAL" : "ANALISTA_DOCUMENTAL",
  veredicto: (api.veredicto ? VEREDICTOS[api.veredicto] : "PENDIENTE") as VeredictoPaso,
  revisor: api.resueltoPor === "" ? null : (api.resueltoPor ?? null),
  resuelto: aNulo(api.resueltoEn),
  observacion: api.observacion === "" ? null : (api.observacion ?? null),
  slaHoras: 0,
  huella: null,
});

const ESTADO_EXPEDIENTE = {
  ABIERTO: "RADICADO",
  EN_VERIFICACION: "EN_VERIFICACION",
  DEVUELTO: "DEVUELTO",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
} as const;

export const aExpediente = (
  api: ExpedienteApi,
  catalogo: Catalogo = CATALOGO_VACIO,
): Expediente => ({
  id: api.id,
  radicado: api.solicitudId,
  organizacionId: api.organizacionId,
  organizacion: nombreDe(catalogo.organizaciones, api.organizacionId),
  tipoActor: "CULTIVADOR",
  departamento: "",
  estado: ESTADO_EXPEDIENTE[api.estado],
  radicacion: api.abierto,
  analista: null,
  documentos: api.documentos.map(aDocumentoExpediente),
  pasos: api.pasos.map(aPaso),
  politicaVersion: api.politicaVersion,
});

export const fechaDeCalendario = soloFecha;

const LABORES_DEL_BACKEND = {
  RIEGO: "RIEGO",
  FERTILIZACION: "FERTILIZACION",
  FITOSANITARIA: "FITOSANITARIO",
  PODA: "PODA",
  TRASPLANTE: "TRASPLANTE",
  MONITOREO: "MONITOREO",
} as const;

export const aLabor = (
  api: LaborApi,
  plantaId: string,
  codigoPlanta: string,
  catalogo: Catalogo = CATALOGO_VACIO,
): Labor => ({
  id: api.id,
  plantaId,
  planta: codigoPlanta,
  tipo: LABORES_DEL_BACKEND[api.tipo],
  agroinsumo: api.agroinsumoId === "" ? null : nombreDe(catalogo.agroinsumos, api.agroinsumoId),
  dosis: api.dosis,
  responsable: api.responsable,
  fecha: api.fecha,
  aptaDesde: aNulo(api.carenciaHasta),
  huella: "",
});

export type DetallePlanta = {
  planta: Planta;
  labores: readonly Labor[];
  madre: Planta | null;
  clones: readonly Planta[];
};

export const aDetallePlanta = (
  api: PlantaApi,
  catalogo: Catalogo = CATALOGO_VACIO,
): DetallePlanta => ({
  planta: aPlanta(api, catalogo),
  labores: (api.labores ?? []).map((labor) => aLabor(labor, api.id, api.codigo, catalogo)),
  madre: null,
  clones: [],
});

const MODOS_DE_REGLA = { PARALELO: "AUTOMATICO", SECUENCIAL: "MANUAL" } as const;

export const aReglaVerificacion = (api: ReglaApi): ReglaVerificacion => ({
  id: api.id,
  tipoActor: "CULTIVADOR",
  documento: aTipoDocumento(api.etiqueta),
  obligatorio: api.obligatorio,
  modo: MODOS_DE_REGLA[api.modo],
  vigenciaMeses: null,
  norma: "",
});

export type Politica = {
  reglas: readonly ReglaVerificacion[];
  version: string;
};

export const aPolitica = (api: PoliticaApi): Politica => ({
  reglas: api.reglas.map(aReglaVerificacion),
  version: api.version,
});

export type TotalesDirectorio = {
  proveedores: number;
  dispensadores: number;
  ips: number;
  medicos: number;
  pacientes: number;
};

export type RespuestaDirectorio = {
  proveedores: readonly Organizacion[];
  dispensadores: readonly Organizacion[];
  prestadores: readonly Organizacion[];
  medicos: readonly Medico[];
  totales: TotalesDirectorio;
};

export const aDirectorio = (api: RespuestaDirectorioApi): RespuestaDirectorio => ({
  proveedores: api.proveedores.map(aOrganizacion),
  dispensadores: api.dispensadores.map(aOrganizacion),
  prestadores: api.prestadores.map(aOrganizacion),
  medicos: api.medicos.map(aMedico),
  totales: {
    proveedores: api.totales.proveedores,
    dispensadores: api.totales.dispensadores,
    ips: api.totales.ips,
    medicos: api.totales.medicos,
    pacientes: api.totales.pacientes,
  },
});

export const aConfiguracionAsistente = (
  api: ConfiguracionAsistenteApi,
): ConfiguracionAsistente => {
  const modelo = aTexto(api.modelo);
  const catalogo =
    api.modelosDisponibles && api.modelosDisponibles.length > 0
      ? [...api.modelosDisponibles]
      : [...MODELOS_DEL_DESPLIEGUE];
  return {
    nombre: aTexto(api.nombre),
    saludo: aTexto(api.saludo),
    fraseFueraDeAlcance: aTexto(api.fraseFueraDeAlcance),
    instruccionesExtra: aTexto(api.instruccionesExtra),
    promptSistema: aTexto(api.promptSistema),
    mensajeAviso: aTexto(api.mensajeAviso),
    habilitado: api.habilitado ?? true,
    proveedor: aTexto(api.proveedor, "openai"),
    modelo,
    modeloEfectivo: aTexto(api.modeloEfectivo) || modelo || MODELO_DEL_DESPLIEGUE,
    modelosDisponibles: catalogo,
    voz: aTexto(api.voz),
    vozEfectiva: aTexto(api.vozEfectiva) || VOZ_DEL_DESPLIEGUE,
    apiKey: {
      configurada: api.apiKey?.configurada ?? false,
      enmascarada: aTexto(api.apiKey?.enmascarada),
    },
    limites: {
      duracionMaximaSegundos: aNumero(
        api.limites?.duracionMaximaSegundos,
        LIMITES_DE_FABRICA.duracionMaximaSegundos,
      ),
      avisoPrevioSegundos: aNumero(
        api.limites?.avisoPrevioSegundos,
        LIMITES_DE_FABRICA.avisoPrevioSegundos,
      ),
      limiteDiarioSegundos: aNumero(
        api.limites?.limiteDiarioSegundos,
        LIMITES_DE_FABRICA.limiteDiarioSegundos,
      ),
      intentosMaximos: aNumero(api.limites?.intentosMaximos, LIMITES_DE_FABRICA.intentosMaximos),
      ventanaIntentosHoras: aNumero(
        api.limites?.ventanaIntentosHoras,
        LIMITES_DE_FABRICA.ventanaIntentosHoras,
      ),
      bloqueoAutomaticoDias: aNumero(
        api.limites?.bloqueoAutomaticoDias,
        LIMITES_DE_FABRICA.bloqueoAutomaticoDias,
      ),
    },
    deFabrica: api.deFabrica,
    actualizadoEn: aNulo(api.actualizadoEn),
    actualizadoPor: aTexto(api.actualizadoPor),
  };
};

const aTipoBloqueo = (tipo: string): TipoBloqueoAsistente =>
  tipo.toLowerCase() === "permanent" ? "permanent" : "temporary";

export const aBloqueoAsistente = (api: BloqueoAsistenteApi): BloqueoAsistente => ({
  id: aTexto(api.id),
  usuario: aTexto(api.usuario),
  usuarioNombre: aTexto(api.usuarioNombre),
  motivo: aTexto(api.motivo),
  tipo: aTipoBloqueo(aTexto(api.tipo, "temporary")),
  iniciaEn: aTexto(api.iniciaEn),
  expiraEn: aNulo(api.expiraEn),
  activo: api.activo,
  creadoPor: aTexto(api.creadoPor),
  creadoPorNombre: aTexto(api.creadoPorNombre),
  creadoEn: aTexto(api.creadoEn),
  desbloqueadoEn: aNulo(api.desbloqueadoEn),
  desbloqueadoPor: aTexto(api.desbloqueadoPor),
  desbloqueadoPorNombre: aTexto(api.desbloqueadoPorNombre),
});

export const aEstadoLlamadasAsistente = (
  api: EstadoLlamadasAsistenteApi,
): EstadoLlamadasAsistente => ({
  puedeLlamar: api.puedeLlamar,
  consumidoSegundos: aNumero(api.consumidoSegundos),
  llamadasHoy: aNumero(api.llamadasHoy),
  limiteDiarioSegundos: aNumero(api.limiteDiarioSegundos),
  restanteDiarioSegundos: aNumero(api.restanteDiarioSegundos),
  duracionMaximaSegundos: aNumero(
    api.duracionMaximaSegundos,
    LIMITES_DE_FABRICA.duracionMaximaSegundos,
  ),
  bloqueo: api.bloqueo ? aBloqueoAsistente(api.bloqueo) : null,
});
