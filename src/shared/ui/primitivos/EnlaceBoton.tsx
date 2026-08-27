import clsx from "clsx";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Icono } from "./Icono";
import type { NombreIcono } from "./Icono";

type Props = {
  a: string;
  variante?: "primario" | "acento" | "secundario" | "fantasma";
  tamano?: "sm" | "md" | "lg";
  icono?: NombreIcono;
  iconoFinal?: NombreIcono;
  bloque?: boolean;
  children: ReactNode;
  className?: string;
};

export const EnlaceBoton = ({
  a,
  variante = "primario",
  tamano = "md",
  icono,
  iconoFinal,
  bloque,
  children,
  className,
}: Props) => (
  <Link
    to={a}
    className={clsx(
      "boton",
      `boton--${variante}`,
      tamano !== "md" && `boton--${tamano}`,
      bloque && "boton--bloque",
      className,
    )}
  >
    {icono ? <Icono nombre={icono} tamano={tamano === "sm" ? 15 : 17} /> : null}
    {children}
    {iconoFinal ? <Icono nombre={iconoFinal} tamano={tamano === "sm" ? 15 : 17} /> : null}
  </Link>
);
