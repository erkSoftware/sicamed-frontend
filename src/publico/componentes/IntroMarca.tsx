import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cinematicaActiva } from "../intro/decision";

const LETRAS = ["S", "I", "C", "A", "M", "E", "D"];
const DURACION = 2000;

const debeOmitir = (): boolean =>
  typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const marcarEstado = (estado: "corriendo" | "listo"): void => {
  const raiz = document.documentElement;
  if (estado === "listo" && raiz.getAttribute("data-cinematica") === "corriendo") return;
  raiz.setAttribute("data-intro", estado);
};

export const IntroMarca = () => {
  const [fase, setFase] = useState<"oculta" | "entrando" | "saliendo">("oculta");
  const esPortada = useLocation().pathname === "/";

  useEffect(() => {
    if (cinematicaActiva()) return undefined;
    if (!esPortada || debeOmitir()) {
      marcarEstado("listo");
      return undefined;
    }
    marcarEstado("corriendo");
    setFase("entrando");
    const salida = window.setTimeout(() => setFase("saliendo"), DURACION - 520);
    const fin = window.setTimeout(() => {
      setFase("oculta");
      marcarEstado("listo");
    }, DURACION);
    return () => {
      window.clearTimeout(salida);
      window.clearTimeout(fin);
    };
  }, [esPortada]);

  if (fase === "oculta") return null;

  return (
    <div className="intro" data-fase={fase} aria-hidden="true">
      <p className="intro__marca">
        {LETRAS.map((letra, indice) => (
          <span
            key={`${letra}-${indice}`}
            className="intro__letra"
            data-vivo={indice >= 4 ? "si" : undefined}
          >
            <span style={{ animationDelay: `${indice * 62}ms` }}>{letra}</span>
          </span>
        ))}
      </p>
      <span className="intro__regla" />
      <p className="intro__lema">Sistema de Información del Cannabis Medicinal</p>
    </div>
  );
};
