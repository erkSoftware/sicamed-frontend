export type Clasificacion = "PUBLICO" | "RESERVADO_COMERCIAL" | "INSTITUCIONAL";

export type CampoOferta =
  | "tipoProducto"
  | "organizacion"
  | "tipoActor"
  | "departamento"
  | "municipio"
  | "estado"
  | "publicada"
  | "vigencia"
  | "disponibilidad"
  | "certificaciones"
  | "interesados"
  | "cantidadDisponible"
  | "capacidadProductiva"
  | "contacto";

export type ClasificacionCampos = Readonly<Record<CampoOferta, Clasificacion>>;

const CLASIFICACION_BASE: ClasificacionCampos = {
  tipoProducto: "PUBLICO",
  organizacion: "PUBLICO",
  tipoActor: "PUBLICO",
  departamento: "PUBLICO",
  municipio: "PUBLICO",
  estado: "PUBLICO",
  publicada: "PUBLICO",
  vigencia: "PUBLICO",
  disponibilidad: "PUBLICO",
  certificaciones: "PUBLICO",
  interesados: "RESERVADO_COMERCIAL",
  cantidadDisponible: "RESERVADO_COMERCIAL",
  capacidadProductiva: "RESERVADO_COMERCIAL",
  contacto: "RESERVADO_COMERCIAL",
};

const CAMPOS_INMUTABLES: readonly CampoOferta[] = [
  "cantidadDisponible",
  "capacidadProductiva",
  "contacto",
];

declare global {
  interface Window {
    SICAMED_CLASIFICACION_CAMPOS?: Partial<Record<string, Clasificacion>>;
  }
}

const configuracionExterna = (): Partial<Record<string, Clasificacion>> => {
  if (typeof window === "undefined") return {};
  return window.SICAMED_CLASIFICACION_CAMPOS ?? {};
};

export const clasificacionCampos = (): ClasificacionCampos => {
  const externa = configuracionExterna();
  const resultado = { ...CLASIFICACION_BASE };
  for (const [campo, clasificacion] of Object.entries(externa)) {
    const clave = campo as CampoOferta;
    if (!(clave in CLASIFICACION_BASE)) continue;
    if (CAMPOS_INMUTABLES.includes(clave)) continue;
    if (!clasificacion) continue;
    resultado[clave] = clasificacion;
  }
  return resultado;
};

export const esPublico = (campo: CampoOferta): boolean =>
  clasificacionCampos()[campo] === "PUBLICO";

export const camposPorClasificacion = (clasificacion: Clasificacion): readonly CampoOferta[] => {
  const mapa = clasificacionCampos();
  return (Object.keys(mapa) as CampoOferta[]).filter((campo) => mapa[campo] === clasificacion);
};
