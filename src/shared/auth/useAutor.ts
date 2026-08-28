import { useMemo } from "react";
import { useAuth } from "./useAuth";
import type { Autor } from "../api/mock/servidorMock";

export const useAutor = (): Autor => {
  const { sesion } = useAuth();
  return useMemo(
    () => ({
      usuarioId: sesion?.usuario.id ?? "USR-ANONIMO",
      nombre: sesion?.usuario.nombre ?? "Usuario sin identificar",
      organizacionId: sesion?.usuario.organizacionId ?? "",
      rol: sesion?.usuario.rolPlataforma ?? "OBSERVADOR_INSTITUCIONAL",
    }),
    [sesion],
  );
};
