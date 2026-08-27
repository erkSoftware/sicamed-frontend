import { useEffect, useState } from "react";
import { numero } from "../../i18n/formato";
import { useRevelado } from "./useRevelado";

type Props = {
  valor: number;
  duracion?: number;
};

export const Contador = ({ valor, duracion = 1100 }: Props) => {
  const { referencia, visible } = useRevelado<HTMLSpanElement>();
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMostrado(valor);
      return undefined;
    }
    let cuadro = 0;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / duracion);
      const suave = 1 - (1 - avance) ** 4;
      setMostrado(Math.round(valor * suave));
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [visible, valor, duracion]);

  return (
    <span ref={referencia} className="cifra">
      {numero(visible ? mostrado : 0)}
    </span>
  );
};
