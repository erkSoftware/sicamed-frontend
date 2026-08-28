import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";

export type FichaActiva = { clave: string; etiqueta: string };

type Props = {
  fichas: readonly FichaActiva[];
  onQuitar: (clave: string) => void;
  onLimpiar: () => void;
};

export const FichasFiltro = ({ fichas, onQuitar, onLimpiar }: Props) => {
  const { t } = useTraduccion();
  if (fichas.length === 0) return null;

  return (
    <ul className="fichas-activas" aria-label={t("vitrina.filtros.activos")}>
      {fichas.map((ficha) => (
        <li key={ficha.clave}>
          <button
            type="button"
            className="ficha-filtro"
            onClick={() => onQuitar(ficha.clave)}
            aria-label={t("vitrina.filtros.quitar", { valor: ficha.etiqueta })}
          >
            {ficha.etiqueta}
            <Icono nombre="cerrar" tamano={11} />
          </button>
        </li>
      ))}
      <li>
        <button type="button" className="ficha-filtro ficha-filtro--limpiar" onClick={onLimpiar}>
          {t("vitrina.filtros.limpiar")}
        </button>
      </li>
    </ul>
  );
};
