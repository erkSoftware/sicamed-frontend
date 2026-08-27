import { useEffect } from "react";

export const useRevelarSeccion = (dependencia: unknown): void => {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const elementos = Array.from(document.querySelectorAll<HTMLElement>("[data-revelar]"));
    if (elementos.length === 0) return undefined;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.setAttribute("data-revelado", "si");
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );

    for (const elemento of elementos) {
      const caja = elemento.getBoundingClientRect();
      if (caja.top < window.innerHeight) elemento.setAttribute("data-revelado", "si");
      else observador.observe(elemento);
    }

    return () => observador.disconnect();
  }, [dependencia]);
};
