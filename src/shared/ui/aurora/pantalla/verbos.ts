import type { VerboDePantalla } from "./tipos";
import type { Permiso } from "../../../auth/tipos";

export type RespaldoDeAccion = {
  ruta: string;
  permiso: Permiso;
};

export type AccionDeInterfaz =
  | { clase: "navegar" }
  | {
      clase: "pantalla";
      verbo: VerboDePantalla;
      objetivo?: string;
      respaldo?: RespaldoDeAccion;
    }
  | { clase: "desconocida" };

const NAVEGACION = ["navigate_to", "open_screen", "go_to", "ir_a", "navegar"];

const VERBOS: readonly { sufijos: readonly string[]; verbo: VerboDePantalla }[] = [
  {
    sufijos: ["open_form", "abrir_formulario", "new_record", "create_form"],
    verbo: "abrir-formulario",
  },
  {
    sufijos: ["fill_field", "prefill_field", "set_field", "prellenar_campo"],
    verbo: "prellenar-campo",
  },
  {
    sufijos: ["highlight_field", "point_to_field", "show_field", "senalar_campo"],
    verbo: "senalar-campo",
  },
  {
    sufijos: ["apply_filter", "filter_list", "set_filter", "aplicar_filtro"],
    verbo: "aplicar-filtro",
  },
  {
    sufijos: ["select_row", "open_row", "pick_row", "seleccionar_fila"],
    verbo: "seleccionar-fila",
  },
  { sufijos: ["submit_form", "submit", "enviar_formulario"], verbo: "enviar" },
];

export const clasificarHerramientaUi = (nombre: string): AccionDeInterfaz => {
  const clave = nombre.trim().toLowerCase();
  if (clave === "") return { clase: "desconocida" };
  if (NAVEGACION.some((sufijo) => clave.endsWith(sufijo))) return { clase: "navegar" };
  if (clave === "open_lot_form") {
    return {
      clase: "pantalla",
      verbo: "abrir-formulario",
      objetivo: "lote",
      respaldo: { ruta: "/app/inventario?crear=lote", permiso: "inventario:lote:escribir" },
    };
  }

  const encontrado = VERBOS.find((entrada) =>
    entrada.sufijos.some((sufijo) => clave.endsWith(sufijo)),
  );
  return encontrado ? { clase: "pantalla", verbo: encontrado.verbo } : { clase: "desconocida" };
};

const CLAVES_DE_OBJETIVO = [
  "objetivo",
  "campo",
  "field",
  "target",
  "filtro",
  "filter",
  "fila",
  "row",
  "formulario",
  "form",
  "nombre",
  "name",
  "columna",
  "column",
];

const CLAVES_DE_VALOR = ["valor", "value", "texto", "text", "contenido", "content", "opcion"];

const primeraCadena = (
  argumentos: Readonly<Record<string, unknown>>,
  claves: readonly string[],
): string => {
  for (const clave of claves) {
    const valor = argumentos[clave];
    if (typeof valor === "string" && valor.trim() !== "") return valor.trim();
    if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  }
  return "";
};

export const objetivoDeArgumentos = (argumentos: Readonly<Record<string, unknown>>): string =>
  primeraCadena(argumentos, CLAVES_DE_OBJETIVO);

export const valorDeArgumentos = (argumentos: Readonly<Record<string, unknown>>): string =>
  primeraCadena(argumentos, CLAVES_DE_VALOR);

export const destinoDeArgumentos = (argumentos: Readonly<Record<string, unknown>>): string =>
  primeraCadena(argumentos, [
    "destino",
    "destination",
    "ruta",
    "route",
    "modulo",
    "module",
    "pantalla",
    "screen",
  ]);
