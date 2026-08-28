import { useLocation } from "react-router-dom";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../shared/i18n/ProveedorIdioma";
import { pedirPelicula, rutaConPelicula } from "./decision";

export const BotonPorQue = () => {
  const { t } = useTraduccion();
  const ruta = useLocation().pathname;

  if (!rutaConPelicula(ruta)) return null;

  return (
    <button type="button" className="porque-flotante" onClick={pedirPelicula}>
      <span className="porque-flotante__disco" aria-hidden="true">
        <Icono nombre="reproducir" tamano={13} />
      </span>
      <span className="porque-flotante__bloque">
        <span className="porque-flotante__rotulo">{t("origen.boton.rotulo")}</span>
        <span className="porque-flotante__titulo">{t("origen.boton.titulo")}</span>
      </span>
    </button>
  );
};
