import { useEffect, useRef, useState } from "react";

type Opciones = {
  seguir?: boolean;
};

export const useRevelado = <T extends HTMLElement>(
  margen = "0px 0px -12% 0px",
  { seguir = false }: Opciones = {},
) => {
  const referencia = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const [enPantalla, setEnPantalla] = useState(false);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      setEnPantalla(true);
      return undefined;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (seguir) setEnPantalla(entrada.isIntersecting);
          if (entrada.isIntersecting && entrada.intersectionRatio >= 0.08) {
            setVisible(true);
            if (!seguir) observador.disconnect();
          }
        }
      },
      { rootMargin: margen, threshold: seguir ? [0, 0.08] : 0.08 },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [margen, seguir]);

  return { referencia, visible, enPantalla };
};
