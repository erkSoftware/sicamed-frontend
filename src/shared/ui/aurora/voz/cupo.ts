import { minutos } from "../../../api/mock/configuracionAsistente";
import { fechaHora } from "../../../i18n/formato";
import type { BloqueoAsistente, EstadoLlamadasAsistente } from "../../../api/mock/tipos";

export type Veda = {
  titulo: string;
  detalle: string;
};

export const sinTopeDiario = (estado: EstadoLlamadasAsistente): boolean =>
  estado.limiteDiarioSegundos === 0;

export const cupoDelDia = (estado: EstadoLlamadasAsistente): string | null => {
  if (sinTopeDiario(estado)) return null;
  if (estado.restanteDiarioSegundos <= 0) return "Sin cupo de voz para hoy";
  return `Te quedan ${minutos(estado.restanteDiarioSegundos)} de cupo hoy`;
};

const autorDelBloqueo = (bloqueo: BloqueoAsistente): string =>
  bloqueo.creadoPor === "sistema" || bloqueo.creadoPor === ""
    ? "Lo puso el sistema por exceso de intentos de llamada"
    : `Lo puso ${bloqueo.creadoPorNombre || bloqueo.creadoPor}`;

const vigenciaDelBloqueo = (expiraEn: string | null): string =>
  expiraEn === null
    ? "No tiene fecha de vencimiento: solo lo levanta quien administra el asistente."
    : `Vence el ${fechaHora(expiraEn)}.`;

export const vedaDelCupo = (estado: EstadoLlamadasAsistente): Veda | null => {
  if (estado.puedeLlamar) return null;

  if (estado.bloqueo) {
    return {
      titulo: "Tu cuenta tiene la voz bloqueada",
      detalle: `Motivo: ${estado.bloqueo.motivo}. ${vigenciaDelBloqueo(
        estado.bloqueo.expiraEn,
      )} ${autorDelBloqueo(estado.bloqueo)}.`,
    };
  }

  if (!sinTopeDiario(estado) && estado.restanteDiarioSegundos <= 0) {
    return {
      titulo: "Se agotó tu tiempo de voz de hoy",
      detalle:
        "El cupo se cuenta por día y no se recupera reintentando. Vuelve mañana: el resto del " +
        "sistema funciona igual.",
    };
  }

  return {
    titulo: "Aurora no está disponible ahora",
    detalle:
      "La entidad tiene la voz apagada o sin configurar. No es un error tuyo y no se arregla " +
      "reintentando.",
  };
};
