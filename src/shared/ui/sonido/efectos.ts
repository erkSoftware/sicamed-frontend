const SILENCIO = 0.0001;

const ruidos = new WeakMap<BaseAudioContext, AudioBuffer>();

const ruidoDe = (audio: BaseAudioContext): AudioBuffer => {
  const guardado = ruidos.get(audio);
  if (guardado) return guardado;
  const segundos = 2;
  const buffer = audio.createBuffer(1, audio.sampleRate * segundos, audio.sampleRate);
  const canal = buffer.getChannelData(0);
  for (let i = 0; i < canal.length; i += 1) canal[i] = Math.random() * 2 - 1;
  ruidos.set(audio, buffer);
  return buffer;
};

const paneo = (
  audio: BaseAudioContext,
  salida: AudioNode,
): { nodo: AudioNode; pan: AudioParam | null } => {
  if (typeof audio.createStereoPanner !== "function") return { nodo: salida, pan: null };
  const panoramico = audio.createStereoPanner();
  panoramico.connect(salida);
  return { nodo: panoramico, pan: panoramico.pan };
};

type Soplo = { en: number; duracion: number; desde: number; hasta: number; volumen: number };

export const soplo = (audio: BaseAudioContext, salida: AudioNode, opciones: Soplo): void => {
  const { en, duracion, desde, hasta, volumen } = opciones;
  const fuente = audio.createBufferSource();
  fuente.buffer = ruidoDe(audio);
  fuente.loop = true;

  const banda = audio.createBiquadFilter();
  banda.type = "bandpass";
  banda.Q.setValueAtTime(0.9, en);
  banda.frequency.setValueAtTime(desde, en);
  banda.frequency.exponentialRampToValueAtTime(hasta, en + duracion);

  const ganancia = audio.createGain();
  ganancia.gain.setValueAtTime(SILENCIO, en);
  ganancia.gain.exponentialRampToValueAtTime(volumen, en + duracion * 0.45);
  ganancia.gain.exponentialRampToValueAtTime(SILENCIO, en + duracion);

  const { nodo, pan } = paneo(audio, salida);
  if (pan) {
    pan.setValueAtTime(-0.6, en);
    pan.linearRampToValueAtTime(0.6, en + duracion);
  }

  fuente.connect(banda);
  banda.connect(ganancia);
  ganancia.connect(nodo);
  fuente.start(en);
  fuente.stop(en + duracion + 0.05);
};

type Campana = { en: number; notas: readonly number[]; volumen: number; decaimiento: number };

const PARCIALES_CAMPANA = [
  { razon: 1, ganancia: 1 },
  { razon: 2.01, ganancia: 0.28 },
  { razon: 2.76, ganancia: 0.12 },
] as const;

export const campana = (audio: BaseAudioContext, salida: AudioNode, opciones: Campana): void => {
  const { en, notas, volumen, decaimiento } = opciones;
  notas.forEach((nota, indice) => {
    const inicio = en + indice * 0.07;
    const ganancia = audio.createGain();
    ganancia.gain.setValueAtTime(SILENCIO, inicio);
    ganancia.gain.exponentialRampToValueAtTime(volumen / notas.length, inicio + 0.012);
    ganancia.gain.exponentialRampToValueAtTime(SILENCIO, inicio + decaimiento);
    const { nodo, pan } = paneo(audio, salida);
    if (pan) pan.setValueAtTime(((indice / Math.max(notas.length - 1, 1)) * 2 - 1) * 0.4, inicio);
    ganancia.connect(nodo);
    for (const parcial of PARCIALES_CAMPANA) {
      const oscilador = audio.createOscillator();
      const mezcla = audio.createGain();
      oscilador.type = "sine";
      oscilador.frequency.setValueAtTime(nota * parcial.razon, inicio);
      mezcla.gain.setValueAtTime(parcial.ganancia, inicio);
      oscilador.connect(mezcla);
      mezcla.connect(ganancia);
      oscilador.start(inicio);
      oscilador.stop(inicio + decaimiento + 0.05);
    }
  });
};

type Subida = { en: number; duracion: number; volumen: number };

export const subida = (audio: BaseAudioContext, salida: AudioNode, opciones: Subida): void => {
  const { en, duracion, volumen } = opciones;
  const filtro = audio.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.Q.setValueAtTime(6, en);
  filtro.frequency.setValueAtTime(220, en);
  filtro.frequency.exponentialRampToValueAtTime(3200, en + duracion);

  const ganancia = audio.createGain();
  ganancia.gain.setValueAtTime(SILENCIO, en);
  ganancia.gain.exponentialRampToValueAtTime(volumen, en + duracion * 0.92);
  ganancia.gain.exponentialRampToValueAtTime(SILENCIO, en + duracion + 0.12);

  filtro.connect(ganancia);
  ganancia.connect(salida);

  for (const desafinado of [-7, 7]) {
    const oscilador = audio.createOscillator();
    oscilador.type = "sawtooth";
    oscilador.detune.setValueAtTime(desafinado, en);
    oscilador.frequency.setValueAtTime(70, en);
    oscilador.frequency.exponentialRampToValueAtTime(280, en + duracion);
    oscilador.connect(filtro);
    oscilador.start(en);
    oscilador.stop(en + duracion + 0.15);
  }
  soplo(audio, salida, {
    en,
    duracion: duracion + 0.1,
    desde: 400,
    hasta: 6000,
    volumen: volumen * 0.6,
  });
};

type Breve = { en: number; volumen: number };

export const fijacion = (audio: BaseAudioContext, salida: AudioNode, opciones: Breve): void => {
  const { en, volumen } = opciones;
  [1318.51, 1975.53].forEach((nota, indice) => {
    const inicio = en + indice * 0.11;
    const oscilador = audio.createOscillator();
    const ganancia = audio.createGain();
    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(nota, inicio);
    ganancia.gain.setValueAtTime(SILENCIO, inicio);
    ganancia.gain.exponentialRampToValueAtTime(volumen, inicio + 0.006);
    ganancia.gain.exponentialRampToValueAtTime(SILENCIO, inicio + 0.16);
    oscilador.connect(ganancia);
    ganancia.connect(salida);
    oscilador.start(inicio);
    oscilador.stop(inicio + 0.2);
  });
};

export const impacto = (audio: BaseAudioContext, salida: AudioNode, opciones: Breve): void => {
  const { en, volumen } = opciones;
  const oscilador = audio.createOscillator();
  const ganancia = audio.createGain();
  oscilador.type = "sine";
  oscilador.frequency.setValueAtTime(130, en);
  oscilador.frequency.exponentialRampToValueAtTime(36, en + 0.55);
  ganancia.gain.setValueAtTime(SILENCIO, en);
  ganancia.gain.exponentialRampToValueAtTime(volumen, en + 0.008);
  ganancia.gain.exponentialRampToValueAtTime(SILENCIO, en + 1.1);
  oscilador.connect(ganancia);
  ganancia.connect(salida);
  oscilador.start(en);
  oscilador.stop(en + 1.15);

  const golpe = audio.createBufferSource();
  golpe.buffer = ruidoDe(audio);
  const grave = audio.createBiquadFilter();
  grave.type = "lowpass";
  grave.frequency.setValueAtTime(700, en);
  const envolvente = audio.createGain();
  envolvente.gain.setValueAtTime(SILENCIO, en);
  envolvente.gain.exponentialRampToValueAtTime(volumen * 0.5, en + 0.005);
  envolvente.gain.exponentialRampToValueAtTime(SILENCIO, en + 0.25);
  golpe.connect(grave);
  grave.connect(envolvente);
  envolvente.connect(salida);
  golpe.start(en);
  golpe.stop(en + 0.3);
};

export type Ambiente = {
  atenuar: (nivel: number) => void;
  apagar: (segundos: number) => void;
};

const ACORDE_AMBIENTE = [110, 164.81, 246.94, 329.63] as const;

export const ambiente = (audio: BaseAudioContext, salida: AudioNode, volumen: number): Ambiente => {
  const en = audio.currentTime;
  const nivel = audio.createGain();
  nivel.gain.setValueAtTime(1, en);
  const general = audio.createGain();
  general.gain.setValueAtTime(SILENCIO, en);
  general.gain.exponentialRampToValueAtTime(volumen, en + 2.2);

  const filtro = audio.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.frequency.setValueAtTime(900, en);
  const vaiven = audio.createOscillator();
  const profundidad = audio.createGain();
  vaiven.frequency.setValueAtTime(0.07, en);
  profundidad.gain.setValueAtTime(420, en);
  vaiven.connect(profundidad);
  profundidad.connect(filtro.frequency);

  filtro.connect(general);
  general.connect(nivel);
  nivel.connect(salida);

  const fuentes: OscillatorNode[] = [vaiven];
  for (const nota of ACORDE_AMBIENTE) {
    for (const desafinado of [-5, 5]) {
      const oscilador = audio.createOscillator();
      const mezcla = audio.createGain();
      oscilador.type = nota < 200 ? "triangle" : "sine";
      oscilador.frequency.setValueAtTime(nota, en);
      oscilador.detune.setValueAtTime(desafinado, en);
      mezcla.gain.setValueAtTime(1 / (ACORDE_AMBIENTE.length * 2), en);
      oscilador.connect(mezcla);
      mezcla.connect(filtro);
      fuentes.push(oscilador);
    }
  }
  for (const fuente of fuentes) fuente.start(en);

  let apagado = false;
  return {
    atenuar: (objetivo) => {
      if (apagado) return;
      nivel.gain.setTargetAtTime(objetivo, audio.currentTime, 0.25);
    },
    apagar: (segundos) => {
      if (apagado) return;
      apagado = true;
      const ahora = audio.currentTime;
      general.gain.cancelScheduledValues(ahora);
      general.gain.setValueAtTime(Math.max(general.gain.value, SILENCIO), ahora);
      general.gain.exponentialRampToValueAtTime(SILENCIO, ahora + segundos);
      for (const fuente of fuentes) fuente.stop(ahora + segundos + 0.05);
    },
  };
};
