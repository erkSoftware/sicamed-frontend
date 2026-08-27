import { useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { NAVEGACION } from "./navegacion";
import type { ItemNavegacion } from "./navegacion";
import { MODULOS, MODULO_INICIAL } from "./modulos";
import type { IdModulo, Modulo } from "./modulos";

export const useNavegacion = (): readonly ItemNavegacion[] => {
  const { permisos } = useAuth();
  return useMemo(
    () => NAVEGACION.filter((item) => permisos.includes(item.permiso)),
    [permisos],
  );
};

export type ModuloDisponible = Modulo & { items: readonly ItemNavegacion[] };

export const useModulosDisponibles = (): readonly ModuloDisponible[] => {
  const items = useNavegacion();
  return useMemo(
    () =>
      MODULOS.map((modulo) => ({
        ...modulo,
        items: items.filter((item) => item.modulo === modulo.id),
      })).filter((modulo) => modulo.items.length > 0),
    [items],
  );
};

export const itemDeRuta = (
  items: readonly ItemNavegacion[],
  ruta: string,
): ItemNavegacion | undefined =>
  [...items]
    .sort((a, b) => b.ruta.length - a.ruta.length)
    .find((item) => ruta === item.ruta || ruta.startsWith(`${item.ruta}/`));

export const useModuloActivo = (ruta: string): IdModulo => {
  const modulos = useModulosDisponibles();
  return useMemo(() => {
    const actual = itemDeRuta(NAVEGACION, ruta);
    if (actual) return actual.modulo;
    return modulos[0]?.id ?? MODULO_INICIAL;
  }, [modulos, ruta]);
};
