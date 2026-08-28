import { useId } from "react";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";

export const TAMANOS_PAGINA = [12, 24, 48] as const;

type Props = {
  desde: number;
  hasta: number;
  total: number;
  limite: number;
  cursorAnterior: string | null;
  cursorSiguiente: string | null;
  onNavegar: (cursor: string | null) => void;
  onCambiarLimite: (limite: number) => void;
};

export const PaginacionCursor = ({
  desde,
  hasta,
  total,
  limite,
  cursorAnterior,
  cursorSiguiente,
  onNavegar,
  onCambiarLimite,
}: Props) => {
  const { t } = useTraduccion();
  const identificador = useId();

  return (
    <nav className="paginacion-mercado" aria-label={t("vitrina.paginacion.etiqueta")}>
      <p className="paginacion-mercado__conteo" aria-live="polite">
        {t("vitrina.resultados.pagina", { desde, hasta })} ·{" "}
        {t("vitrina.resultados.conteo", { conteo: total })}
      </p>

      <div className="paginacion-mercado__controles">
        <label className="control-mercado__rotulo rotulo" htmlFor={identificador}>
          {t("vitrina.paginacion.porPagina")}
        </label>
        <select
          id={identificador}
          className="control-mercado__selector"
          value={limite}
          onChange={(evento) => onCambiarLimite(Number(evento.target.value))}
        >
          {TAMANOS_PAGINA.map((tamano) => (
            <option key={tamano} value={tamano}>
              {tamano}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="boton boton--fantasma boton--sm"
          disabled={desde <= 1}
          onClick={() => onNavegar(cursorAnterior)}
        >
          <Icono nombre="chevron" tamano={14} />
          {t("vitrina.paginacion.anterior")}
        </button>
        <button
          type="button"
          className="boton boton--fantasma boton--sm"
          disabled={cursorSiguiente === null}
          onClick={() => onNavegar(cursorSiguiente)}
        >
          {t("vitrina.paginacion.siguiente")}
          <Icono nombre="flecha" tamano={14} />
        </button>
      </div>
    </nav>
  );
};
