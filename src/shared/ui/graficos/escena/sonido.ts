import { campana, fijacion, impacto, soplo, type PintarEfecto } from "../../sonido/efectos";
import type { Fase, Rama } from "./guion";

export const CLAVES_CADENA = [
  "finca",
  "viaje",
  "escaneo",
  "registro",
  "eleccion",
  "laboratorio",
  "ips",
  "exportacion",
  "cierre",
] as const;

export type ClaveCadena = (typeof CLAVES_CADENA)[number];

export const rutaCadena = (clave: ClaveCadena): string => `/audio/cadena/${clave}.mp3`;

const LOCUCION_DE_FASE: Partial<Record<Fase, ClaveCadena>> = {
  "finca-hacia-bulto": "finca",
  "viaje-bodega": "viaje",
  "bodega-escaneo": "escaneo",
  "bodega-registro": "registro",
  "salidas-reposo": "eleccion",
  cierre: "cierre",
};

export const locucionDeCadena = (fase: Fase, rama: Rama | null): ClaveCadena | null => {
  if (fase === "rama-transito") return rama;
  return LOCUCION_DE_FASE[fase] ?? null;
};

export const LOCUCIONES_QUE_ESPERAN: ReadonlySet<ClaveCadena> = new Set(["eleccion", "cierre"]);

const EFECTOS: Partial<Record<Fase, PintarEfecto>> = {
  "finca-agarrar": (audio, salida, en) => impacto(audio, salida, { en, volumen: 0.14 }),
  "finca-montar": (audio, salida, en) => impacto(audio, salida, { en, volumen: 0.26 }),
  "viaje-bodega": (audio, salida, en) =>
    soplo(audio, salida, { en, duracion: 2.4, desde: 120, hasta: 420, volumen: 0.12 }),
  "bodega-escaneo": (audio, salida, en) => {
    fijacion(audio, salida, { en: en + 0.3, volumen: 0.1 });
    fijacion(audio, salida, { en: en + 1.2, volumen: 0.1 });
  },
  "bodega-registro": (audio, salida, en) =>
    campana(audio, salida, {
      en: en + 0.4,
      notas: [880, 1318.51],
      volumen: 0.16,
      decaimiento: 1.8,
    }),
  "viaje-muelle": (audio, salida, en) =>
    soplo(audio, salida, { en, duracion: 2, desde: 140, hasta: 380, volumen: 0.1 }),
  "rama-sello": (audio, salida, en) => {
    impacto(audio, salida, { en, volumen: 0.3 });
    campana(audio, salida, {
      en: en + 0.08,
      notas: [783.99, 1174.66],
      volumen: 0.16,
      decaimiento: 1.8,
    });
  },
  cierre: (audio, salida, en) =>
    campana(audio, salida, {
      en,
      notas: [440, 659.25, 880, 1108.73],
      volumen: 0.22,
      decaimiento: 3.2,
    }),
};

export const efectoDeCadena = (fase: Fase): PintarEfecto | null => EFECTOS[fase] ?? null;

export const toque: PintarEfecto = (audio, salida, en) =>
  campana(audio, salida, { en, notas: [1046.5], volumen: 0.08, decaimiento: 0.35 });
