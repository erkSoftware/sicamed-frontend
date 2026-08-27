import { useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { NAVEGACION } from "./navegacion";
import type { ItemNavegacion } from "./navegacion";

export const useNavegacion = (): readonly ItemNavegacion[] => {
  const { permisos } = useAuth();
  return useMemo(
    () => NAVEGACION.filter((item) => permisos.includes(item.permiso)),
    [permisos],
  );
};

export const useNavegacionAgrupada = (): readonly [string, readonly ItemNavegacion[]][] => {
  const items = useNavegacion();
  return useMemo(() => {
    const grupos = new Map<string, ItemNavegacion[]>();
    for (const item of items) {
      const existente = grupos.get(item.grupo) ?? [];
      existente.push(item);
      grupos.set(item.grupo, existente);
    }
    return [...grupos.entries()];
  }, [items]);
};
