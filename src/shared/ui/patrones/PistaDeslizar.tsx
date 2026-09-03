import { useEffect, useState } from "react";
import { Icono } from "../primitivos/Icono";
import { useConsultaMedios } from "../movimiento/useConsultaMedios";

const CONSULTA_APILADO = "(max-width: 980px)";

const DESPLAZAMIENTO_MINIMO = 24;

type Props = { destino: string };

export const PistaDeslizar = ({ destino }: Props) => {
  const compacta = useConsultaMedios(CONSULTA_APILADO);
  const [sinDeslizar, fijarSinDeslizar] = useState(true);

  useEffect(() => {
    const mirar = () => fijarSinDeslizar(window.scrollY < DESPLAZAMIENTO_MINIMO);
    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    return () => window.removeEventListener("scroll", mirar);
  }, []);

  if (!compacta || !sinDeslizar) return null;

  const bajar = () =>
    document.querySelector(destino)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <button type="button" className="pista-deslizar" onClick={bajar}>
      <Icono nombre="chevron" tamano={18} />
      <span className="solo-lectores">Ver el recorrido animado que está debajo</span>
    </button>
  );
};
