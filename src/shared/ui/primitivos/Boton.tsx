import clsx from "clsx";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icono } from "./Icono";
import type { NombreIcono } from "./Icono";

type Variante = "primario" | "acento" | "secundario" | "fantasma" | "peligro";
type Tamano = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
  icono?: NombreIcono;
  iconoFinal?: NombreIcono;
  bloque?: boolean;
  cargando?: boolean;
  children?: ReactNode;
};

export const Boton = forwardRef<HTMLButtonElement, Props>(
  (
    {
      variante = "primario",
      tamano = "md",
      icono,
      iconoFinal,
      bloque,
      cargando,
      children,
      className,
      disabled,
      type = "button",
      ...resto
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clsx(
        "boton",
        `boton--${variante}`,
        tamano !== "md" && `boton--${tamano}`,
        bloque && "boton--bloque",
        !children && "boton--icono",
        className,
      )}
      {...resto}
    >
      {icono && !cargando ? <Icono nombre={icono} tamano={tamano === "sm" ? 15 : 17} /> : null}
      {cargando ? <span className="girador" style={{ width: 15, height: 15 }} /> : null}
      {children}
      {iconoFinal ? <Icono nombre={iconoFinal} tamano={tamano === "sm" ? 15 : 17} /> : null}
    </button>
  ),
);

Boton.displayName = "Boton";
