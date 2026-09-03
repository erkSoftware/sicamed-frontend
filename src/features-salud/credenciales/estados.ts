import type { TonoInsignia } from "../../shared/ui/primitivos/Insignia";
import type { EstadoCredencial, NivelVerificacion } from "../../shared/api/mock/datosClinicos";

export const TONO_CREDENCIAL: Readonly<Record<EstadoCredencial, TonoInsignia>> = {
  ACTIVA: "exito",
  SUSPENDIDA: "alerta",
  VENCIDA: "neutro",
  REVOCADA: "peligro",
};

export const ETIQUETA_CREDENCIAL: Readonly<Record<EstadoCredencial, string>> = {
  ACTIVA: "Activa",
  SUSPENDIDA: "Suspendida",
  VENCIDA: "Vencida",
  REVOCADA: "Revocada",
};

export const ETIQUETA_NIVEL: Readonly<Record<NivelVerificacion, string>> = {
  DOCUMENTO: "Documento cotejado",
  PRESENCIAL: "Presencial en IPS",
  BIOMETRICO: "Biométrica",
};

export const OPCIONES_NIVEL = (Object.keys(ETIQUETA_NIVEL) as NivelVerificacion[]).map((valor) => ({
  valor,
  etiqueta: ETIQUETA_NIVEL[valor],
}));
