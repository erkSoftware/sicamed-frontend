import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";

export const CabezaPortal = () => {
  const { t } = useTraduccion();

  return (
    <div className="portal__cabeza">
      <div className="portal__cabeza-interior">
        <h1 className="portal__titulo">{t("vitrina.hero.titulo")}</h1>
        <p className="portal__promesa">{t("vitrina.hero.promesa")}</p>
      </div>
    </div>
  );
};
