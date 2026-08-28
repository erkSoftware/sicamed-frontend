import { useLocation } from "react-router-dom";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { pedirCinematica } from "./diagnostico";

export const BotonIntro = () => {
  const esPortada = useLocation().pathname === "/";

  if (!esPortada) return null;

  return (
    <button
      type="button"
      className="intro-flotante"
      aria-label="Ver la introducción"
      onClick={pedirCinematica}
    >
      <span className="intro-flotante__disco" aria-hidden="true">
        <Icono nombre="reproducir" tamano={13} />
      </span>
      <span className="intro-flotante__bloque">
        <span className="intro-flotante__rotulo">Recorrido</span>
        <span className="intro-flotante__titulo">Ver la introducción</span>
      </span>
    </button>
  );
};
