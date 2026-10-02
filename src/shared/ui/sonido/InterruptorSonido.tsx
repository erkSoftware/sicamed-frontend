import clsx from "clsx";
import { Icono } from "../primitivos/Icono";
import { useSonido } from "./almacen";

type Props = {
  objeto?: string;
  className?: string;
};

export const InterruptorSonido = ({ objeto = "de los filtros", className }: Props) => {
  const activo = useSonido((estado) => estado.activo);
  const alternar = useSonido((estado) => estado.alternar);
  const etiqueta = activo ? `Silenciar el sonido ${objeto}` : `Activar el sonido ${objeto}`;

  return (
    <button
      type="button"
      className={clsx("sonido__interruptor", className)}
      aria-pressed={activo}
      aria-label={etiqueta}
      title={etiqueta}
      onClick={alternar}
    >
      <Icono nombre={activo ? "sonido" : "silencio"} tamano={15} />
    </button>
  );
};
