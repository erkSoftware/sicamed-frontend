import { Icono } from "../../../shared/ui/primitivos/Icono";
import type { NombreIcono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";
import { SelectorIdioma } from "../../../shared/i18n/SelectorIdioma";
import { fecha } from "../../../shared/i18n/formato";
import { AvisoClasificacion } from "./AvisoClasificacion";

const RAZONES: readonly { clave: string; icono: NombreIcono }[] = [
  { clave: "franja", icono: "hoja" },
  { clave: "marco", icono: "licencias" },
  { clave: "habilitacion", icono: "escudo" },
  { clave: "abierta", icono: "mundo" },
];

type Props = {
  actualizacion: string;
};

export const RazonesVitrina = ({ actualizacion }: Props) => {
  const { t, locale } = useTraduccion();

  return (
    <div className="contenedor contenedor--mercado">
      <section className="razones" aria-label={t("vitrina.razones.titulo")}>
        <p className="razones__titulo rotulo">{t("vitrina.razones.titulo")}</p>
        <ul className="razones__lista">
          {RAZONES.map((razon) => (
            <li key={razon.clave}>
              <span className="razones__icono" aria-hidden="true">
                <Icono nombre={razon.icono} tamano={16} />
              </span>
              <span className="razones__nombre">{t(`vitrina.razones.${razon.clave}`)}</span>
              <span className="razones__detalle">{t(`vitrina.razones.${razon.clave}Detalle`)}</span>
            </li>
          ))}
        </ul>
        <div className="razones__pie">
          {fecha(actualizacion, locale) ? (
            <p className="mercado__actualizacion mono">
              {t("vitrina.hero.actualizacion")} · {fecha(actualizacion, locale)}
            </p>
          ) : null}
          <AvisoClasificacion />
          <SelectorIdioma />
        </div>
      </section>
    </div>
  );
};
