import { useEffect, useRef, useState } from "react";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fechaHora } from "../../../shared/i18n/formato";

type Evento = {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  actor: string;
  huella: string;
};

type Props = {
  eventos: readonly Evento[];
};

const SOSTENIDO = 4200;

export const ActividadReciente = ({ eventos }: Props) => {
  const conocidos = useRef<Set<string>>(new Set());
  const [frescos, setFrescos] = useState<readonly string[]>([]);

  useEffect(() => {
    if (eventos.length === 0) return undefined;
    const primeraCarga = conocidos.current.size === 0;
    const llegados = eventos.filter((evento) => !conocidos.current.has(evento.id)).map((evento) => evento.id);
    for (const evento of eventos) conocidos.current.add(evento.id);
    if (primeraCarga || llegados.length === 0) return undefined;
    setFrescos(llegados);
    const reloj = window.setTimeout(() => setFrescos([]), SOSTENIDO);
    return () => window.clearTimeout(reloj);
  }, [eventos]);

  return (
    <ol className="linea-tiempo">
      {eventos.map((evento, orden) => (
        <li
          key={evento.id}
          className="linea-tiempo__item"
          data-nuevo={frescos.includes(evento.id) ? "si" : undefined}
          style={{ animationDelay: `${Math.min(orden, 8) * 70}ms` }}
        >
          <span className="linea-tiempo__punto" aria-hidden="true">
            <Icono nombre={evento.tipo.includes("RECHAZ") ? "alerta" : "check"} tamano={14} />
          </span>
          <div>
            <p className="linea-tiempo__titulo">
              {evento.descripcion}
              {frescos.includes(evento.id) ? (
                <span className="linea-tiempo__sello">Recién sellado</span>
              ) : null}
            </p>
            <p className="linea-tiempo__meta">
              {fechaHora(evento.fecha)} · {evento.actor} · sello {evento.huella}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
};
