import { useEffect, useState } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

export const useMovimientoSobrio = (): boolean => {
  const [sobrio, setSobrio] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const medio = window.matchMedia(CONSULTA);
    setSobrio(medio.matches);
    const alCambiar = (evento: MediaQueryListEvent) => setSobrio(evento.matches);
    medio.addEventListener("change", alCambiar);
    return () => medio.removeEventListener("change", alCambiar);
  }, []);

  return sobrio;
};
