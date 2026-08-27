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
