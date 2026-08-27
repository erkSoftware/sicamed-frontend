import { useAuth } from "../auth/useAuth";
import type { Permiso } from "../auth/tipos";

export const usePermiso = (permiso: Permiso): boolean => {
  const { permisos } = useAuth();
  return permisos.includes(permiso);
};

export const useAlgunPermiso = (requeridos: readonly Permiso[]): boolean => {
  const { permisos } = useAuth();
  return requeridos.some((permiso) => permisos.includes(permiso));
};
