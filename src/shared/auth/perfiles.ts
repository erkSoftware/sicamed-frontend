import type { Permiso, RolPlataforma, Sesion } from "./tipos";
import {
  abreAsistente,
  PERMISOS_CAMPO,
  PERMISOS_CLINICOS,
  PERMISOS_CUMPLIMIENTO,
  PERMISOS_INSTITUCIONAL,
  PERMISOS_OBSERVACION,
  PERMISOS_ORGANIZACION,
  PERMISOS_PLATAFORMA,
} from "./permisosDeRol";

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
    permisos: PERMISOS_ORGANIZACION,
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
    permisos: PERMISOS_ORGANIZACION,
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
    permisos: PERMISOS_CLINICOS,
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
    permisos: PERMISOS_OBSERVACION,
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
      "Caracteriza la organización y observa el trámite. Los pasos del expediente son del analista de cumplimiento, no suyos.",
    permisos: PERMISOS_INSTITUCIONAL,
  },
  {
    clave: "ANALISTA_DOCUMENTAL",
    nombre: "Lida Almeciga",
    rol: "Analista de cumplimiento",
    rolPlataforma: "ANALISTA_DOCUMENTAL",
    correo: "lida.almeciga@sicamed.gov.co",
    organizacionId: "ORG-0000",
    organizacion: "SICAMED · Administración de la plataforma",
    descripcion:
      "Admite solicitudes a trámite, decide cada soporte y resuelve los pasos del expediente. No puede cerrar sola un registro.",
    permisos: PERMISOS_CUMPLIMIENTO,
  },
  {
    clave: "ANALISTA_SEGUNDO_CONTROL",
    nombre: "Claudia Liliana Pardo",
    rol: "Analista de cumplimiento · segundo control",
    rolPlataforma: "ANALISTA_DOCUMENTAL",
    correo: "claudia.pardo@sicamed.gov.co",
    organizacionId: "ORG-0000",
    organizacion: "SICAMED · Administración de la plataforma",
    descripcion:
      "La segunda analista que exige el doble control: cierra el paso de licencia competente en expedientes que no tocó antes.",
    permisos: PERMISOS_CUMPLIMIENTO,
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

export const permisosDePerfil = (perfil: PerfilDemo): readonly Permiso[] =>
  abreAsistente(perfil.rolPlataforma) && !perfil.permisos.includes("asistente:sesion:abrir")
    ? [...perfil.permisos, "asistente:sesion:abrir"]
    : perfil.permisos;

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
  permisos: permisosDePerfil(perfil),
  expiracion: Date.now() + DURACION_SESION_MS,
});
