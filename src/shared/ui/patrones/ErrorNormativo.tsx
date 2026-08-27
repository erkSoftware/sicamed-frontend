import { Link } from "react-router-dom";
import type { ProblemDetail } from "../../api/problemDetails";
import { Icono } from "../primitivos/Icono";

type Props = {
  problema: ProblemDetail;
  onReintentar?: () => void;
};

export const ErrorNormativo = ({ problema, onReintentar }: Props) => (
  <div role="alert" aria-live="assertive" className="error-normativo">
    <h3 className="error-normativo__titulo">
      <Icono nombre="alerta" tamano={18} />
      {problema.title}
    </h3>
    <p className="error-normativo__detalle">{problema.detail}</p>
    {problema.norma ? (
      <p className="error-normativo__fundamento">Fundamento normativo: {problema.norma}</p>
    ) : null}
    {problema.accion || onReintentar ? (
      <div className="error-normativo__acciones">
        {problema.accion ? (
          <Link className="boton boton--secundario boton--sm" to={problema.accion.ruta}>
            {problema.accion.etiqueta}
          </Link>
        ) : null}
        {onReintentar ? (
          <button type="button" className="boton boton--fantasma boton--sm" onClick={onReintentar}>
            Reintentar
          </button>
        ) : null}
      </div>
    ) : null}
  </div>
);
