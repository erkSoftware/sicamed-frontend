import { useId } from "react";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";
import type { OrdenVitrina } from "../../../shared/api/mock/servidorMock";

export type Vista = "rejilla" | "lista";

const ORDENES: readonly { valor: OrdenVitrina; clave: string }[] = [
  { valor: "RECIENTES", clave: "vitrina.orden.recientes" },
  { valor: "TERRITORIO", clave: "vitrina.orden.territorio" },
  { valor: "PRODUCTO", clave: "vitrina.orden.producto" },
];

export const SelectorOrden = ({
  valor,
  onCambiar,
}: {
  valor: OrdenVitrina;
  onCambiar: (orden: OrdenVitrina) => void;
}) => {
  const { t } = useTraduccion();
  const identificador = useId();

  return (
    <div className="control-mercado">
      <label className="control-mercado__rotulo rotulo" htmlFor={identificador}>
        {t("vitrina.orden.etiqueta")}
      </label>
      <select
        id={identificador}
        className="control-mercado__selector"
        value={valor}
        onChange={(evento) => onCambiar(evento.target.value as OrdenVitrina)}
      >
        {ORDENES.map((orden) => (
          <option key={orden.valor} value={orden.valor}>
            {t(orden.clave)}
          </option>
        ))}
      </select>
    </div>
  );
};

export const SelectorVista = ({
  valor,
  onCambiar,
}: {
  valor: Vista;
  onCambiar: (vista: Vista) => void;
}) => {
  const { t } = useTraduccion();

  return (
    <div className="selector-vista" role="group" aria-label={t("vitrina.vista.etiqueta")}>
      <button
        type="button"
        className="selector-vista__opcion"
        aria-label={t("vitrina.vista.rejilla")}
        aria-pressed={valor === "rejilla"}
        onClick={() => onCambiar("rejilla")}
      >
        <Icono nombre="capas" tamano={15} />
        <span className="selector-vista__texto">{t("vitrina.vista.rejilla")}</span>
      </button>
      <button
        type="button"
        className="selector-vista__opcion"
        aria-label={t("vitrina.vista.lista")}
        aria-pressed={valor === "lista"}
        onClick={() => onCambiar("lista")}
      >
        <Icono nombre="menu" tamano={15} />
        <span className="selector-vista__texto">{t("vitrina.vista.lista")}</span>
      </button>
    </div>
  );
};
