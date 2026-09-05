import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAurora } from "../almacen";
import { INTERVALO_LATIDO } from "./latido";
import { BITRATE_RESISTENTE, CADENCIA_DE_MEDIDA } from "./calidad";
import { iniciarConversacion, terminarConversacion } from "./motor";

const SDP_OFERTA = [
  "v=0",
  "m=audio 9 UDP/TLS/RTP/SAVPF 111",
  "a=rtpmap:111 opus/48000/2",
  "a=fmtp:111 minptime=10;useinbandfec=1",
  "",
].join("\r\n");

type Descripcion = { type: string; sdp?: string };

type ConexionFalsa = {
  ontrack: null | ((evento: unknown) => void);
  oniceconnectionstatechange: null | (() => void);
  onconnectionstatechange: null | (() => void);
  iceConnectionState: string;
  connectionState: string;
  localDescription: Descripcion | null;
  close: () => void;
};

const pista = () => ({ stop: vi.fn(), kind: "audio" });

const flujoFalso = () => {
  const pistas = [pista()];
  return { getTracks: () => pistas } as unknown as MediaStream;
};

const analizadorFalso = () => ({
  fftSize: 1024,
  smoothingTimeConstant: 0.55,
  frequencyBinCount: 512,
  connect: vi.fn(),
  disconnect: vi.fn(),
  getByteTimeDomainData: (muestras: Uint8Array) => muestras.fill(128),
});

const contextoAudioFalso = vi.fn(() => ({
  state: "running",
  resume: vi.fn(),
  close: vi.fn(),
  createMediaStreamSource: () => ({ connect: vi.fn(), disconnect: vi.fn() }),
  createAnalyser: analizadorFalso,
}));

const canalFalso = () => ({
  readyState: "open",
  send: vi.fn(),
  close: vi.fn(),
  onmessage: null as unknown,
  onopen: null as unknown,
});

let conexiones: ConexionFalsa[] = [];

const conexionFalsa = () => {
  const pc: ConexionFalsa = {
    ontrack: null,
    oniceconnectionstatechange: null,
    onconnectionstatechange: null,
    iceConnectionState: "connected",
    connectionState: "connected",
    localDescription: null,
    close: vi.fn(),
  };
  const completa = {
    ...pc,
    addTrack: vi.fn(),
    createDataChannel: vi.fn(canalFalso),
    createOffer: vi.fn(async () => ({ type: "offer", sdp: SDP_OFERTA })),
    setLocalDescription: vi.fn(async (descripcion: Descripcion) => {
      completa.localDescription = descripcion;
    }),
    setRemoteDescription: vi.fn(async () => undefined),
    getSenders: () => [],
    getReceivers: () => [{ track: { kind: "audio" }, playoutDelayHint: 0 }],
    getStats: vi.fn(async () => new Map()),
  };
  conexiones.push(completa);
  return completa;
};

const ultimaConexion = (): ConexionFalsa => {
  const encontrada = conexiones[conexiones.length - 1];
  if (!encontrada) throw new Error("no se abrió ninguna conexión de audio");
  return encontrada;
};

const sesion = (llamadaId: string) => ({
  id: `sess_${llamadaId}`,
  clientSecret: "ek_prueba",
  expiraEn: new Date(Date.now() + 600_000).toISOString(),
  modelo: "gpt-realtime",
  urlWebrtc: "https://api.openai.com/v1/realtime/calls",
  herramientas: [],
  llamadaId,
});

let sesionesServidas = 0;
let sesionRota = false;
let freno: Promise<void> | null = null;
let latidos: unknown[] = [];

const deferido = () => {
  let abrir: () => void = () => undefined;
  const promesa = new Promise<void>((seguir) => {
    abrir = seguir;
  });
  return { promesa, abrir: () => abrir() };
};

const problema = (status: number, type: string) => ({
  ok: false,
  status,
  headers: new Headers(),
  json: async () => ({ type, title: "Título", detail: "Detalle", status }),
});

const respuestaDeRed = (url: string) => {
  if (url.endsWith("/latido")) {
    const siguiente = latidos.shift() ?? { vive: true, restanteSegundos: 200 };
    if (siguiente instanceof Error) throw siguiente;
    if (siguiente === 404) {
      return problema(404, "https://sicamed.co/problemas/asistente-llamada-desconocida");
    }
    return { ok: true, status: 200, headers: new Headers(), json: async () => siguiente };
  }
  if (url.endsWith("/asistente/sesiones")) {
    if (sesionRota && sesionesServidas > 0) {
      return problema(503, "https://sicamed.co/problemas/proveedor-realtime-no-disponible");
    }
    sesionesServidas += 1;
    return {
      ok: true,
      status: 201,
      headers: new Headers(),
      json: async () => sesion(sesionesServidas === 1 ? "lla_uno" : `lla_${sesionesServidas}`),
    };
  }
  if (url.endsWith("/cierre")) {
    return { ok: true, status: 204, headers: new Headers() };
  }
  return {
    ok: true,
    status: 200,
    headers: new Headers({ Location: "/v1/realtime/calls/rtc_abc-123" }),
    text: async () => "v=0 respuesta",
  };
};

const red = vi.fn(async (...argumentos: Parameters<typeof fetch>) => {
  const url = String(argumentos[0]);
  if (freno && url.endsWith("/asistente/sesiones")) await freno;
  return respuestaDeRed(url) as unknown as Response;
});

const llamadasA = (fragmento: string) =>
  red.mock.calls
    .filter((registro) => String(registro[0]).includes(fragmento))
    .map((registro) => ({ url: String(registro[0]), opciones: registro[1] }));

const cuerpoDe = (fragmento: string, indice = 0) => {
  const encontrada = llamadasA(fragmento)[indice];
  if (!encontrada) throw new Error(`no hubo llamada de red a ${fragmento}`);
  return JSON.parse(String(encontrada.opciones?.body)) as Record<string, unknown>;
};

const audioFalso = () =>
  ({
    play: vi.fn(async () => undefined),
    pause: vi.fn(),
    srcObject: null,
    volume: 1,
  }) as unknown as HTMLAudioElement;

const conversar = async () => {
  await iniciarConversacion({
    audio: audioFalso(),
    navegar: () => undefined,
    permisos: [],
    ruta: () => "/app",
  });
};

const caerse = async (estado: string) => {
  const pc = ultimaConexion();
  pc.iceConnectionState = estado;
  pc.oniceconnectionstatechange?.();
  await vi.advanceTimersByTimeAsync(0);
};

beforeEach(() => {
  vi.useFakeTimers();
  conexiones = [];
  latidos = [];
  sesionesServidas = 0;
  sesionRota = false;
  freno = null;
  red.mockClear();
  vi.stubGlobal("AudioContext", contextoAudioFalso);
  vi.stubGlobal("RTCPeerConnection", vi.fn(conexionFalsa));
  vi.stubGlobal("fetch", red);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => flujoFalso()) },
  });
});

afterEach(() => {
  terminarConversacion();
  useAurora.setState({ voz: "inactiva", falloVoz: null, conexionDebil: false, mensajes: [] });
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("el latido de la llamada", () => {
  it("late cada quince segundos contra la llamada que abrió el servidor", async () => {
    await conversar();
    expect(useAurora.getState().voz).toBe("escuchando");
    expect(llamadasA("/latido")).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(INTERVALO_LATIDO);
    expect(llamadasA("/latido")).toHaveLength(1);
    expect(llamadasA("/latido")[0]?.url).toContain("/asistente/llamadas/lla_uno/latido");
    expect(llamadasA("/latido")[0]?.opciones?.method).toBe("POST");

    await vi.advanceTimersByTimeAsync(INTERVALO_LATIDO * 2);
    expect(llamadasA("/latido")).toHaveLength(3);
  });

  it("un latido perdido por red no corta la conversación: para eso hay tolerancia", async () => {
    latidos = [new Error("sin red"), new Error("sin red")];
    await conversar();

    await vi.advanceTimersByTimeAsync(INTERVALO_LATIDO * 3);

    expect(llamadasA("/latido")).toHaveLength(3);
    expect(useAurora.getState().voz).toBe("escuchando");
    expect(llamadasA("/cierre")).toHaveLength(0);
  });

  it("un 404 desmonta la llamada y deja de latir", async () => {
    latidos = [404];
    await conversar();

    await vi.advanceTimersByTimeAsync(INTERVALO_LATIDO);
    expect(useAurora.getState().voz).toBe("fallo");

    await vi.advanceTimersByTimeAsync(INTERVALO_LATIDO * 3);
    expect(llamadasA("/latido")).toHaveLength(1);
  });

  it("vive: false es el fin normal de la llamada, no un error del usuario", async () => {
    latidos = [{ vive: false }];
    await conversar();

    await vi.advanceTimersByTimeAsync(INTERVALO_LATIDO);

    const estado = useAurora.getState();
    expect(estado.voz).toBe("fallo");
    expect(estado.falloVoz?.reintentable).toBe(true);
    expect(estado.falloVoz?.titulo).toMatch(/servidor/i);
  });

  it("colgar para el latido en el acto", async () => {
    await conversar();
    terminarConversacion();

    await vi.advanceTimersByTimeAsync(INTERVALO_LATIDO * 3);
    expect(llamadasA("/latido")).toHaveLength(0);
  });
});

describe("disconnected no es failed", () => {
  it("una caída transitoria avisa en pantalla y no toca la sesión", async () => {
    await conversar();
    await caerse("disconnected");

    expect(useAurora.getState().conexionDebil).toBe(true);
    expect(useAurora.getState().voz).toBe("escuchando");
    expect(llamadasA("/asistente/sesiones")).toHaveLength(1);
    expect(llamadasA("/cierre")).toHaveLength(0);
  });

  it("la medida de calidad no borra el aviso mientras la ruta sigue caída", async () => {
    await conversar();
    await caerse("disconnected");
    await vi.advanceTimersByTimeAsync(CADENCIA_DE_MEDIDA * 2);

    expect(useAurora.getState().conexionDebil).toBe(true);

    await caerse("connected");
    expect(useAurora.getState().conexionDebil).toBe(false);
  });
});

describe("reconectar sin gastar cupo de insistencia", () => {
  it("declara la llamada caída y no la cierra a mano", async () => {
    await conversar();
    await caerse("failed");

    expect(useAurora.getState().voz).toBe("reconectando");
    expect(useAurora.getState().conexionDebil).toBe(true);

    await vi.advanceTimersByTimeAsync(2000);

    expect(llamadasA("/asistente/sesiones")).toHaveLength(2);
    expect(cuerpoDe("/asistente/sesiones", 1)).toEqual({
      contexto: {},
      reanudaLlamadaId: "lla_uno",
    });
    expect(llamadasA("/cierre")).toHaveLength(0);
    expect(useAurora.getState().voz).toBe("escuchando");
    expect(useAurora.getState().conexionDebil).toBe(false);
  });

  it("el latido sigue vivo sobre la llamada nueva, no sobre la caída", async () => {
    await conversar();
    await caerse("failed");
    await vi.advanceTimersByTimeAsync(2000);

    await vi.advanceTimersByTimeAsync(INTERVALO_LATIDO);
    expect(llamadasA("/latido")).toHaveLength(1);
    expect(llamadasA("/latido")[0]?.url).toContain("/lla_2/latido");
  });

  it("se rinde a los tres intentos y cierra la caída para no cobrarla entera", async () => {
    await conversar();
    sesionRota = true;
    await caerse("failed");

    await vi.advanceTimersByTimeAsync(20_000);

    expect(llamadasA("/asistente/sesiones")).toHaveLength(4);
    expect(useAurora.getState().voz).toBe("fallo");
    expect(useAurora.getState().falloVoz?.titulo).toMatch(/No se pudo restablecer/);

    const cierres = llamadasA("/cierre");
    expect(cierres).toHaveLength(1);
    expect(cierres[0]?.url).toContain("/asistente/llamadas/lla_uno/cierre");
    expect(cuerpoDe("/cierre")).toEqual({ motivo: "connection_error", callId: "rtc_abc-123" });
  });

  it("un enlace que parpadea no reconecta sin techo dentro de la misma conversación", async () => {
    await conversar();

    for (let vuelta = 0; vuelta < 3; vuelta += 1) {
      await caerse("failed");
      await vi.advanceTimersByTimeAsync(2000);
    }

    expect(useAurora.getState().voz).toBe("escuchando");
    expect(llamadasA("/asistente/sesiones")).toHaveLength(4);

    await caerse("failed");
    await vi.advanceTimersByTimeAsync(20_000);

    expect(llamadasA("/asistente/sesiones")).toHaveLength(4);
    expect(useAurora.getState().voz).toBe("fallo");
    expect(llamadasA("/cierre")).toHaveLength(1);
  });

  it("colgar durante la reconexión la abandona sin abrir sesiones nuevas", async () => {
    await conversar();
    await caerse("failed");
    terminarConversacion();

    await vi.advanceTimersByTimeAsync(20_000);
    expect(llamadasA("/asistente/sesiones")).toHaveLength(1);
  });
});

describe("colgar mientras la sesión se está abriendo", () => {
  it("cierra la llamada que llegó tarde en vez de dejarla hablando sola", async () => {
    const cerrojo = deferido();
    freno = cerrojo.promesa;

    const apertura = conversar();
    await vi.advanceTimersByTimeAsync(0);
    expect(useAurora.getState().voz).toBe("conectando");

    terminarConversacion();
    freno = null;
    cerrojo.abrir();
    await apertura;

    expect(useAurora.getState().voz).toBe("inactiva");
    expect(conexiones).toHaveLength(0);
    expect(llamadasA("/cierre")).toHaveLength(1);
    expect(cuerpoDe("/cierre")).toEqual({ motivo: "user_ended" });
  });

  it("volver a entrar de una abre la nueva y no se pierde detrás de la anterior", async () => {
    const cerrojo = deferido();
    freno = cerrojo.promesa;

    const primera = conversar();
    await vi.advanceTimersByTimeAsync(0);
    terminarConversacion();

    const segunda = conversar();
    freno = null;
    cerrojo.abrir();
    await primera;
    await segunda;

    expect(useAurora.getState().voz).toBe("escuchando");
    expect(llamadasA("/asistente/sesiones")).toHaveLength(2);
    expect(conexiones).toHaveLength(1);
    expect(llamadasA("/cierre")).toHaveLength(1);
  });

  it("la conversación nueva no arrastra lo que dijo la anterior", async () => {
    await conversar();
    useAurora.getState().cerrarTurnoDeVoz("Le queda un minuto de conversación.");
    terminarConversacion();

    await conversar();

    expect(useAurora.getState().mensajes).toHaveLength(0);
    expect(useAurora.getState().transcripcion).toBe("");
  });
});

describe("el audio se pide preparado para la pérdida", () => {
  it("la oferta que sale lleva FEC y bitrate bajo", async () => {
    await conversar();

    const canje = llamadasA("https://api.openai.com")[0];
    expect(String(canje?.opciones?.body)).toContain(`maxaveragebitrate=${BITRATE_RESISTENTE}`);
    expect(String(canje?.opciones?.body)).toContain("useinbandfec=1");
  });
});
