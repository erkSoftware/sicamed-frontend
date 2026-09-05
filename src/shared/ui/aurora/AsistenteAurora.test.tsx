import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
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

let ultimoCanal: ReturnType<typeof canalFalso> | null = null;

const abrirCanal = () => {
  ultimoCanal = canalFalso();
  return ultimoCanal;
};

const canalVivo = () => {
  if (!ultimoCanal) throw new Error("no se abrió el canal de datos");
  return ultimoCanal;
};

const avisarCanal = (evento: { data: string }) => {
  (canalVivo().onmessage as ((mensaje: { data: string }) => void) | null)?.(evento);
};

const abrirCanalDeDatos = () => {
  (canalVivo().onopen as (() => void) | null)?.();
};

const enviados = () =>
  canalVivo().send.mock.calls.map(
    (registro) => JSON.parse(String(registro[0])) as Record<string, unknown>,
  );

const conexionFalsa = () => ({
  ontrack: null as unknown,
  onconnectionstatechange: null as unknown,
  connectionState: "connected",
  localDescription: { type: "offer", sdp: "v=0 oferta" },
  addTrack: vi.fn(),
  createDataChannel: vi.fn(abrirCanal),
  createOffer: vi.fn(async () => ({ type: "offer", sdp: "v=0 oferta" })),
  setLocalDescription: vi.fn(async () => undefined),
  setRemoteDescription: vi.fn(async () => undefined),
  getSenders: () => [],
  close: vi.fn(),
});

const CONSULTA = {
  nombre: "consultar_lotes_por_vencer",
  clase: "consulta",
  descripcion: "Consulta qué lotes vencen",
  confirmacionPrevia: false,
  parametros: {
    type: "object",
    properties: { dias: { type: "integer", minimum: 1, maximum: 365 } },
    required: ["dias"],
    additionalProperties: false,
  },
};

const NEGOCIO = {
  nombre: "registrar_acta",
  clase: "negocio",
  descripcion: "Levanta un acta de transformación",
  confirmacionPrevia: true,
  parametros: {
    type: "object",
    properties: { lote: { type: "string", description: "Código del lote." } },
    required: ["lote"],
    additionalProperties: false,
  },
};

let herramientasDeSesion: readonly unknown[] = [];

const SESION = {
  id: "sess_prueba",
  clientSecret: "ek_prueba",
  expiraEn: new Date(Date.now() + 600_000).toISOString(),
  modelo: "gpt-realtime",
  urlWebrtc: "https://api.openai.com/v1/realtime/calls",
  llamadaId: "lla_prueba",
  resumenEntidad: "Cupo de plantas: 1.200 disponibles de 5.000.",
};

const llamadaDeHerramienta = (nombre: string, argumentos: string) => ({
  data: JSON.stringify({
    type: "response.function_call_arguments.done",
    name: nombre,
    call_id: "call_9xKq2",
    arguments: argumentos,
  }),
});

const ESTADO_LIBRE = {
  puedeLlamar: true,
  consumidoSegundos: 0,
  llamadasHoy: 0,
  limiteDiarioSegundos: 600,
  restanteDiarioSegundos: 600,
  duracionMaximaSegundos: 300,
  bloqueo: null,
};

const BLOQUEO = {
  id: "BLQ-0001",
  usuario: "USR-0007",
  usuarioNombre: "Laura Restrepo Ossa",
  motivo: "Exceso de intentos de llamada",
  tipo: "temporary",
  iniciaEn: "2026-09-01T00:00:00Z",
  expiraEn: "2026-10-01T00:00:00Z",
  activo: true,
  creadoPor: "sistema",
  creadoPorNombre: "",
  creadoEn: "2026-09-01T00:00:00Z",
  desbloqueadoEn: null,
  desbloqueadoPor: "",
  desbloqueadoPorNombre: "",
};

const ESTADO_BLOQUEADO = { ...ESTADO_LIBRE, puedeLlamar: false, bloqueo: BLOQUEO };

let estadoDeLlamadas: unknown = ESTADO_LIBRE;
let respuestaDeSesion: unknown = null;
let respuestaDeDesbloqueo: unknown = null;

const problema = (status: number, type: string, detail: string) => ({
  ok: false,
  status,
  headers: new Headers(),
  json: async () => ({ type, title: "Título", detail, status }),
});

const respuestaDeRed = (url: string) => {
  if (url.endsWith("/desbloqueo")) {
    return (
      respuestaDeDesbloqueo ?? {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({ ...BLOQUEO, activo: false, desbloqueadoEn: "2026-09-02T00:00:00Z" }),
      }
    );
  }
  if (url.endsWith("/asistente/llamadas/estado")) {
    return { ok: true, status: 200, headers: new Headers(), json: async () => estadoDeLlamadas };
  }
  if (url.endsWith("/asistente/sesiones")) {
    return (
      respuestaDeSesion ?? {
        ok: true,
        status: 201,
        headers: new Headers(),
        json: async () => ({ ...SESION, herramientas: herramientasDeSesion }),
      }
    );
  }
  if (url.includes("/asistente/herramientas/")) {
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({
        ok: true,
        resumen: "Cuatro lotes vencen en los próximos 30 días.",
        datos: { total: 4, lotes: [{ codigo: "LT-0091" }] },
      }),
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

const red = vi.fn(
  async (...argumentos: Parameters<typeof fetch>) =>
    respuestaDeRed(String(argumentos[0])) as unknown as Response,
);

const llamadasA = (fragmento: string) =>
  red.mock.calls
    .filter((registro) => String(registro[0]).includes(fragmento))
    .map((registro) => ({ url: String(registro[0]), opciones: registro[1] }));

const llamadaA = (fragmento: string) => {
  const encontrada = llamadasA(fragmento)[0];
  if (!encontrada) throw new Error(`no hubo llamada de red a ${fragmento}`);
  return encontrada;
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

const enMovil = () => {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches: consulta.includes("max-width: 640px"),
    media: consulta,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
};

const asistente = () => document.querySelector(".aurora-asistente");

beforeEach(() => {
  marcarPresentada();
  ultimoCanal = null;
  herramientasDeSesion = [];
  estadoDeLlamadas = ESTADO_LIBRE;
  respuestaDeSesion = null;
  respuestaDeDesbloqueo = null;
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
  useAurora.setState({
    visible: false,
    mensajes: [],
    vozDisponible: true,
    conexionDebil: false,
    falloVoz: null,
    reintentoDesde: 0,
  });
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

  it("le manda al proveedor la nota de pantalla en cuanto abre el canal", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    act(() => {
      abrirCanalDeDatos();
    });

    const nota = enviados().find((mensaje) => mensaje.type === "conversation.item.create");
    expect(nota).toMatchObject({
      item: { type: "message", role: "system" },
    });
    expect(JSON.stringify(nota)).toContain("Pantalla:");
  });

  it("pinta el resumen de la entidad como foto del inicio y no lo reenvía", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    expect(await screen.findByText(/Al iniciar la llamada/)).toBeInTheDocument();
    expect(screen.getByText(/1\.200 disponibles de 5\.000/)).toBeInTheDocument();
    expect(JSON.stringify(enviados())).not.toContain("1.200 disponibles");
  });

  it("ejecuta una consulta, devuelve solo el resumen y la anota en la bitácora", async () => {
    herramientasDeSesion = [CONSULTA];
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    act(() => {
      avisarCanal(llamadaDeHerramienta("consultar_lotes_por_vencer", '{"dias":30}'));
    });

    await waitFor(() =>
      expect(llamadasA("/asistente/herramientas/consultar_lotes_por_vencer")).toHaveLength(1),
    );
    const cuerpo = JSON.parse(
      String(llamadaA("/asistente/herramientas/consultar_lotes_por_vencer").opciones?.body),
    );
    expect(cuerpo).toEqual({
      llamadaId: "lla_prueba",
      argumentos: { dias: 30 },
      callId: "call_9xKq2",
    });

    await waitFor(() =>
      expect(
        enviados().some(
          (mensaje) =>
            (mensaje.item as { type?: string } | undefined)?.type === "function_call_output",
        ),
      ).toBe(true),
    );
    const salida = enviados().find(
      (mensaje) => (mensaje.item as { type?: string } | undefined)?.type === "function_call_output",
    );
    const devuelto = String((salida?.item as { output?: string }).output);
    expect(JSON.parse(devuelto)).toEqual({
      ok: true,
      resumen: "Cuatro lotes vencen en los próximos 30 días.",
    });
    expect(devuelto).not.toContain("LT-0091");

    expect(await screen.findByText("Lo que hice")).toBeInTheDocument();
    expect(screen.getByText(/Cuatro lotes vencen/)).toBeInTheDocument();
  });

  it("no manda a escribir nada sin firma, y avisa al modelo de que no se autorizó", async () => {
    herramientasDeSesion = [NEGOCIO];
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    act(() => {
      avisarCanal(llamadaDeHerramienta("registrar_acta", '{"lote":"LT-0091"}'));
    });

    expect(await screen.findByText(/Aurora va a escribir en SICAMED/)).toBeInTheDocument();
    expect(screen.getByText("Código del lote")).toBeInTheDocument();
    expect(screen.getByText("LT-0091")).toBeInTheDocument();
    expect(llamadasA("/asistente/herramientas/registrar_acta")).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: /No autorizo/ }));

    await waitFor(() =>
      expect(
        enviados().some(
          (mensaje) =>
            (mensaje.item as { type?: string } | undefined)?.type === "function_call_output",
        ),
      ).toBe(true),
    );
    const salida = enviados().find(
      (mensaje) => (mensaje.item as { type?: string } | undefined)?.type === "function_call_output",
    );
    expect(JSON.parse(String((salida?.item as { output?: string }).output))).toEqual({
      ok: false,
      motivo: "el usuario no confirmó",
    });
    expect(llamadasA("/asistente/herramientas/registrar_acta")).toHaveLength(0);
  });

  it("no ejecuta la herramienta que el catálogo no concedió", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    act(() => {
      avisarCanal(llamadaDeHerramienta("registrar_acta", '{"lote":"LT-0091"}'));
    });

    await waitFor(() =>
      expect(
        enviados().some(
          (mensaje) =>
            (mensaje.item as { type?: string } | undefined)?.type === "function_call_output",
        ),
      ).toBe(true),
    );
    expect(llamadasA("/asistente/herramientas/")).toHaveLength(0);
  });

  it("pide el micrófono y entra en conversación con solo abrir el panel", async () => {
    montar();
    await abrirPanel();

    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
    });
    expect(await screen.findByText(/Te escucho/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Terminar/ })).toBeInTheDocument();
  });

  it("pide la sesión al borde y canjea el SDP contra la url que devuelve", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    expect(llamadaA("/asistente/sesiones").url).toContain(
      "/api/v1/comercial/asistente/sesiones",
    );

    const canje = llamadaA(SESION.urlWebrtc);
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

    await waitFor(() => expect(llamadasA("/cierre")).toHaveLength(1));
    const cierre = llamadaA("/cierre");
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

describe("cuando la red flaquea", () => {
  it("avisa de la conexión débil sin dar la conversación por perdida", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    act(() => useAurora.getState().fijarConexionDebil(true));

    expect(screen.getByText(/conexión va débil/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Terminar/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hablar con Aurora/ })).not.toBeInTheDocument();
  });

  it("mientras reconecta lo dice y pide que no se cuelgue", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    act(() => {
      useAurora.getState().fijarVoz("reconectando");
      useAurora.getState().fijarConexionDebil(true);
    });

    expect(screen.getByText(/Restableciendo la conversación/)).toBeInTheDocument();
    expect(screen.getByText(/No cuelgues/)).toBeInTheDocument();
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
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));
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
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));
  });
});

describe("el cupo se consulta antes de abrir el micrófono", () => {
  it("pregunta por el estado antes de pedir una sesión", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    const estado = llamadaA("/asistente/llamadas/estado");
    expect(estado.opciones?.method ?? "GET").toBe("GET");
    expect(red.mock.calls.findIndex((registro) => String(registro[0]).includes("/estado"))).toBe(0);
  });

  it("colgar releé el cupo y no vuelve a abrir la sesión por su cuenta", async () => {
    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    await userEvent.click(screen.getByRole("button", { name: /Terminar/ }));
    await waitFor(() => expect(llamadasA("/asistente/llamadas/estado")).toHaveLength(2));

    expect(llamadasA("/asistente/sesiones")).toHaveLength(1);
    expect(useAurora.getState().voz).toBe("inactiva");
    expect(screen.getByRole("button", { name: /Hablar con Aurora/ })).toBeEnabled();
  });

  it("una cuenta bloqueada no gasta ni un intento y ve el motivo con su fecha", async () => {
    estadoDeLlamadas = ESTADO_BLOQUEADO;

    montar();
    await abrirPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent(/voz bloqueada/i);
    expect(screen.getByRole("alert")).toHaveTextContent(/Exceso de intentos de llamada/);
    expect(screen.getByRole("alert")).toHaveTextContent(/exceso de intentos/i);
    expect(llamadasA("/asistente/sesiones")).toHaveLength(0);
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Hablar con Aurora/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reintentar/ })).not.toBeInTheDocument();
  });

  it("quien administra los bloqueos se levanta el suyo desde el propio panel", async () => {
    estadoDeLlamadas = ESTADO_BLOQUEADO;

    montar(["asistente:sesion:abrir", "asistente:llamadas:gestionar"]);
    await abrirPanel();

    const levantar = await screen.findByRole("button", { name: /Levantar mi bloqueo/ });
    estadoDeLlamadas = ESTADO_LIBRE;
    await userEvent.click(levantar);

    await waitFor(() => expect(llamadasA("/asistente/bloqueos/")).toHaveLength(1));
    expect(llamadaA("/asistente/bloqueos/").url).toContain("/BLQ-0001/desbloqueo");
    expect(llamadaA("/asistente/bloqueos/").opciones?.method).toBe("POST");

    expect(await screen.findByRole("button", { name: /Hablar con Aurora/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(llamadasA("/asistente/sesiones")).toHaveLength(0);
  });

  it("sin el permiso de gestionar bloqueos el panel no ofrece levantarlo", async () => {
    estadoDeLlamadas = ESTADO_BLOQUEADO;

    montar();
    await abrirPanel();

    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: /Levantar mi bloqueo/ })).not.toBeInTheDocument();
  });

  it("si debajo quedaba otro bloqueo lo dice en vez de fingir que ya puede hablar", async () => {
    estadoDeLlamadas = ESTADO_BLOQUEADO;

    montar(["asistente:sesion:abrir", "asistente:llamadas:gestionar"]);
    await abrirPanel();

    const levantar = await screen.findByRole("button", { name: /Levantar mi bloqueo/ });
    estadoDeLlamadas = {
      ...ESTADO_BLOQUEADO,
      bloqueo: { ...BLOQUEO, id: "BLQ-0009" },
    };
    await userEvent.click(levantar);

    expect(await screen.findByText(/hay otro encima creado después/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hablar con Aurora/ })).not.toBeInTheDocument();
  });

  it("el cupo agotado se explica sin invitar a repetir la apertura", async () => {
    estadoDeLlamadas = { ...ESTADO_LIBRE, puedeLlamar: false, restanteDiarioSegundos: 0 };

    montar();
    await abrirPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent(/tiempo de voz de hoy/i);
    expect(llamadasA("/asistente/sesiones")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /Hablar con Aurora/ })).not.toBeInTheDocument();
  });

  it("sin tope diario no anuncia cero minutos de cupo", async () => {
    estadoDeLlamadas = {
      ...ESTADO_LIBRE,
      limiteDiarioSegundos: 0,
      restanteDiarioSegundos: 0,
    };

    montar();
    await abrirPanel();
    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    expect(screen.queryByText(/sin límite de cupo hoy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 min de cupo/i)).not.toBeInTheDocument();
  });
});

describe("los rechazos no se reintentan solos", () => {
  it("un 403 de bloqueo no deja ningún botón que vuelva a abrir sesión", async () => {
    respuestaDeSesion = problema(
      403,
      "https://sicamed.co/problemas/asistente-usuario-bloqueado",
      "Su cuenta tiene la voz bloqueada hasta el 2026-10-01.",
    );

    montar();
    await abrirPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent(/voz bloqueada/i);
    expect(screen.queryByRole("button", { name: /Reintentar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hablar con Aurora/ })).not.toBeInTheDocument();
    expect(llamadasA("/asistente/sesiones")).toHaveLength(1);
  });

  it("el 503 del proveedor deja reintentar, pero no antes de treinta segundos", async () => {
    respuestaDeSesion = problema(
      503,
      "https://sicamed.co/problemas/proveedor-realtime-no-disponible",
      "El proveedor de voz no respondió.",
    );

    montar();
    await abrirPanel();

    const boton = await screen.findByRole("button", { name: /Reintentar en/ });
    expect(boton).toBeDisabled();
    expect(boton).toHaveTextContent(/Reintentar en 30 s/);
    expect(llamadasA("/asistente/sesiones")).toHaveLength(1);

    await userEvent.click(boton);
    expect(llamadasA("/asistente/sesiones")).toHaveLength(1);
  });

  it("en móvil enseña en pantalla que la conversación se está abriendo", async () => {
    enMovil();
    montar();
    await abrirPanel();

    await waitFor(() => expect(useAurora.getState().voz).toBe("escuchando"));

    expect(screen.getByRole("status")).toHaveClass("aurora-cinta__estado");
    expect(screen.getByText(/Te escucho/)).toBeInTheDocument();
    expect(asistente()).toHaveAttribute("data-enlazando", "no");
    expect(document.querySelector(".aurora-cinta__hilo")).not.toBeInTheDocument();

    act(() => {
      useAurora.getState().fijarVoz("conectando");
    });

    expect(screen.getByText(/Abriendo la conversación/)).toBeInTheDocument();
    expect(asistente()).toHaveAttribute("data-enlazando", "si");
    expect(document.querySelector(".aurora-cinta__hilo")).toBeInTheDocument();
  });
});
