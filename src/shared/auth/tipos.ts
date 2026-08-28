import type { RolPlataforma } from "../api/mock/tipos";

export type { RolPlataforma };

export type Permiso =
  | "actores:org:leer"
  | "actores:org:escribir"
  | "cumplimiento:atestacion:leer"
  | "cumplimiento:atestacion:escribir"
  | "cumplimiento:expediente:leer"
  | "cumplimiento:expediente:verificar"
  | "cumplimiento:solicitud:tramitar"
  | "produccion:cultivo:leer"
  | "produccion:cultivo:escribir"
  | "produccion:planta:leer"
  | "produccion:planta:escribir"
  | "produccion:beneficio:leer"
  | "produccion:beneficio:escribir"
  | "produccion:transformacion:leer"
  | "produccion:transformacion:escribir"
  | "produccion:destruccion:leer"
  | "produccion:destruccion:escribir"
  | "produccion:cupo:leer"
  | "inventario:lote:leer"
  | "inventario:lote:escribir"
  | "vitrina:oferta:leer"
  | "vitrina:oferta:publicar"
  | "vitrina:contacto:habilitar"
  | "trazabilidad:evento:leer"
  | "ruedas:convocatoria:leer"
  | "ruedas:convocatoria:inscribir"
  | "directorio:actor:leer"
  | "reportes:tablero:leer"
  | "interoperabilidad:conexion:leer"
  | "interoperabilidad:conexion:conciliar"
  | "ambiente:lectura:leer"
  | "admin:politica:gestionar"
  | "admin:usuario:gestionar"
  | "institucional:consultar"
  | "clinico:atencion:leer"
  | "clinico:agenda:gestionar"
  | "clinico:teleconsulta:atender";

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

export type ProveedorAutenticacion = {
  nombre: string;
  restaurar: () => Promise<Sesion | null>;
  iniciarSesion: (perfilDemo?: string) => Promise<Sesion>;
  cerrarSesion: () => Promise<void>;
  credencial: () => string | undefined;
};
