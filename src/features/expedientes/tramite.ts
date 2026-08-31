import type {
  EstadoDocumento,
  EstadoExpediente,
  EstadoSolicitud,
  PasoVerificacion,
  VeredictoPaso,
} from "../../shared/api/mock/tipos";
import type { TonoInsignia } from "../../shared/ui/primitivos/Insignia";

export type DecisionDocumento = Extract<EstadoDocumento, "APROBADO" | "DEVUELTO" | "RECHAZADO">;

export type VeredictoResoluble = Extract<
  VeredictoPaso,
  "VERIFICADO" | "DEVUELTO" | "RECHAZADO"
>;

export const TONO_EXPEDIENTE: Record<EstadoExpediente, TonoInsignia> = {
  BORRADOR: "neutro",
  RADICADO: "info",
  EN_VERIFICACION: "acento",
  APROBADO: "exito",
  DEVUELTO: "alerta",
  RECHAZADO: "peligro",
};

export const ETIQUETA_EXPEDIENTE: Record<EstadoExpediente, string> = {
  BORRADOR: "Borrador",
  RADICADO: "Radicado",
  EN_VERIFICACION: "En verificación",
  APROBADO: "Aprobado",
  DEVUELTO: "Devuelto para subsanar",
  RECHAZADO: "Rechazado",
};

export const TONO_DOCUMENTO: Record<EstadoDocumento, TonoInsignia> = {
  PENDIENTE: "neutro",
  EN_VERIFICACION: "info",
  APROBADO: "exito",
  DEVUELTO: "alerta",
  RECHAZADO: "peligro",
  VENCIDO: "alerta",
};

export const ETIQUETA_DOCUMENTO: Record<EstadoDocumento, string> = {
  PENDIENTE: "Sin decidir",
  EN_VERIFICACION: "En verificación",
  APROBADO: "Aceptado",
  DEVUELTO: "Devuelto",
  RECHAZADO: "Rechazado",
  VENCIDO: "Vencido",
};

export const TONO_PASO: Record<VeredictoPaso, TonoInsignia> = {
  PENDIENTE: "neutro",
  VERIFICADO: "exito",
  DEVUELTO: "alerta",
  RECHAZADO: "peligro",
};

export const ETIQUETA_PASO: Record<VeredictoPaso, string> = {
  PENDIENTE: "Pendiente",
  VERIFICADO: "Aprobado",
  DEVUELTO: "Devuelto",
  RECHAZADO: "Rechazado",
};

export const TONO_SOLICITUD: Record<EstadoSolicitud, TonoInsignia> = {
  RECIBIDA: "info",
  EN_TRAMITE: "acento",
  APROBADA: "exito",
  RECHAZADA: "peligro",
};

export const ETIQUETA_SOLICITUD: Record<EstadoSolicitud, string> = {
  RECIBIDA: "Sin tramitar",
  EN_TRAMITE: "En trámite",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

export const ETIQUETA_ACTOR = {
  CULTIVADOR: "Cultivador",
  TRANSFORMADOR: "Transformador",
  DISPENSADOR: "Dispensador",
  IPS: "IPS",
  LABORATORIO: "Laboratorio",
} as const;

export const exigeObservacion = (valor: DecisionDocumento | VeredictoResoluble): boolean =>
  valor !== "APROBADO" && valor !== "VERIFICADO";

export const porOrden = (pasos: readonly PasoVerificacion[]): readonly PasoVerificacion[] =>
  [...pasos].sort((uno, otro) => uno.orden - otro.orden);

export const pasoEnTurno = (pasos: readonly PasoVerificacion[]): PasoVerificacion | null =>
  porOrden(pasos).find((paso) => paso.veredicto === "PENDIENTE") ?? null;

export const tramiteCerrado = (estado: EstadoExpediente): boolean =>
  estado === "APROBADO" || estado === "RECHAZADO";

export const resueltosPor = (
  pasos: readonly PasoVerificacion[],
  revisor: string,
): readonly PasoVerificacion[] =>
  pasos.filter((paso) => paso.revisor !== null && paso.revisor === revisor);
