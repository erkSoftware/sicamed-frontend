import { leerEvento } from "./eventos";
import type { EventoProveedor } from "./eventos";
import type { SesionAsistente } from "../../../api/clienteAsistente";

export type ClaseFallo =
  | "sin-microfono"
  | "permiso-negado"
  | "microfono-ocupado"
  | "proveedor"
  | "red";

export class FalloVoz extends Error {
  readonly clase: ClaseFallo;

  readonly estado?: number;

  constructor(clase: ClaseFallo, estado?: number) {
    super(clase);
    this.name = "FalloVoz";
    this.clase = clase;
    this.estado = estado;
  }
}

export type Conexion = {
  pc: RTCPeerConnection;
  canal: RTCDataChannel;
  microfono: MediaStream;
};

export type OpcionesConexion = {
  microfono: MediaStream;
  alPistaRemota: (flujo: MediaStream) => void;
  alEvento: (evento: EventoProveedor, canal: RTCDataChannel) => void;
  alCaer: () => void;
};

export const claseDeFalloDeMedios = (motivo: unknown): ClaseFallo => {
  const nombre = motivo instanceof Error ? motivo.name : "";
  if (nombre === "NotAllowedError" || nombre === "SecurityError") return "permiso-negado";
  if (nombre === "NotReadableError" || nombre === "AbortError") return "microfono-ocupado";
  return "sin-microfono";
};

export const pedirMicrofono = async (): Promise<MediaStream> => {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new FalloVoz("sin-microfono");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (motivo) {
    throw new FalloVoz(claseDeFalloDeMedios(motivo));
  }
};

export const conectar = async (
  sesion: SesionAsistente,
  opciones: OpcionesConexion,
): Promise<Conexion> => {
  const pc = new RTCPeerConnection();

  pc.ontrack = (evento) => {
    const [flujo] = evento.streams;
    if (flujo) opciones.alPistaRemota(flujo);
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") opciones.alCaer();
  };

  opciones.microfono.getTracks().forEach((pista) => pc.addTrack(pista, opciones.microfono));

  const canal = pc.createDataChannel("oai-events");
  canal.onmessage = (evento: MessageEvent) => {
    const dato = leerEvento(evento.data);
    if (dato) opciones.alEvento(dato, canal);
  };
  canal.onopen = () => canal.send(JSON.stringify({ type: "response.create" }));

  await pc.setLocalDescription(await pc.createOffer());

  let respuesta: Response;
  try {
    respuesta = await fetch(sesion.urlWebrtc, {
      method: "POST",
      body: pc.localDescription?.sdp ?? "",
      headers: {
        Authorization: `Bearer ${sesion.clientSecret}`,
        "Content-Type": "application/sdp",
      },
    });
  } catch {
    pc.close();
    throw new FalloVoz("red");
  }

  if (!respuesta.ok) {
    pc.close();
    throw new FalloVoz("proveedor", respuesta.status);
  }

  await pc.setRemoteDescription({ type: "answer", sdp: await respuesta.text() });
  return { pc, canal, microfono: opciones.microfono };
};

export const responderHerramienta = (
  canal: RTCDataChannel,
  llamada: string,
  resultado: unknown,
): void => {
  if (canal.readyState !== "open") return;
  canal.send(
    JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: llamada,
        output: JSON.stringify(resultado),
      },
    }),
  );
  canal.send(JSON.stringify({ type: "response.create" }));
};

export const cortarRespuesta = (canal: RTCDataChannel): void => {
  if (canal.readyState !== "open") return;
  canal.send(JSON.stringify({ type: "response.cancel" }));
};

export const desconectar = (conexion: Conexion | null): void => {
  if (!conexion) return;
  conexion.canal.onmessage = null;
  conexion.canal.onopen = null;
  conexion.canal.close();
  conexion.microfono.getTracks().forEach((pista) => pista.stop());
  conexion.pc.getSenders().forEach((emisor) => emisor.track?.stop());
  conexion.pc.ontrack = null;
  conexion.pc.onconnectionstatechange = null;
  conexion.pc.close();
};
