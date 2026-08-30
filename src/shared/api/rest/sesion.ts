import { solicitar } from "../transporte";
import { PERMISOS } from "../../auth/tipos";
import type { Permiso, Sesion } from "../../auth/tipos";
import { aRolPlataforma } from "./mapeadores";
import { normalizarPermiso, permisosDeRolConocido } from "../../auth/permisosDeRol";
import type { PermisosDeRolApi, RolApi, SesionApi } from "./contrato";

const CONOCIDOS: ReadonlySet<string> = new Set(PERMISOS);

export const ETIQUETA_DE_ROL: Readonly<Record<RolApi, string>> = {
  SUPER_ADMIN: "Super administrador",
  ADMIN_INSTITUCIONAL: "Administrador institucional",
  ANALISTA_CUMPLIMIENTO: "Analista de cumplimiento",
  REPRESENTANTE_LEGAL: "Representante legal",
  PRODUCTOR: "Productor",
  COMPRADOR: "Comprador",
  OPERADOR: "Operador",
  AUDITOR: "Auditor",
  AUTORIDAD_COMPETENTE: "Autoridad competente",
  PROFESIONAL_SALUD: "Profesional de la salud",
  INTEGRACION: "Integración",
  SERVICIO_INTERNO: "Servicio interno",
};

export const permisosReconocidos = (permisos: readonly string[]): readonly Permiso[] =>
  permisos
    .map(normalizarPermiso)
    .filter((permiso): permiso is Permiso => CONOCIDOS.has(permiso));

export const etiquetaDeRol = (rol: string): string =>
  ETIQUETA_DE_ROL[rol as RolApi] ?? "Usuario autenticado";

export const aSesion = (api: SesionApi, expiracion: number): Sesion => {
  const rol = api.roles[0] ?? "";
  const reconocidos = permisosReconocidos(api.permisos);
  return {
    usuario: {
      id: api.sujeto,
      nombre: api.nombre,
      correo: api.correo,
      rol: etiquetaDeRol(rol),
      rolPlataforma: aRolPlataforma(rol),
      organizacionId: api.organizacionId ?? "",
      organizacion: "",
      tenantId: api.tenantId,
    },
    permisos:
      api.permisos.length > 0 && reconocidos.length === 0
        ? permisosDeRolConocido(rol)
        : reconocidos,
    expiracion,
  };
};

export const consultarSesion = (): Promise<SesionApi> =>
  solicitar<SesionApi>("comercial", "/iam/sesion");

export const permisosDeRol = (rol: RolApi): Promise<PermisosDeRolApi> =>
  solicitar<PermisosDeRolApi>("comercial", `/iam/roles/${rol}`);

export const tieneZonaClinica = (api: SesionApi): boolean => api.zonaClinica;
