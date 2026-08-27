import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  titulo?: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  sinRelleno?: boolean;
  className?: string;
};

export const Tarjeta = ({
  titulo,
  descripcion,
  acciones,
  children,
  pie,
  sinRelleno,
  className,
}: Props) => (
  <section className={clsx("tarjeta", className)}>
    {titulo ? (
      <header className="tarjeta__encabezado">
        <div>
          <h2 className="tarjeta__titulo">{titulo}</h2>
          {descripcion ? <p className="tarjeta__descripcion">{descripcion}</p> : null}
        </div>
        {acciones ? <div className="fila" style={{ gap: "var(--e2)" }}>{acciones}</div> : null}
      </header>
    ) : null}
    <div className={sinRelleno ? undefined : "tarjeta__cuerpo"}>{children}</div>
    {pie ? <footer className="tarjeta__pie">{pie}</footer> : null}
  </section>
);
