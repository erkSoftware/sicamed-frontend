import { abrirAudio } from "../../shared/ui/sonido/contexto";
import {
  ambiente,
  campana,
  fijacion,
  impacto,
  soplo,
  subida,
  type Ambiente,
} from "../../shared/ui/sonido/efectos";
import { crearLocutor, type Locutor } from "../../shared/ui/sonido/locutor";
import { anotar } from "./diagnostico";
import type { FaseIntro } from "./guion";

export const CLAVES_LINEA = ["apertura", "territorio", "cadena", "cierre"] as const;

export type ClaveLinea = (typeof CLAVES_LINEA)[number];

export type Locucion = ClaveLinea | "departamento";

export type EstadoBanda = "preparando" | "sonando" | "bloqueado" | "silenciado" | "sin-audio";

const RAIZ_AUDIO = "/audio/intro";

export const rutaLinea = (clave: ClaveLinea): string => `${RAIZ_AUDIO}/${clave}.mp3`;

export const rutaDepartamento = (codigo: string): string =>
  `${RAIZ_AUDIO}/departamentos/${codigo}.mp3`;

const LOCUCION_DEL_TRAMO: Record<FaseIntro, Locucion> = {
  aparicion: "apertura",
  giro: "apertura",
  colombia: "territorio",
  zoom: "territorio",
  seleccion: "departamento",
  entrada: "departamento",
  ecosistema: "cadena",
  salida: "cierre",
};

const FASES_QUE_INAUGURAN: ReadonlySet<FaseIntro> = new Set([
  "aparicion",
  "colombia",
  "seleccion",
  "ecosistema",
  "salida",
]);

export const locucionDelTramo = (fase: FaseIntro): Locucion => LOCUCION_DEL_TRAMO[fase];

export const inauguraLocucion = (fase: FaseIntro): boolean => FASES_QUE_INAUGURAN.has(fase);

const VOLUMEN_VOZ = 1;
const VOLUMEN_EFECTOS = 0.55;
const VOLUMEN_AMBIENTE = 0.07;
const AMBIENTE_BAJO_LA_VOZ = 0.4;
const ESPERA_MAXIMA_EN_COLA = 2600;
const ESPERA_DESBLOQUEO = 160;

const efectoDeFase = (audio: AudioContext, salida: AudioNode, fase: FaseIntro): void => {
  const en = audio.currentTime + 0.02;
  if (fase === "aparicion")
    campana(audio, salida, {
      en: en + 0.2,
      notas: [659.25, 987.77, 1318.51],
      volumen: 0.22,
      decaimiento: 2.8,
    });
  if (fase === "giro")
    soplo(audio, salida, { en, duracion: 2.4, desde: 300, hasta: 2400, volumen: 0.16 });
  if (fase === "colombia")
    campana(audio, salida, {
      en,
      notas: [783.99, 1174.66, 1567.98, 2349.32],
      volumen: 0.2,
      decaimiento: 2.2,
    });
  if (fase === "zoom") subida(audio, salida, { en, duracion: 1.25, volumen: 0.1 });
  if (fase === "seleccion") fijacion(audio, salida, { en: en + 0.25, volumen: 0.12 });
  if (fase === "entrada")
    soplo(audio, salida, { en, duracion: 0.95, desde: 600, hasta: 5200, volumen: 0.28 });
  if (fase === "ecosistema") impacto(audio, salida, { en, volumen: 0.5 });
  if (fase === "salida")
    campana(audio, salida, {
      en,
      notas: [440, 659.25, 880, 1108.73],
      volumen: 0.24,
      decaimiento: 3.6,
    });
};

export type BandaSonora = {
  fase: (fase: FaseIntro) => void;
  activar: () => void;
  silenciar: () => void;
  hablando: () => boolean;
  terminar: () => void;
  cortar: () => void;
  estado: () => EstadoBanda;
};

type Opciones = {
  departamento: string;
  activo: boolean;
  alCambiar: (estado: EstadoBanda) => void;
};

const esperar = (ms: number) => new Promise<void>((resolver) => window.setTimeout(resolver, ms));

export const crearBandaSonora = ({ departamento, activo, alCambiar }: Opciones): BandaSonora => {
  const audio = abrirAudio();
  let estado: EstadoBanda = audio ? (activo ? "preparando" : "silenciado") : "sin-audio";
  let faseActual: FaseIntro = "aparicion";
  let concluida = false;
  let despidiendo = false;
  let fondo: Ambiente | null = null;
  const dichas = new Set<Locucion>();

  const maestro = audio ? audio.createGain() : null;
  const voces = audio ? audio.createGain() : null;
  const efectos = audio ? audio.createGain() : null;
  if (audio && maestro && voces && efectos) {
    maestro.connect(audio.destination);
    voces.gain.value = VOLUMEN_VOZ;
    efectos.gain.value = VOLUMEN_EFECTOS;
    voces.connect(maestro);
    efectos.connect(maestro);
  }

  const cambiar = (siguiente: EstadoBanda) => {
    if (estado === siguiente) return;
    estado = siguiente;
    anotar("sonido", { estado });
    alCambiar(estado);
  };

  const encenderFondo = () => {
    if (!audio || !maestro || fondo || concluida) return;
    fondo = ambiente(audio, maestro, VOLUMEN_AMBIENTE);
  };

  const despedirFondo = () => {
    fondo?.apagar(2.6);
    fondo = null;
  };

  const locutor: Locutor<Locucion> | null =
    audio && voces
      ? crearLocutor<Locucion>({
          audio,
          salida: voces,
          esperaMaxima: ESPERA_MAXIMA_EN_COLA,
          ruta: (locucion) =>
            locucion === "departamento" ? rutaDepartamento(departamento) : rutaLinea(locucion),
          alHablar: (hablando) => {
            fondo?.atenuar(hablando ? AMBIENTE_BAJO_LA_VOZ : 1);
            if (!hablando && despidiendo && !locutor?.hablando()) despedirFondo();
          },
          alDecir: (locucion, segundos) =>
            anotar("voz", { locucion, segundos: Math.round(segundos * 10) / 10 }),
        })
      : null;

  const decir = (locucion: Locucion) => {
    if (!locutor || concluida || estado !== "sonando" || dichas.has(locucion)) return;
    dichas.add(locucion);
    locutor.decir(locucion, { paciente: locucion === "cierre" });
  };

  const desbloqueo = (evento: Event) => {
    const objetivo = evento.target;
    if (objetivo instanceof Element && objetivo.closest("button")) return;
    activar();
  };

  const vigilarGesto = (vigilar: boolean) => {
    if (typeof window === "undefined") return;
    if (vigilar) {
      window.addEventListener("pointerdown", desbloqueo);
      return;
    }
    window.removeEventListener("pointerdown", desbloqueo);
  };

  const sonar = () => {
    if (!audio || !maestro || concluida) return;
    vigilarGesto(false);
    maestro.gain.cancelScheduledValues(audio.currentTime);
    maestro.gain.setTargetAtTime(1, audio.currentTime, 0.05);
    cambiar("sonando");
    encenderFondo();
    if (faseActual === "aparicion" && efectos) efectoDeFase(audio, efectos, faseActual);
    decir(locucionDelTramo(faseActual));
  };

  const activar = () => {
    if (!audio || concluida) return;
    const intento = audio.resume();
    if (audio.state === "running") {
      sonar();
      return;
    }
    void intento.then(() => {
      if (audio.state === "running") sonar();
    });
  };

  const arrancar = async () => {
    if (!audio || estado !== "preparando") return;
    locutor?.precargar(["apertura", "territorio", "departamento", "cadena", "cierre"]);
    if (audio.state !== "running") await Promise.race([audio.resume(), esperar(ESPERA_DESBLOQUEO)]);
    if (estado !== "preparando") return;
    if (audio.state === "running") {
      sonar();
      return;
    }
    cambiar("bloqueado");
    vigilarGesto(true);
  };

  void arrancar();

  return {
    fase: (fase) => {
      faseActual = fase;
      if (!audio || !efectos || estado !== "sonando") return;
      efectoDeFase(audio, efectos, fase);
      if (inauguraLocucion(fase)) decir(locucionDelTramo(fase));
    },
    activar,
    silenciar: () => {
      if (!audio || !maestro) return;
      vigilarGesto(false);
      locutor?.callar();
      despedirFondo();
      maestro.gain.setTargetAtTime(0, audio.currentTime, 0.06);
      cambiar("silenciado");
    },
    hablando: () => estado === "sonando" && Boolean(locutor?.hablando()),
    terminar: () => {
      vigilarGesto(false);
      despidiendo = true;
      if (!locutor?.hablando()) despedirFondo();
    },
    cortar: () => {
      vigilarGesto(false);
      concluida = true;
      locutor?.callar();
      despedirFondo();
      if (audio && maestro) maestro.gain.setTargetAtTime(0, audio.currentTime, 0.08);
    },
    estado: () => estado,
  };
};
