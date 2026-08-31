import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Boton } from "../primitivos/Boton";
import { Icono } from "../primitivos/Icono";
import { contextoDeRuta } from "./contextoDeSeccion";
import type { ContextoDeSeccion } from "./contextoDeSeccion";
import type { Permiso } from "../../auth/tipos";

const ESPERA_ANTES = 700;
const ESPERA_DESPUES = 9000;
const ESPERA_CIERRE = 5200;

const anunciadas = new Set<string>();

export const olvidarSeccionesAnunciadas = (): void => anunciadas.clear();

type Props = {
  activa: boolean;
  permisos: readonly Permiso[];
  puedeHablar: boolean;
  cierre: string | null;
  onHablar: () => void;
  onCierreVisto: () => void;
};

export const GuiaDeSeccion = ({
  activa,
  permisos,
  puedeHablar,
  cierre,
  onHablar,
  onCierreVisto,
}: Props) => {
  const ubicacion = useLocation();
  const [pista, setPista] = useState<ContextoDeSeccion | null>(null);
  const temporizadores = useRef<number[]>([]);

  const limpiar = () => {
    temporizadores.current.forEach((identificador) => window.clearTimeout(identificador));
    temporizadores.current = [];
  };

  useEffect(() => {
    if (!activa) {
      setPista(null);
      return undefined;
    }

    const contexto = contextoDeRuta(ubicacion.pathname, permisos);
    if (!contexto || anunciadas.has(contexto.ruta)) {
      setPista(null);
      return undefined;
    }

    anunciadas.add(contexto.ruta);
    temporizadores.current.push(window.setTimeout(() => setPista(contexto), ESPERA_ANTES));
    temporizadores.current.push(
      window.setTimeout(() => setPista(null), ESPERA_ANTES + ESPERA_DESPUES),
    );

    return limpiar;
  }, [activa, ubicacion.pathname, permisos]);

  useEffect(() => {
    if (!cierre) return undefined;
    const identificador = window.setTimeout(onCierreVisto, ESPERA_CIERRE);
    return () => window.clearTimeout(identificador);
  }, [cierre, onCierreVisto]);

  const visible = cierre ?? (pista ? pista.frase : null);
  if (!activa || !visible) return null;

  const cerrar = () => {
    limpiar();
    setPista(null);
    if (cierre) onCierreVisto();
  };

  return (
    <section
      className="aurora-guia"
      data-tono={cierre ? "cierre" : "pista"}
      aria-label={pista && !cierre ? `Aurora en ${pista.etiqueta}` : "Aurora"}
    >
      <div className="aurora-guia__encabezado">
        <span className="aurora-guia__firma">
          <Icono nombre="asistente" tamano={15} />
          Aurora
        </span>
        <button
          type="button"
          className="aurora-guia__cerrar"
          aria-label="Cerrar el aviso de Aurora"
          onClick={cerrar}
        >
          <Icono nombre="cerrar" tamano={15} />
        </button>
      </div>

      <p className="aurora-guia__frase" role="status">
        {visible}
      </p>

      {cierre || !puedeHablar ? null : (
        <Boton
          tamano="sm"
          icono="microfono"
          bloque
          onClick={() => {
            limpiar();
            setPista(null);
            onHablar();
          }}
        >
          Hablar
        </Boton>
      )}
    </section>
  );
};
