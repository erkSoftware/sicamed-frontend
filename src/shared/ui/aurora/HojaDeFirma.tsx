import { Dialogo } from "../primitivos/Dialogo";
import { Boton } from "../primitivos/Boton";
import { Icono } from "../primitivos/Icono";
import { firmar, rechazarFirma, useFirma } from "./voz/confirmacion";

export const HojaDeFirma = () => {
  const pendiente = useFirma((estado) => estado.pendiente);

  return (
    <Dialogo
      abierto={pendiente !== null}
      titulo={pendiente?.titulo ?? "Autorización pendiente"}
      clase="aurora-firma"
      onCerrar={rechazarFirma}
      pie={
        <>
          <Boton variante="secundario" onClick={rechazarFirma}>
            No autorizo
          </Boton>
          <Boton icono="check" onClick={firmar}>
            Autorizar
          </Boton>
        </>
      }
    >
      {pendiente ? (
        <div className="aurora-firma__cuerpo">
          <p className="aurora-firma__descripcion">{pendiente.descripcion}</p>

          <p className="aurora-firma__entidad">
            <Icono nombre="capas" tamano={14} />
            <span>
              Se toca <strong>{pendiente.entidad}</strong>
            </span>
          </p>

          {pendiente.campos.length === 0 ? (
            <p className="aurora-firma__sin-datos">
              La acción no lleva valores: solo se ejecuta tal como está.
            </p>
          ) : (
            <dl className="aurora-firma__valores">
              {pendiente.campos.map((campo) => (
                <div key={campo.etiqueta} className="aurora-firma__valor">
                  <dt>{campo.etiqueta}</dt>
                  <dd>
                    {campo.anterior === undefined ? null : (
                      <span className="aurora-firma__antes">{campo.anterior}</span>
                    )}
                    <span className="aurora-firma__despues">{campo.valor}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p className="aurora-firma__nota">
            Lo pediste por voz, pero se escribe en tu nombre y queda en el ledger de trazabilidad.
            Si no reconoces estos valores, no lo autorices.
          </p>
        </div>
      ) : null}
    </Dialogo>
  );
};
