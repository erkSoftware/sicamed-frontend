import type { TonoInsignia } from "../../shared/ui/primitivos/Insignia";
import type { EstadoPrescripcion, TipoUsuario } from "../../shared/api/mock/datosClinicos";

export const TONO_PRESCRIPCION: Readonly<Record<EstadoPrescripcion, TonoInsignia>> = {
  EMITIDA: "acento",
  VIGENTE: "exito",
  DISPENSADA_PARCIAL: "alerta",
  DISPENSADA: "info",
  ANULADA: "peligro",
  VENCIDA: "neutro",
};

export const ETIQUETA_PRESCRIPCION: Readonly<Record<EstadoPrescripcion, string>> = {
  EMITIDA: "Emitida",
  VIGENTE: "Vigente",
  DISPENSADA_PARCIAL: "Dispensada en parte",
  DISPENSADA: "Dispensada",
  ANULADA: "Anulada",
  VENCIDA: "Vencida",
};

export const ETIQUETA_TIPO_USUARIO: Readonly<Record<TipoUsuario, string>> = {
  CONTRIBUTIVO: "Contributivo",
  SUBSIDIADO: "Subsidiado",
  PARTICULAR: "Particular",
  REGIMEN_ESPECIAL: "Régimen especial",
};

export const OPCIONES_TIPO_USUARIO = (
  Object.keys(ETIQUETA_TIPO_USUARIO) as TipoUsuario[]
).map((valor) => ({ valor, etiqueta: ETIQUETA_TIPO_USUARIO[valor] }));
