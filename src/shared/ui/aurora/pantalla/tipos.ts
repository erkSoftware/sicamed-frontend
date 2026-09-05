import type { Permiso } from "../../../auth/tipos";
import type { CampoDeFirma } from "../voz/confirmacion";

export type VerboDePantalla =
  | "abrir-formulario"
  | "prellenar-campo"
  | "senalar-campo"
  | "aplicar-filtro"
  | "seleccionar-fila"
  | "enviar";

export const VERBOS_DE_PANTALLA: readonly VerboDePantalla[] = [
  "abrir-formulario",
  "prellenar-campo",
  "senalar-campo",
  "aplicar-filtro",
  "seleccionar-fila",
  "enviar",
];

export const ETIQUETA_DE_VERBO: Readonly<Record<VerboDePantalla, string>> = {
  "abrir-formulario": "abrir el formulario",
  "prellenar-campo": "escribir en el campo",
  "senalar-campo": "señalar el campo",
  "aplicar-filtro": "aplicar el filtro",
  "seleccionar-fila": "seleccionar la fila",
  enviar: "enviar el formulario",
};

export type PeticionDeAccion = {
  objetivo: string;
  valor: string;
  argumentos: Readonly<Record<string, unknown>>;
};

export type ResultadoAccion = {
  ok: boolean;
  detalle?: string;
  motivo?: string;
  valores?: readonly string[];
  deshacer?: () => void;
};

export type AccionDePantalla = {
  verbo: VerboDePantalla;
  objetivo: string;
  etiqueta: string;
  sinonimos?: readonly string[];
  valores?: readonly string[];
  permiso?: Permiso;
  escribe?: boolean;
  firma?: () => readonly CampoDeFirma[];
  ejecutar: (peticion: PeticionDeAccion) => ResultadoAccion | Promise<ResultadoAccion>;
};

export type FiltroVivo = {
  etiqueta: string;
  valor: string;
};

export type CampoVivo = {
  etiqueta: string;
  diligenciado: boolean;
  error?: string;
};

export type FormularioVivo = {
  etiqueta: string;
  campos: readonly CampoVivo[];
};

export type EstadoDePantalla = {
  pantalla: string;
  filtros?: readonly FiltroVivo[];
  seleccion?: string;
  total?: number;
  formulario?: FormularioVivo | null;
};
