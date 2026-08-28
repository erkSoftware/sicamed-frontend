import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { VisualCategoria } from "../../../shared/ui/graficos/VisualCategoria";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";
import { fecha, iniciales } from "../../../shared/i18n/formato";
import { esPublico } from "../../../shared/config/camposPublicos";
import type { Oferta } from "../../../shared/api/mock/tipos";

type Props = {
  oferta: Oferta;
  indice?: number;
  onManifestarInteres: (oferta: Oferta) => void;
};

export const TarjetaOferta = ({ oferta, indice = 0, onManifestarInteres }: Props) => {
  const { t, locale } = useTraduccion();
  const producto = t(`producto.${oferta.tipoProducto}`);
  const territorio =
    esPublico("municipio") && oferta.municipio
      ? `${oferta.municipio}, ${oferta.departamento}`
      : oferta.departamento;

  return (
    <article className="tarjeta-oferta" style={{ "--indice": indice } as CSSProperties}>
      <div className="tarjeta-oferta__visual">
        <VisualCategoria
          clave={oferta.id}
          tipoProducto={oferta.tipoProducto}
          rotulo={territorio}
          pie={oferta.id}
          descripcionAlternativa={t("vitrina.tarjeta.imagenCategoria")}
        />
        <span className="tarjeta-oferta__estado mono">{t("vitrina.tarjeta.vigente")}</span>
      </div>

      <div className="tarjeta-oferta__cuerpo">
        <h3 className="tarjeta-oferta__producto">
          <Link to={`/vitrina/${oferta.id}`}>{producto}</Link>
        </h3>

        <p className="tarjeta-oferta__actor">
          <span className="tarjeta-oferta__avatar" aria-hidden="true">
            {iniciales(oferta.organizacion)}
          </span>
          <span className="tarjeta-oferta__actor-nombre">{oferta.organizacion}</span>
          <span className="tarjeta-oferta__atestado">
            <Icono nombre="check" tamano={10} titulo={t("vitrina.tarjeta.habilitacionAtestada")} />
          </span>
        </p>

        <p className="tarjeta-oferta__meta">
          <span className="tarjeta-oferta__meta-dato">
            <Icono nombre="mapa" tamano={13} />
            {territorio}
          </span>
          <span className="tarjeta-oferta__meta-dato">
            <Icono nombre="organizacion" tamano={13} />
            {t(`actor.${oferta.tipoActor}`)}
          </span>
        </p>

        <dl className="tarjeta-oferta__datos">
          {esPublico("disponibilidad") ? (
            <div>
              <dt>{t("vitrina.tarjeta.disponibilidad")}</dt>
              <dd>
                <span className="tarjeta-oferta__punto" aria-hidden="true" />
                {t(`disponibilidad.${oferta.disponibilidad}`)}
              </dd>
            </div>
          ) : null}
          {esPublico("publicada") ? (
            <div>
              <dt>{t("vitrina.tarjeta.publicada")}</dt>
              <dd className="mono">{fecha(oferta.publicada, locale)}</dd>
            </div>
          ) : null}
        </dl>

        {esPublico("certificaciones") && oferta.certificaciones.length > 0 ? (
          <p className="tarjeta-oferta__atestaciones">
            <Icono nombre="documento" tamano={13} />
            {t("vitrina.tarjeta.atestaciones", { conteo: oferta.certificaciones.length })}
          </p>
        ) : null}
      </div>

      <div className="tarjeta-oferta__acciones">
        <Link className="boton boton--fantasma boton--sm" to={`/vitrina/${oferta.id}`}>
          {t("vitrina.tarjeta.ver")}
        </Link>
        <button
          type="button"
          className="boton boton--primario boton--sm"
          onClick={() => onManifestarInteres(oferta)}
        >
          {t("vitrina.tarjeta.interes")}
        </button>
      </div>
    </article>
  );
};
