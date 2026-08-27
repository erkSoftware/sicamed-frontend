import { useEffect, useRef, useState } from "react";

export const useRevelado = <T extends HTMLElement>(margen = "0px 0px -12% 0px") => {
  const referencia = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setVisible(true);
            observador.disconnect();
          }
        }
      },
      { rootMargin: margen, threshold: 0.08 },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [margen]);

  return { referencia, visible };
};
