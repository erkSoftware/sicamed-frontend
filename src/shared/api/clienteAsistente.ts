import { construirUrl, solicitar } from "./transporte";

export type ClaseHerramienta = "ui" | "consulta" | "negocio";

export type HerramientaAsistente = {
  nombre: string;
  clase: ClaseHerramienta;
  descripcion: string;
  confirmacionPrevia: boolean;
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
