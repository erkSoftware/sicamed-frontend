import { useState } from "react";
import { normalizar } from "../../../i18n/formato";
import { usePantallaDeAurora } from "./usePantallaDeAurora";
import { senalarElemento } from "./senalar";
import type { AccionDePantalla, EstadoDePantalla, FiltroVivo, ResultadoAccion } from "./tipos";
import type { Columna } from "../../primitivos/Tabla";

export type OpcionSeleccionable = {
  valor: string;
  etiqueta: string;
};

export type FiltroDeAurora = {
  clave: string;
  etiqueta: string;
  valor: string;
  opciones: readonly OpcionSeleccionable[];
  onCambiar: (valor: string) => void;
};

export type TablaDeAurora<T> = {
  pantalla: string;
  etiquetaFila?: (fila: T) => string;
  onSeleccionar?: (fila: T) => void;
};

export type EntradaDeTabla<T> = {
  anclaje: string;
  columnas: readonly Columna<T>[];
  filas: readonly T[];
  claveFila: (fila: T) => string;
  etiquetaPlural: string;
  total?: number;
  busqueda: FiltroDeAurora;
  filtros: readonly FiltroDeAurora[];
  aurora?: TablaDeAurora<T>;
};

const SIN_OPCION = "no reconocí esa opción";

const dentroDelAnclaje = (anclaje: string, selector: string): Element | null =>
  document.getElementById(anclaje)?.querySelector(selector) ?? null;

const opcionQueCoincide = (
  opciones: readonly OpcionSeleccionable[],
  dicho: string,
): OpcionSeleccionable | undefined => {
  const buscado = normalizar(dicho).trim();
  if (buscado === "") return undefined;
  return (
    opciones.find((opcion) => normalizar(opcion.etiqueta) === buscado) ??
    opciones.find((opcion) => normalizar(opcion.valor) === buscado) ??
    (buscado.length >= 4
      ? opciones.find((opcion) => normalizar(opcion.etiqueta).includes(buscado))
      : undefined)
  );
};

const etiquetaVigente = (filtro: FiltroDeAurora): string =>
  filtro.opciones.find((opcion) => opcion.valor === filtro.valor)?.etiqueta ?? filtro.valor;

const accionDeFiltro = (filtro: FiltroDeAurora): AccionDePantalla => ({
  verbo: "aplicar-filtro",
  objetivo: filtro.clave,
  etiqueta: filtro.etiqueta,
  valores: filtro.opciones.map((opcion) => opcion.etiqueta),
  ejecutar: ({ valor }): ResultadoAccion => {
    const anterior = filtro.valor;
    if (valor.trim() === "") {
      filtro.onCambiar("");
      return {
        ok: true,
        detalle: `${filtro.etiqueta}: sin filtro`,
        deshacer: () => filtro.onCambiar(anterior),
      };
    }

    const opcion = opcionQueCoincide(filtro.opciones, valor);
    if (!opcion) {
      return {
        ok: false,
        motivo: SIN_OPCION,
        valores: filtro.opciones.map((disponible) => disponible.etiqueta),
      };
    }

    filtro.onCambiar(opcion.valor);
    return {
      ok: true,
      detalle: `${filtro.etiqueta}: ${opcion.etiqueta}`,
      deshacer: () => filtro.onCambiar(anterior),
    };
  },
});

const accionDeBusqueda = (busqueda: FiltroDeAurora): AccionDePantalla => ({
  verbo: "aplicar-filtro",
  objetivo: "busqueda",
  etiqueta: busqueda.etiqueta,
  sinonimos: ["buscar", "búsqueda", "texto", "search"],
  ejecutar: ({ valor }): ResultadoAccion => {
    const anterior = busqueda.valor;
    busqueda.onCambiar(valor);
    return {
      ok: true,
      detalle: valor === "" ? "Búsqueda vaciada" : `Busqué «${valor}»`,
      deshacer: () => busqueda.onCambiar(anterior),
    };
  },
});

const accionDeColumna = <T>(anclaje: string, columna: Columna<T>): AccionDePantalla => ({
  verbo: "senalar-campo",
  objetivo: columna.clave,
  etiqueta: columna.encabezado,
  ejecutar: (): ResultadoAccion =>
    senalarElemento(dentroDelAnclaje(anclaje, `th[data-columna="${columna.clave}"]`))
      ? { ok: true, detalle: `Señalé la columna ${columna.encabezado}` }
      : { ok: false, motivo: "esa columna no está a la vista" },
});

const accionDeFila = <T>(
  anclaje: string,
  entrada: EntradaDeTabla<T>,
  aurora: TablaDeAurora<T>,
  anotarSeleccion: (etiqueta: string) => void,
): AccionDePantalla => {
  const rotular = aurora.etiquetaFila ?? entrada.claveFila;
  return {
    verbo: "seleccionar-fila",
    objetivo: "fila",
    etiqueta: entrada.etiquetaPlural,
    valores: entrada.filas.map(rotular),
    ejecutar: ({ valor }): ResultadoAccion => {
      const buscado = normalizar(valor).trim();
      const fila =
        buscado === ""
          ? undefined
          : (entrada.filas.find((candidata) => normalizar(rotular(candidata)) === buscado) ??
            entrada.filas.find((candidata) => normalizar(rotular(candidata)).includes(buscado)));

      if (!fila) {
        return {
          ok: false,
          motivo: buscado === "" ? "no dijiste cuál" : `no veo «${valor}» en el listado`,
          valores: entrada.filas.slice(0, 8).map(rotular),
        };
      }

      senalarElemento(dentroDelAnclaje(anclaje, `tr[data-fila="${entrada.claveFila(fila)}"]`));
      aurora.onSeleccionar?.(fila);
      anotarSeleccion(rotular(fila));
      return { ok: true, detalle: `Seleccioné ${rotular(fila)}` };
    },
  };
};

const filtrosVivos = (entrada: EntradaDeTabla<unknown>): readonly FiltroVivo[] => {
  const puestos = entrada.filtros
    .filter((filtro) => filtro.valor !== "")
    .map((filtro) => ({ etiqueta: filtro.etiqueta, valor: etiquetaVigente(filtro) }));
  return entrada.busqueda.valor.trim() === ""
    ? puestos
    : [...puestos, { etiqueta: entrada.busqueda.etiqueta, valor: entrada.busqueda.valor }];
};

export const useTablaDeAurora = <T>(entrada: EntradaDeTabla<T>): void => {
  const aurora = entrada.aurora;
  const [seleccion, fijarSeleccion] = useState("");
  const rotularFila = aurora?.etiquetaFila ?? entrada.claveFila;
  const sigueVisible =
    seleccion !== "" && entrada.filas.some((fila) => rotularFila(fila) === seleccion);

  const estado: EstadoDePantalla | null = aurora
    ? {
        pantalla: aurora.pantalla,
        filtros: filtrosVivos(entrada as EntradaDeTabla<unknown>),
        total: entrada.total ?? entrada.filas.length,
        ...(sigueVisible ? { seleccion } : {}),
      }
    : null;

  const acciones: readonly AccionDePantalla[] = aurora
    ? [
        accionDeBusqueda(entrada.busqueda),
        ...entrada.filtros.map(accionDeFiltro),
        ...entrada.columnas.map((columna) => accionDeColumna(entrada.anclaje, columna)),
        accionDeFila(entrada.anclaje, entrada, aurora, fijarSeleccion),
      ]
    : [];

  usePantallaDeAurora(estado, acciones);
};
