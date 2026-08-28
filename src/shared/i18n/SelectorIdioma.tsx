import { IDIOMAS } from "./idioma";
import { useTraduccion } from "./ProveedorIdioma";

export const SelectorIdioma = () => {
  const { idioma, cambiarIdioma, t } = useTraduccion();

  return (
    <div className="selector-idioma" role="group" aria-label={t("idioma.selector")}>
      {IDIOMAS.map((definicion) => (
        <button
          key={definicion.codigo}
          type="button"
          className="selector-idioma__opcion mono"
          aria-pressed={idioma === definicion.codigo}
          lang={definicion.codigo}
          onClick={() => cambiarIdioma(definicion.codigo)}
        >
          <span aria-hidden="true">{definicion.etiquetaCorta}</span>
          <span className="solo-lectores">{definicion.etiqueta}</span>
        </button>
      ))}
    </div>
  );
};
