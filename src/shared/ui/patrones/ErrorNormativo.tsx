import { Link } from "react-router-dom";
import { esLimiteDeTasa, segundosDeEspera } from "../../api/problemDetails";
import { salidaDelProblema } from "../../api/salidas";
import type { ProblemDetail } from "../../api/problemDetails";
import { Icono } from "../primitivos/Icono";

type Props = {
  problema: ProblemDetail;
  onReintentar?: () => void;
};

export const ErrorNormativo = ({ problema, onReintentar }: Props) => {
  const espera = esLimiteDeTasa(problema) ? segundosDeEspera(problema) : 0;
  const salida = salidaDelProblema(problema);
  return (
    <div role="alert" aria-live="assertive" className="error-normativo">
      <h3 className="error-normativo__titulo">
        <Icono nombre="alerta" tamano={18} />
        {problema.title}
      </h3>
      <p className="error-normativo__detalle">{problema.detail}</p>
      {salida ? <p className="error-normativo__salida">Qué hacer: {salida}</p> : null}
      {problema.norma ? (
        <p className="error-normativo__fundamento">Fundamento normativo: {problema.norma}</p>
      ) : null}
      {problema.errores?.length ? (
        <ul className="error-normativo__campos">
          {problema.errores.map((campo) => (
            <li key={campo.campo}>
              <b>{campo.campo}</b>: {campo.motivo}
            </li>
          ))}
        </ul>
      ) : null}
      {espera > 0 ? (
        <p className="error-normativo__espera">
          El servicio limitó la cantidad de peticiones. Puedes reintentar en {espera} segundos.
        </p>
      ) : null}
      {problema.solicitudId ? (
        <p className="error-normativo__solicitud">
          Identificador de la solicitud: <code>{problema.solicitudId}</code>
        </p>
      ) : null}
      {problema.accion || onReintentar ? (
        <div className="error-normativo__acciones">
          {problema.accion ? (
            <Link className="boton boton--secundario boton--sm" to={problema.accion.ruta}>
              {problema.accion.etiqueta}
            </Link>
          ) : null}
          {onReintentar ? (
            <button
              type="button"
              className="boton boton--fantasma boton--sm"
              onClick={onReintentar}
              disabled={espera > 0}
            >
              Reintentar
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
