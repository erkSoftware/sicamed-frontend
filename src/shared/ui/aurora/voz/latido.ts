import { latirLlamadaAsistente } from "../../../api/clienteAsistente";
import { ErrorApi } from "../../../api/problemDetails";

export const INTERVALO_LATIDO = 15_000;

export const latidoDefinitivo = (motivo: unknown): boolean =>
  motivo instanceof ErrorApi && motivo.problema.status === 404;

export const empezarLatido = (llamadaId: string, alMorir: () => void): (() => void) => {
  if (llamadaId === "" || typeof window === "undefined") return () => undefined;

  let vigente = true;
  let temporizador = 0;

  const parar = () => {
    vigente = false;
    window.clearInterval(temporizador);
  };

  const pulso = async () => {
    try {
      const latido = await latirLlamadaAsistente(llamadaId);
      if (!vigente || latido.vive) return;
      parar();
      alMorir();
    } catch (motivo) {
      if (!vigente || !latidoDefinitivo(motivo)) return;
      parar();
      alMorir();
    }
  };

  temporizador = window.setInterval(() => void pulso(), INTERVALO_LATIDO);
  return parar;
};
