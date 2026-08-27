import clsx from "clsx";
import type { ReactNode } from "react";

export type TonoInsignia = "neutro" | "exito" | "alerta" | "peligro" | "info" | "acento";

type Props = {
  tono?: TonoInsignia;
  children: ReactNode;
  sinPunto?: boolean;
};

export const Insignia = ({ tono = "neutro", children, sinPunto }: Props) => (
  <span className={clsx("insignia", `insignia--${tono}`, sinPunto && "insignia--sin-punto")}>
    {children}
  </span>
);
