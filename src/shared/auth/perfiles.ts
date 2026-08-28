import type { Permiso, RolPlataforma, Sesion } from "./tipos";

const PERMISOS_COMERCIALES: readonly Permiso[] = [
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
];

const PERMISOS_CAMPO: readonly Permiso[] = [
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
];

const PERMISOS_PLATAFORMA: readonly Permiso[] = [
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
  "institucional:consultar",
];

const PERMISOS_INSTITUCIONAL: readonly Permiso[] = [
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
];

export type PerfilDemo = {
  clave: string;
  nombre: string;
  rol: string;
  rolPlataforma: RolPlataforma;
  correo: string;
  organizacionId: string;
  organizacion: string;
  descripcion: string;
  permisos: readonly Permiso[];
};

export const PERFILES_DEMO: readonly PerfilDemo[] = [
  {
    clave: "PRODUCTOR_HABILITADO",
    nombre: "Marcela Ospina",
    rol: "Representante legal · Cultivador",
    rolPlataforma: "REPRESENTANTE_LEGAL",
    correo: "marcela.ospina@fitomed.co",
    organizacionId: "ORG-0006",
    organizacion: "Laboratorios Fitomed S.A.S.",
    descripcion: "Organización con atestación de licencia vigente. Puede publicar en la vitrina.",
    permisos: PERMISOS_COMERCIALES,
  },
  {
    clave: "PRODUCTOR_SIN_ATESTACION",
    nombre: "Hernán Cifuentes",
    rol: "Representante legal · Cultivador",
    rolPlataforma: "REPRESENTANTE_LEGAL",
    correo: "hernan.cifuentes@agrocannalia.co",
    organizacionId: "ORG-0046",
    organizacion: "Agroindustrias Cannalia S.A.S. 3",
    descripcion:
      "Organización sin atestación vigente. Al intentar publicar verás el rechazo normativo citado.",
    permisos: PERMISOS_COMERCIALES,
  },
  {
    clave: "OPERARIO_CAMPO",
    nombre: "Jairo Peñaloza",
    rol: "Operario de campo · Cultivador",
    rolPlataforma: "OPERARIO_CAMPO",
    correo: "jairo.penaloza@fitomed.co",
    organizacionId: "ORG-0006",
    organizacion: "Laboratorios Fitomed S.A.S.",
    descripcion:
      "Registra plantas, labores y beneficio en campo. No publica en la vitrina ni gestiona la organización.",
    permisos: PERMISOS_CAMPO,
  },
  {
    clave: "EQUIPO_CLINICO",
    nombre: "Dra. Alejandra Ríos",
    rol: "Médica tratante · IPS Alivio Integral",
    rolPlataforma: "EQUIPO_CLINICO",
    correo: "alejandra.rios@alivio.co",
    organizacionId: "ORG-0014",
    organizacion: "IPS Alivio Integral",
    descripcion: "Acceso a la zona clínica: pacientes, agenda y teleconsulta.",
    permisos: [
      "actores:org:leer",
      "directorio:actor:leer",
      "clinico:atencion:leer",
      "clinico:agenda:gestionar",
      "clinico:teleconsulta:atender",
    ],
  },
  {
    clave: "INSTITUCIONAL",
    nombre: "Paula Andrea Rincón",
    rol: "Observadora institucional · MinCIT",
    rolPlataforma: "OBSERVADOR_INSTITUCIONAL",
    correo: "paula.rincon@mincit.gov.co",
    organizacionId: "ORG-0001",
    organizacion: "Ministerio de Comercio, Industria y Turismo",
    descripcion: "Panel institucional de solo lectura sobre todo el ecosistema.",
    permisos: PERMISOS_INSTITUCIONAL.filter(
      (permiso) => permiso !== "cumplimiento:expediente:verificar",
    ),
  },
  {
    clave: "ADMIN_INSTITUCIONAL",
    nombre: "Andrés Beltrán",
    rol: "Administrador institucional · MinCIT",
    rolPlataforma: "ADMIN_INSTITUCIONAL",
    correo: "andres.beltran@mincit.gov.co",
    organizacionId: "ORG-0001",
    organizacion: "Ministerio de Comercio, Industria y Turismo",
    descripcion:
      "Resuelve el paso final del trámite de registro y caracteriza la organización. Nunca su propio expediente.",
    permisos: PERMISOS_INSTITUCIONAL,
  },
  {
    clave: "ANALISTA_DOCUMENTAL",
    nombre: "Lida Almeciga",
    rol: "Analista de verificación documental",
    rolPlataforma: "ANALISTA_DOCUMENTAL",
    correo: "lida.almeciga@sicamed.gov.co",
    organizacionId: "ORG-0000",
    organizacion: "SICAMED · Administración de la plataforma",
    descripcion:
      "Revisa los expedientes de registro y aprueba o devuelve cada documento con su observación.",
    permisos: [
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
    ],
  },
  {
    clave: "SUPER_ADMIN",
    nombre: "Diego Fernando Marín",
    rol: "Super administrador",
    rolPlataforma: "SUPER_ADMIN",
    correo: "super.admin@sicamed.gov.co",
    organizacionId: "ORG-0000",
    organizacion: "SICAMED · Administración de la plataforma",
    descripcion:
      "Define la política de verificación y administra las cuentas. No verifica expedientes: separación de funciones.",
    permisos: PERMISOS_PLATAFORMA,
  },
];

const PERFIL_INICIAL = import.meta.env.VITE_PERFIL_DEMO ?? "";

export const perfilPorDefecto = (): PerfilDemo =>
  PERFILES_DEMO.find((perfil) => perfil.clave === PERFIL_INICIAL) ?? (PERFILES_DEMO[0] as PerfilDemo);

export const DURACION_SESION_MS = 30 * 60 * 1000;

export const sesionDesdePerfil = (perfil: PerfilDemo): Sesion => ({
  usuario: {
    id: `USR-${perfil.clave}`,
    nombre: perfil.nombre,
    correo: perfil.correo,
    rol: perfil.rol,
    rolPlataforma: perfil.rolPlataforma,
    organizacionId: perfil.organizacionId,
    organizacion: perfil.organizacion,
    tenantId: "sicamed-co",
  },
  permisos: perfil.permisos,
  expiracion: Date.now() + DURACION_SESION_MS,
});
