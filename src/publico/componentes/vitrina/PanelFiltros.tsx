import { useEffect, useRef } from "react";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";
import { numero } from "../../../shared/i18n/formato";
import { TIPOS_PRODUCTO } from "../../../shared/api/mock/catalogos";
import type { FacetasVitrina } from "../../../shared/api/mock/servidorMock";

export const TIPOS_ACTOR_PUBLICOS = [
  "CULTIVADOR",
  "TRANSFORMADOR",
  "DISPENSADOR",
  "LABORATORIO",
] as const;

export const DISPONIBILIDADES_PUBLICAS = ["INMEDIATA", "PROGRAMADA", "POR_CAMPAÑA"] as const;

export type ClaveFiltro = "producto" | "departamento" | "actor" | "disponibilidad";

type Opcion = { valor: string; etiqueta: string; conteo: number };

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  facetas: FacetasVitrina;
  seleccion: Readonly<Record<ClaveFiltro, string>>;
  onCambiar: (clave: ClaveFiltro, valor: string) => void;
  onLimpiar: () => void;
  conteoResultados: number;
  departamentosDisponibles: readonly string[];
};

const Grupo = ({
  titulo,
  clave,
  opciones,
  seleccionado,
  onCambiar,
  desplazable,
}: {
  titulo: string;
  clave: ClaveFiltro;
  opciones: readonly Opcion[];
  seleccionado: string;
  onCambiar: (clave: ClaveFiltro, valor: string) => void;
  desplazable?: boolean;
}) => {
  const { t, locale } = useTraduccion();
  const total = opciones.reduce((suma, opcion) => suma + opcion.conteo, 0);

  return (
    <fieldset className="grupo-filtro">
      <legend className="grupo-filtro__titulo rotulo">{titulo}</legend>
      <div
        className={
          desplazable ? "grupo-filtro__lista grupo-filtro__lista--alta" : "grupo-filtro__lista"
        }
      >
        <label className="opcion-filtro">
          <input
            type="radio"
            name={`filtro-${clave}`}
            value=""
            checked={seleccionado === ""}
            onChange={() => onCambiar(clave, "")}
          />
          <span className="opcion-filtro__etiqueta">{t("vitrina.filtros.todos")}</span>
          <span className="opcion-filtro__conteo mono">{numero(total, locale)}</span>
        </label>
        {opciones.map((opcion) => (
          <label className="opcion-filtro" key={opcion.valor}>
            <input
              type="radio"
              name={`filtro-${clave}`}
              value={opcion.valor}
              checked={seleccionado === opcion.valor}
              onChange={() => onCambiar(clave, opcion.valor)}
            />
            <span className="opcion-filtro__etiqueta">{opcion.etiqueta}</span>
            <span className="opcion-filtro__conteo mono">{numero(opcion.conteo, locale)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export const PanelFiltros = ({
  abierto,
  onCerrar,
  facetas,
  seleccion,
  onCambiar,
  onLimpiar,
  conteoResultados,
  departamentosDisponibles,
}: Props) => {
  const { t, locale } = useTraduccion();
  const referencia = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return;
    if (abierto && !elemento.open) elemento.showModal();
    if (!abierto && elemento.open) elemento.close();
  }, [abierto]);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return undefined;
    const cancelar = (evento: Event) => {
      evento.preventDefault();
      onCerrar();
    };
    elemento.addEventListener("cancel", cancelar);
    return () => elemento.removeEventListener("cancel", cancelar);
  }, [onCerrar]);

  const productos: readonly Opcion[] = TIPOS_PRODUCTO.filter(
    (tipo) => (facetas.tipoProducto[tipo] ?? 0) > 0,
  ).map((tipo) => ({
    valor: tipo,
    etiqueta: t(`producto.${tipo}`),
    conteo: facetas.tipoProducto[tipo] ?? 0,
  }));

  const departamentos: readonly Opcion[] = departamentosDisponibles
    .filter((nombre) => (facetas.departamento[nombre] ?? 0) > 0)
    .map((nombre) => ({
      valor: nombre,
      etiqueta: nombre,
      conteo: facetas.departamento[nombre] ?? 0,
    }));

  const actores: readonly Opcion[] = TIPOS_ACTOR_PUBLICOS.filter(
    (tipo) => (facetas.tipoActor[tipo] ?? 0) > 0,
  ).map((tipo) => ({
    valor: tipo,
    etiqueta: t(`actor.${tipo}`),
    conteo: facetas.tipoActor[tipo] ?? 0,
  }));

  const disponibilidades: readonly Opcion[] = DISPONIBILIDADES_PUBLICAS.filter(
    (tipo) => (facetas.disponibilidad[tipo] ?? 0) > 0,
  ).map((tipo) => ({
    valor: tipo,
    etiqueta: t(`disponibilidad.${tipo}`),
    conteo: facetas.disponibilidad[tipo] ?? 0,
  }));

  return (
    <dialog ref={referencia} className="cajon" aria-label={t("vitrina.filtros.titulo")}>
      <div className="cajon__encabezado">
        <div>
          <p className="cajon__titulo">{t("vitrina.filtros.titulo")}</p>
          <p className="cajon__entrada">{t("vitrina.filtros.entrada")}</p>
        </div>
        <button
          type="button"
          className="cajon__cerrar"
          onClick={onCerrar}
          aria-label={t("vitrina.filtros.cerrar")}
        >
          <Icono nombre="cerrar" tamano={16} />
        </button>
      </div>

      <div className="cajon__cuerpo">
        <Grupo
          titulo={t("vitrina.filtros.grupo.producto")}
          clave="producto"
          opciones={productos}
          seleccionado={seleccion.producto}
          onCambiar={onCambiar}
        />
        <Grupo
          titulo={t("vitrina.filtros.grupo.territorio")}
          clave="departamento"
          opciones={departamentos}
          seleccionado={seleccion.departamento}
          onCambiar={onCambiar}
          desplazable
        />
        <Grupo
          titulo={t("vitrina.filtros.grupo.actor")}
          clave="actor"
          opciones={actores}
          seleccionado={seleccion.actor}
          onCambiar={onCambiar}
        />
        <Grupo
          titulo={t("vitrina.filtros.grupo.disponibilidad")}
          clave="disponibilidad"
          opciones={disponibilidades}
          seleccionado={seleccion.disponibilidad}
          onCambiar={onCambiar}
        />
      </div>

      <div className="cajon__pie">
        <button type="button" className="boton boton--fantasma boton--sm" onClick={onLimpiar}>
          {t("vitrina.filtros.limpiar")}
        </button>
        <button type="button" className="boton boton--primario boton--sm" onClick={onCerrar}>
          {t("vitrina.filtros.ver", { conteo: numero(conteoResultados, locale) })}
        </button>
      </div>
    </dialog>
  );
};
