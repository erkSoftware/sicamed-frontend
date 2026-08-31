import { Icono } from "../primitivos/Icono";
import { useConsultaMedios } from "../movimiento/useConsultaMedios";

const CONSULTA_APILADO = "(max-width: 980px)";

type Props = { destino: string };

export const PistaDeslizar = ({ destino }: Props) => {
  const compacta = useConsultaMedios(CONSULTA_APILADO);

  if (!compacta) return null;

  const bajar = () =>
    document.querySelector(destino)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <button type="button" className="pista-deslizar" onClick={bajar}>
      <Icono nombre="chevron" tamano={18} />
      <span className="solo-lectores">Ver el recorrido animado que está debajo</span>
    </button>
  );
};
