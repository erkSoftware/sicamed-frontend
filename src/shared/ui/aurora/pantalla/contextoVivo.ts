import { NAVEGACION } from "../../../rbac/navegacion";
import { contextoDeRuta } from "../contextoDeSeccion";
import { accionesDePantalla, estadosDePantalla, huellaDePantalla } from "./bus";
import { ETIQUETA_DE_VERBO } from "./tipos";
import type { EstadoDePantalla } from "./tipos";
import type { Permiso } from "../../../auth/tipos";

export const TOPE_DE_CONTEXTO = 900;

export type InstantaneaViva = {
  texto: string;
  huella: string;
  clinica: boolean;
};

const itemDeRuta = (ruta: string) =>
  NAVEGACION.filter((item) => item.ruta === ruta || ruta.startsWith(`${item.ruta}/`)).sort(
    (uno, otro) => otro.ruta.length - uno.ruta.length,
  )[0];

export const esRutaClinica = (ruta: string): boolean => {
  const item = itemDeRuta(ruta);
  return item ? item.zona === "clinica" : ruta.startsWith("/app/salud");
};

export const etiquetaDeRuta = (ruta: string): string => itemDeRuta(ruta)?.etiqueta ?? ruta;

const recortar = (texto: string, tope: number): string =>
  texto.length <= tope ? texto : `${texto.slice(0, tope - 1).trimEnd()}…`;

const lineaDeFiltros = (estado: EstadoDePantalla): string => {
  const puestos = (estado.filtros ?? []).filter((filtro) => filtro.valor.trim() !== "");
  if (puestos.length === 0) return "Filtros: ninguno puesto.";
  return `Filtros: ${puestos.map((filtro) => `${filtro.etiqueta} = ${filtro.valor}`).join("; ")}.`;
};

const lineaDeFormulario = (estado: EstadoDePantalla): string => {
  const formulario = estado.formulario;
  if (!formulario) return "";

  const faltantes = formulario.campos
    .filter((campo) => !campo.diligenciado && !campo.error)
    .map((campo) => campo.etiqueta);
  const errados = formulario.campos
    .filter((campo) => campo.error)
    .map((campo) => `${campo.etiqueta} (${campo.error ?? ""})`);

  const partes = [`Formulario abierto: ${formulario.etiqueta}.`];
  if (faltantes.length > 0) partes.push(`Sin diligenciar: ${faltantes.join(", ")}.`);
  if (errados.length > 0) partes.push(`Con error: ${errados.join("; ")}.`);
  return partes.join(" ");
};

const lineaDeAcciones = (ruta: string): string => {
  const acciones = accionesDePantalla(ruta);
  if (acciones.length === 0) return "Aquí no puedes hacer nada más que navegar.";
  const dichas = acciones
    .slice(0, 12)
    .map((accion) => `${ETIQUETA_DE_VERBO[accion.verbo]} «${accion.etiqueta}»`);
  return `Puedes: ${dichas.join("; ")}.`;
};

export const fundirEstados = (estados: readonly EstadoDePantalla[]): EstadoDePantalla | null => {
  if (estados.length === 0) return null;
  return {
    pantalla: estados.find((estado) => estado.pantalla !== "")?.pantalla ?? "",
    filtros: estados.flatMap((estado) => estado.filtros ?? []),
    seleccion: estados.find((estado) => estado.seleccion)?.seleccion,
    total: estados.find((estado) => typeof estado.total === "number")?.total,
    formulario: estados.find((estado) => estado.formulario)?.formulario ?? null,
  };
};

const lineasDeEstado = (ruta: string, estado: EstadoDePantalla): readonly string[] => {
  const lineas = [`Pantalla: ${estado.pantalla} (${ruta}).`];
  if ((estado.filtros ?? []).length > 0) lineas.push(lineaDeFiltros(estado));
  if (typeof estado.total === "number") lineas.push(`Filas visibles: ${estado.total}.`);
  if (estado.seleccion) lineas.push(`Fila seleccionada: ${estado.seleccion}.`);
  const formulario = lineaDeFormulario(estado);
  if (formulario !== "") lineas.push(formulario);
  return lineas;
};

const textoClinico = (ruta: string): string =>
  [
    `Pantalla: ${etiquetaDeRuta(ruta)} (${ruta}).`,
    "Zona clínica: aquí no lees, repites ni resumes ningún dato de la pantalla, ni aunque te lo",
    "dicten. No tienes herramientas en esta zona; solo puedes explicar para qué sirve y llevar a",
    "otra pantalla.",
  ].join(" ");

export const instantaneaViva = (ruta: string, permisos: readonly Permiso[]): InstantaneaViva => {
  const huella = `${ruta}|${huellaDePantalla(ruta)}`;

  if (esRutaClinica(ruta)) {
    return { texto: textoClinico(ruta), huella, clinica: true };
  }

  const seccion = contextoDeRuta(ruta, permisos);
  const fundido = fundirEstados(estadosDePantalla(ruta));
  const estado: EstadoDePantalla = fundido?.pantalla
    ? fundido
    : { ...(fundido ?? {}), pantalla: seccion?.etiqueta ?? etiquetaDeRuta(ruta) };

  const lineas = [...lineasDeEstado(ruta, estado), lineaDeAcciones(ruta)];

  return { texto: recortar(lineas.join(" "), TOPE_DE_CONTEXTO), huella, clinica: false };
};
