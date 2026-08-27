import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./useAuth";
import type { Permiso } from "./tipos";

type Props = {
  children: ReactNode;
  permiso?: Permiso;
};

export const GuardaDeRuta = ({ children, permiso }: Props) => {
  const { estado, permisos } = useAuth();
  const ubicacion = useLocation();

  if (estado === "cargando")
    return (
      <div className="cargando-ruta" role="status">
        <span className="girador" />
        <span>Verificando tu sesión…</span>
      </div>
    );

  if (estado === "anonimo")
    return <Navigate to="/acceso" replace state={{ destino: ubicacion.pathname }} />;

  if (permiso && !permisos.includes(permiso))
    return <Navigate to="/app/sin-permiso" replace state={{ permiso }} />;

  return <>{children}</>;
};
