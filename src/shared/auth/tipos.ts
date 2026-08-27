export type Permiso =
  | "actores:org:leer"
  | "actores:org:escribir"
  | "cumplimiento:atestacion:leer"
  | "cumplimiento:atestacion:escribir"
  | "produccion:cultivo:leer"
  | "produccion:cultivo:escribir"
  | "inventario:lote:leer"
  | "inventario:lote:escribir"
  | "vitrina:oferta:leer"
  | "vitrina:oferta:publicar"
  | "trazabilidad:evento:leer"
  | "ruedas:convocatoria:leer"
  | "directorio:actor:leer"
  | "reportes:tablero:leer"
  | "institucional:consultar"
  | "clinico:atencion:leer"
  | "clinico:agenda:gestionar"
  | "clinico:teleconsulta:atender";

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
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
