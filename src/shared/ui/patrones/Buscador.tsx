import { useId } from "react";
import { Icono } from "../primitivos/Icono";

type Props = {
  valor: string;
  onCambiar: (valor: string) => void;
  etiqueta: string;
  marcador?: string;
};

export const Buscador = ({ valor, onCambiar, etiqueta, marcador }: Props) => {
  const id = useId();
  return (
    <div className="buscador">
      <label className="solo-lectores" htmlFor={id}>
        {etiqueta}
      </label>
      <Icono nombre="buscar" tamano={16} />
      <input
        id={id}
        type="search"
        className="campo__control"
        value={valor}
        placeholder={marcador ?? etiqueta}
        onChange={(evento) => onCambiar(evento.target.value)}
      />
    </div>
  );
};
