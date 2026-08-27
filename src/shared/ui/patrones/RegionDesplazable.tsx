import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  etiqueta: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  alto?: number | string;
};

export const RegionDesplazable = ({ etiqueta, children, className, style, alto }: Props) => (
  <div
    className={clsx(className, alto !== undefined && "region-alta")}
    style={
      alto === undefined
        ? style
        : { ...style, ["--alto-region" as string]: typeof alto === "number" ? `${alto}px` : alto }
    }
    role="group"
    tabIndex={0}
    aria-label={etiqueta}
  >
    {children}
  </div>
);
