import { useEffect, useState } from "react";
import { Icono } from "../primitivos/Icono";
import { useConsultaMedios } from "../movimiento/useConsultaMedios";

const CONSULTA_APILADO = "(max-width: 980px)";

const UMBRAL_PX = 24;

type Props = { destino: string };

export const PistaDeslizar = ({ destino }: Props) => {
  const compacta = useConsultaMedios(CONSULTA_APILADO);
  const [arriba, setArriba] = useState(true);

  useEffect(() => {
    if (!compacta) return undefined;
    const mirar = () => setArriba(window.scrollY < UMBRAL_PX);
    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    return () => window.removeEventListener("scroll", mirar);
  }, [compacta]);

  if (!compacta) return null;

  const bajar = () =>
    document.querySelector(destino)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <button
      type="button"
      className="pista-deslizar"
      data-saliendo={arriba ? "no" : "si"}
      onClick={bajar}
    >
      <Icono nombre="chevron" tamano={18} />
      <span className="solo-lectores">Ver el recorrido animado que está debajo</span>
    </button>
  );
};
