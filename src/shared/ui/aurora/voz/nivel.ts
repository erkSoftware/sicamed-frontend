export type Medidor = {
  nivel: () => number;
  desechar: () => void;
};

const PISO = 0.08;

const RANGO = 0.42;

export const normalizarRms = (rms: number): number => {
  if (!Number.isFinite(rms) || rms <= 0) return 0;
  const curva = (Math.sqrt(rms) - PISO) / RANGO;
  return Math.min(1, Math.max(0, curva));
};

export const seguir = (actual: number, destino: number, ataque: number, caida: number): number => {
  const factor = destino > actual ? ataque : caida;
  const paso = Math.min(1, Math.max(0, factor));
  return actual + (destino - actual) * paso;
};

export const crearMedidor = (contexto: AudioContext, flujo: MediaStream): Medidor => {
  const fuente = contexto.createMediaStreamSource(flujo);
  const analizador = contexto.createAnalyser();
  analizador.fftSize = 1024;
  analizador.smoothingTimeConstant = 0.55;
  fuente.connect(analizador);
  const muestras = new Uint8Array(analizador.fftSize);

  return {
    nivel: () => {
      analizador.getByteTimeDomainData(muestras);
      let suma = 0;
      for (let indice = 0; indice < muestras.length; indice += 1) {
        const desvio = ((muestras[indice] ?? 128) - 128) / 128;
        suma += desvio * desvio;
      }
      return normalizarRms(Math.sqrt(suma / muestras.length));
    },
    desechar: () => {
      fuente.disconnect();
      analizador.disconnect();
    },
  };
};
