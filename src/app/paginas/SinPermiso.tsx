import { Link, useLocation } from "react-router-dom";
import { EstadoVacio } from "../../shared/ui/patrones/EstadoVacio";

type EstadoUbicacion = { permiso?: string };

export const SinPermiso = () => {
  const ubicacion = useLocation();
  const permiso = (ubicacion.state as EstadoUbicacion | null)?.permiso;

  return (
    <div className="pagina">
      <EstadoVacio
        icono="candado"
        titulo="No tienes acceso a esta sección"
        texto={
          permiso
            ? `Tu rol actual no incluye el permiso ${permiso}. Si necesitas acceder, solicita la asignación a quien administra tu organización. El servidor también rechazaría la operación.`
            : "Tu rol actual no incluye los permisos necesarios para esta sección."
        }
        accion={
          <Link to="/app" className="boton boton--primario boton--sm">
            Volver al tablero
          </Link>
        }
      />
    </div>
  );
};
