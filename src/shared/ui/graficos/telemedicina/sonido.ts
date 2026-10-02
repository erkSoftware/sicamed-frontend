import { campana, fijacion, soplo, type PintarEfecto } from "../../sonido/efectos";
import type { FaseRecorrido } from "./guion";

export const CLAVES_TELEMEDICINA = [
  "colombia",
  "region",
  "cultivo",
  "laboratorio",
  "ips",
  "paciente",
  "cierre",
] as const;

export type ClaveTelemedicina = (typeof CLAVES_TELEMEDICINA)[number];

export const rutaTelemedicina = (clave: ClaveTelemedicina): string =>
  `/audio/telemedicina/${clave}.mp3`;

export const locucionDeRecorrido = (fase: FaseRecorrido): ClaveTelemedicina | null =>
  fase === "reposo" ? null : fase;

const EFECTOS: Record<FaseRecorrido, PintarEfecto | null> = {
  reposo: null,
  colombia: (audio, salida, en) =>
    campana(audio, salida, {
      en,
      notas: [659.25, 987.77, 1318.51],
      volumen: 0.2,
      decaimiento: 2.4,
    }),
  region: (audio, salida, en) => fijacion(audio, salida, { en: en + 0.2, volumen: 0.1 }),
  cultivo: (audio, salida, en) =>
    soplo(audio, salida, { en, duracion: 2.6, desde: 380, hasta: 900, volumen: 0.07 }),
  laboratorio: (audio, salida, en) => {
    fijacion(audio, salida, { en, volumen: 0.08 });
    campana(audio, salida, {
      en: en + 0.3,
      notas: [1567.98, 2093],
      volumen: 0.1,
      decaimiento: 1.4,
    });
  },
  ips: (audio, salida, en) =>
    campana(audio, salida, { en, notas: [523.25, 783.99], volumen: 0.16, decaimiento: 2 }),
  paciente: (audio, salida, en) =>
    campana(audio, salida, { en, notas: [587.33, 880, 1174.66], volumen: 0.18, decaimiento: 2.4 }),
  cierre: (audio, salida, en) =>
    campana(audio, salida, {
      en,
      notas: [440, 659.25, 880, 1108.73],
      volumen: 0.22,
      decaimiento: 3.4,
    }),
};

export const efectoDeRecorrido = (fase: FaseRecorrido): PintarEfecto | null => EFECTOS[fase];
