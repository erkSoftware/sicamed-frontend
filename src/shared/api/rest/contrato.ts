export type TipoActorApi =
  | "CULTIVADOR"
  | "TRANSFORMADOR"
  | "DISPENSADOR"
  | "IPS"
  | "LABORATORIO";

export type RolApi =
  | "SUPER_ADMIN"
  | "ADMIN_INSTITUCIONAL"
  | "ANALISTA_CUMPLIMIENTO"
  | "REPRESENTANTE_LEGAL"
  | "PRODUCTOR"
  | "COMPRADOR"
  | "OPERADOR"
  | "AUDITOR"
  | "AUTORIDAD_COMPETENTE"
  | "PROFESIONAL_SALUD"
  | "INTEGRACION"
  | "SERVICIO_INTERNO";

export type UnidadApi = "g" | "kg" | "t" | "ml" | "l" | "und" | "planta" | "ha";

export type Decimal = number | string;

export type PaginaApi<T> = {
  datos: readonly T[];
  total?: number | null;
  pagina: number;
  porPagina: number;
  cursorSiguiente?: string | null;
  cursorAnterior?: string | null;
};

export type VarianteMedioApi = {
  alto: number;
  ancho: number;
  bytes: number;
  etiqueta: string;
  formato: string;
  url: string;
};

export type MedioApi = {
  id: string;
  alt: string;
  alto: number;
  ancho: number;
  color: string;
  lqip?: string | null;
  variantes?: readonly VarianteMedioApi[];
  estado?: string;
  entidad?: string;
  entidadId?: string;
  rol?: string;
  orden?: number;
};

export type OfertaPublicaApi = {
  id: string;
  titulo: string;
  descripcion: string;
  tipoProducto: string;
  tipoActor: TipoActorApi;
  organizacion: string;
  organizacionId: string;
  departamento: string;
  municipio: string;
  estado: string;
  disponibilidad: "INMEDIATA" | "PROGRAMADA" | "POR_CAMPAÑA";
  publicada: string;
  vigencia: string;
  certificaciones?: readonly string[];
  medios?: readonly MedioApi[];
};

export type PaginaCursorOfertasApi = {
  ofertas: readonly OfertaPublicaApi[];
  cursorSiguiente?: string | null;
  cursorAnterior?: string | null;
  desde?: number;
  hasta?: number;
};

export type FacetasApi = {
  departamento: Readonly<Record<string, number>>;
  disponibilidad: Readonly<Record<string, number>>;
  tipoActor: Readonly<Record<string, number>>;
  tipoProducto: Readonly<Record<string, number>>;
};

export type TotalesVitrinaApi = {
  actores: number;
  departamentos: number;
  ofertas: number;
};

export type EstadisticasVitrinaApi = {
  actores: number;
  departamentos: number;
  ofertas: number;
  actualizacion: string | null;
  facetas: FacetasApi;
  totales: TotalesVitrinaApi;
};

export type OfertaApi = {
  id: string;
  titulo: string;
  descripcion: string;
  tipoProducto: string;
  tipoActor: TipoActorApi;
  organizacion: string;
  organizacionId: string;
  departamento: string;
  municipio: string;
  estado: "BORRADOR" | "PUBLICADA" | "PAUSADA" | "DESPUBLICADA" | "CERRADA";
  disponibilidad: "INMEDIATA" | "PROGRAMADA" | "POR_CAMPAÑA";
  publicada: string | null;
  vigencia: string | null;
  certificaciones?: readonly string[];
  interesados?: number;
  medios?: readonly MedioApi[];
  atestacionHabilitanteId?: string | null;
  motivoDespublicacion?: string;
  verificadaEn?: string | null;
};

export type SesionApi = {
  correo: string;
  nombre: string;
  organizacionId: string | null;
  permisos: readonly string[];
  roles: readonly string[];
  sujeto: string;
  tenantId: string;
  zonaClinica: boolean;
};

export type PermisosDeRolApi = {
  permisos: readonly string[];
  rol: RolApi;
};

export type CuentaApi = {
  id: string;
  nombre: string;
  correo: string;
  organizacionId: string;
  rol: RolApi;
  estado: "INVITADA" | "ACTIVA" | "SUSPENDIDA" | "INACTIVA";
  creada: string;
  ultimoAcceso?: string | null;
  vinculadaAlIdp: boolean;
};

export type OrganizacionApi = {
  id: string;
  nit: string;
  nombre: string;
  tipo: TipoActorApi;
  departamento: string;
  municipio: string;
  estado: "HABILITADA" | "EN_TRAMITE" | "SUSPENDIDA" | "VENCIDA" | "INACTIVA";
  registro: string;
  representante?: string;
  correo?: string;
  telefono?: string;
  cultivos?: number;
  lotes?: number;
  ofertas?: number;
};

export type ResumenOrganizacionApi = {
  id: string;
  nombre: string;
  tipo: TipoActorApi;
};

export type AtestacionApi = {
  id: string;
  organizacionId: string;
  tipo:
    | "CULTIVO_NO_PSICOACTIVO"
    | "CULTIVO_PSICOACTIVO"
    | "FABRICACION_DERIVADOS"
    | "DISPENSACION"
    | "EXPORTACION";
  acto: string;
  autoridad: string;
  expedicion: string;
  vencimiento: string;
  estado: "VIGENTE" | "POR_VENCER" | "VENCIDA" | "REVOCADA";
  evidencia: string;
  huella: string;
  origen: string;
  registrada: string;
  expedienteId?: string | null;
};

export type SolicitudApi = {
  id: string;
  nit: string;
  organizacion: string;
  tipoActor: TipoActorApi;
  departamento: string;
  municipio: string;
  representante: string;
  correo: string;
  telefono: string;
  estado: "RECIBIDA" | "EN_TRAMITE" | "APROBADA" | "RECHAZADA";
  radicada: string;
  expedienteId?: string | null;
  documentos?: number;
  correoVerificado?: boolean;
  motivoRechazo?: string;
};

export type DocumentoDeclaradoApi = {
  nombre: string;
  tipo: string;
};

export type SolicitudDetalleApi = SolicitudApi & {
  organizacionId?: string | null;
  documentosDeclarados?: readonly DocumentoDeclaradoApi[];
};

export type DocumentoApi = {
  id: string;
  nombre: string;
  tipo: string;
  medioId?: string | null;
  decision?: "ACEPTADO" | "DEVUELTO" | "RECHAZADO" | null;
  decididoEn?: string | null;
  decididoPor?: string;
  observacion?: string;
};

export type PasoApi = {
  id: string;
  etiqueta: string;
  orden: number;
  reglaId: string;
  rolResponsable: string;
  exigeDobleControl: boolean;
  veredicto?: "APROBADO" | "DEVUELTO" | "RECHAZADO" | null;
  resueltoEn?: string | null;
  resueltoPor?: string;
  observacion?: string;
};

export type ExpedienteApi = {
  id: string;
  organizacionId: string;
  solicitudId: string;
  estado: "ABIERTO" | "EN_VERIFICACION" | "DEVUELTO" | "APROBADO" | "RECHAZADO";
  modo: "SECUENCIAL" | "PARALELO";
  abierto: string;
  motivoCierre: string;
  politicaVersion: string;
  documentos: readonly DocumentoApi[];
  pasos: readonly PasoApi[];
};

export type ReglaApi = {
  id: string;
  etiqueta: string;
  orden: number;
  modo: "SECUENCIAL" | "PARALELO";
  obligatorio: boolean;
  exigeDobleControl: boolean;
  rolResponsable: string;
};

export type PoliticaApi = {
  reglas: readonly ReglaApi[];
  version: string;
};

export type CupoApi = {
  id: string;
  organizacionId: string;
  acto: string;
  estado: "ASIGNADO" | "CONCILIADO" | "DISCREPANTE" | "VENCIDO";
  plantasAsignadas: number;
  plantasDisponibles: number;
  plantasUsadas: number;
  plantasReportadasMicc?: number | null;
  vigenciaDesde: string;
  vigenciaHasta: string;
};

export type CultivoApi = {
  id: string;
  nombre: string;
  organizacionId: string;
  cupoId: string;
  variedadId: string;
  departamento: string;
  municipio: string;
  areaHectareas: Decimal;
  plantas: number;
  plantasVivas: number;
  estado: "PLANIFICADO" | "SIEMBRA" | "VEGETATIVO" | "FLORACION" | "COSECHA" | "CERRADO";
  siembra: string;
  cosechaEstimada: string;
  registro: string;
};

export type LaborApi = {
  id: string;
  tipo: "RIEGO" | "FERTILIZACION" | "FITOSANITARIA" | "PODA" | "TRASPLANTE" | "MONITOREO";
  agroinsumoId: string;
  dosis: string;
  responsable: string;
  fecha: string;
  carenciaHasta?: string | null;
};

export type PlantaApi = {
  id: string;
  codigo: string;
  cultivoId: string;
  organizacionId: string;
  variedadId: string;
  origen: "SEMILLA" | "CLON";
  madreId?: string | null;
  estado: "VIVA" | "COSECHADA" | "DESTRUIDA";
  siembra: string;
  bloque: string;
  aptaDesde?: string | null;
  cosechadaEn?: string | null;
  enCarencia: boolean;
  labores?: readonly LaborApi[];
};

export type BeneficioApi = {
  id: string;
  cultivoId: string;
  organizacionId: string;
  estado: "SECADO" | "CURADO" | "ACONDICIONADO" | "CERRADO";
  plantas: number;
  pesoHumedoKg: Decimal;
  pesoSecoKg?: Decimal | null;
  pesoAcondicionadoKg?: Decimal | null;
  humedad?: Decimal | null;
  merma?: Decimal | null;
  responsable: string;
  registro: string;
};

export type LoteApi = {
  id: string;
  codigo: string;
  cultivoId?: string | null;
  organizacionId: string;
  tipo: "FLOR_SECA" | "BIOMASA" | "EXTRACTO" | "ACEITE" | "FORMULA_MAGISTRAL";
  cantidadInicial: Decimal;
  existencia: Decimal;
  unidad: UnidadApi;
  estado:
    | "EN_BODEGA"
    | "EN_TRANSITO"
    | "DISPENSADO"
    | "RETENIDO"
    | "DESTRUIDO"
    | "CONGELADO";
  motivoEstado: string;
  thc: Decimal;
  cbd: Decimal;
  psicoactivo: boolean;
  bodega: string;
  departamento: string;
  fecha: string;
  vencimiento: string;
  registro: string;
  registroInvima: string;
};

export type MovimientoApi = {
  loteId: string;
  actor: string;
  bodega: string;
  estadoAnterior: LoteApi["estado"];
  estadoNuevo: LoteApi["estado"];
  momento: string;
  motivo: string;
};

export type TransformacionApi = {
  id: string;
  organizacionId: string;
  loteOrigenId: string;
  loteResultanteId?: string | null;
  producto: string;
  formula: string;
  entradaKg: Decimal;
  salida: Decimal;
  unidadSalida: UnidadApi;
  rendimiento: Decimal;
  registroInvima: string;
  responsable: string;
  fecha: string;
  registro: string;
};

export type ActaDestruccionApi = {
  id: string;
  organizacionId: string;
  entidad: string;
  entidadId: string;
  cantidad: Decimal;
  unidad: UnidadApi;
  causal: string;
  metodo: string;
  responsable: string;
  testigo: string;
  cargoTestigo: string;
  fecha: string;
  registro: string;
};

export type EventoTrazabilidadApi = {
  id: string;
  secuencia: number;
  tipo: string;
  descripcion: string;
  entidad: string;
  entidadId: string;
  actor: string;
  organizacionId?: string | null;
  fecha: string;
  huella: string;
  huellaPrevia: string;
};

export type VerificacionCadenaApi = {
  eventos: number;
  integra: boolean;
  primeraSecuenciaRota?: number | null;
};

export type ConexionApi = {
  id: string;
  nombre: string;
  entidad: string;
  descripcion: string;
  norma: string;
  estado: "CONECTADA" | "DEGRADADA" | "NO_CONECTADA";
  ultimaSincronizacion?: string | null;
  registrosSincronizados?: number;
  discrepanciasAbiertas?: number;
};

export type DiscrepanciaApi = {
  id: string;
  conexionId: string;
  entidad: string;
  entidadId: string;
  campo: string;
  valorLocal: string;
  valorExterno: string;
  observacion: string;
  resolucion: "PENDIENTE" | "ACEPTA_EXTERNO" | "ESCALADA" | "SUBSANADA";
  detectada: string;
  resuelta?: string | null;
  resueltaPor: string;
};

export type ManifestacionApi = {
  id: string;
  ofertaId: string;
  oferta: string;
  solicitante: string;
  departamento: string;
  organizacionInteresadaId: string;
  estado: "RECIBIDA" | "CONTACTO_HABILITADO" | "DECLINADA" | "EXPIRADA";
  fecha: string;
  expira: string;
  cierreId?: string | null;
  contacto?: Readonly<Record<string, string>> | null;
};

export type CierreApi = {
  id: string;
  ofertaId: string;
  manifestacionId: string;
  canal: "FNE" | "CONTRATO_DIRECTO" | "EXPORTACION";
  movimiento: "NO_DECLARADO" | "SE_CONCRETO" | "NO_SE_CONCRETO" | "EN_CONVERSACION";
  autodeclarado: boolean;
  abierto: string;
  declaradoEn?: string | null;
};

export type RuedaApi = {
  id: string;
  nombre: string;
  fecha: string;
  departamento: string;
  municipio: string;
  estado: "CONVOCATORIA" | "INSCRIPCIONES" | "CERRADA" | "REALIZADA";
  cupos: number;
  cuposDisponibles: number;
  inscrito?: boolean;
};

export type MedicoApi = {
  id: string;
  nombre: string;
  registro: string;
  especialidad: string;
  departamento: string;
  municipio: string;
  estado: "ACTIVO" | "INACTIVO";
};

export type TotalesDirectorioApi = {
  dispensadores: number;
  ips: number;
  medicos: number;
  pacientes: number;
  proveedores: number;
};

export type RespuestaDirectorioApi = {
  dispensadores: readonly OrganizacionApi[];
  medicos: readonly MedicoApi[];
  prestadores: readonly OrganizacionApi[];
  proveedores: readonly OrganizacionApi[];
  totales: TotalesDirectorioApi;
};

export type DepartamentoApi = {
  codigo: string;
  nombre: string;
  dispensadores: number;
  ips: number;
  medicos: number;
  pacientes: number;
  proveedores: number;
};

export type EtapaApi = {
  clave: string;
  detalle: string;
  etiqueta: string;
  unidad: string;
  valor: number;
};

export type PuntoSerieApi = {
  etiqueta: string;
  rechazos: number;
  valor: number;
};

export type ParApi = {
  etiqueta: string;
  valor: number;
};

export type TotalesApi = TotalesDirectorioApi;

export type IndicadoresNacionalesApi = {
  atestacionesPorVencer: number;
  departamentos: readonly DepartamentoApi[];
  etapas: readonly EtapaApi[];
  eventosLedger: number;
  ofertasPublicadas: number;
  rechazosNormativos: number;
  serie: readonly PuntoSerieApi[];
  totales: TotalesApi;
};

export type ResumenReportesApi = {
  cumplimiento: readonly ParApi[];
  departamentos: readonly DepartamentoApi[];
  etapas: readonly EtapaApi[];
  porTipoActor: readonly ParApi[];
  serie: readonly PuntoSerieApi[];
};

export type SubidaApi = {
  metodo: string;
  url: string;
  campos?: Readonly<Record<string, string>>;
  cabeceras?: Readonly<Record<string, string>>;
  expira: string;
};

export type RestriccionesApi = {
  bytesMaximos: number;
  cantidadMaxima: number;
  ladoMaximo: number;
  mimes: readonly string[];
  pixelesMaximos: number;
  restantes: number;
};

export type PreparacionApi = {
  medioId: string;
  restricciones: RestriccionesApi;
  subida: SubidaApi;
};

export type EntidadMedio =
  | "LOTE"
  | "PLANTA"
  | "CULTIVO"
  | "BENEFICIO"
  | "OFERTA"
  | "DESTRUCCION"
  | "EXPEDIENTE";

export type PrepararApi = {
  entidad: EntidadMedio;
  entidadId: string;
  nombre: string;
  mime: string;
  bytes: number;
  clasificacion?: "PUBLICO" | "RESERVADO_COMERCIAL";
  rol?: "PORTADA" | "GALERIA" | "EVIDENCIA" | "DOCUMENTO";
};

export type ConfirmarApi = {
  alt: string;
  sinPersonas: boolean;
  titulo?: string | null;
  orden?: number;
  capturado?: string | null;
};

export type AutorizacionApi = {
  canal: string;
  evidencia: string;
  finalidad: "ATENCION_ASISTENCIAL" | "TELECONSULTA" | "PRESCRIPCION" | "INVESTIGACION";
  otorgada: string;
  revocada?: string | null;
  vigente: boolean;
};

export type PacienteEnListaApi = {
  id: string;
  nombre: string;
  edad: number;
  departamento: string;
  municipio: string;
  estado: "ACTIVO" | "INACTIVO" | "EGRESADO";
  autorizacionesVigentes: readonly AutorizacionApi["finalidad"][];
};

export type PacienteApi = PacienteEnListaApi & {
  documento: string;
  fechaNacimiento: string;
  registrado: string;
  autorizaciones: readonly AutorizacionApi[];
};

export type CitaApi = {
  id: string;
  pacienteId: string;
  profesionalId: string;
  inicio: string;
  fin: string;
  duracionMinutos: number;
  modalidad: "PRESENCIAL" | "TELECONSULTA";
  estado: "PROGRAMADA" | "CONFIRMADA" | "ATENDIDA" | "CANCELADA" | "NO_ASISTIO";
  motivo: string;
  enlaceTeleconsulta: string;
};

export type ProfesionalApi = {
  id: string;
  nombre: string;
  registro: string;
  especialidad: string;
  departamento: string;
  municipio: string;
  estado: "ACTIVO" | "INACTIVO";
};

export type SenalApi = {
  conteo: number;
  departamento: string;
  emitida: string;
  estado: "RETENIDA" | "EMITIDA";
  periodo: string;
  presentacion: string;
};

export type DocumentoRequeridoApi = {
  tipo: string;
  etiqueta: string;
  obligatorio: boolean;
};

export type RequisitosActorApi = {
  tipoActor: TipoActorApi;
  documentos: readonly DocumentoRequeridoApi[];
};

export type SubidaSoporteApi = {
  url: string;
  metodo: string;
  expira: string;
  campos: Readonly<Record<string, string>>;
};

export type PreparacionSoporteApi = {
  soporteId: string;
  subida: SubidaSoporteApi;
  mimesAdmitidos: readonly string[];
  bytesMaximos: number;
};

export type EstadoSoporteApi = "PENDIENTE" | "DISPONIBLE" | "RECHAZADO";

export type SoporteApi = {
  soporteId: string;
  tipo: string;
  estado: EstadoSoporteApi;
  nombre: string;
  mime: string;
  bytes: number;
};

export type RadicacionApi = {
  id: string;
  estado: "RECIBIDA";
  radicada: string;
  mensaje: string;
  tokenVerificacion?: string | null;
};

export type VerificacionCorreoApi = {
  id: string;
  correoVerificado: boolean;
  mensaje: string;
};

export type RadicarSolicitudApi = {
  nit: string;
  organizacion: string;
  tipoActor: TipoActorApi;
  departamento: string;
  municipio: string;
  representante: string;
  correo: string;
  telefono: string;
  clave: string;
  documentos: readonly { tipo: string; soporteId: string }[];
};
