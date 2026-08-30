import type { RolPlataforma, Sesion } from "./tipos";

const ADMINISTRADORES: readonly RolPlataforma[] = ["SUPER_ADMIN", "ADMIN_INSTITUCIONAL"];

export const esRolAdministrador = (rol: RolPlataforma): boolean => ADMINISTRADORES.includes(rol);

export const esAdministrador = (sesion: Sesion | null): boolean =>
  sesion !== null && esRolAdministrador(sesion.usuario.rolPlataforma);
