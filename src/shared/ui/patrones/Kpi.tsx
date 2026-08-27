import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Icono } from "../primitivos/Icono";
import { Contador } from "../movimiento/Contador";
import { numero } from "../../i18n/formato";
import type { NombreIcono } from "../primitivos/Icono";

type Props = {
  etiqueta: string;
  valor?: ReactNode;
  cifra?: number;
  nota?: string;
  delta?: { valor: string; sube: boolean };
  icono?: NombreIcono;
  a?: string;
};

const Contenido = ({ etiqueta, valor, cifra, nota, delta, icono }: Props) => (
  <>
    <div className="kpi__cabecera">
      <span className="kpi__etiqueta">{etiqueta}</span>
      {icono ? (
        <span className="kpi__icono">
          <Icono nombre={icono} tamano={18} />
        </span>
      ) : null}
    </div>
    <strong className="kpi__valor">
      {typeof cifra === "number" ? (
        <>
          <span aria-hidden="true">
            <Contador valor={cifra} />
          </span>
          <span className="solo-lectores">{numero(cifra)}</span>
        </>
      ) : (
        valor
      )}
    </strong>
    {nota || delta ? (
      <span className="kpi__nota">
        {delta ? (
          <span className={`kpi__delta kpi__delta--${delta.sube ? "sube" : "baja"}`}>
            {delta.sube ? "▲" : "▼"} {delta.valor}
          </span>
        ) : null}
        {nota}
      </span>
    ) : null}
  </>
);

export const Kpi = (props: Props) =>
  props.a ? (
    <Link to={props.a} className="kpi kpi--enlace">
      <Contenido {...props} />
    </Link>
  ) : (
    <article className="kpi">
      <Contenido {...props} />
    </article>
  );
