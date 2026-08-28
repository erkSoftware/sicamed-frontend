import { Icono } from "../primitivos/Icono";
import { useSonido } from "./almacen";

export const InterruptorSonido = () => {
  const activo = useSonido((estado) => estado.activo);
  const alternar = useSonido((estado) => estado.alternar);

  return (
    <button
      type="button"
      className="sonido__interruptor"
      aria-pressed={activo}
      aria-label={activo ? "Silenciar el sonido de los filtros" : "Activar el sonido de los filtros"}
      title={activo ? "Silenciar el sonido de los filtros" : "Activar el sonido de los filtros"}
      onClick={alternar}
    >
      <Icono nombre={activo ? "sonido" : "silencio"} tamano={15} />
    </button>
  );
};
