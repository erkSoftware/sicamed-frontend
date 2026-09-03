import type { RolPlataforma } from "../api/mock/tipos";

export type { RolPlataforma };

export const PERMISOS = [
  "actores:org:leer",
  "actores:org:escribir",
  "cumplimiento:atestacion:leer",
  "cumplimiento:atestacion:escribir",
  "cumplimiento:expediente:leer",
  "cumplimiento:expediente:verificar",
  "cumplimiento:solicitud:tramitar",
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
  "interoperabilidad:conexion:conciliar",
  "ambiente:lectura:leer",
  "admin:politica:gestionar",
  "admin:usuario:gestionar",
  "institucional:consultar",
  "asistente:sesion:abrir",
  "asistente:configuracion:gestionar",
  "asistente:llamadas:gestionar",
  "clinico:atencion:leer",
  "clinico:agenda:gestionar",
  "clinico:teleconsulta:atender",
  "clinico:credencial:emitir",
  "clinico:prescripcion:emitir",
  "clinico:prescripcion:anular",
  "dispensacion:acto:leer",
  "dispensacion:acto:registrar",
  "dispensacion:credencial:verificar",
  "liquidacion:cargo:leer",
  "liquidacion:corte:generar",
] as const;

export type Permiso = (typeof PERMISOS)[number];

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  rolPlataforma: RolPlataforma;
  organizacionId: string;
  organizacion: string;
  tenantId: string;
};

export type Sesion = {
  usuario: Usuario;
  permisos: readonly Permiso[];
  expiracion: number;
};

export type EstadoAuth = "cargando" | "anonimo" | "autenticado";

export type Credenciales = {
  perfilDemo?: string;
  usuario?: string;
  clave?: string;
  captcha?: string | undefined;
};

export type ProveedorAutenticacion = {
  nombre: string;
  restaurar: () => Promise<Sesion | null>;
  iniciarSesion: (credenciales?: Credenciales) => Promise<Sesion>;
  cerrarSesion: () => Promise<void>;
  credencial: () => string | undefined;
  renovar?: () => Promise<Sesion | null>;
};
