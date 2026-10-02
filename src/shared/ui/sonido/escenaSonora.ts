import { useSonido } from "./almacen";
import { abrirAudio } from "./contexto";
import { ambiente as crearAmbiente, type Ambiente, type PintarEfecto } from "./efectos";
import { crearLocutor, type OpcionesDecir } from "./locutor";

export type EstadoSonoro = "preparando" | "sonando" | "bloqueado" | "silenciado" | "sin-audio";

export type { PintarEfecto };

export type OpcionesEscenaSonora<Clave extends string> = {
  ruta: (clave: Clave) => string;
  precarga?: readonly Clave[];
  esperaMaxima?: number;
  volumenAmbiente?: number;
  volumenEfectos?: number;
  desbloquearConGesto?: boolean;
  alCambiar?: (estado: EstadoSonoro) => void;
  alDecir?: (clave: Clave, segundos: number) => void;
};

export type DecirEnEscena = OpcionesDecir & { unaVez?: boolean };

export type EscenaSonora<Clave extends string> = {
  estado: () => EstadoSonoro;
  despertar: () => void;
  activar: () => void;
  silenciar: () => void;
  decir: (clave: Clave, opciones?: DecirEnEscena) => void;
  efecto: (pintar: PintarEfecto) => void;
  ambiente: (encendido: boolean) => void;
  callar: () => void;
  olvidarDichas: () => void;
  hablando: () => boolean;
  cerrar: () => void;
};

const ESPERA_MAXIMA = 2600;
const ESPERA_DESBLOQUEO = 160;
const AMBIENTE_BAJO_LA_VOZ = 0.4;

const esperar = (ms: number) => new Promise<void>((resolver) => window.setTimeout(resolver, ms));

export const crearEscenaSonora = <Clave extends string>(
  opciones: OpcionesEscenaSonora<Clave>,
): EscenaSonora<Clave> => {
  const {
    ruta,
    precarga = [],
    esperaMaxima = ESPERA_MAXIMA,
    volumenAmbiente = 0,
    volumenEfectos = 0.55,
    desbloquearConGesto = true,
    alCambiar,
    alDecir,
  } = opciones;
  const audio = abrirAudio();
  let estado: EstadoSonoro = !audio
    ? "sin-audio"
    : useSonido.getState().activo
      ? "preparando"
      : "silenciado";
  let cerrada = false;
  let ambienteDeseado = false;
  let fondo: Ambiente | null = null;
  const dichas = new Set<Clave>();

  const maestro = audio?.createGain() ?? null;
  const voces = audio?.createGain() ?? null;
  const efectos = audio?.createGain() ?? null;
  if (audio && maestro && voces && efectos) {
    maestro.connect(audio.destination);
    efectos.gain.value = volumenEfectos;
    voces.connect(maestro);
    efectos.connect(maestro);
  }

  const locutor =
    audio && voces
      ? crearLocutor<Clave>({
          audio,
          salida: voces,
          ruta,
          esperaMaxima,
          alHablar: (hablando) => fondo?.atenuar(hablando ? AMBIENTE_BAJO_LA_VOZ : 1),
          alDecir,
        })
      : null;

  const cambiar = (siguiente: EstadoSonoro) => {
    if (estado === siguiente) return;
    estado = siguiente;
    alCambiar?.(estado);
  };

  const encenderFondo = () => {
    if (!audio || !maestro || fondo || volumenAmbiente <= 0) return;
    fondo = crearAmbiente(audio, maestro, volumenAmbiente);
  };

  const apagarFondo = (segundos: number) => {
    fondo?.apagar(segundos);
    fondo = null;
  };

  const alGesto = () => despertar();

  const vigilarGesto = (vigilar: boolean) => {
    if (typeof window === "undefined" || !desbloquearConGesto) return;
    if (vigilar) window.addEventListener("pointerdown", alGesto);
    else window.removeEventListener("pointerdown", alGesto);
  };

  const sonar = () => {
    if (!audio || !maestro || cerrada || !useSonido.getState().activo) return;
    vigilarGesto(false);
    maestro.gain.cancelScheduledValues(audio.currentTime);
    maestro.gain.setTargetAtTime(1, audio.currentTime, 0.05);
    cambiar("sonando");
    if (ambienteDeseado) encenderFondo();
  };

  const despertar = () => {
    if (!audio || cerrada || !useSonido.getState().activo) return;
    const intento = audio.resume();
    if (audio.state === "running") {
      sonar();
      return;
    }
    void intento.then(() => {
      if (audio.state === "running") sonar();
    });
  };

  const enmudecer = () => {
    if (!audio || !maestro) return;
    vigilarGesto(false);
    locutor?.callar();
    apagarFondo(0.4);
    maestro.gain.setTargetAtTime(0, audio.currentTime, 0.06);
    cambiar("silenciado");
  };

  const desuscribir = useSonido.subscribe((actual, previo) => {
    if (actual.activo === previo.activo || cerrada) return;
    if (actual.activo) despertar();
    else enmudecer();
  });

  const arrancar = async () => {
    if (!audio || estado !== "preparando") return;
    locutor?.precargar(precarga);
    if (audio.state !== "running") await Promise.race([audio.resume(), esperar(ESPERA_DESBLOQUEO)]);
    if (estado !== "preparando" || cerrada) return;
    if (audio.state === "running") {
      sonar();
      return;
    }
    cambiar("bloqueado");
    vigilarGesto(true);
  };

  void arrancar();

  return {
    estado: () => estado,
    despertar,
    activar: () => {
      useSonido.getState().fijar(true);
      despertar();
    },
    silenciar: () => useSonido.getState().fijar(false),
    decir: (clave, { unaVez = false, ...resto } = {}) => {
      if (!locutor || estado !== "sonando" || cerrada) return;
      if (unaVez && dichas.has(clave)) return;
      dichas.add(clave);
      locutor.decir(clave, resto);
    },
    efecto: (pintar) => {
      if (!audio || !efectos || estado !== "sonando" || cerrada) return;
      pintar(audio, efectos, audio.currentTime + 0.02);
    },
    ambiente: (encendido) => {
      ambienteDeseado = encendido;
      if (!encendido) apagarFondo(1.6);
      else if (estado === "sonando") encenderFondo();
    },
    callar: () => locutor?.callar(),
    olvidarDichas: () => dichas.clear(),
    hablando: () => estado === "sonando" && Boolean(locutor?.hablando()),
    cerrar: () => {
      if (cerrada) return;
      cerrada = true;
      desuscribir();
      vigilarGesto(false);
      locutor?.callar();
      apagarFondo(0.6);
      if (audio && maestro) maestro.gain.setTargetAtTime(0, audio.currentTime, 0.08);
    },
  };
};
