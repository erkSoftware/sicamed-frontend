import { en } from "./diccionarios/en";
import { es, type ClaveTraduccion } from "./diccionarios/es";

export type CodigoIdioma = "es" | "en";

export type DefinicionIdioma = {
  codigo: CodigoIdioma;
  locale: string;
  etiqueta: string;
  etiquetaCorta: string;
};

export const IDIOMAS: readonly DefinicionIdioma[] = [
  { codigo: "es", locale: "es-CO", etiqueta: "Español", etiquetaCorta: "ES" },
  { codigo: "en", locale: "en", etiqueta: "English", etiquetaCorta: "EN" },
];

export const IDIOMA_POR_DEFECTO: CodigoIdioma = "es";

export const CLAVE_ALMACENAMIENTO_IDIOMA = "sicamed.idioma";

const DICCIONARIOS: Record<CodigoIdioma, Record<ClaveTraduccion, string>> = {
  es,
  en,
};

export const definicionIdioma = (codigo: CodigoIdioma): DefinicionIdioma =>
  IDIOMAS.find((idioma) => idioma.codigo === codigo) ?? IDIOMAS[0]!;

export const esCodigoIdioma = (valor: string | null | undefined): valor is CodigoIdioma =>
  IDIOMAS.some((idioma) => idioma.codigo === valor);

export type ValoresTraduccion = Record<string, string | number>;

const interpolar = (
  plantilla: string,
  valores: ValoresTraduccion | undefined,
  locale: string,
): string => {
  if (!valores) return plantilla;
  return plantilla.replace(/\{(\w+)\}/g, (coincidencia, clave: string) => {
    const valor = valores[clave];
    if (valor === undefined) return coincidencia;
    return typeof valor === "number" ? new Intl.NumberFormat(locale).format(valor) : valor;
  });
};

const claveConPlural = (
  diccionario: Record<string, string>,
  clave: string,
  locale: string,
  conteo: number,
): string => {
  const categoria = new Intl.PluralRules(locale).select(conteo);
  const sufijo = categoria === "one" ? "_uno" : "_otro";
  const candidata = `${clave}${sufijo}`;
  if (candidata in diccionario) return candidata;
  const respaldo = `${clave}_otro`;
  return respaldo in diccionario ? respaldo : clave;
};

export const traducir = (
  codigo: CodigoIdioma,
  clave: ClaveTraduccion | string,
  valores?: ValoresTraduccion,
): string => {
  const diccionario = DICCIONARIOS[codigo] as Record<string, string>;
  const respaldo = DICCIONARIOS[IDIOMA_POR_DEFECTO] as Record<string, string>;
  const locale = definicionIdioma(codigo).locale;
  const conteo = typeof valores?.conteo === "number" ? valores.conteo : undefined;
  const buscada =
    conteo === undefined
      ? clave
      : claveConPlural(clave in diccionario ? diccionario : respaldo, clave, locale, conteo);
  const plantilla = diccionario[buscada] ?? respaldo[buscada] ?? String(clave);
  return interpolar(plantilla, valores, locale);
};

export type { ClaveTraduccion };
