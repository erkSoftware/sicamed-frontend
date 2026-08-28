import { Icono } from "../ui/primitivos/Icono";
import { useTema } from "./almacen";
import { FICHAS_LUMINOSIDAD } from "./tipos";

export const SelectorTema = () => {
  const luminosidad = useTema((estado) => estado.luminosidad);
  const alternarLuminosidad = useTema((estado) => estado.alternarLuminosidad);
  const destino = FICHAS_LUMINOSIDAD[luminosidad === "claro" ? "oscuro" : "claro"];

  return (
    <button
      type="button"
      className="tema__interruptor"
      aria-label={`Cambiar a modo ${destino.nombre}`}
      title={destino.descripcion}
      onClick={alternarLuminosidad}
    >
      <Icono nombre={destino.icono} tamano={16} />
    </button>
  );
};
