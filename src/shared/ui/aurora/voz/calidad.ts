export const BITRATE_RESISTENTE = 20000;

export const RETRASO_DE_ESCUCHA = 0.2;

export const PERDIDA_TOLERADA = 0.03;

export const IDA_Y_VUELTA_TOLERADA = 0.4;

export const CADENCIA_DE_MEDIDA = 5000;

export type Lectura = {
  perdidos: number;
  recibidos: number;
  idaYVuelta: number;
};

export type Informe = {
  type?: string;
  kind?: string;
  state?: string;
  packetsLost?: number;
  packetsReceived?: number;
  currentRoundTripTime?: number;
};

export const LECTURA_EN_BLANCO: Lectura = { perdidos: 0, recibidos: 0, idaYVuelta: 0 };

const OPUS = /a=rtpmap:(\d+) opus\/[^\r\n]*/iu;

const conRedundancia = (parametros: string): string => {
  const ajustados = new Map<string, string>();
  for (const trozo of parametros.split(";")) {
    const limpio = trozo.trim();
    if (limpio === "") continue;
    const igual = limpio.indexOf("=");
    if (igual < 0) ajustados.set(limpio, "");
    else ajustados.set(limpio.slice(0, igual), limpio.slice(igual + 1));
  }
  ajustados.set("useinbandfec", "1");
  ajustados.set("stereo", "0");
  ajustados.set("maxaveragebitrate", String(BITRATE_RESISTENTE));
  return [...ajustados]
    .map(([clave, valor]) => (valor === "" ? clave : `${clave}=${valor}`))
    .join(";");
};

export const opusResistente = (sdp: string): string => {
  const encontrado = OPUS.exec(sdp);
  const carga = encontrado?.[1];
  if (!encontrado || !carga) return sdp;

  const fmtp = new RegExp(`a=fmtp:${carga} ([^\\r\\n]*)`, "u");
  if (fmtp.test(sdp)) {
    return sdp.replace(fmtp, (_, parametros: string) => `a=fmtp:${carga} ${conRedundancia(parametros)}`);
  }
  return sdp.replace(OPUS, (linea) => `${linea}\r\na=fmtp:${carga} ${conRedundancia("")}`);
};

export const leerInformes = (informes: readonly Informe[]): Lectura => {
  const lectura = { ...LECTURA_EN_BLANCO };
  for (const informe of informes) {
    if (informe.type === "inbound-rtp" && informe.kind === "audio") {
      lectura.perdidos = informe.packetsLost ?? 0;
      lectura.recibidos = informe.packetsReceived ?? 0;
    }
    if (informe.type === "candidate-pair" && informe.state === "succeeded") {
      lectura.idaYVuelta = informe.currentRoundTripTime ?? 0;
    }
  }
  return lectura;
};

export const tasaDePerdida = (previa: Lectura, actual: Lectura): number => {
  const perdidos = Math.max(0, actual.perdidos - previa.perdidos);
  const recibidos = Math.max(0, actual.recibidos - previa.recibidos);
  const total = perdidos + recibidos;
  return total === 0 ? 0 : perdidos / total;
};

export const enlaceDebil = (previa: Lectura, actual: Lectura): boolean =>
  tasaDePerdida(previa, actual) > PERDIDA_TOLERADA || actual.idaYVuelta > IDA_Y_VUELTA_TOLERADA;

export const alargarBufer = (pc: RTCPeerConnection): void => {
  if (typeof pc.getReceivers !== "function") return;
  const receptor = pc
    .getReceivers()
    .find((candidato) => candidato.track?.kind === "audio") as
    | (RTCRtpReceiver & { playoutDelayHint?: number })
    | undefined;
  if (receptor && "playoutDelayHint" in receptor) receptor.playoutDelayHint = RETRASO_DE_ESCUCHA;
};

export const vigilarCalidad = (
  pc: RTCPeerConnection,
  alCambiar: (debil: boolean) => void,
): (() => void) => {
  if (typeof pc.getStats !== "function" || typeof window === "undefined") return () => undefined;

  let vigente = true;
  let previa = LECTURA_EN_BLANCO;

  const medir = async () => {
    const informes: Informe[] = [];
    try {
      const reporte = await pc.getStats();
      reporte.forEach((informe) => informes.push(informe as Informe));
    } catch {
      return;
    }
    if (!vigente) return;
    const actual = leerInformes(informes);
    alCambiar(enlaceDebil(previa, actual));
    previa = actual;
  };

  const temporizador = window.setInterval(() => void medir(), CADENCIA_DE_MEDIDA);

  return () => {
    vigente = false;
    window.clearInterval(temporizador);
  };
};
