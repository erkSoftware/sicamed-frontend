export type EventoProveedor = {
  type?: string;
  delta?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  error?: { message?: string; type?: string };
};

export type ClaseEvento =
  | "herramienta"
  | "transcripcion"
  | "habla-inicia"
  | "habla-termina"
  | "respuesta-inicia"
  | "respuesta-termina"
  | "error"
  | "ignorado";

export const clasificarEvento = (tipo: string | undefined): ClaseEvento => {
  const clave = tipo ?? "";
  if (clave.endsWith("function_call_arguments.done")) return "herramienta";
  if (clave.endsWith("audio_transcript.delta")) return "transcripcion";
  if (clave === "input_audio_buffer.speech_started") return "habla-inicia";
  if (clave === "input_audio_buffer.speech_stopped") return "habla-termina";
  if (clave.endsWith("response.created")) return "respuesta-inicia";
  if (clave.endsWith("response.done")) return "respuesta-termina";
  if (clave === "error") return "error";
  return "ignorado";
};

export const leerEvento = (dato: unknown): EventoProveedor | null => {
  if (typeof dato !== "string") return null;
  try {
    const valor: unknown = JSON.parse(dato);
    if (typeof valor !== "object" || valor === null) return null;
    return valor as EventoProveedor;
  } catch {
    return null;
  }
};
