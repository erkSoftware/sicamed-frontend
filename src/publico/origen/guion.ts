import { CENTRO_COLOMBIA } from "../../shared/api/mock/mundo";
import type { ClaveTraduccion } from "../../shared/i18n/diccionarios/es";

export type FaseOrigen =
  | "invitacion"
  | "origen"
  | "cultivo"
  | "hoja"
  | "laboratorio"
  | "producto"
  | "colombia"
  | "mundo"
  | "sicamed"
  | "razones"
  | "cierre"
  | "salida";

export type Tramo = {
  fase: FaseOrigen;
  duracion: number;
};

export const TRAMOS: readonly Tramo[] = [
  { fase: "invitacion", duracion: 2600 },
  { fase: "origen", duracion: 5400 },
  { fase: "cultivo", duracion: 5400 },
  { fase: "hoja", duracion: 3000 },
  { fase: "laboratorio", duracion: 3400 },
  { fase: "producto", duracion: 5000 },
  { fase: "colombia", duracion: 3600 },
  { fase: "mundo", duracion: 6000 },
  { fase: "sicamed", duracion: 5600 },
  { fase: "razones", duracion: 6000 },
  { fase: "cierre", duracion: 5200 },
  { fase: "salida", duracion: 900 },
];

export const DURACION_TOTAL = TRAMOS.reduce((suma, tramo) => suma + tramo.duracion, 0);

export const INICIO_SALIDA = DURACION_TOTAL - 900;

export const inicioDe = (fase: FaseOrigen): number => {
  let suma = 0;
  for (const tramo of TRAMOS) {
    if (tramo.fase === fase) return suma;
    suma += tramo.duracion;
  }
  return 0;
};

export const FIN_INVITACION = inicioDe("origen");

export type Momento = {
  fase: FaseOrigen;
  avance: number;
  tiempo: number;
};

export const momentoEn = (tiempo: number): Momento => {
  const reloj = Math.max(0, tiempo);
  let restante = reloj;
  for (const tramo of TRAMOS) {
    if (restante < tramo.duracion) {
      return { fase: tramo.fase, avance: restante / tramo.duracion, tiempo: reloj };
    }
    restante -= tramo.duracion;
  }
  return { fase: "salida", avance: 1, tiempo: reloj };
};

export type Escena =
  "tierra" | "cultivo" | "hoja" | "laboratorio" | "producto" | "globo" | "vitrina" | "cierre";

export type Plano = {
  escena: Escena;
  entra: number;
  sale: number;
  escalaEntra: number;
  escalaSale: number;
};

export const FUNDIDO = 900;

export const PLANOS: readonly Plano[] = [
  { escena: "tierra", entra: 0, sale: 9200, escalaEntra: 1.02, escalaSale: 1.26 },
  { escena: "cultivo", entra: 7200, sale: 14400, escalaEntra: 1, escalaSale: 1.3 },
  { escena: "hoja", entra: 12800, sale: 17200, escalaEntra: 0.92, escalaSale: 1.9 },
  { escena: "laboratorio", entra: 15800, sale: 20800, escalaEntra: 1.24, escalaSale: 1 },
  { escena: "producto", entra: 19200, sale: 25600, escalaEntra: 1, escalaSale: 1.14 },
  { escena: "globo", entra: 24200, sale: 35200, escalaEntra: 1, escalaSale: 1 },
  { escena: "vitrina", entra: 33800, sale: 46600, escalaEntra: 1.06, escalaSale: 1 },
  { escena: "cierre", entra: 45400, sale: DURACION_TOTAL, escalaEntra: 1.04, escalaSale: 1 },
];

export type Toma = {
  opacidad: number;
  escala: number;
  desenfoque: number;
};

const acotar = (valor: number) => Math.min(1, Math.max(0, valor));

export const suavizar = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export const tomaEn = (plano: Plano, tiempo: number): Toma => {
  const entrada = acotar((tiempo - plano.entra) / FUNDIDO);
  const salida = acotar((plano.sale - tiempo) / FUNDIDO);
  const recorrido = acotar((tiempo - plano.entra) / Math.max(1, plano.sale - plano.entra));
  return {
    opacidad: Math.min(entrada, salida),
    escala: plano.escalaEntra + (plano.escalaSale - plano.escalaEntra) * suavizar(recorrido),
    desenfoque: (1 - entrada) * 14 + (1 - salida) * 10,
  };
};

export type Encuadre = {
  lon: number;
  lat: number;
  acercamiento: number;
  revelado: number;
  enlaces: number;
};

const LON_FUGA = CENTRO_COLOMBIA.lon + 22;

export const encuadreEn = (momento: Momento): Encuadre => {
  if (momento.fase === "producto")
    return {
      lon: CENTRO_COLOMBIA.lon,
      lat: CENTRO_COLOMBIA.lat,
      acercamiento: 7.4 - 2.2 * suavizar(momento.avance),
      revelado: momento.avance,
      enlaces: 0,
    };

  if (momento.fase === "colombia") {
    const t = suavizar(momento.avance);
    return {
      lon: CENTRO_COLOMBIA.lon,
      lat: CENTRO_COLOMBIA.lat,
      acercamiento: 5.2 - 3.9 * t,
      revelado: 1,
      enlaces: acotar((momento.avance - 0.7) / 0.3),
    };
  }

  if (momento.fase === "mundo") {
    const t = suavizar(momento.avance);
    return {
      lon: CENTRO_COLOMBIA.lon + (LON_FUGA - CENTRO_COLOMBIA.lon) * t,
      lat: CENTRO_COLOMBIA.lat + (14 - CENTRO_COLOMBIA.lat) * t,
      acercamiento: 1.3 - 0.32 * t,
      revelado: 1,
      enlaces: 1,
    };
  }

  return { lon: LON_FUGA, lat: 14, acercamiento: 0.98, revelado: 1, enlaces: 1 };
};

export const ROTULOS: readonly { fase: FaseOrigen; clave: ClaveTraduccion }[] = [
  { fase: "origen", clave: "origen.tierra" },
  { fase: "cultivo", clave: "origen.cultivo" },
  { fase: "laboratorio", clave: "origen.industria" },
  { fase: "producto", clave: "origen.producto" },
  { fase: "mundo", clave: "origen.mundo" },
  { fase: "sicamed", clave: "origen.vitrina" },
];

export const rotuloDe = (fase: FaseOrigen): ClaveTraduccion | null =>
  ROTULOS.find((rotulo) => rotulo.fase === fase)?.clave ?? null;
