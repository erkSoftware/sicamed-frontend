import { useEffect, useRef, useState } from "react";
import {
  crearEscenaSonora,
  type EscenaSonora,
  type EstadoSonoro,
  type OpcionesEscenaSonora,
} from "./escenaSonora";

export const useEscenaSonora = <Clave extends string>(
  opciones: Omit<OpcionesEscenaSonora<Clave>, "alCambiar">,
  activa = true,
) => {
  const escena = useRef<EscenaSonora<Clave> | null>(null);
  const vigentes = useRef(opciones);
  vigentes.current = opciones;
  const [estado, setEstado] = useState<EstadoSonoro>("preparando");

  useEffect(() => {
    if (!activa) return undefined;
    const creada = crearEscenaSonora<Clave>({ ...vigentes.current, alCambiar: setEstado });
    escena.current = creada;
    setEstado(creada.estado());
    return () => {
      creada.cerrar();
      if (escena.current === creada) escena.current = null;
    };
  }, [activa]);

  return { escena, estado };
};
