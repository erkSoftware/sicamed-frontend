import type { CodigoIdioma } from "../../shared/i18n/idioma";
import { campana, fijacion, impacto, soplo, subida } from "../../shared/ui/sonido/efectos";
import {
  crearEscenaSonora,
  type EscenaSonora,
  type EstadoSonoro,
  type PintarEfecto,
} from "../../shared/ui/sonido/escenaSonora";
import { anotar } from "../intro/diagnostico";
import type { FaseOrigen } from "./guion";

export const CLAVES_LINEA = [
  "tierra",
  "cultivo",
  "industria",
  "producto",
  "mundo",
  "vitrina",
  "razones",
  "cierre",
] as const;

export type ClaveLinea = (typeof CLAVES_LINEA)[number];

export const CARPETA_POR_IDIOMA: Record<CodigoIdioma, string> = {
  es: "/audio/origen",
  en: "/audio/origen/en",
};

export const rutaLinea = (idioma: CodigoIdioma, clave: ClaveLinea): string =>
  `${CARPETA_POR_IDIOMA[idioma]}/${clave}.mp3`;

export const LOCUCION_DE_FASE: Readonly<Partial<Record<FaseOrigen, ClaveLinea>>> = {
  origen: "tierra",
  cultivo: "cultivo",
  laboratorio: "industria",
  producto: "producto",
  mundo: "mundo",
  sicamed: "vitrina",
  razones: "razones",
  cierre: "cierre",
};

export const locucionDeFase = (fase: FaseOrigen): ClaveLinea | null =>
  LOCUCION_DE_FASE[fase] ?? null;

const NOTAS_RAZONES = [659.25, 739.99, 880, 987.77] as const;
const PASO_RAZONES = 0.42;
const PASO_ELEMENTOS = 0.5;
const RETARDO_ELEMENTOS = 0.6;

const EFECTO_DE_FASE: Readonly<Partial<Record<FaseOrigen, PintarEfecto>>> = {
  origen: (audio, salida, en) => {
    soplo(audio, salida, { en, duracion: 4.6, desde: 180, hasta: 900, volumen: 0.12 });
    campana(audio, salida, {
      en: en + 0.4,
      notas: [329.63, 440, 659.25],
      volumen: 0.12,
      decaimiento: 3.6,
    });
  },
  cultivo: (audio, salida, en) =>
    soplo(audio, salida, { en, duracion: 3.4, desde: 500, hasta: 1800, volumen: 0.1 }),
  hoja: (audio, salida, en) => {
    soplo(audio, salida, { en, duracion: 0.95, desde: 700, hasta: 5200, volumen: 0.22 });
    fijacion(audio, salida, { en: en + 0.7, volumen: 0.08 });
  },
  laboratorio: (audio, salida, en) =>
    campana(audio, salida, {
      en: en + 0.3,
      notas: [1760, 2637.02],
      volumen: 0.09,
      decaimiento: 1.6,
    }),
  producto: (audio, salida, en) => impacto(audio, salida, { en: en + 0.2, volumen: 0.28 }),
  colombia: (audio, salida, en) =>
    campana(audio, salida, {
      en,
      notas: [659.25, 987.77, 1318.51, 1975.53],
      volumen: 0.2,
      decaimiento: 2.4,
    }),
  mundo: (audio, salida, en) => subida(audio, salida, { en, duracion: 1.6, volumen: 0.09 }),
  sicamed: (audio, salida, en) => {
    for (let indice = 0; indice < 4; indice += 1)
      fijacion(audio, salida, {
        en: en + RETARDO_ELEMENTOS + indice * PASO_ELEMENTOS,
        volumen: 0.07,
      });
  },
  razones: (audio, salida, en) =>
    NOTAS_RAZONES.forEach((nota, indice) =>
      campana(audio, salida, {
        en: en + indice * PASO_RAZONES,
        notas: [nota],
        volumen: 0.08,
        decaimiento: 1.2,
      }),
    ),
  cierre: (audio, salida, en) => {
    impacto(audio, salida, { en, volumen: 0.4 });
    campana(audio, salida, {
      en: en + 0.1,
      notas: [440, 659.25, 880, 1108.73],
      volumen: 0.24,
      decaimiento: 3.6,
    });
  },
};

export const efectoDeFase = (fase: FaseOrigen): PintarEfecto | null => EFECTO_DE_FASE[fase] ?? null;

export type BandaOrigen = {
  fase: (fase: FaseOrigen) => void;
  despertar: () => void;
  alternar: () => void;
  terminar: () => void;
  cortar: () => void;
  estado: () => EstadoSonoro;
};

type OpcionesBanda = {
  idioma: CodigoIdioma;
  alCambiar: (estado: EstadoSonoro) => void;
};

const VOLUMEN_AMBIENTE = 0.06;
const VENTANA_LOCUCION_TARDIA = 1600;
const DESPEDIDA = 2400;

export const crearBandaOrigen = ({ idioma, alCambiar }: OpcionesBanda): BandaOrigen => {
  let faseActual: FaseOrigen = "invitacion";
  let faseDesde = performance.now();
  let despedida = 0;
  let creada: EscenaSonora<ClaveLinea> | null = null;

  const decirFase = (fase: FaseOrigen) => {
    const clave = locucionDeFase(fase);
    if (clave) creada?.decir(clave, { paciente: clave === "cierre" });
  };

  const escena = crearEscenaSonora<ClaveLinea>({
    ruta: (clave) => rutaLinea(idioma, clave),
    precarga: CLAVES_LINEA,
    volumenAmbiente: VOLUMEN_AMBIENTE,
    alCambiar: (estado) => {
      anotar("origen-sonido", { estado });
      alCambiar(estado);
      if (estado !== "sonando") return;
      if (performance.now() - faseDesde < VENTANA_LOCUCION_TARDIA) decirFase(faseActual);
    },
    alDecir: (clave, segundos) =>
      anotar("origen-voz", { clave, segundos: Math.round(segundos * 10) / 10 }),
  });
  creada = escena;
  escena.ambiente(true);

  return {
    fase: (fase) => {
      faseActual = fase;
      faseDesde = performance.now();
      const efecto = efectoDeFase(fase);
      if (efecto) escena.efecto(efecto);
      decirFase(fase);
      if (fase === "salida") escena.ambiente(false);
    },
    despertar: () => escena.despertar(),
    alternar: () => {
      if (escena.estado() === "sonando") escena.silenciar();
      else escena.activar();
    },
    terminar: () => {
      escena.ambiente(false);
      despedida = window.setTimeout(() => escena.cerrar(), DESPEDIDA);
    },
    cortar: () => {
      window.clearTimeout(despedida);
      escena.cerrar();
    },
    estado: () => escena.estado(),
  };
};
