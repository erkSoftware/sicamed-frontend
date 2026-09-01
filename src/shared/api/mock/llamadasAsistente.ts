import type { BloqueoAsistente, TipoBloqueoAsistente } from "./tipos";

export type MotivoCierreLlamada = "user_ended" | "completed" | "connection_error" | "system_error";

export const MOTIVOS_DE_CIERRE: readonly MotivoCierreLlamada[] = [
  "user_ended",
  "completed",
  "connection_error",
  "system_error",
];

export const MOTIVOS_DEL_SERVIDOR: readonly string[] = ["time_limit", "daily_limit", "blocked"];

export const ETIQUETA_TIPO_BLOQUEO: Record<TipoBloqueoAsistente, string> = {
  temporary: "Temporal",
  permanent: "Permanente",
};

export type SituacionBloqueo = "activo" | "vencido" | "levantado";

export const situacionDeBloqueo = (
  bloqueo: BloqueoAsistente,
  referencia: Date = new Date(),
): SituacionBloqueo => {
  if (bloqueo.desbloqueadoEn) return "levantado";
  if (bloqueo.tipo === "temporary" && bloqueo.expiraEn) {
    const vence = new Date(bloqueo.expiraEn).getTime();
    if (Number.isFinite(vence) && vence <= referencia.getTime()) return "vencido";
  }
  return bloqueo.activo ? "activo" : "vencido";
};

export const ETIQUETA_SITUACION: Record<SituacionBloqueo, string> = {
  activo: "Activo",
  vencido: "Vencido",
  levantado: "Levantado",
};

export const esAutomatico = (bloqueo: BloqueoAsistente): boolean =>
  bloqueo.creadoPor.toLowerCase() === "sistema";

export const nombreDelBloqueado = (bloqueo: BloqueoAsistente): string =>
  bloqueo.usuarioNombre || bloqueo.usuario;

export const nombreDeQuienBloqueo = (bloqueo: BloqueoAsistente): string =>
  bloqueo.creadoPorNombre || bloqueo.creadoPor;

export const nombreDeQuienLevanto = (bloqueo: BloqueoAsistente): string =>
  bloqueo.desbloqueadoPorNombre || bloqueo.desbloqueadoPor;

const enDias = (dias: number): string =>
  new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

export const BLOQUEOS_ASISTENTE: readonly BloqueoAsistente[] = [
  {
    id: "BLQ-0001",
    usuario: "USR-0007",
    usuarioNombre: "Laura Restrepo Ossa",
    motivo: "Exceso de intentos de llamada",
    tipo: "temporary",
    iniciaEn: enDias(-2),
    expiraEn: enDias(28),
    activo: true,
    creadoPor: "sistema",
    creadoPorNombre: "",
    creadoEn: enDias(-2),
    desbloqueadoEn: null,
    desbloqueadoPor: "",
    desbloqueadoPorNombre: "",
  },
  {
    id: "BLQ-0002",
    usuario: "USR-0012",
    usuarioNombre: "Andrés Felipe Quintero",
    motivo: "Uso indebido reportado por la mesa de servicio",
    tipo: "permanent",
    iniciaEn: enDias(-40),
    expiraEn: null,
    activo: true,
    creadoPor: "USR-0001",
    creadoPorNombre: "Diego Fernando Marín",
    creadoEn: enDias(-40),
    desbloqueadoEn: null,
    desbloqueadoPor: "",
    desbloqueadoPorNombre: "",
  },
  {
    id: "BLQ-0003",
    usuario: "USR-0004",
    usuarioNombre: "",
    motivo: "Exceso de intentos de llamada",
    tipo: "temporary",
    iniciaEn: enDias(-70),
    expiraEn: enDias(-40),
    activo: false,
    creadoPor: "sistema",
    creadoPorNombre: "",
    creadoEn: enDias(-70),
    desbloqueadoEn: enDias(-55),
    desbloqueadoPor: "USR-0001",
    desbloqueadoPorNombre: "Diego Fernando Marín",
  },
];
