import type { ReactNode } from "react";
import { Icono } from "../primitivos/Icono";
import type { NombreIcono } from "../primitivos/Icono";

type Props = {
  titulo: string;
  texto: string;
  icono?: NombreIcono;
  accion?: ReactNode;
};

export const EstadoVacio = ({ titulo, texto, icono = "documento", accion }: Props) => (
  <div className="estado-vacio">
    <span className="estado-vacio__icono">
      <Icono nombre={icono} tamano={24} />
    </span>
    <h3 className="estado-vacio__titulo">{titulo}</h3>
    <p className="estado-vacio__texto">{texto}</p>
    {accion}
  </div>
);
