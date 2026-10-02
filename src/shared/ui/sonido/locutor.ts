const UMBRAL_SILENCIO = 0.012;
const MARGEN_RECORTE = 0.04;
const FUNDIDO_INTERRUPCION = 0.03;

export type Recorte = { desde: number; duracion: number };

export const recortarSilencio = (muestras: Float32Array, frecuencia: number): Recorte => {
  let primera = 0;
  while (primera < muestras.length && Math.abs(muestras[primera] ?? 0) < UMBRAL_SILENCIO)
    primera += 1;
  let ultima = muestras.length - 1;
  while (ultima > primera && Math.abs(muestras[ultima] ?? 0) < UMBRAL_SILENCIO) ultima -= 1;
  if (primera >= muestras.length) return { desde: 0, duracion: muestras.length / frecuencia };
  const desde = Math.max(0, primera / frecuencia - MARGEN_RECORTE);
  const hasta = Math.min(muestras.length / frecuencia, ultima / frecuencia + MARGEN_RECORTE);
  return { desde, duracion: hasta - desde };
};

type Pista = { buffer: AudioBuffer; recorte: Recorte };

type Pendiente<Clave> = { clave: Clave; pedidaEn: number; paciente: boolean };

export type OpcionesDecir = {
  interrumpir?: boolean;
  paciente?: boolean;
};

export type Locutor<Clave extends string> = {
  precargar: (claves: readonly Clave[]) => void;
  decir: (clave: Clave, opciones?: OpcionesDecir) => void;
  callar: () => void;
  hablando: () => boolean;
};

type OpcionesLocutor<Clave extends string> = {
  audio: AudioContext;
  salida: AudioNode;
  ruta: (clave: Clave) => string;
  esperaMaxima: number;
  alHablar?: (hablando: boolean) => void;
  alDecir?: (clave: Clave, segundos: number) => void;
};

export const crearLocutor = <Clave extends string>({
  audio,
  salida,
  ruta,
  esperaMaxima,
  alHablar,
  alDecir,
}: OpcionesLocutor<Clave>): Locutor<Clave> => {
  const pistas = new Map<Clave, Promise<Pista | null>>();
  const cola: Pendiente<Clave>[] = [];
  let actual: { fuente: AudioBufferSourceNode; volumen: GainNode } | null = null;
  let cargando = false;
  let turno = 0;

  const cargar = (clave: Clave): Promise<Pista | null> => {
    const guardada = pistas.get(clave);
    if (guardada) return guardada;
    const promesa = (async () => {
      try {
        const respuesta = await fetch(ruta(clave));
        if (!respuesta.ok) return null;
        const buffer = await audio.decodeAudioData(await respuesta.arrayBuffer());
        return { buffer, recorte: recortarSilencio(buffer.getChannelData(0), buffer.sampleRate) };
      } catch {
        return null;
      }
    })();
    pistas.set(clave, promesa);
    return promesa;
  };

  const avanzar = async (): Promise<void> => {
    if (actual || cargando) return;
    const siguiente = cola.shift();
    if (!siguiente) return;
    if (!siguiente.paciente && performance.now() - siguiente.pedidaEn > esperaMaxima)
      return avanzar();
    const miTurno = turno;
    cargando = true;
    const pista = await cargar(siguiente.clave);
    if (miTurno !== turno) return;
    cargando = false;
    if (!pista) return avanzar();
    const fuente = audio.createBufferSource();
    const volumen = audio.createGain();
    fuente.buffer = pista.buffer;
    fuente.connect(volumen);
    volumen.connect(salida);
    fuente.onended = () => {
      if (actual?.fuente !== fuente) return;
      actual = null;
      alHablar?.(false);
      void avanzar();
    };
    actual = { fuente, volumen };
    alHablar?.(true);
    fuente.start(audio.currentTime, pista.recorte.desde, pista.recorte.duracion);
    alDecir?.(siguiente.clave, pista.recorte.duracion);
  };

  const callar = () => {
    turno += 1;
    cola.length = 0;
    cargando = false;
    const saliente = actual;
    actual = null;
    if (!saliente) return;
    alHablar?.(false);
    try {
      const ahora = audio.currentTime;
      saliente.volumen.gain.setTargetAtTime(0, ahora, FUNDIDO_INTERRUPCION);
      saliente.fuente.stop(ahora + FUNDIDO_INTERRUPCION * 5);
    } catch {
      return;
    }
  };

  return {
    precargar: (claves) => {
      for (const clave of claves) void cargar(clave);
    },
    decir: (clave, opciones = {}) => {
      if (opciones.interrumpir) callar();
      cola.push({ clave, pedidaEn: performance.now(), paciente: opciones.paciente ?? false });
      void avanzar();
    },
    callar,
    hablando: () => actual !== null || cargando || cola.length > 0,
  };
};
