import { compacto } from "../../i18n/formato";
import { Icono } from "../primitivos/Icono";

export type EtapaFlujo = {
  clave: string;
  etiqueta: string;
  valor: number;
  unidad: string;
  detalle: string;
};

type Props = {
  etapas: readonly EtapaFlujo[];
  activa?: string;
};

export const FlujoProceso = ({ etapas, activa }: Props) => (
  <div
    className="flujo"
    role="group"
    tabIndex={0}
    aria-label="Flujo del proceso, de cultivo a entrega al paciente"
  >
    <ol className="flujo__lista">
      {etapas.map((etapa, indice) => (
        <li key={etapa.clave} className="flujo__elemento">
          <div className={`flujo__paso${activa === etapa.clave ? " flujo__paso--activo" : ""}`}>
            <span
              className="flujo__lote"
              aria-hidden="true"
              style={{ animationDelay: `${indice * 340}ms` }}
            />
            <span className="flujo__etapa">
              {indice + 1}. {etapa.etiqueta}
            </span>
            <span className="flujo__valor">{compacto(etapa.valor)}</span>
            <span className="flujo__unidad">{etapa.unidad}</span>
            <span className="flujo__unidad" style={{ marginTop: "var(--e2)" }}>
              {etapa.detalle}
            </span>
          </div>
          {indice < etapas.length - 1 ? (
            <span className="flujo__flecha" aria-hidden="true">
              <Icono nombre="flecha" tamano={18} />
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  </div>
);
