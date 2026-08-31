import { useEffect, useState } from "react";

export const useConsultaMedios = (consulta: string): boolean => {
  const [coincide, setCoincide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const medio = window.matchMedia(consulta);
    setCoincide(medio.matches);
    const alCambiar = (evento: MediaQueryListEvent) => setCoincide(evento.matches);
    medio.addEventListener("change", alCambiar);
    return () => medio.removeEventListener("change", alCambiar);
  }, [consulta]);

  return coincide;
};
