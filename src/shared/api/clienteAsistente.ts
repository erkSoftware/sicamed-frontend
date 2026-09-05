import { construirUrl, solicitar } from "./transporte";

export type ClaseHerramienta = "ui" | "consulta" | "negocio";

export type PropiedadDeEsquema = {
  type?: string;
  description?: string;
  enum?: readonly (string | number)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: PropiedadDeEsquema;
};

export type EsquemaHerramienta = {
  type?: string;
  properties?: Readonly<Record<string, PropiedadDeEsquema>>;
  required?: readonly string[];
  additionalProperties?: boolean;
};

export type HerramientaAsistente = {
  nombre: string;
  clase: ClaseHerramienta;
  descripcion: string;
  confirmacionPrevia: boolean;
  parametros?: EsquemaHerramienta;
};

export type SesionAsistente = {
  id: string;
  clientSecret: string;
  expiraEn: string;
  modelo: string;
  urlWebrtc: string;
  herramientas: readonly HerramientaAsistente[];
  llamadaId?: string;
  duracionMaximaSegundos?: number;
  avisoEnSegundos?: number;
  mensajeAviso?: string;
  restanteDiarioSegundos?: number;
  resumenEntidad?: string;
  demostracion?: boolean;
};

export type ContextoAsistente = {
  ruta?: string;
  pantalla?: string;
};

export type MotivoCierre = "user_ended" | "completed" | "connection_error" | "system_error";

export type LatidoLlamada = {
  vive: boolean;
  expiraEn?: string;
  restanteSegundos?: number;
};

export const cuerpoDeApertura = (
  contexto: ContextoAsistente,
  reanudaLlamadaId = "",
): { contexto: ContextoAsistente; reanudaLlamadaId?: string } =>
  /^[A-Za-z0-9_-]+$/u.test(reanudaLlamadaId) ? { contexto, reanudaLlamadaId } : { contexto };

export const abrirSesionAsistente = async (
  contexto: ContextoAsistente = {},
  reanudaLlamadaId = "",
): Promise<SesionAsistente> =>
  solicitar<SesionAsistente>("comercial", "/asistente/sesiones", {
    metodo: "POST",
    cuerpo: cuerpoDeApertura(contexto, reanudaLlamadaId),
  });

export type RespuestaHerramienta = {
  ok: boolean;
  resumen?: string;
  datos?: unknown;
};

export type CuerpoDeHerramienta = {
  llamadaId: string;
  argumentos?: Readonly<Record<string, unknown>>;
  callId?: string;
  tokenConfirmacion?: string;
};

export const NOMBRE_DE_HERRAMIENTA = /^[A-Za-z0-9_-]{1,64}$/u;

export const cuerpoDeHerramienta = (
  llamadaId: string,
  argumentos: Readonly<Record<string, unknown>>,
  callId = "",
): CuerpoDeHerramienta => ({
  llamadaId,
  ...(Object.keys(argumentos).length > 0 ? { argumentos } : {}),
  ...(/^[A-Za-z0-9_-]+$/u.test(callId) ? { callId } : {}),
});

export const ejecutarHerramientaAsistente = async (
  nombre: string,
  cuerpo: CuerpoDeHerramienta,
): Promise<RespuestaHerramienta> =>
  solicitar<RespuestaHerramienta>("comercial", `/asistente/herramientas/${nombre}`, {
    metodo: "POST",
    cuerpo,
  });

export const latirLlamadaAsistente = async (llamadaId: string): Promise<LatidoLlamada> =>
  solicitar<LatidoLlamada>("comercial", `/asistente/llamadas/${llamadaId}/latido`, {
    metodo: "POST",
  });

export const cuerpoDeCierre = (
  motivo: MotivoCierre,
  callId = "",
): { motivo: MotivoCierre; callId?: string } =>
  /^[A-Za-z0-9_-]+$/u.test(callId) ? { motivo, callId } : { motivo };

export const cerrarLlamadaAsistente = async (
  llamadaId: string,
  motivo: MotivoCierre,
  callId = "",
): Promise<void> => {
  if (!llamadaId) return;
  try {
    await solicitar<void>("comercial", `/asistente/llamadas/${llamadaId}/cierre`, {
      metodo: "POST",
      cuerpo: cuerpoDeCierre(motivo, callId),
    });
  } catch {
    return;
  }
};

export const despedirLlamadaAsistente = (
  llamadaId: string,
  motivo: MotivoCierre,
  callId = "",
): void => {
  if (!llamadaId) return;
  const url = construirUrl("comercial", `/asistente/llamadas/${llamadaId}/cierre`).toString();
  const cuerpo = JSON.stringify(cuerpoDeCierre(motivo, callId));
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(url, new Blob([cuerpo], { type: "application/json" }));
    return;
  }
  void cerrarLlamadaAsistente(llamadaId, motivo, callId);
};
