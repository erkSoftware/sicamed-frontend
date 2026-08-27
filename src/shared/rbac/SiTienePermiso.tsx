import type { ReactNode } from "react";
import { usePermiso } from "./usePermiso";
import type { Permiso } from "../auth/tipos";

type Props = {
  permiso: Permiso;
  children: ReactNode;
  alternativa?: ReactNode;
};

export const SiTienePermiso = ({ permiso, children, alternativa = null }: Props) => {
  const permitido = usePermiso(permiso);
  return <>{permitido ? children : alternativa}</>;
};
