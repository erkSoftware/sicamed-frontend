import { useId } from "react";
import type { ReactNode } from "react";
import { Buscador } from "./Buscador";
import { GrupoFiltros } from "./GrupoFiltros";
import { EstadoConsulta } from "./EstadoConsulta";
import { Paginacion } from "./Paginacion";
import { Tabla } from "../primitivos/Tabla";
import type { Columna } from "../primitivos/Tabla";
import { Tarjeta } from "../primitivos/Tarjeta";
import { CampoSelect } from "../primitivos/Campo";
import { useTablaDeAurora } from "../aurora/pantalla/useTablaDeAurora";
import type { FiltroDeAurora, TablaDeAurora } from "../aurora/pantalla/useTablaDeAurora";

export type FiltroSelector = {
  clave: string;
  etiqueta: string;
  valor: string;
  opciones: readonly { valor: string; etiqueta: string }[];
  onCambiar: (valor: string) => void;
};

type Props<T> = {
  descripcion: string;
  columnas: readonly Columna<T>[];
  claveFila: (fila: T) => string;
  consulta: {
    isLoading: boolean;
    error: unknown;
    refetch: () => unknown;
    data?: { datos: readonly T[]; total: number; pagina: number; porPagina: number };
  };
  busqueda: string;
  onBusqueda: (valor: string) => void;
  etiquetaBusqueda: string;
  marcadorBusqueda?: string;
  segmentos?: {
    etiqueta: string;
    valor: string;
    opciones: readonly { valor: string; etiqueta: string }[];
    onCambiar: (valor: string) => void;
  };
  selectores?: readonly FiltroSelector[];
  onPagina: (pagina: number) => void;
  etiquetaPlural: string;
  vacio: ReactNode;
  aurora?: TablaDeAurora<T>;
};

export const TablaConFiltros = <T,>({
  descripcion,
  columnas,
  claveFila,
  consulta,
  busqueda,
  onBusqueda,
  etiquetaBusqueda,
  marcadorBusqueda,
  segmentos,
  selectores,
  onPagina,
  etiquetaPlural,
  vacio,
  aurora,
}: Props<T>) => {
  const anclaje = useId().replace(/:/gu, "");
  const filas = consulta.data?.datos ?? [];

  useTablaDeAurora({
    anclaje,
    columnas,
    filas,
    claveFila,
    etiquetaPlural,
    total: consulta.data?.total,
    busqueda: {
      clave: "busqueda",
      etiqueta: etiquetaBusqueda,
      valor: busqueda,
      opciones: [],
      onCambiar: onBusqueda,
    },
    filtros: [
      ...(segmentos
        ? [
            {
              clave: "segmento",
              etiqueta: segmentos.etiqueta,
              valor: segmentos.valor,
              opciones: segmentos.opciones,
              onCambiar: segmentos.onCambiar,
            } satisfies FiltroDeAurora,
          ]
        : []),
      ...(selectores ?? []).map(
        (selector) =>
          ({
            clave: selector.clave,
            etiqueta: selector.etiqueta,
            valor: selector.valor,
            opciones: selector.opciones,
            onCambiar: selector.onCambiar,
          }) satisfies FiltroDeAurora,
      ),
    ],
    aurora,
  });

  return (
    <Tarjeta id={anclaje} sinRelleno>
      <div
        className="fila"
        style={{ gap: "var(--e3)", padding: "var(--e4)", flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <Buscador
          valor={busqueda}
          onCambiar={onBusqueda}
          etiqueta={etiquetaBusqueda}
          marcador={marcadorBusqueda}
        />
        {segmentos ? (
          <GrupoFiltros
            etiqueta={segmentos.etiqueta}
            opciones={segmentos.opciones}
            valor={segmentos.valor}
            onCambiar={segmentos.onCambiar}
          />
        ) : null}
        {selectores?.map((selector) => (
          <CampoSelect
            key={selector.clave}
            etiqueta={selector.etiqueta}
            value={selector.valor}
            vacio="Todos"
            opciones={selector.opciones}
            onChange={(evento) => selector.onCambiar(evento.target.value)}
            className="campo--filtro"
          />
        ))}
      </div>

      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
        esqueleto={
          <Tabla
            descripcion={descripcion}
            columnas={columnas}
            filas={[]}
            claveFila={claveFila}
            cargando
          />
        }
      >
        <Tabla
          descripcion={descripcion}
          columnas={columnas}
          filas={filas}
          claveFila={claveFila}
          vacio={vacio}
        />
        {consulta.data && consulta.data.total > 0 ? (
          <Paginacion
            pagina={consulta.data.pagina}
            porPagina={consulta.data.porPagina}
            total={consulta.data.total}
            onCambiar={onPagina}
            etiqueta={etiquetaPlural}
          />
        ) : null}
      </EstadoConsulta>
    </Tarjeta>
  );
};
