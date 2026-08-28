import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";
import type { Oferta } from "../../../shared/api/mock/tipos";

type Props = {
  oferta: Oferta | null;
  onCerrar: () => void;
};

export const DialogoInteres = ({ oferta, onCerrar }: Props) => {
  const { t } = useTraduccion();
  const referencia = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return;
    if (oferta && !elemento.open) elemento.showModal();
    if (!oferta && elemento.open) elemento.close();
  }, [oferta]);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return undefined;
    const cancelar = (evento: Event) => {
      evento.preventDefault();
      onCerrar();
    };
    elemento.addEventListener("cancel", cancelar);
    return () => elemento.removeEventListener("cancel", cancelar);
  }, [onCerrar]);

  return (
    <dialog
      ref={referencia}
      className="dialogo dialogo--acceso"
      aria-label={t("vitrina.acceso.titulo")}
    >
      <div className="dialogo__encabezado">
        <p className="dialogo__titulo">{t("vitrina.acceso.titulo")}</p>
        <button
          type="button"
          className="cajon__cerrar"
          onClick={onCerrar}
          aria-label={t("vitrina.acceso.cancelar")}
        >
          <Icono nombre="cerrar" tamano={16} />
        </button>
      </div>

      <div className="dialogo__cuerpo">
        {oferta ? (
          <p className="dialogo-acceso__oferta">
            <span className="rotulo">{t(`producto.${oferta.tipoProducto}`)}</span>
            <span>{oferta.organizacion}</span>
          </p>
        ) : null}
        <p className="dialogo-acceso__texto">{t("vitrina.acceso.texto")}</p>
        <p className="dialogo-acceso__reservado">
          <Icono nombre="candado" tamano={14} />
          {t("vitrina.clasificacion.reservadoDetalle")}
        </p>
      </div>

      <div className="dialogo__pie">
        <button type="button" className="boton boton--fantasma boton--sm" onClick={onCerrar}>
          {t("vitrina.acceso.cancelar")}
        </button>
        <Link className="boton boton--fantasma boton--sm" to="/registro">
          {t("vitrina.acceso.registrar")}
        </Link>
        <Link className="boton boton--primario boton--sm" to="/acceso">
          {t("vitrina.acceso.ingresar")}
        </Link>
      </div>
    </dialog>
  );
};
