let contexto: AudioContext | null = null;

export const abrirAudio = (): AudioContext | null => {
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
