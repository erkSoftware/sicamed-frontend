export type TipoActor =
  | "CULTIVADOR"
  | "TRANSFORMADOR"
  | "DISPENSADOR"
  | "IPS"
  | "LABORATORIO";

export type EstadoHabilitacion = "HABILITADA" | "EN_TRAMITE" | "SUSPENDIDA" | "VENCIDA";

export type Organizacion = {
  id: string;
  nit: string;
  nombre: string;
  tipo: TipoActor;
  departamento: string;
  municipio: string;
  estado: EstadoHabilitacion;
  registro: string;
  representante: string;
  correo: string;
  telefono: string;
  cultivos: number;
  lotes: number;
  ofertas: number;
};

export type TipoAtestacion =
  | "CULTIVO_NO_PSICOACTIVO"
  | "CULTIVO_PSICOACTIVO"
  | "FABRICACION_DERIVADOS"
  | "DISPENSACION"
  | "EXPORTACION";

export type EstadoAtestacion = "VIGENTE" | "POR_VENCER" | "VENCIDA" | "EN_TRAMITE" | "RECHAZADA";

export type Atestacion = {
  id: string;
  organizacionId: string;
  organizacion: string;
  tipo: TipoAtestacion;
  acto: string;
  autoridad: string;
  expedicion: string;
  vencimiento: string;
  estado: EstadoAtestacion;
  evidencia: string;
  huella: string;
};

export type EstadoCultivo = "PREPARACION" | "VEGETATIVO" | "FLORACION" | "COSECHA" | "CERRADO";

export type Cultivo = {
  id: string;
  nombre: string;
  organizacionId: string;
  organizacion: string;
  departamento: string;
  municipio: string;
  variedad: string;
  psicoactivo: boolean;
  areaHectareas: number;
  plantas: number;
  estado: EstadoCultivo;
  siembra: string;
  cosechaEstimada: string;
};

export type TipoLote = "FLOR_SECA" | "BIOMASA" | "EXTRACTO" | "ACEITE" | "FORMULA_MAGISTRAL";

export type EstadoLote = "EN_BODEGA" | "EN_TRANSITO" | "DISPENSADO" | "RETENIDO" | "DESTRUIDO";

export type Lote = {
  id: string;
  codigo: string;
  cultivoId: string;
  organizacionId: string;
  organizacion: string;
  tipo: TipoLote;
  cantidad: number;
  unidad: string;
  estado: EstadoLote;
  thc: number;
  cbd: number;
  bodega: string;
  departamento: string;
  fecha: string;
  vencimiento: string;
};

export type EstadoOferta = "BORRADOR" | "PUBLICADA" | "RECHAZADA" | "CERRADA" | "SUSPENDIDA";

export type Oferta = {
  id: string;
  titulo: string;
  tipoProducto: string;
  organizacionId: string;
  organizacion: string;
  tipoActor: TipoActor;
  departamento: string;
  municipio: string;
  estado: EstadoOferta;
  disponibilidad: "INMEDIATA" | "PROGRAMADA" | "POR_CAMPAÑA";
  publicada: string;
  vigencia: string;
  descripcion: string;
  certificaciones: readonly string[];
  interesados: number;
};

export type EventoTrazabilidad = {
  id: string;
  secuencia: number;
  tipo: string;
  descripcion: string;
  entidad: string;
  entidadId: string;
  actor: string;
  organizacionId: string;
  fecha: string;
  huella: string;
  huellaPrevia: string;
};

export type RuedaNegocio = {
  id: string;
  nombre: string;
  fecha: string;
  modalidad: "PRESENCIAL" | "VIRTUAL" | "MIXTA";
  sede: string;
  departamento: string;
  estado: "ABIERTA" | "EN_CURSO" | "CERRADA";
  cupos: number;
  inscritos: number;
  enfoque: string;
};

export type Medico = {
  id: string;
  nombre: string;
  rethus: string;
  especialidad: string;
  ips: string;
  departamento: string;
  prescripciones: number;
  estado: "ACTIVO" | "INACTIVO" | "EN_VERIFICACION";
};

export type ManifestacionInteres = {
  id: string;
  ofertaId: string;
  oferta: string;
  solicitante: string;
  departamento: string;
  fecha: string;
  estado: "NUEVA" | "EN_REVISION" | "HABILITADA" | "DESCARTADA";
};

export type TipoCannabis = "PSICOACTIVO" | "NO_PSICOACTIVO";

export type Variedad = {
  id: string;
  nombre: string;
  tipo: TipoCannabis;
  thc: number;
  cbd: number;
  registroIca: string;
  procedencia: string;
  plantasVivas: number;
};

export type OrigenPlanta = "SEMILLA" | "CLON";

export type EstadoPlanta =
  | "PROPAGACION"
  | "VEGETATIVO"
  | "FLORACION"
  | "COSECHADA"
  | "DESTRUIDA";

export type Planta = {
  id: string;
  codigo: string;
  variedadId: string;
  variedad: string;
  tipo: TipoCannabis;
  cultivoId: string;
  cultivo: string;
  organizacionId: string;
  departamento: string;
  origen: OrigenPlanta;
  madre: string | null;
  estado: EstadoPlanta;
  siembra: string;
  bloque: string;
  labores: number;
  aptaDesde: string;
  huella: string;
};

export type CategoriaAgroinsumo = "FERTILIZANTE" | "FITOSANITARIO" | "BIOLOGICO" | "SUSTRATO";

export type Agroinsumo = {
  id: string;
  nombre: string;
  categoria: CategoriaAgroinsumo;
  registroIca: string;
  ingrediente: string;
  carenciaDias: number;
};

export type TipoLabor =
  | "TRASPLANTE"
  | "RIEGO"
  | "PODA"
  | "FERTILIZACION"
  | "FITOSANITARIO"
  | "MONITOREO";

export type Labor = {
  id: string;
  plantaId: string;
  planta: string;
  tipo: TipoLabor;
  agroinsumo: string | null;
  dosis: string;
  responsable: string;
  fecha: string;
  aptaDesde: string | null;
  huella: string;
};

export type EstadoBeneficio = "SECADO" | "CURADO" | "ACONDICIONADO" | "RECHAZADO";

export type Beneficio = {
  id: string;
  codigo: string;
  cultivoId: string;
  cultivo: string;
  organizacionId: string;
  organizacion: string;
  departamento: string;
  variedad: string;
  tipo: TipoCannabis;
  plantas: number;
  pesoHumedo: number;
  pesoSeco: number;
  pesoAcondicionado: number;
  humedad: number;
  estado: EstadoBeneficio;
  inicio: string;
  fin: string;
  loteCodigo: string | null;
  responsable: string;
  huella: string;
};

export type TipoDocumento =
  | "CAMARA_COMERCIO"
  | "RUT"
  | "LICENCIA_CULTIVO"
  | "LICENCIA_FABRICACION"
  | "CERTIFICADO_BPA"
  | "CUPO_FNE"
  | "AUTORIZACION_SANITARIA"
  | "PLANO_PREDIO";

export type EstadoDocumento =
  | "PENDIENTE"
  | "EN_VERIFICACION"
  | "APROBADO"
  | "DEVUELTO"
  | "VENCIDO";

export type DocumentoExpediente = {
  id: string;
  tipo: TipoDocumento;
  archivo: string;
  estado: EstadoDocumento;
  cargado: string;
  vence: string | null;
  verificadoPor: string | null;
  observacion: string | null;
  huella: string;
};

export type EstadoExpediente =
  | "BORRADOR"
  | "RADICADO"
  | "EN_VERIFICACION"
  | "APROBADO"
  | "DEVUELTO";

export type Expediente = {
  id: string;
  radicado: string;
  organizacionId: string;
  organizacion: string;
  tipoActor: TipoActor;
  departamento: string;
  estado: EstadoExpediente;
  radicacion: string;
  analista: string | null;
  documentos: readonly DocumentoExpediente[];
  pasos: readonly PasoVerificacion[];
  politicaVersion: string;
};

export type ReglaVerificacion = {
  id: string;
  tipoActor: TipoActor;
  documento: TipoDocumento;
  obligatorio: boolean;
  modo: "MANUAL" | "AUTOMATICO";
  vigenciaMeses: number | null;
  norma: string;
};

export type ViaCierre = "FNE" | "CONTRATO_DIRECTO" | "EXPORTACION";

export type EstadoCierre =
  | "CONTACTO_HABILITADO"
  | "TRAMITE_EXTERNO"
  | "MOVIMIENTO_DECLARADO"
  | "SIN_DECLARAR";

export type CierreExterno = {
  id: string;
  ofertaId: string;
  oferta: string;
  tipoProducto: string;
  tipo: TipoCannabis;
  organizacion: string;
  contraparte: string;
  departamento: string;
  via: ViaCierre;
  entidad: string;
  norma: string;
  estado: EstadoCierre;
  habilitado: string;
  declarado: string | null;
  movimiento: string | null;
};

export type EstadoConexion = "OPERATIVA" | "DEGRADADA" | "SIN_RESPUESTA" | "NO_CONECTADA";

export type Conexion = {
  id: string;
  sigla: string;
  nombre: string;
  entidad: string;
  proposito: string;
  direccion: "CONSULTA" | "REPORTE" | "BIDIRECCIONAL";
  estado: EstadoConexion;
  ultimaLectura: string;
  conciliados: number;
  discrepancias: number;
  mecanismo: string;
  norma: string;
};

export type EstadoDiscrepancia = "ABIERTA" | "RESUELTA_EXTERNO" | "RESUELTA_LOCAL";

export type Discrepancia = {
  id: string;
  conexionId: string;
  sigla: string;
  organizacionId: string;
  organizacion: string;
  campo: string;
  valorLocal: string;
  valorExterno: string;
  autoritativo: "EXTERNO" | "LOCAL";
  estado: EstadoDiscrepancia;
  detectada: string;
  resuelta: string | null;
  resueltaPor: string | null;
};

export type RolPlataforma =
  | "SUPER_ADMIN"
  | "ADMIN_INSTITUCIONAL"
  | "ANALISTA_DOCUMENTAL"
  | "REPRESENTANTE_LEGAL"
  | "OPERARIO_CAMPO"
  | "EQUIPO_CLINICO"
  | "OBSERVADOR_INSTITUCIONAL";

export type EstadoCuenta = "ACTIVA" | "INVITADA" | "SUSPENDIDA" | "INACTIVA";

export type CuentaUsuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: RolPlataforma;
  organizacionId: string;
  organizacion: string;
  estado: EstadoCuenta;
  creada: string;
  ultimoAcceso: string | null;
  invitadaPor: string;
  autenticacion: "OIDC" | "CLOUDFLARE" | "DEMOSTRACION";
};

export type EstadoSolicitud = "RECIBIDA" | "EXPEDIENTE_ABIERTO" | "DESCARTADA";

export type SolicitudRegistro = {
  id: string;
  nit: string;
  organizacion: string;
  tipoActor: TipoActor;
  departamento: string;
  municipio: string;
  representante: string;
  correo: string;
  telefono: string;
  estado: EstadoSolicitud;
  recibida: string;
  expedienteId: string | null;
  huella: string;
};

export type VeredictoPaso = "PENDIENTE" | "VERIFICADO" | "DEVUELTO";

export type PasoVerificacion = {
  id: string;
  orden: number;
  rol: Extract<RolPlataforma, "ANALISTA_DOCUMENTAL" | "ADMIN_INSTITUCIONAL">;
  veredicto: VeredictoPaso;
  revisor: string | null;
  resuelto: string | null;
  observacion: string | null;
  slaHoras: number;
  huella: string | null;
};

export type EstadoCupo = "VIGENTE" | "AGOTADO" | "POR_VENCER" | "SIN_CUPO";

export type CupoMicc = {
  id: string;
  organizacionId: string;
  organizacion: string;
  modalidad: TipoAtestacion;
  actoAsignacion: string;
  plantasAutorizadas: number;
  plantasSembradas: number;
  vigencia: string;
  estado: EstadoCupo;
  conciliado: string;
  norma: string;
};

export type EstadoTransformacion = "EN_PROCESO" | "LIBERADA" | "RECHAZADA";

export type Transformacion = {
  id: string;
  codigo: string;
  organizacionId: string;
  organizacion: string;
  departamento: string;
  loteOrigen: string;
  loteOrigenId: string;
  producto: string;
  formula: string;
  entradaKg: number;
  salida: number;
  unidadSalida: string;
  rendimiento: number;
  registroInvima: string | null;
  estado: EstadoTransformacion;
  loteResultante: string | null;
  responsable: string;
  fecha: string;
  huella: string;
};

export type CausalDestruccion =
  | "PLAGA_NO_CONTROLABLE"
  | "FUERA_DE_ESPECIFICACION"
  | "VENCIMIENTO"
  | "ORDEN_AUTORIDAD"
  | "EXCEDENTE_DE_CUPO";

export type ActaDestruccion = {
  id: string;
  acta: string;
  organizacionId: string;
  organizacion: string;
  departamento: string;
  entidad: "PLANTA" | "LOTE";
  entidadId: string;
  referencia: string;
  cantidad: number;
  unidad: string;
  causal: CausalDestruccion;
  metodo: string;
  testigo: string;
  cargoTestigo: string;
  responsable: string;
  fecha: string;
  norma: string;
  huella: string;
};

export type EstadoLectura = "EN_RANGO" | "FUERA_DE_RANGO" | "SIN_SENAL";

export type LecturaAmbiente = {
  id: string;
  cultivoId: string;
  cultivo: string;
  bloque: string;
  departamento: string;
  temperatura: number;
  humedad: number;
  conductividad: number;
  luz: number;
  estado: EstadoLectura;
  registro: string;
};
