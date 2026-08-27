import type { Permiso, Sesion } from "./tipos";

const PERMISOS_COMERCIALES: readonly Permiso[] = [
  "actores:org:leer",
  "actores:org:escribir",
  "cumplimiento:atestacion:leer",
  "cumplimiento:atestacion:escribir",
  "produccion:cultivo:leer",
  "produccion:cultivo:escribir",
  "inventario:lote:leer",
  "inventario:lote:escribir",
  "vitrina:oferta:leer",
  "vitrina:oferta:publicar",
  "trazabilidad:evento:leer",
  "ruedas:convocatoria:leer",
  "directorio:actor:leer",
  "reportes:tablero:leer",
];

export type PerfilDemo = {
  clave: string;
  nombre: string;
  rol: string;
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
    correo: "hernan.cifuentes@agrocannalia.co",
    organizacionId: "ORG-0046",
    organizacion: "Agroindustrias Cannalia S.A.S. 3",
    descripcion:
      "Organización sin atestación vigente. Al intentar publicar verás el rechazo normativo citado.",
    permisos: PERMISOS_COMERCIALES,
  },
  {
    clave: "EQUIPO_CLINICO",
    nombre: "Dra. Alejandra Ríos",
    rol: "Médica tratante · IPS Alivio Integral",
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
    nombre: "Andrés Beltrán",
    rol: "Analista · MinCIT",
    correo: "andres.beltran@mincit.gov.co",
    organizacionId: "ORG-0001",
    organizacion: "Ministerio de Comercio, Industria y Turismo",
    descripcion: "Panel institucional de solo lectura sobre todo el ecosistema.",
    permisos: [
      "actores:org:leer",
      "cumplimiento:atestacion:leer",
      "produccion:cultivo:leer",
      "inventario:lote:leer",
      "vitrina:oferta:leer",
      "trazabilidad:evento:leer",
      "directorio:actor:leer",
      "reportes:tablero:leer",
      "institucional:consultar",
      "ruedas:convocatoria:leer",
    ],
  },
];

export const DURACION_SESION_MS = 30 * 60 * 1000;

export const sesionDesdePerfil = (perfil: PerfilDemo): Sesion => ({
  usuario: {
    id: `USR-${perfil.clave}`,
    nombre: perfil.nombre,
    correo: perfil.correo,
    rol: perfil.rol,
    organizacionId: perfil.organizacionId,
    organizacion: perfil.organizacion,
    tenantId: "sicamed-co",
  },
  permisos: perfil.permisos,
  expiracion: Date.now() + DURACION_SESION_MS,
});
