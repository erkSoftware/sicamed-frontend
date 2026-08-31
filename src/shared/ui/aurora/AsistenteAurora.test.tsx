import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { AsistenteAurora } from "./AsistenteAurora";
import { useAurora } from "./almacen";
import { terminarConversacion } from "./voz/motor";
import { marcarPresentada, olvidarPresentacion } from "./PresentacionAurora";
import { ContextoAuth } from "../../auth/contexto";
import type { ValorAuth } from "../../auth/contexto";
import type { Permiso } from "../../auth/tipos";

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

const conexionFalsa = () => ({
  ontrack: null as unknown,
  onconnectionstatechange: null as unknown,
  connectionState: "connected",
  localDescription: { type: "offer", sdp: "v=0 oferta" },
  addTrack: vi.fn(),
  createDataChannel: vi.fn(canalFalso),
  createOffer: vi.fn(async () => ({ type: "offer", sdp: "v=0 oferta" })),
  setLocalDescription: vi.fn(async () => undefined),
  setRemoteDescription: vi.fn(async () => undefined),
  getSenders: () => [],
  close: vi.fn(),
});

const SESION = {
  id: "sess_prueba",
  clientSecret: "ek_prueba",
  expiraEn: new Date(Date.now() + 600_000).toISOString(),
  modelo: "gpt-realtime",
  urlWebrtc: "https://api.openai.com/v1/realtime/calls",
  herramientas: [],
  llamadaId: "lla_prueba",
};

const respuestaDeRed = (url: string) => {
  if (url.endsWith("/asistente/sesiones")) {
    return { ok: true, status: 201, headers: new Headers(), json: async () => SESION };
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

const red = vi.fn(
  async (...argumentos: Parameters<typeof fetch>) =>
    respuestaDeRed(String(argumentos[0])) as unknown as Response,
);

const llamadaDeRed = (indice: number) => {
  const registro = red.mock.calls[indice];
  if (!registro) throw new Error(`no hubo llamada de red ${indice}`);
  return { url: String(registro[0]), opciones: registro[1] };
};

const autorizacion = (permisos: readonly Permiso[]): ValorAuth =>
  ({
    estado: "autenticado",
    sesion: null,
    sesionReal: null,
    permisos,
    iniciarSesion: async () => null,
    cerrarSesion: async () => undefined,
    error: null,
    rechazo: null,
    perfilAdoptado: null,
    puedeAdoptarPerfil: false,
    adoptarPerfil: () => undefined,
  }) as unknown as ValorAuth;

const montar = (permisos: readonly Permiso[] = ["asistente:sesion:abrir"]) => {
  const envoltorio = ({ children }: { children: ReactNode }) => (
    <ContextoAuth.Provider value={autorizacion(permisos)}>
      <MemoryRouter>{children}</MemoryRouter>
    </ContextoAuth.Provider>
  );
  return render(<AsistenteAurora />, { wrapper: envoltorio });
};

const abrirPanel = async () => {
  await userEvent.click(screen.getByRole("button", { name: /Abrir a Aurora/ }));
};

beforeEach(() => {
  marcarPresentada();
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
  useAurora.setState({ visible: false, mensajes: [], vozDisponible: true, falloVoz: null });
  vi.unstubAllGlobals();
});

describe("AsistenteAurora", () => {
  it("no abre el micrófono a quien no puede abrir sesión", async () => {
    montar([]);
    await abrirPanel();
    expect(screen.queryByRole("button", { name: /Hablar con Aurora/ })).not.toBeInTheDocument();
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(useAurora.getState().voz).toBe("inactiva");
    expect(screen.getByText(/Aurora no abre voz con tu perfil/)).toBeInTheDocument();
    expect(screen.getByText(/no tiene habilitada la conversación por voz/)).toBeInTheDocument();
    expect(screen.queryByText(/Aurora está en silencio/)).not.toBeInTheDocument();
  });

  it("pide el micrófono y entra en conversación con solo abrir el panel", async () => {
    montar();
    await abrirPanel();

    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    expect(await screen.findByText(/Te escucho/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Terminar/ })).toBeInTheDocument();
  });

  it("pide la sesión al borde y canjea el SDP contra la url que devuelve", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    expect(llamadaDeRed(0).url).toContain("/api/v1/comercial/asistente/sesiones");

    const canje = llamadaDeRed(1);
    expect(canje.url).toBe(`${SESION.urlWebrtc}?model=${SESION.modelo}`);
    expect(canje.opciones?.body).toBe("v=0 oferta");

    const cabeceras = canje.opciones?.headers as Record<string, string>;
    expect(cabeceras["Content-Type"]).toBe("application/sdp");
    expect(cabeceras.Authorization).toBe(`Bearer ${SESION.clientSecret}`);
  });

  it("cierra el registro de la llamada con el identificador que devolvió el proveedor", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    await userEvent.click(screen.getByRole("button", { name: /Terminar/ }));

    await waitFor(() => expect(red.mock.calls.length).toBeGreaterThan(2));
    const cierre = llamadaDeRed(2);
    expect(cierre.url).toContain("/asistente/llamadas/lla_prueba/cierre");
    expect(JSON.parse(String(cierre.opciones?.body))).toEqual({
      motivo: "user_ended",
      callId: "rtc_abc-123",
    });
  });

  it("explica el permiso negado sin culpar al usuario y deja reintentar", async () => {
    const negado = new Error("denegado");
    negado.name = "NotAllowedError";
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => Promise.reject(negado)) },
    });

    montar();
    await abrirPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent(/permiso del micrófono/i);
    expect(screen.getByRole("button", { name: /Reintentar/ })).toBeInTheDocument();
    expect(useAurora.getState().voz).toBe("fallo");
  });

  it("apaga el micrófono al cerrar el panel", async () => {
    const flujo = flujoFalso();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => flujo) },
    });

    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    await userEvent.click(screen.getByRole("button", { name: /Cerrar el panel de Aurora/ }));

    await waitFor(() => expect(useAurora.getState().voz).toBe("inactiva"));
    flujo.getTracks().forEach((pistaViva) => expect(pistaViva.stop).toHaveBeenCalled());
  });
});

describe("la primera vez que se toca a Aurora", () => {
  it("explica lo que puede hacer antes de abrir el micrófono", async () => {
    olvidarPresentacion();
    montar();
    await abrirPanel();

    expect(screen.getByRole("heading", { name: "Habla con AURORA" })).toBeInTheDocument();
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(useAurora.getState().visible).toBe(false);
  });

  it("salir de la presentación deja a Aurora abierta, no la cierra", async () => {
    olvidarPresentacion();
    montar();
    await abrirPanel();
    await userEvent.click(screen.getByRole("button", { name: /Salir de la presentación/ }));

    expect(screen.queryByRole("heading", { name: "Habla con AURORA" })).not.toBeInTheDocument();
    expect(useAurora.getState().visible).toBe(true);
  });

  it("después de verla una vez, tocar a Aurora abre la conversación directamente", async () => {
    olvidarPresentacion();
    montar();
    await abrirPanel();
    await userEvent.click(screen.getByRole("button", { name: /Salir de la presentación/ }));
    await userEvent.click(screen.getByRole("button", { name: /Cerrar a Aurora/ }));

    await abrirPanel();
    expect(screen.queryByRole("heading", { name: "Habla con AURORA" })).not.toBeInTheDocument();
    expect(useAurora.getState().visible).toBe(true);
  });
});
