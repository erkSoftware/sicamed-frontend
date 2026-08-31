import { useEffect, useRef, useState } from "react";
import { EsferaAurora } from "./EsferaAurora";
import { nivelDeVoz } from "./voz/motor";
import { Boton } from "../primitivos/Boton";
import { Icono } from "../primitivos/Icono";
import type { NombreIcono } from "../primitivos/Icono";

const CLAVE = "sicamed.presentacion-aurora";

export const yaSePresento = (): boolean => {
  try {
    return window.localStorage.getItem(CLAVE) === "vista";
  } catch {
    return true;
  }
};

export const marcarPresentada = (): void => {
  try {
    window.localStorage.setItem(CLAVE, "vista");
  } catch {
    return;
  }
};

export const olvidarPresentacion = (): void => {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    return;
  }
};

type Capacidad = {
  icono: NombreIcono;
  dicho: string;
  detalle: string;
};

const CAPACIDADES: readonly Capacidad[] = [
  {
    icono: "mapa",
    dicho: "«Llévame a cumplimiento»",
    detalle: "Te muevo por el sistema sin que busques en el menú.",
  },
  {
    icono: "ojo",
    dicho: "«¿Qué estoy viendo aquí?»",
    detalle: "Te explico la pantalla en la que estás y qué se hace en ella.",
  },
  {
    icono: "documento",
    dicho: "«Registra un lote»",
    detalle: "Te acompaño paso a paso y te leo lo que voy a escribir antes de hacerlo.",
  },
];

const PASOS = CAPACIDADES.length + 2;
const CADENCIA = 800;

type Props = {
  abierta: boolean;
  onCerrar: () => void;
};

export const PresentacionAurora = ({ abierta, onCerrar }: Props) => {
  const [revelado, setRevelado] = useState(0);
  const temporizadores = useRef<number[]>([]);

  useEffect(() => {
    if (!abierta) {
      setRevelado(0);
      return undefined;
    }

    setRevelado(1);
    for (let paso = 2; paso <= PASOS; paso += 1) {
      temporizadores.current.push(
        window.setTimeout(() => setRevelado(paso), CADENCIA * (paso - 1)),
      );
    }

    return () => {
      temporizadores.current.forEach((identificador) => window.clearTimeout(identificador));
      temporizadores.current = [];
    };
  }, [abierta]);

  useEffect(() => {
    if (!abierta) return undefined;
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierta, onCerrar]);

  if (!abierta) return null;

  return (
    <div
      className="aurora-presentacion"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aurora-presentacion-titulo"
    >
      <button
        type="button"
        className="aurora-presentacion__cerrar"
        aria-label="Salir de la presentación y dejar a Aurora lista"
        onClick={onCerrar}
      >
        <Icono nombre="cerrar" tamano={18} />
      </button>

      <div className="aurora-presentacion__cuerpo">
        <span className="aurora-presentacion__esfera" aria-hidden="true">
          <EsferaAurora nivel={nivelDeVoz} activa />
        </span>

        <h2 className="aurora-presentacion__titulo" id="aurora-presentacion-titulo">
          Habla con AURORA
        </h2>

        <ul className="aurora-presentacion__lista">
          {CAPACIDADES.map((capacidad, indice) =>
            revelado > indice + 1 ? (
              <li key={capacidad.dicho} className="aurora-presentacion__item">
                <span className="aurora-presentacion__icono" aria-hidden="true">
                  <Icono nombre={capacidad.icono} tamano={17} />
                </span>
                <span>
                  <strong>{capacidad.dicho}</strong>
                  <span className="aurora-presentacion__detalle">{capacidad.detalle}</span>
                </span>
              </li>
            ) : null,
          )}
        </ul>

        {revelado >= PASOS ? (
          <p className="aurora-presentacion__cierre">
            No tienes que aprenderte el sistema. Basta con decirle qué necesitas.
          </p>
        ) : null}
      </div>

      <div className="aurora-presentacion__pie">
        <Boton icono="microfono" bloque onClick={onCerrar}>
          Empezar a hablar
        </Boton>
      </div>
    </div>
  );
};
