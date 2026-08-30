import { useEffect, useRef, useState } from "react";
import { fichaDeAccion } from "./acciones";
import type { AccionAurora } from "./acciones";
import type { Encuadre, Escena, Vista } from "./escena";
import { useTema } from "../../tema/almacen";
import { useMovimientoSobrio } from "../movimiento/useMovimientoSobrio";

type Fondo = "panel" | "ninguno";

type Props = {
  accion: AccionAurora;
  encuadre?: Encuadre;
  vista?: Vista;
  fondo?: Fondo;
  fondoEstudio?: boolean;
  voz?: () => number;
  interactiva?: boolean;
  className?: string;
  onOrigen?: (origen: "procedural" | "modelo") => void;
};

export const Aurora = ({
  accion,
  encuadre = "busto",
  vista,
  fondo = "panel",
  fondoEstudio,
  voz,
  interactiva = true,
  className,
  onOrigen,
}: Props) => {
  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const escena = useRef<Escena | null>(null);
  const arrastre = useRef<number | null>(null);
  const [estado, setEstado] = useState<"cargando" | "lista" | "sin-soporte">("cargando");
  const luminosidad = useTema((tema) => tema.luminosidad);
  const sobrio = useMovimientoSobrio();
  const arranque = useRef({
    accion,
    encuadre,
    luminosidad,
    movimiento: !sobrio,
    vista,
    suelo: fondo !== "ninguno",
    fondoEstudio,
    voz,
    onOrigen,
  });

  useEffect(() => {
    let vigente = true;
    const elemento = lienzo.current;
    if (!elemento) return undefined;

    void import("./escena")
      .then(({ montarEscena }) => {
        if (!vigente) return;
        escena.current = montarEscena(elemento, arranque.current);
        setEstado("lista");
      })
      .catch(() => {
        if (vigente) setEstado("sin-soporte");
      });

    return () => {
      vigente = false;
      escena.current?.desechar();
      escena.current = null;
    };
  }, []);

  useEffect(() => escena.current?.fijarAccion(accion), [accion]);
  useEffect(() => escena.current?.fijarEncuadre(encuadre), [encuadre]);
  useEffect(() => escena.current?.fijarLuminosidad(luminosidad), [luminosidad]);
  useEffect(() => escena.current?.fijarMovimiento(!sobrio), [sobrio]);
  useEffect(() => {
    if (vista) escena.current?.fijarVista(vista);
  }, [vista]);

  const ficha = fichaDeAccion(accion);

  const alBajar = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiva) return;
    arrastre.current = evento.clientX;
    evento.currentTarget.setPointerCapture(evento.pointerId);
  };

  const alMover = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (arrastre.current === null) return;
    const delta = (evento.clientX - arrastre.current) / 180;
    arrastre.current = evento.clientX;
    escena.current?.girar(delta);
  };

  const alSoltar = () => {
    arrastre.current = null;
  };

  return (
    <div
      ref={contenedor}
      className={className ? `aurora-escena ${className}` : "aurora-escena"}
      data-estado={estado}
      data-fondo={fondo}
      data-interactiva={interactiva ? "si" : "no"}
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
    >
      <canvas
        ref={lienzo}
        className="aurora-escena__lienzo"
        role="img"
        aria-label={`Aurora, asistente de SICAMED. ${ficha.etiqueta}: ${ficha.proposito}.`}
      />
      {estado === "sin-soporte" ? (
        <p className="aurora-escena__respaldo">
          Este navegador no puede dibujar a Aurora en tres dimensiones. El resto del sistema
          funciona igual.
        </p>
      ) : null}
    </div>
  );
};
