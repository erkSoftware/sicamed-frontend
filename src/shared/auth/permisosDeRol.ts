import type { Permiso, RolPlataforma } from "./tipos";
import type { RolApi } from "../api/rest/contrato";
import { aRolApi } from "../api/rest/peticiones";

export const PERMISOS_ORGANIZACION: readonly Permiso[] = [
  "actores:org:leer",
  "actores:org:escribir",
  "cumplimiento:atestacion:leer",
  "cumplimiento:atestacion:escribir",
  "produccion:cultivo:leer",
  "produccion:cultivo:escribir",
  "produccion:planta:leer",
  "produccion:planta:escribir",
  "produccion:beneficio:leer",
  "produccion:beneficio:escribir",
  "produccion:transformacion:leer",
  "produccion:transformacion:escribir",
  "produccion:destruccion:leer",
  "produccion:destruccion:escribir",
  "produccion:cupo:leer",
  "cumplimiento:expediente:leer",
  "inventario:lote:leer",
  "inventario:lote:escribir",
  "vitrina:oferta:leer",
  "vitrina:oferta:publicar",
  "vitrina:contacto:habilitar",
  "trazabilidad:evento:leer",
  "ruedas:convocatoria:leer",
  "ruedas:convocatoria:inscribir",
  "directorio:actor:leer",
  "reportes:tablero:leer",
  "interoperabilidad:conexion:leer",
  "ambiente:lectura:leer",
  "dispensacion:acto:leer",
  "dispensacion:acto:registrar",
  "dispensacion:credencial:verificar",
  "liquidacion:cargo:leer",
];

export const PERMISOS_CAMPO: readonly Permiso[] = [
  "actores:org:leer",
  "directorio:actor:leer",
  "produccion:cultivo:leer",
  "produccion:planta:leer",
  "produccion:planta:escribir",
  "produccion:beneficio:leer",
  "produccion:beneficio:escribir",
  "produccion:destruccion:leer",
  "produccion:destruccion:escribir",
  "produccion:cupo:leer",
  "inventario:lote:leer",
  "trazabilidad:evento:leer",
  "ambiente:lectura:leer",
  "dispensacion:acto:leer",
  "dispensacion:acto:registrar",
  "dispensacion:credencial:verificar",
];

export const PERMISOS_PLATAFORMA: readonly Permiso[] = [
  "actores:org:leer",
  "actores:org:escribir",
  "cumplimiento:atestacion:leer",
  "cumplimiento:expediente:leer",
  "cumplimiento:solicitud:tramitar",
  "produccion:cultivo:leer",
  "produccion:planta:leer",
  "produccion:beneficio:leer",
  "produccion:transformacion:leer",
  "produccion:destruccion:leer",
  "produccion:cupo:leer",
  "inventario:lote:leer",
  "vitrina:oferta:leer",
  "trazabilidad:evento:leer",
  "ruedas:convocatoria:leer",
  "directorio:actor:leer",
  "reportes:tablero:leer",
  "interoperabilidad:conexion:leer",
  "interoperabilidad:conexion:conciliar",
  "ambiente:lectura:leer",
  "admin:politica:gestionar",
  "admin:usuario:gestionar",
  "asistente:configuracion:gestionar",
  "asistente:llamadas:gestionar",
  "institucional:consultar",
  "dispensacion:acto:leer",
  "liquidacion:cargo:leer",
  "liquidacion:corte:generar",
];

export const PERMISOS_INSTITUCIONAL: readonly Permiso[] = [
  "actores:org:leer",
  "cumplimiento:atestacion:leer",
  "cumplimiento:expediente:leer",
  "cumplimiento:expediente:verificar",
  "produccion:cultivo:leer",
  "produccion:planta:leer",
  "produccion:beneficio:leer",
  "produccion:transformacion:leer",
  "produccion:destruccion:leer",
  "produccion:cupo:leer",
  "inventario:lote:leer",
  "vitrina:oferta:leer",
  "trazabilidad:evento:leer",
  "directorio:actor:leer",
  "reportes:tablero:leer",
  "interoperabilidad:conexion:leer",
  "ambiente:lectura:leer",
  "institucional:consultar",
  "ruedas:convocatoria:leer",
  "asistente:llamadas:gestionar",
  "dispensacion:acto:leer",
];

const AJENOS_A_LA_OBSERVACION: readonly Permiso[] = [
  "cumplimiento:expediente:verificar",
  "asistente:llamadas:gestionar",
];

export const PERMISOS_OBSERVACION: readonly Permiso[] = PERMISOS_INSTITUCIONAL.filter(
  (permiso) => !AJENOS_A_LA_OBSERVACION.includes(permiso),
);

export const PERMISOS_CUMPLIMIENTO: readonly Permiso[] = [
  "actores:org:leer",
  "directorio:actor:leer",
  "cumplimiento:atestacion:leer",
  "cumplimiento:atestacion:escribir",
  "cumplimiento:expediente:leer",
  "cumplimiento:expediente:verificar",
  "cumplimiento:solicitud:tramitar",
  "trazabilidad:evento:leer",
  "reportes:tablero:leer",
  "interoperabilidad:conexion:leer",
  "interoperabilidad:conexion:conciliar",
];

export const PERMISOS_CLINICOS: readonly Permiso[] = [
  "actores:org:leer",
  "directorio:actor:leer",
  "clinico:atencion:leer",
  "clinico:agenda:gestionar",
  "clinico:teleconsulta:atender",
  "clinico:credencial:emitir",
  "clinico:prescripcion:emitir",
  "clinico:prescripcion:anular",
];

export const PERMISOS_COMPRADOR: readonly Permiso[] = [
  "actores:org:leer",
  "actores:org:escribir",
  "directorio:actor:leer",
  "inventario:lote:leer",
  "vitrina:oferta:leer",
  "vitrina:contacto:habilitar",
  "ruedas:convocatoria:leer",
  "ruedas:convocatoria:inscribir",
  "trazabilidad:evento:leer",
  "reportes:tablero:leer",
];

const BASE: Readonly<Record<RolApi, readonly Permiso[]>> = {
  SUPER_ADMIN: PERMISOS_PLATAFORMA,
  ADMIN_INSTITUCIONAL: PERMISOS_INSTITUCIONAL,
  ANALISTA_CUMPLIMIENTO: PERMISOS_CUMPLIMIENTO,
  REPRESENTANTE_LEGAL: PERMISOS_ORGANIZACION,
  PRODUCTOR: PERMISOS_ORGANIZACION,
  COMPRADOR: PERMISOS_COMPRADOR,
  OPERADOR: PERMISOS_CAMPO,
  AUDITOR: PERMISOS_OBSERVACION,
  AUTORIDAD_COMPETENTE: PERMISOS_INSTITUCIONAL,
  PROFESIONAL_SALUD: PERMISOS_CLINICOS,
  INTEGRACION: [],
  SERVICIO_INTERNO: [],
};

const ABREN_ASISTENTE: readonly RolApi[] = [
  "SUPER_ADMIN",
  "ADMIN_INSTITUCIONAL",
  "ANALISTA_CUMPLIMIENTO",
  "REPRESENTANTE_LEGAL",
  "PRODUCTOR",
  "COMPRADOR",
  "OPERADOR",
];

export const PERMISOS_POR_ROL = Object.fromEntries(
  (Object.keys(BASE) as RolApi[]).map((rol) => [
    rol,
    ABREN_ASISTENTE.includes(rol) ? [...BASE[rol], "asistente:sesion:abrir"] : BASE[rol],
  ]),
) as Readonly<Record<RolApi, readonly Permiso[]>>;

export const permisosDeRolConocido = (rol: string): readonly Permiso[] =>
  PERMISOS_POR_ROL[rol as RolApi] ?? [];

export const abreAsistente = (rol: RolPlataforma): boolean =>
  permisosDeRolConocido(aRolApi(rol)).includes("asistente:sesion:abrir");

const ALIAS: Readonly<Record<string, Permiso>> = {
  "actores:organizacion:leer": "actores:org:leer",
  "actores:organizacion:escribir": "actores:org:escribir",
};

export const normalizarPermiso = (permiso: string): string => ALIAS[permiso] ?? permiso;
