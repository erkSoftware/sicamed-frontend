import { ErrorApi } from "../problemDetails";
import type {
  CrearBloqueoAsistenteApi,
  EntidadMedio,
  GuardarConfiguracionAsistenteApi,
  RadicarSolicitudApi,
  RolApi,
  TipoActorApi,
  UnidadApi,
} from "./contrato";
import { soloFecha } from "./conversiones";
import { sanearTextoDeAsistente } from "../mock/configuracionAsistente";
import type { BorradorConfiguracionAsistente } from "../mock/configuracionAsistente";
import type {
  EstadoCuenta,
  RolPlataforma,
  TipoAtestacion,
  TipoBloqueoAsistente,
  TipoLote,
} from "../mock/tipos";

export const hoy = (): string => soloFecha(new Date().toISOString());

export const sinContrato = (operacion: string): Promise<never> =>
  Promise.reject(
    new ErrorApi({
      type: "https://sicamed.co/problemas/operacion-sin-contrato",
      title: "La operación no existe en el contrato publicado",
      detail:
        `«${operacion}» está disponible en el modo de demostración pero el backend todavía no ` +
        "publica una ruta equivalente. Cámbiate al modo mock o espera a la siguiente versión del contrato.",
      status: 501,
    }),
  );

export type RadicarSolicitud = {
  nit: string;
  organizacion: string;
  tipoActor: TipoActorApi;
  departamento: string;
  municipio: string;
  representante: string;
  correo: string;
  telefono: string;
  clave: string;
  documentos?: readonly { tipo: string; soporteId: string }[];
};

export const cuerpoRadicarSolicitud = (entrada: RadicarSolicitud): RadicarSolicitudApi => ({
  nit: entrada.nit,
  organizacion: entrada.organizacion,
  tipoActor: entrada.tipoActor,
  departamento: entrada.departamento,
  municipio: entrada.municipio,
  representante: entrada.representante,
  correo: entrada.correo,
  telefono: entrada.telefono,
  clave: entrada.clave,
  documentos: (entrada.documentos ?? []).map((documento) => ({
    tipo: documento.tipo,
    soporteId: documento.soporteId,
  })),
});

export const cuerpoActualizarOrganizacion = (entrada: {
  id: string;
  representante: string;
  correo: string;
  telefono: string;
  municipio: string;
}) => ({
  id: entrada.id,
  representante: entrada.representante,
  correo: entrada.correo,
  telefono: entrada.telefono,
  municipio: entrada.municipio,
});

export const cuerpoRegistrarAtestacion = (entrada: {
  organizacionId: string;
  tipo: TipoAtestacion;
  acto: string;
  autoridad: string;
  expedicion: string;
  vencimiento: string;
  evidencia: string;
  expedienteId: string | null;
}) => ({
  organizacionId: entrada.organizacionId,
  tipo: entrada.tipo,
  acto: entrada.acto,
  autoridad: entrada.autoridad,
  expedicion: soloFecha(entrada.expedicion),
  vencimiento: soloFecha(entrada.vencimiento),
  evidencia: entrada.evidencia,
  expedienteId: entrada.expedienteId,
});

export const cuerpoRegistrarCultivo = (entrada: {
  nombre: string;
  organizacionId: string;
  departamento: string;
  municipio: string;
  variedad: string;
  areaHectareas: number;
  plantas: number;
  siembra: string;
  cosechaEstimada: string;
  cupoId?: string;
}) => ({
  nombre: entrada.nombre,
  organizacionId: entrada.organizacionId,
  departamento: entrada.departamento,
  municipio: entrada.municipio,
  variedadId: entrada.variedad,
  cupoId: entrada.cupoId ?? "",
  areaHectareas: entrada.areaHectareas,
  plantas: entrada.plantas,
  siembra: soloFecha(entrada.siembra),
  cosechaEstimada: soloFecha(entrada.cosechaEstimada),
});

export const cuerpoCrearLote = (entrada: {
  organizacionId: string;
  cultivoId: string;
  tipo: TipoLote;
  cantidad: number;
  unidad: string;
  thc: number;
  cbd: number;
  bodega: string;
  departamento: string;
  vencimiento: string;
  codigo?: string;
  fecha?: string;
  registroInvima?: string;
}) => ({
  organizacionId: entrada.organizacionId,
  cultivoId: entrada.cultivoId === "" ? null : entrada.cultivoId,
  codigo: entrada.codigo ?? "",
  tipo: entrada.tipo,
  cantidad: entrada.cantidad,
  unidad: entrada.unidad as UnidadApi,
  thc: entrada.thc,
  cbd: entrada.cbd,
  bodega: entrada.bodega,
  departamento: entrada.departamento,
  fecha: soloFecha(entrada.fecha ?? hoy()),
  vencimiento: soloFecha(entrada.vencimiento),
  registroInvima: entrada.registroInvima ?? "",
});

export const cuerpoMoverLote = (entrada: {
  estado: string;
  bodega: string;
  motivo: string;
}) => ({
  destino: entrada.estado,
  bodega: entrada.bodega,
  motivo: entrada.motivo,
});

export const cuerpoRegistrarPlanta = (entrada: {
  variedadId: string;
  origen: "SEMILLA" | "CLON";
  madre: string | null;
  bloque: string;
  siembra: string;
  codigo?: string;
  organizacionId?: string;
}) => ({
  codigo: entrada.codigo ?? "",
  variedadId: entrada.variedadId,
  origen: entrada.origen,
  madreId: entrada.madre,
  bloque: entrada.bloque,
  siembra: soloFecha(entrada.siembra),
  organizacionId: entrada.organizacionId,
});

const LABORES = {
  RIEGO: "RIEGO",
  FERTILIZACION: "FERTILIZACION",
  FITOSANITARIO: "FITOSANITARIA",
  PODA: "PODA",
  TRASPLANTE: "TRASPLANTE",
  MONITOREO: "MONITOREO",
} as const;

export const cuerpoRegistrarLabor = (entrada: {
  tipo: keyof typeof LABORES;
  agroinsumoId: string | null;
  dosis: string;
  responsable: string;
}) => ({
  tipo: LABORES[entrada.tipo],
  agroinsumoId: entrada.agroinsumoId ?? "",
  dosis: entrada.dosis,
  responsable: entrada.responsable,
});

export const cuerpoRegistrarBeneficio = (entrada: {
  cultivoId: string;
  plantas: number;
  pesoHumedo: number;
  responsable: string;
  organizacionId?: string;
}) => ({
  cultivoId: entrada.cultivoId,
  plantas: entrada.plantas,
  pesoHumedoKg: entrada.pesoHumedo,
  responsable: entrada.responsable,
  organizacionId: entrada.organizacionId,
});

const AVANCES = {
  SECADO: "SECADO",
  CURADO: "CURADO",
  ACONDICIONADO: "ACONDICIONADO",
  RECHAZADO: "CERRADO",
} as const;

export const cuerpoAvanzarBeneficio = (entrada: {
  estado: keyof typeof AVANCES;
  peso: number;
  humedad: number;
}) => ({
  estado: AVANCES[entrada.estado],
  pesoKg: entrada.peso,
  humedad: entrada.humedad,
});

export const cuerpoRegistrarTransformacion = (entrada: {
  loteOrigenId: string;
  producto: string;
  formula: string;
  entradaKg: number;
  salida: number;
  unidadSalida: string;
  registroInvima: string;
  responsable: string;
  fecha?: string;
  codigoLoteResultante?: string;
}) => ({
  loteOrigenId: entrada.loteOrigenId,
  producto: entrada.producto,
  formula: entrada.formula,
  entradaKg: entrada.entradaKg,
  salida: entrada.salida,
  unidadSalida: entrada.unidadSalida as UnidadApi,
  registroInvima: entrada.registroInvima,
  responsable: entrada.responsable,
  fecha: soloFecha(entrada.fecha ?? hoy()),
  codigoLoteResultante: entrada.codigoLoteResultante,
});

export const cuerpoLevantarActa = (entrada: {
  entidad: "PLANTA" | "LOTE";
  entidadId: string;
  cantidad: number;
  causal: string;
  metodo: string;
  testigo: string;
  cargoTestigo: string;
  unidad?: string;
  responsable?: string;
  fecha?: string;
}) => ({
  entidad: entrada.entidad as EntidadMedio,
  entidadId: entrada.entidadId,
  cantidad: entrada.cantidad,
  unidad: (entrada.unidad ?? (entrada.entidad === "PLANTA" ? "planta" : "kg")) as UnidadApi,
  causal: entrada.causal,
  metodo: entrada.metodo,
  testigo: entrada.testigo,
  cargoTestigo: entrada.cargoTestigo,
  responsable: entrada.responsable ?? "",
  fecha: soloFecha(entrada.fecha ?? hoy()),
});

const DECISIONES = { APROBADO: "ACEPTADO", DEVUELTO: "DEVUELTO", RECHAZADO: "RECHAZADO" } as const;

export const cuerpoDecidirDocumento = (entrada: {
  expedienteId: string;
  documentoId: string;
  decision: keyof typeof DECISIONES;
  observacion: string;
}) => ({
  expedienteId: entrada.expedienteId,
  documentoId: entrada.documentoId,
  decision: DECISIONES[entrada.decision],
  observacion: entrada.observacion,
});

const VEREDICTOS = { VERIFICADO: "APROBADO", DEVUELTO: "DEVUELTO", RECHAZADO: "RECHAZADO" } as const;

export const cuerpoResolverPaso = (entrada: {
  expedienteId: string;
  pasoId: string;
  veredicto: keyof typeof VEREDICTOS;
  observacion: string;
}) => ({
  expedienteId: entrada.expedienteId,
  pasoId: entrada.pasoId,
  veredicto: VEREDICTOS[entrada.veredicto],
  observacion: entrada.observacion,
});

export const cuerpoGuardarPolitica = (entrada: {
  reglas: readonly { id: string; obligatorio: boolean; modo: "MANUAL" | "AUTOMATICO" }[];
}) => ({
  reglas: entrada.reglas.map((regla) => ({
    id: regla.id,
    obligatorio: regla.obligatorio,
    modo: regla.modo === "AUTOMATICO" ? "PARALELO" : "SECUENCIAL",
  })),
});

const ROLES_AL_BACKEND: Record<RolPlataforma, RolApi> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN_INSTITUCIONAL: "ADMIN_INSTITUCIONAL",
  ANALISTA_DOCUMENTAL: "ANALISTA_CUMPLIMIENTO",
  REPRESENTANTE_LEGAL: "REPRESENTANTE_LEGAL",
  OPERARIO_CAMPO: "OPERADOR",
  EQUIPO_CLINICO: "PROFESIONAL_SALUD",
  OBSERVADOR_INSTITUCIONAL: "AUDITOR",
};

export const aRolApi = (rol: RolPlataforma): RolApi => ROLES_AL_BACKEND[rol];

export const cuerpoInvitarCuenta = (entrada: {
  nombre: string;
  correo: string;
  rol: RolPlataforma;
  organizacionId: string;
}) => ({
  nombre: entrada.nombre,
  correo: entrada.correo,
  rol: aRolApi(entrada.rol),
  organizacionId: entrada.organizacionId,
});

export const cuerpoModificarCuenta = (entrada: {
  id: string;
  estado?: EstadoCuenta;
  rol?: RolPlataforma;
}) => ({
  id: entrada.id,
  estado: entrada.estado,
  rol: entrada.rol ? aRolApi(entrada.rol) : undefined,
});

const RESOLUCIONES = {
  RESUELTA_EXTERNO: "ACEPTA_EXTERNO",
  RESUELTA_LOCAL: "SUBSANADA",
} as const;

export const cuerpoResolverDiscrepancia = (entrada: {
  id: string;
  resolucion: keyof typeof RESOLUCIONES;
  observacion?: string;
}) => ({
  id: entrada.id,
  resolucion: RESOLUCIONES[entrada.resolucion],
  observacion: entrada.observacion ?? "",
});

export const cuerpoDeclararMovimiento = (entrada: { id: string; movimiento: string }) => ({
  id: entrada.id,
  movimiento: entrada.movimiento,
});

export type TipoProductoApi =
  | "FLOR_SECA"
  | "FLOR_SECA_NO_PSICOACTIVA"
  | "BIOMASA"
  | "EXTRACTO"
  | "ACEITE"
  | "FORMULA_MAGISTRAL";

const TIPOS_DE_PRODUCTO: Readonly<Record<string, TipoProductoApi>> = {
  "Flor seca no psicoactiva": "FLOR_SECA_NO_PSICOACTIVA",
  "Flor seca psicoactiva": "FLOR_SECA",
  "Biomasa vegetal": "BIOMASA",
  "Extracto de espectro completo": "EXTRACTO",
  "Aceite estandarizado CBD": "ACEITE",
  "Aceite estandarizado THC:CBD": "ACEITE",
  "Fórmula magistral": "FORMULA_MAGISTRAL",
  FLOR_SECA: "FLOR_SECA",
  FLOR_SECA_NO_PSICOACTIVA: "FLOR_SECA_NO_PSICOACTIVA",
  BIOMASA: "BIOMASA",
  EXTRACTO: "EXTRACTO",
  ACEITE: "ACEITE",
  FORMULA_MAGISTRAL: "FORMULA_MAGISTRAL",
};

export const aTipoProducto = (etiqueta: string): TipoProductoApi => {
  const tipo = TIPOS_DE_PRODUCTO[etiqueta];
  if (tipo) return tipo;
  throw new ErrorApi({
    type: "https://sicamed.co/problemas/contenido-invalido",
    title: "El tipo de producto no está en el catálogo del contrato",
    detail:
      `«${etiqueta}» no corresponde a ninguno de los tipos que admite la vitrina: ` +
      "flor seca, flor seca no psicoactiva, biomasa, extracto, aceite o fórmula magistral.",
    status: 422,
    errores: [{ campo: "tipoProducto", motivo: "No es un valor admitido por el contrato." }],
  });
};

export const cuerpoPublicarOferta = (borrador: {
  organizacionId: string;
  tipoProducto: string;
  titulo: string;
  departamento: string;
  municipio: string;
  disponibilidad: string;
  descripcion: string;
  vigencia?: string;
  medios?: readonly string[];
  certificaciones?: readonly string[];
}) => ({
  organizacionId: borrador.organizacionId,
  tipoProducto: aTipoProducto(borrador.tipoProducto),
  titulo: borrador.titulo,
  departamento: borrador.departamento,
  municipio: borrador.municipio,
  disponibilidad: borrador.disponibilidad,
  descripcion: borrador.descripcion,
  vigencia: borrador.vigencia ? soloFecha(borrador.vigencia) : undefined,
  medios: borrador.medios ?? [],
  certificaciones: borrador.certificaciones ?? [],
});

export type ComprobantePublicacion = {
  id: string;
  estado: string;
  atestacionId: string;
};

export const cuerpoGuardarConfiguracionAsistente = (entrada: {
  borrador: BorradorConfiguracionAsistente;
}): GuardarConfiguracionAsistenteApi => {
  const clave = entrada.borrador.apiKey.trim();
  return {
    nombre: sanearTextoDeAsistente(entrada.borrador.nombre),
    saludo: sanearTextoDeAsistente(entrada.borrador.saludo),
    fraseFueraDeAlcance: sanearTextoDeAsistente(entrada.borrador.fraseFueraDeAlcance),
    instruccionesExtra: sanearTextoDeAsistente(entrada.borrador.instruccionesExtra),
    promptSistema: sanearTextoDeAsistente(entrada.borrador.promptSistema),
    mensajeAviso: sanearTextoDeAsistente(entrada.borrador.mensajeAviso),
    habilitado: entrada.borrador.habilitado,
    proveedor: sanearTextoDeAsistente(entrada.borrador.proveedor),
    modelo: sanearTextoDeAsistente(entrada.borrador.modelo),
    voz: sanearTextoDeAsistente(entrada.borrador.voz),
    borrarApiKey: entrada.borrador.borrarApiKey,
    limites: { ...entrada.borrador.limites },
    ...(clave === "" ? {} : { apiKey: clave }),
  };
};

export const cuerpoBloquearAsistente = (entrada: {
  usuario: string;
  motivo: string;
  tipo: TipoBloqueoAsistente;
  dias: number;
}): CrearBloqueoAsistenteApi => ({
  usuario: entrada.usuario.trim(),
  motivo: sanearTextoDeAsistente(entrada.motivo),
  tipo: entrada.tipo,
  ...(entrada.tipo === "temporary" ? { dias: entrada.dias } : {}),
});
