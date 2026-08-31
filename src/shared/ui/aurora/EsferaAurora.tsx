import { useEffect, useRef } from "react";
import { seguir } from "./voz/nivel";
import { useMovimientoSobrio } from "../movimiento/useMovimientoSobrio";

type Props = {
  nivel: () => number;
  activa: boolean;
};

export const EsferaAurora = ({ nivel, activa }: Props) => {
  const esfera = useRef<HTMLSpanElement>(null);
  const viva = useRef(activa);
  const sobrio = useMovimientoSobrio();
  const quieto = useRef(sobrio);

  viva.current = activa;
  quieto.current = sobrio;

  useEffect(() => {
    const elemento = esfera.current;
    if (!elemento) return undefined;

    let energia = 0;
    let cuadro = 0;

    const pintar = () => {
      const objetivo = viva.current && !quieto.current ? Math.min(1, nivel()) : 0;
      energia = seguir(energia, objetivo, 0.32, 0.06);
      elemento.style.setProperty("--pulso", energia.toFixed(3));
      cuadro = requestAnimationFrame(pintar);
    };

    cuadro = requestAnimationFrame(pintar);
    return () => cancelAnimationFrame(cuadro);
  }, [nivel]);

  return <span ref={esfera} className="aurora-esfera" aria-hidden="true" />;
};
