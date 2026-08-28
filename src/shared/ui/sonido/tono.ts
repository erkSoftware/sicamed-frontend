const ESCALA = [523.25, 587.33, 659.25, 783.99, 880] as const;

const BASE_RESPALDO = 523.25;

const PARCIALES = [
  { tipo: "triangle", razon: 1, ganancia: 1 },
  { tipo: "sine", razon: 2, ganancia: 0.3 },
] as const;

let contexto: AudioContext | null = null;

const abrir = (): AudioContext | null => {
  if (contexto) return contexto;
  if (typeof window === "undefined") return null;
  const ventana = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const Constructor = ventana.AudioContext ?? ventana.webkitAudioContext;
  if (!Constructor) return null;
  try {
    contexto = new Constructor();
  } catch {
    contexto = null;
  }
  return contexto;
};

export const emitirTono = (paso: number): void => {
  const audio = abrir();
  if (!audio) return;
  try {
    if (audio.state === "suspended") void audio.resume();
    const indice = Math.min(Math.max(Math.trunc(paso), 0), ESCALA.length - 1);
    const base = ESCALA[indice] ?? BASE_RESPALDO;
    const ahora = audio.currentTime;

    const filtro = audio.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.setValueAtTime(2600, ahora);

    const volumen = audio.createGain();
    volumen.gain.setValueAtTime(0.0001, ahora);
    volumen.gain.exponentialRampToValueAtTime(0.05, ahora + 0.006);
    volumen.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.13);

    filtro.connect(volumen);
    volumen.connect(audio.destination);

    for (const parcial of PARCIALES) {
      const oscilador = audio.createOscillator();
      const mezcla = audio.createGain();
      oscilador.type = parcial.tipo;
      oscilador.frequency.setValueAtTime(base * parcial.razon, ahora);
      mezcla.gain.setValueAtTime(parcial.ganancia, ahora);
      oscilador.connect(mezcla);
      mezcla.connect(filtro);
      oscilador.start(ahora);
      oscilador.stop(ahora + 0.16);
    }
  } catch {
    return;
  }
};
