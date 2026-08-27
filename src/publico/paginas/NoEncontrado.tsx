import { Link } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { EstadoVacio } from "../../shared/ui/patrones/EstadoVacio";

export const NoEncontrado = () => (
  <div className="contenedor" style={{ padding: "var(--e8) 0" }}>
    <Seo
      titulo="Página no encontrada"
      descripcion="La página consultada no existe en SICAMED."
      ruta="/404"
      noIndexar
    />
    <EstadoVacio
      icono="mundo"
      titulo="Esta página no existe"
      texto="La dirección que buscas no corresponde a ninguna sección de SICAMED. Puede que el enlace haya cambiado o que la publicación ya no esté vigente."
      accion={
        <div className="fila" style={{ gap: "var(--e3)" }}>
          <Link to="/" className="boton boton--primario boton--sm">
            Ir al inicio
          </Link>
          <Link to="/vitrina" className="boton boton--secundario boton--sm">
            Ver la vitrina
          </Link>
        </div>
      }
    />
  </div>
);
