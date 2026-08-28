import { CENTRO_COLOMBIA } from "../../shared/api/mock/mundo";

export type FaseIntro =
  "aparicion" | "giro" | "colombia" | "zoom" | "seleccion" | "entrada" | "ecosistema" | "salida";

export type Tramo = {
  fase: FaseIntro;
  duracion: number;
};

export const TRAMOS: readonly Tramo[] = [
  { fase: "aparicion", duracion: 1700 },
  { fase: "giro", duracion: 2600 },
  { fase: "colombia", duracion: 1600 },
  { fase: "zoom", duracion: 1300 },
  { fase: "seleccion", duracion: 1500 },
  { fase: "entrada", duracion: 1000 },
  { fase: "ecosistema", duracion: 13000 },
  { fase: "salida", duracion: 900 },
];

export const DURACION_TOTAL = TRAMOS.reduce((suma, tramo) => suma + tramo.duracion, 0);

export const INICIO_SALIDA = TRAMOS.filter((tramo) => tramo.fase !== "salida").reduce(
  (suma, tramo) => suma + tramo.duracion,
  0,
);

export const DURACION_ESCENA = 900;

const LON_PARTIDA = CENTRO_COLOMBIA.lon + 96;
const LAT_PARTIDA = 20;
const DERIVA_APARICION = 30;

const entradaSuave = (t: number): number => t * t * t;
const suavizar = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export type Momento = {
  fase: FaseIntro;
  avance: number;
  escena: number;
};

export const momentoEn = (tiempo: number): Momento => {
  let restante = Math.max(0, tiempo);
  for (const tramo of TRAMOS) {
    if (restante < tramo.duracion) {
      return {
        fase: tramo.fase,
        avance: restante / tramo.duracion,
        escena: Math.floor(restante / DURACION_ESCENA),
      };
    }
    restante -= tramo.duracion;
  }
  return { fase: "salida", avance: 1, escena: 5 };
};

export type Encuadre = {
  lon: number;
  lat: number;
  acercamiento: number;
  revelado: number;
  opacidad: number;
};

export type Destino = {
  lon: number;
  lat: number;
};

const LON_GIRO = LON_PARTIDA - DERIVA_APARICION;

export const encuadreEn = (momento: Momento, destino: Destino): Encuadre => {
  const { fase, avance } = momento;

  if (fase === "aparicion")
    return {
      lon: LON_PARTIDA - DERIVA_APARICION * avance,
      lat: LAT_PARTIDA,
      acercamiento: 0.22 + 0.78 * suavizar(avance),
      revelado: 0,
      opacidad: Math.min(1, avance * 3.2),
    };

  if (fase === "giro") {
    const t = suavizar(avance);
    return {
      lon: LON_GIRO + (CENTRO_COLOMBIA.lon - LON_GIRO) * t,
      lat: LAT_PARTIDA + (CENTRO_COLOMBIA.lat - LAT_PARTIDA) * t,
      acercamiento: 1 + 0.15 * t,
      revelado: 0,
      opacidad: 1,
    };
  }

  if (fase === "colombia")
    return {
      lon: CENTRO_COLOMBIA.lon,
      lat: CENTRO_COLOMBIA.lat,
      acercamiento: 1.15 + 1.25 * suavizar(avance),
      revelado: Math.min(1, avance / 0.6),
      opacidad: 1,
    };

  if (fase === "zoom")
    return {
      lon: CENTRO_COLOMBIA.lon,
      lat: CENTRO_COLOMBIA.lat,
      acercamiento: 2.4 + 4.2 * entradaSuave(avance),
      revelado: 1,
      opacidad: 1,
    };

  if (fase === "seleccion") {
    const t = suavizar(avance);
    return {
      lon: CENTRO_COLOMBIA.lon + (destino.lon - CENTRO_COLOMBIA.lon) * t,
      lat: CENTRO_COLOMBIA.lat + (destino.lat - CENTRO_COLOMBIA.lat) * t,
      acercamiento: 6.6 + 2 * avance,
      revelado: 1,
      opacidad: 1,
    };
  }

  if (fase === "entrada")
    return {
      lon: destino.lon,
      lat: destino.lat,
      acercamiento: 8.6 + 21.4 * avance ** 3.2,
      revelado: 1,
      opacidad: 1,
    };

  return {
    lon: destino.lon,
    lat: destino.lat,
    acercamiento: 30 + 6 * avance,
    revelado: 1,
    opacidad: 0.4,
  };
};
