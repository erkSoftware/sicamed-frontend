import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";

export type ModoVitrina = "buscador" | "resultados";

type Props = {
  modo: ModoVitrina;
  total: number;
  onCambiar: (modo: ModoVitrina) => void;
};

export const AlternadorVitrina = ({ modo, total, onCambiar }: Props) => {
  const { t } = useTraduccion();

  return (
    <div className="alternador" role="group" aria-label={t("vitrina.mando.etiqueta")}>
      <span className="alternador__marca" aria-hidden="true" data-modo={modo} />
      <button
        type="button"
        className="alternador__opcion"
        aria-pressed={modo === "buscador"}
        onClick={() => onCambiar("buscador")}
      >
        <Icono nombre="buscar" tamano={14} />
        {t("vitrina.mando.buscador")}
      </button>
      <button
        type="button"
        className="alternador__opcion"
        aria-pressed={modo === "resultados"}
        onClick={() => onCambiar("resultados")}
      >
        <Icono nombre="capas" tamano={14} />
        {t("vitrina.mando.resultados")}
        <span className="alternador__conteo mono">{total}</span>
      </button>
    </div>
  );
};
