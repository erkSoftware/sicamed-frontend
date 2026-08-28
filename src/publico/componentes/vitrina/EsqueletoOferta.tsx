import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";

export const EsqueletoOferta = () => (
  <div className="tarjeta-oferta tarjeta-oferta--esqueleto" aria-hidden="true">
    <div className="tarjeta-oferta__visual esqueleto" />
    <div className="tarjeta-oferta__cuerpo">
      <span className="esqueleto esqueleto--linea esqueleto--titulo" />
      <span className="esqueleto esqueleto--linea esqueleto--media" />
      <span className="esqueleto esqueleto--linea esqueleto--corta" />
      <span className="esqueleto esqueleto--bloque" />
    </div>
    <div className="tarjeta-oferta__acciones">
      <span className="esqueleto esqueleto--boton" />
      <span className="esqueleto esqueleto--boton" />
    </div>
  </div>
);

export const RejillaEsqueleto = ({ cantidad }: { cantidad: number }) => {
  const { t } = useTraduccion();
  return (
    <div className="mercado__rejilla" role="status" aria-label={t("vitrina.resultados.cargando")}>
      {Array.from({ length: cantidad }, (_, indice) => (
        <EsqueletoOferta key={indice} />
      ))}
    </div>
  );
};
