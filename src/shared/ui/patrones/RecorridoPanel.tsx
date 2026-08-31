import { useCallback, useEffect, useRef, useState } from "react";
import { Boton } from "../primitivos/Boton";
import { useConsultaMedios } from "../movimiento/useConsultaMedios";
import {
  PARADAS,
  marcarRecorridoVisto,
  recorridoVisto,
  recuadroDe,
  ubicarTarjeta,
} from "./recorridoPanel";
import type { Foco } from "./recorridoPanel";

const CONSULTA_COMPACTA = "(max-width: 900px)";

const ARRANQUE_MS = 900;

export const RecorridoPanel = () => {
  const compacta = useConsultaMedios(CONSULTA_COMPACTA);
  const [corriendo, setCorriendo] = useState(false);
  const [indice, setIndice] = useState(0);
  const [foco, setFoco] = useState<Foco | null>(null);
  const tarjeta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!compacta || recorridoVisto()) return undefined;
    const reloj = window.setTimeout(() => setCorriendo(true), ARRANQUE_MS);
    return () => window.clearTimeout(reloj);
  }, [compacta]);

  const cerrar = useCallback(() => {
    marcarRecorridoVisto();
    setCorriendo(false);
  }, []);

  const visibles = PARADAS.filter((parada) => document.querySelector(parada.seleccion) !== null);
  const parada = visibles[indice];

  useEffect(() => {
    if (!corriendo || !parada) return undefined;
    const medir = () => {
      const objetivo = document.querySelector(parada.seleccion);
      setFoco(objetivo ? recuadroDe(objetivo) : null);
    };
    medir();
    tarjeta.current?.focus();
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, { passive: true });
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir);
    };
  }, [corriendo, parada]);

  useEffect(() => {
    if (!corriendo) return undefined;
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [corriendo, cerrar]);

  if (!corriendo || !parada || !foco) return null;

  const ultima = indice === visibles.length - 1;
  const sitio = ubicarTarjeta(foco, window.innerHeight);

  return (
    <div className="recorrido" role="dialog" aria-modal="true" aria-label="Recorrido del panel">
      <div
        className="recorrido__foco"
        style={{
          top: `${foco.arriba}px`,
          left: `${foco.izquierda}px`,
          width: `${foco.ancho}px`,
          height: `${foco.alto}px`,
        }}
      />

      <div
        className="recorrido__tarjeta"
        data-lado={sitio.lado}
        style={
          sitio.lado === "abajo"
            ? { top: `${sitio.desplazamiento}px` }
            : { bottom: `${sitio.desplazamiento}px` }
        }
        ref={tarjeta}
        tabIndex={-1}
      >
        <p className="recorrido__avance mono">
          {indice + 1} de {visibles.length}
        </p>
        <h2 className="recorrido__titulo">{parada.titulo}</h2>
        <p className="recorrido__detalle">{parada.detalle}</p>
        <div className="recorrido__mandos">
          <Boton variante="fantasma" tamano="sm" onClick={cerrar}>
            Saltar
          </Boton>
          <Boton
            tamano="sm"
            onClick={() => (ultima ? cerrar() : setIndice((previo) => previo + 1))}
          >
            {ultima ? "Entendido" : "Siguiente"}
          </Boton>
        </div>
      </div>
    </div>
  );
};
