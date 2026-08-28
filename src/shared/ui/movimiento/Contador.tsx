import { useEffect, useState } from "react";
import { numero } from "../../i18n/formato";
import { useRevelado } from "./useRevelado";

type Props = {
  valor: number;
  duracion?: number;
};

export const Contador = ({ valor, duracion = 1100 }: Props) => {
  const { referencia, visible } = useRevelado<HTMLSpanElement>();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const nodo = referencia.current;
    if (!visible || !nodo) return undefined;
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setListo(true);
      return undefined;
    }
    setListo(false);
    let cuadro = 0;
    let previo = -1;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / duracion);
      const suave = 1 - (1 - avance) ** 4;
      const actual = Math.round(valor * suave);
      if (actual !== previo) {
        previo = actual;
        nodo.textContent = numero(actual);
      }
      if (avance < 1) cuadro = requestAnimationFrame(paso);
      else setListo(true);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [referencia, visible, valor, duracion]);

  return (
    <span ref={referencia} className="cifra">
      {numero(listo ? valor : 0)}
    </span>
  );
};
