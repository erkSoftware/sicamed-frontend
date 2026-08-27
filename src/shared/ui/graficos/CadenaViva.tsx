import { useEffect, useRef, useState } from "react";
import { compacto } from "../../i18n/formato";
import { Icono, type NombreIcono } from "../primitivos/Icono";
import { useRevelado } from "../movimiento/useRevelado";
import type { EtapaFlujo } from "./FlujoProceso";

type Props = {
  etapas: readonly EtapaFlujo[];
};

const COMPAS = 2300;

const ICONOS: Record<string, NombreIcono> = {
  cultivo: "hoja",
  bodega: "inventario",
  dispensario: "vitrina",
  ips: "medico",
  entregado: "pacientes",
};

const ACCIONES: Record<string, string> = {
  cultivo: "Lote sembrado y georreferenciado",
  bodega: "Biomasa pesada y sellada",
  dispensario: "Producto terminado liberado",
  ips: "Fórmula asociada al paciente",
  entregado: "Entrega confirmada con firma en destino",
};

const huella = (semilla: string): string => {
  let mezcla = 0x811c9dc5;
  for (let i = 0; i < semilla.length; i += 1) {
    mezcla ^= semilla.charCodeAt(i);
    mezcla = Math.imul(mezcla, 0x01000193) >>> 0;
  }
  let salida = "";
  let valor = mezcla;
  for (let i = 0; i < 10; i += 1) {
    salida += "0123456789abcdef"[valor & 15];
    valor = (Math.imul(valor, 0x01000193) ^ (valor >>> 5)) >>> 0;
  }
  return salida;
};

export const CadenaViva = ({ etapas }: Props) => {
  const { referencia, visible } = useRevelado<HTMLDivElement>();
  const [activa, setActiva] = useState(0);
  const [detenida, setDetenida] = useState(false);
  const reducido = useRef(false);

  useEffect(() => {
    reducido.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido.current) setActiva(etapas.length - 1);
  }, [etapas.length]);

  useEffect(() => {
    if (!visible || detenida || reducido.current) return undefined;
    const reloj = window.setInterval(() => {
      setActiva((anterior) => (anterior + 1) % (etapas.length + 1));
    }, COMPAS);
    return () => window.clearInterval(reloj);
  }, [visible, detenida, etapas.length]);

  const indice = Math.min(activa, etapas.length - 1);
  const completa = activa >= etapas.length;
  const posicion = ((indice + 0.5) / etapas.length) * 100;
  const arranque = 50 / etapas.length;

  return (
    <div
      className="cadena"
      ref={referencia}
      data-completa={completa ? "si" : "no"}
      onMouseEnter={() => setDetenida(true)}
      onMouseLeave={() => setDetenida(false)}
    >
      <div className="cadena__via" aria-hidden="true">
        <span className="cadena__riel" style={{ left: `${arranque}%`, width: `${100 - arranque * 2}%` }} />
        <span
          className="cadena__avance"
          style={{ left: `${arranque}%`, width: `${Math.max(0, posicion - arranque)}%` }}
        />
        {etapas.map((etapa, orden) => (
          <span
            key={etapa.clave}
            className="cadena__nodo"
            data-estado={orden < indice || completa ? "hecho" : orden === indice ? "activo" : "espera"}
            style={{ left: `${((orden + 0.5) / etapas.length) * 100}%` }}
          />
        ))}
        <span className="cadena__lote" style={{ left: `${posicion}%` }}>
          <span className="cadena__lote-pulso" />
          <span className="cadena__lote-sello mono">LOTE-{huella(etapas[indice]?.clave ?? "").slice(0, 6).toUpperCase()}</span>
        </span>
      </div>

      <ol className="cadena__estaciones">
        {etapas.map((etapa, orden) => (
          <li
            key={etapa.clave}
            className="cadena__estacion"
            data-estado={orden < indice || completa ? "hecho" : orden === indice ? "activo" : "espera"}
          >
            <button
              type="button"
              className="cadena__boton"
              aria-pressed={orden === indice}
              onClick={() => setActiva(orden)}
            >
              <span className="cadena__icono" aria-hidden="true">
                <Icono nombre={ICONOS[etapa.clave] ?? "hoja"} tamano={18} />
              </span>
              <span className="cadena__orden rotulo">Etapa {String(orden + 1).padStart(2, "0")}</span>
              <span className="cadena__nombre">{etapa.etiqueta}</span>
              <span className="cadena__cifra">{compacto(etapa.valor)}</span>
              <span className="cadena__unidad">{etapa.unidad}</span>
              <span className="cadena__detalle">{etapa.detalle}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="cadena__registro">
        <p className="cadena__registro-titulo rotulo">
          Cadena de eventos <span aria-hidden="true">·</span> huella encadenada
        </p>
        <ol className="cadena__sellos">
          {etapas.map((etapa, orden) => {
            const sellado = orden < indice || completa;
            const enCurso = orden === indice && !completa;
            return (
              <li
                key={etapa.clave}
                className="cadena__sello"
                data-estado={sellado ? "hecho" : enCurso ? "activo" : "espera"}
              >
                <span className="cadena__sello-marca" aria-hidden="true">
                  <Icono nombre={sellado ? "check" : enCurso ? "reloj" : "cadena"} tamano={13} />
                </span>
                <span className="cadena__sello-texto">{ACCIONES[etapa.clave] ?? etapa.detalle}</span>
                <span className="cadena__sello-huella mono">{huella(`${etapa.clave}-sicamed`)}</span>
              </li>
            );
          })}
        </ol>
        <p className="cadena__nota">
          Cada evento incorpora la huella del anterior. Reescribir una etapa invalidaría todas las
          posteriores, y por eso el histórico sirve de prueba ante la autoridad sanitaria.
        </p>
      </div>
    </div>
  );
};
