import { Link } from "react-router-dom";
import { Boton } from "../primitivos/Boton";
import { Icono } from "../primitivos/Icono";
import { deshacerAsiento, useBitacora } from "./voz/bitacora";
import type { EstadoDeAsiento } from "./voz/bitacora";
import type { NombreIcono } from "../primitivos/Icono";

const ICONO: Record<EstadoDeAsiento, NombreIcono> = {
  hecho: "check",
  rechazado: "cerrar",
  fallido: "alerta",
};

const hora = (instante: number): string =>
  new Date(instante).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

export const BitacoraAurora = () => {
  const asientos = useBitacora((estado) => estado.asientos);
  if (asientos.length === 0) return null;

  return (
    <section className="aurora-bitacora" aria-label="Lo que Aurora hizo en esta conversación">
      <h3 className="aurora-bitacora__titulo">Lo que hice</h3>
      <ul className="aurora-bitacora__lista">
        {asientos.map((asiento) => (
          <li key={asiento.id} className="aurora-bitacora__asiento" data-estado={asiento.estado}>
            <Icono nombre={ICONO[asiento.estado]} tamano={13} />
            <div className="aurora-bitacora__texto">
              <p className="aurora-bitacora__etiqueta">{asiento.etiqueta}</p>
              {asiento.detalle ? (
                <p className="aurora-bitacora__detalle">{asiento.detalle}</p>
              ) : null}
              <p className="aurora-bitacora__pie">
                <span className="aurora-bitacora__hora">{hora(asiento.instante)}</span>
                {asiento.traza ? (
                  <Link
                    className="aurora-bitacora__enlace"
                    to={`/app/trazabilidad?buscar=${encodeURIComponent(asiento.traza)}`}
                  >
                    Ver en trazabilidad
                  </Link>
                ) : null}
                {asiento.deshacer ? (
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => deshacerAsiento(asiento.id)}
                  >
                    Deshacer
                  </Boton>
                ) : null}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
