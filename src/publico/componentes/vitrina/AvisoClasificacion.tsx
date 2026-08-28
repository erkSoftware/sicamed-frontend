import { Link } from "react-router-dom";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";

export const AvisoClasificacion = () => {
  const { t } = useTraduccion();

  const niveles = [
    {
      clave: "publico",
      icono: "mundo" as const,
      titulo: t("vitrina.clasificacion.publico"),
      detalle: t("vitrina.clasificacion.publicoDetalle"),
    },
    {
      clave: "reservado",
      icono: "candado" as const,
      titulo: t("vitrina.clasificacion.reservado"),
      detalle: t("vitrina.clasificacion.reservadoDetalle"),
    },
    {
      clave: "fuera",
      icono: "escudo" as const,
      titulo: t("vitrina.clasificacion.fuera"),
      detalle: t("vitrina.clasificacion.fueraDetalle"),
    },
  ];

  return (
    <details className="clasificacion">
      <summary className="clasificacion__disparador">
        <Icono nombre="escudo" tamano={14} />
        {t("vitrina.clasificacion.abrir")}
      </summary>
      <div className="clasificacion__panel">
        <p className="clasificacion__titulo">{t("vitrina.clasificacion.titulo")}</p>
        <dl className="clasificacion__niveles">
          {niveles.map((nivel) => (
            <div key={nivel.clave} data-nivel={nivel.clave}>
              <dt>
                <Icono nombre={nivel.icono} tamano={13} />
                {nivel.titulo}
              </dt>
              <dd>{nivel.detalle}</dd>
            </div>
          ))}
        </dl>
        <p className="clasificacion__norma mono">{t("vitrina.clasificacion.norma")}</p>
        <Link to="/transparencia" className="clasificacion__enlace">
          {t("vitrina.clasificacion.enlace")}
          <Icono nombre="flecha" tamano={13} />
        </Link>
      </div>
    </details>
  );
};
