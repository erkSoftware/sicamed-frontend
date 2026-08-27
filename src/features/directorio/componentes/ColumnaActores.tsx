import type { ReactNode } from "react";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import type { NombreIcono } from "../../../shared/ui/primitivos/Icono";
import { numero } from "../../../shared/i18n/formato";

type Props = {
  titulo: string;
  total: number;
  visibles: number;
  icono: NombreIcono;
  children: ReactNode;
  pie?: ReactNode;
};

export const ColumnaActores = ({ titulo, total, visibles, icono, children, pie }: Props) => (
  <section className="columna" aria-labelledby={`columna-${titulo}`}>
    <header className="columna__encabezado">
      <h2 className="columna__titulo" id={`columna-${titulo}`}>
        <Icono nombre={icono} tamano={15} />
        {titulo}
      </h2>
      <span className="columna__conteo">{numero(total)}</span>
      <p style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
        {numero(visibles)} visibles en esta página
      </p>
    </header>
    <ul className="columna__lista">{children}</ul>
    {pie}
  </section>
);
