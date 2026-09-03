import { describe, expect, it } from "vitest";
import { clasificarEvento, leerEvento } from "./eventos";
import { normalizarRms, seguir } from "./nivel";
import { envolventeHabla, trocear } from "./demostracion";
import { ESPERA_ENTRE_INTENTOS, diagnosticar } from "./diagnostico";
import { cupoDelDia, vedaDelCupo } from "./cupo";
import { FalloVoz, identificadorDeLlamada, urlDeCanje } from "./sesion";
import {
  BITRATE_RESISTENTE,
  LECTURA_EN_BLANCO,
  enlaceDebil,
  leerInformes,
  opusResistente,
  tasaDePerdida,
} from "./calidad";
import { latidoDefinitivo } from "./latido";
import { esperaDeReintento } from "./motor";
import { cuerpoDeApertura, cuerpoDeCierre } from "../../../api/clienteAsistente";
import { mensajeDeAviso, planDeLlamada } from "./llamada";
import type { SesionAsistente } from "../../../api/clienteAsistente";
import { ErrorApi } from "../../../api/problemDetails";
import { enPerimetro } from "../HaloVoz";

describe("normalizarRms", () => {
  it("deja el silencio en cero y nunca pasa de uno", () => {
    expect(normalizarRms(0)).toBe(0);
    expect(normalizarRms(-1)).toBe(0);
    expect(normalizarRms(Number.NaN)).toBe(0);
    expect(normalizarRms(0.0001)).toBe(0);
    expect(normalizarRms(1)).toBe(1);
    expect(normalizarRms(9)).toBe(1);
  });

  it("crece con el volumen", () => {
    expect(normalizarRms(0.05)).toBeGreaterThan(normalizarRms(0.02));
    expect(normalizarRms(0.2)).toBeGreaterThan(normalizarRms(0.05));
  });
});

describe("seguir", () => {
  it("sube rápido y baja despacio", () => {
    const subida = seguir(0, 1, 0.4, 0.05);
    const bajada = seguir(1, 0, 0.4, 0.05);
    expect(subida).toBeCloseTo(0.4);
    expect(bajada).toBeCloseTo(0.95);
  });

  it("no se pasa del destino con factores fuera de rango", () => {
    expect(seguir(0, 1, 4, 0.05)).toBe(1);
    expect(seguir(1, 0, 0.4, -2)).toBe(1);
  });
});

describe("clasificarEvento", () => {
  it("despacha por sufijo y no por igualdad estricta", () => {
    expect(clasificarEvento("response.function_call_arguments.done")).toBe("herramienta");
    expect(clasificarEvento("conversation.item.function_call_arguments.done")).toBe("herramienta");
    expect(clasificarEvento("response.audio_transcript.delta")).toBe("transcripcion");
    expect(clasificarEvento("response.output_audio_transcript.delta")).toBe("transcripcion");
  });

  it("no confunde el fin de una transcripción con el fin de la respuesta", () => {
    expect(clasificarEvento("response.audio_transcript.done")).toBe("ignorado");
    expect(clasificarEvento("response.done")).toBe("respuesta-termina");
    expect(clasificarEvento("response.created")).toBe("respuesta-inicia");
  });

  it("reconoce la interrupción del usuario y el error", () => {
    expect(clasificarEvento("input_audio_buffer.speech_started")).toBe("habla-inicia");
    expect(clasificarEvento("input_audio_buffer.speech_stopped")).toBe("habla-termina");
    expect(clasificarEvento("error")).toBe("error");
    expect(clasificarEvento(undefined)).toBe("ignorado");
  });
});

describe("leerEvento", () => {
  it("devuelve null ante basura y objeto ante json válido", () => {
    expect(leerEvento("{")).toBeNull();
    expect(leerEvento("null")).toBeNull();
    expect(leerEvento("[1,2]")).not.toBeNull();
    expect(leerEvento(new ArrayBuffer(4))).toBeNull();
    expect(leerEvento('{"type":"error"}')).toEqual({ type: "error" });
  });
});

describe("trocear", () => {
  it("reparte la frase en fragmentos con espacio final", () => {
    const trozos = trocear("uno dos tres cuatro cinco");
    expect(trozos).toHaveLength(3);
    expect(trozos.join("").trim()).toBe("uno dos tres cuatro cinco");
    trozos.forEach((trozo) => expect(trozo.endsWith(" ")).toBe(true));
  });

  it("no produce fragmentos vacíos con espacios de más", () => {
    expect(trocear("  hola   mundo  ")).toEqual(["hola mundo "]);
    expect(trocear("")).toEqual([]);
  });
});

describe("envolventeHabla", () => {
  it("se mantiene dentro del rango dibujable", () => {
    for (let t = 0; t < 6; t += 0.017) {
      const valor = envolventeHabla(t);
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
  });
});

const problema = (status: number, type: string) =>
  new ErrorApi({
    type,
    title: "Título",
    detail: "Detalle",
    status,
  });

describe("diagnosticar", () => {
  it("esconde el micrófono cuando el rol no puede abrir sesión", () => {
    const salida = diagnosticar(problema(403, "https://sicamed.co/problemas/permiso-denegado"));
    expect(salida.vedar).toBe(true);
  });

  it("esconde el micrófono cuando el asistente está apagado en el despliegue", () => {
    const salida = diagnosticar(
      problema(503, "https://sicamed.co/problemas/asistente-deshabilitado"),
    );
    expect(salida.vedar).toBe(true);
    expect(salida.fallo.reintentable).toBe(false);
  });

  it("no esconde el micrófono cuando el proveedor no respondió", () => {
    const salida = diagnosticar(
      problema(503, "https://sicamed.co/problemas/proveedor-realtime-no-disponible"),
    );
    expect(salida.vedar).toBe(false);
    expect(salida.fallo.reintentable).toBe(true);
  });

  it("separa el permiso del micrófono del rechazo del proveedor", () => {
    const negado = diagnosticar(new FalloVoz("permiso-negado"));
    const rechazo = diagnosticar(new FalloVoz("proveedor", 401));
    expect(negado.fallo.titulo).not.toBe(rechazo.fallo.titulo);
    expect(negado.vedar).toBe(false);
    expect(rechazo.fallo.reintentable).toBe(true);
  });

  it("un bloqueo de la cuenta no se lee como un rol sin permiso ni se reintenta", () => {
    const salida = diagnosticar(
      problema(403, "https://sicamed.co/problemas/asistente-usuario-bloqueado"),
    );
    expect(salida.vedar).toBe(false);
    expect(salida.fallo.reintentable).toBe(false);
    expect(salida.fallo.titulo).toContain("bloqueada");
  });

  it("el cupo diario agotado no invita a reintentar hoy", () => {
    const salida = diagnosticar(
      problema(429, "https://sicamed.co/problemas/asistente-limite-diario"),
    );
    expect(salida.fallo.reintentable).toBe(false);
    expect(
      diagnosticar(problema(429, "https://sicamed.co/problemas/demasiadas-peticiones")).fallo
        .reintentable,
    ).toBe(true);
  });

  it("cae en un mensaje propio ante un motivo desconocido", () => {
    expect(diagnosticar(new Error("cualquiera")).fallo.reintentable).toBe(true);
  });

  it("nada de lo que no se arregla repitiéndolo ofrece reintento", () => {
    const irreintentables = [
      problema(403, "https://sicamed.co/problemas/asistente-usuario-bloqueado"),
      problema(429, "https://sicamed.co/problemas/asistente-limite-diario"),
      problema(403, "https://sicamed.co/problemas/permiso-denegado"),
      problema(422, "https://sicamed.co/problemas/configuracion-asistente-invalida"),
      problema(502, "https://sicamed.co/problemas/asistente-credencial-rechazada"),
      problema(503, "https://sicamed.co/problemas/asistente-deshabilitado"),
      problema(503, "https://sicamed.co/problemas/asistente-no-configurado"),
    ];
    irreintentables.forEach((error) => expect(diagnosticar(error).fallo.reintentable).toBe(false));
  });

  it("todo lo que sí se reintenta contra el borde exige esperar entre intentos", () => {
    const conEspera = [
      problema(503, "https://sicamed.co/problemas/proveedor-realtime-no-disponible"),
      problema(503, "https://sicamed.co/problemas/otra-cosa"),
      problema(429, "https://sicamed.co/problemas/demasiadas-peticiones"),
      problema(500, "https://sicamed.co/problemas/error-inesperado"),
    ];
    conEspera.forEach((error) => {
      const { fallo } = diagnosticar(error);
      expect(fallo.reintentable).toBe(true);
      expect(fallo.esperaSegundos).toBeGreaterThanOrEqual(ESPERA_ENTRE_INTENTOS);
    });
  });

  it("un 429 con espera declarada nunca reintenta antes que el servidor", () => {
    const largo = new ErrorApi({
      type: "https://sicamed.co/problemas/demasiadas-peticiones",
      title: "Título",
      detail: "Detalle",
      status: 429,
      reintentarEn: 90,
    });
    expect(diagnosticar(largo).fallo.esperaSegundos).toBe(90);
  });

  it("el permiso del micrófono se reintenta sin espera: no gasta intentos del borde", () => {
    expect(diagnosticar(new FalloVoz("permiso-negado")).fallo.esperaSegundos).toBeUndefined();
    expect(diagnosticar(new FalloVoz("proveedor")).fallo.esperaSegundos).toBe(
      ESPERA_ENTRE_INTENTOS,
    );
  });
});

const estadoBase = {
  puedeLlamar: true,
  consumidoSegundos: 0,
  llamadasHoy: 0,
  limiteDiarioSegundos: 600,
  restanteDiarioSegundos: 600,
  duracionMaximaSegundos: 300,
  bloqueo: null,
};

const bloqueoBase = {
  id: "BLQ-0001",
  usuario: "USR-0007",
  usuarioNombre: "Laura Restrepo",
  motivo: "Exceso de intentos de llamada",
  tipo: "temporary" as const,
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

describe("vedaDelCupo", () => {
  it("quien puede llamar no ve ninguna veda", () => {
    expect(vedaDelCupo(estadoBase)).toBeNull();
  });

  it("el bloqueo se explica con su motivo, su vencimiento y quién lo puso", () => {
    const veda = vedaDelCupo({ ...estadoBase, puedeLlamar: false, bloqueo: bloqueoBase });
    expect(veda?.titulo).toContain("bloqueada");
    expect(veda?.detalle).toContain("Exceso de intentos de llamada");
    expect(veda?.detalle).toContain("exceso de intentos");
  });

  it("un permanente no inventa fecha de vencimiento", () => {
    const veda = vedaDelCupo({
      ...estadoBase,
      puedeLlamar: false,
      bloqueo: {
        ...bloqueoBase,
        expiraEn: null,
        tipo: "permanent",
        creadoPor: "USR-0001",
        creadoPorNombre: "Diego Marín",
      },
    });
    expect(veda?.detalle).toContain("No tiene fecha de vencimiento");
    expect(veda?.detalle).toContain("Diego Marín");
  });

  it("el cupo agotado no se confunde con un bloqueo", () => {
    const veda = vedaDelCupo({ ...estadoBase, puedeLlamar: false, restanteDiarioSegundos: 0 });
    expect(veda?.titulo).toContain("tiempo de voz de hoy");
  });

  it("sin tope diario y sin bloqueo, el no poder llamar es de la entidad", () => {
    const veda = vedaDelCupo({
      ...estadoBase,
      puedeLlamar: false,
      limiteDiarioSegundos: 0,
      restanteDiarioSegundos: 0,
    });
    expect(veda?.titulo).toContain("no está disponible");
  });
});

describe("cupoDelDia", () => {
  it("un cupo de cero segundos declara la ausencia de tope, no la de tiempo", () => {
    expect(cupoDelDia({ ...estadoBase, limiteDiarioSegundos: 0, restanteDiarioSegundos: 0 })).toBeNull();
  });

  it("con tope, dice cuánto queda", () => {
    expect(cupoDelDia({ ...estadoBase, restanteDiarioSegundos: 300 })).toBe(
      "Te quedan 5 min de cupo hoy",
    );
  });
});

describe("enPerimetro", () => {
  it("recorre los cuatro bordes sin salirse del rectángulo", () => {
    for (let paso = 0; paso <= 200; paso += 1) {
      const { x, y } = enPerimetro(paso / 200, 320, 180);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(320);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(180);
      const enBorde = x === 0 || y === 0 || Math.abs(x - 320) < 1e-9 || Math.abs(y - 180) < 1e-9;
      expect(enBorde).toBe(true);
    }
  });

  it("cierra la vuelta y tolera avances negativos o mayores que uno", () => {
    expect(enPerimetro(0, 100, 50)).toEqual(enPerimetro(1, 100, 50));
    expect(enPerimetro(-0.25, 100, 50)).toEqual(enPerimetro(0.75, 100, 50));
    expect(enPerimetro(2.5, 100, 50)).toEqual(enPerimetro(0.5, 100, 50));
  });

  it("toca arriba, derecha, abajo e izquierda en ese orden", () => {
    expect(enPerimetro(0.125, 100, 50)).toEqual({ x: 37.5, y: 0 });
    expect(enPerimetro(0.375, 100, 50)).toEqual({ x: 100, y: 12.5 });
    expect(enPerimetro(0.625, 100, 50)).toEqual({ x: 62.5, y: 50 });
    expect(enPerimetro(0.875, 100, 50)).toEqual({ x: 0, y: 37.5 });
  });
});

const sesionBase: SesionAsistente = {
  id: "sess_1",
  clientSecret: "ek_1",
  expiraEn: "2026-08-31T18:05:00Z",
  modelo: "gpt-realtime",
  urlWebrtc: "https://api.openai.com/v1/realtime/calls",
  herramientas: [],
};

describe("planDeLlamada", () => {
  it("toma el tope y el aviso de la sesión, no de una constante del cliente", () => {
    const plan = planDeLlamada({
      ...sesionBase,
      llamadaId: "3f1c",
      duracionMaximaSegundos: 300,
      avisoEnSegundos: 240,
      mensajeAviso: "Le queda un minuto.",
    });
    expect(plan).toEqual({
      llamadaId: "3f1c",
      duracionSegundos: 300,
      avisoSegundos: 240,
      frase: "Le queda un minuto.",
    });
  });

  it("un aviso en cero no dispara nada", () => {
    const plan = planDeLlamada({
      ...sesionBase,
      duracionMaximaSegundos: 300,
      avisoEnSegundos: 0,
      mensajeAviso: "Le queda un minuto.",
    });
    expect(plan.avisoSegundos).toBeNull();
  });

  it("un aviso sin frase, o que cae después del final, tampoco", () => {
    expect(
      planDeLlamada({ ...sesionBase, duracionMaximaSegundos: 300, avisoEnSegundos: 240 })
        .avisoSegundos,
    ).toBeNull();
    expect(
      planDeLlamada({
        ...sesionBase,
        duracionMaximaSegundos: 300,
        avisoEnSegundos: 300,
        mensajeAviso: "Tarde",
      }).avisoSegundos,
    ).toBeNull();
  });

  it("una sesión sin tope no pinta contador", () => {
    expect(planDeLlamada(sesionBase).duracionSegundos).toBeNull();
    expect(planDeLlamada(sesionBase).llamadaId).toBe("");
  });
});

describe("mensajeDeAviso", () => {
  it("manda la frase del servidor, sin copiarla al cliente", () => {
    const enviado: unknown = JSON.parse(mensajeDeAviso("Le queda un minuto."));
    expect(enviado).toEqual({
      type: "response.create",
      response: { instructions: 'Diga exactamente esto y siga atendiendo: "Le queda un minuto."' },
    });
  });
});

describe("urlDeCanje", () => {
  it("lleva el modelo que declaró la sesión", () => {
    expect(urlDeCanje({ ...sesionBase, modelo: "gpt-realtime" })).toBe(
      "https://api.openai.com/v1/realtime/calls?model=gpt-realtime",
    );
  });

  it("no duplica el modelo ni lo inventa cuando la sesión no lo declara", () => {
    expect(
      urlDeCanje({
        ...sesionBase,
        modelo: "otro",
        urlWebrtc: "https://api.openai.com/v1/realtime/calls?model=gpt-realtime",
      }),
    ).toBe("https://api.openai.com/v1/realtime/calls?model=gpt-realtime");
    expect(urlDeCanje({ ...sesionBase, modelo: "" })).toBe(sesionBase.urlWebrtc);
  });
});

describe("identificadorDeLlamada", () => {
  it("saca el identificador de la cabecera Location", () => {
    const respuesta = new Response("", {
      headers: { Location: "/v1/realtime/calls/rtc_9f2a-BC" },
    });
    expect(identificadorDeLlamada(respuesta)).toBe("rtc_9f2a-BC");
  });

  it("devuelve vacío cuando la cabecera falta o trae algo que el borde rechazaría", () => {
    expect(identificadorDeLlamada(new Response(""))).toBe("");
    expect(
      identificadorDeLlamada(new Response("", { headers: { Location: "/calls/rtc con espacio" } })),
    ).toBe("");
  });
});

describe("cuerpoDeCierre", () => {
  it("manda el cierre sin callId antes que mandarlo vacío", () => {
    expect(cuerpoDeCierre("user_ended")).toEqual({ motivo: "user_ended" });
    expect(cuerpoDeCierre("completed", "rtc_1")).toEqual({ motivo: "completed", callId: "rtc_1" });
  });
});

const SDP_OPUS = [
  "v=0",
  "m=audio 9 UDP/TLS/RTP/SAVPF 111 63",
  "a=rtpmap:111 opus/48000/2",
  "a=fmtp:111 minptime=10;useinbandfec=1",
  "a=rtpmap:63 red/48000/2",
  "",
].join("\r\n");

describe("opusResistente", () => {
  it("pide redundancia y bitrate bajo sobre la carga de opus", () => {
    const ajustado = opusResistente(SDP_OPUS);
    expect(ajustado).toContain(`maxaveragebitrate=${BITRATE_RESISTENTE}`);
    expect(ajustado).toContain("useinbandfec=1");
    expect(ajustado).toContain("stereo=0");
    expect(ajustado).toContain("minptime=10");
    expect(ajustado).toContain("a=rtpmap:63 red/48000/2");
  });

  it("no toca la carga que no es opus ni duplica parámetros al repetirse", () => {
    const unaVez = opusResistente(SDP_OPUS);
    expect(opusResistente(unaVez)).toBe(unaVez);
    expect(unaVez.match(/maxaveragebitrate/gu)).toHaveLength(1);
    expect(unaVez).not.toContain("a=fmtp:63");
  });

  it("escribe la línea cuando el proveedor la omitió, y se queda quieto sin opus", () => {
    const sinFmtp = SDP_OPUS.replace("a=fmtp:111 minptime=10;useinbandfec=1\r\n", "");
    expect(opusResistente(sinFmtp)).toContain(`a=fmtp:111 useinbandfec=1;stereo=0;maxaveragebitrate=${BITRATE_RESISTENTE}`);

    const sinOpus = "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 8\r\na=rtpmap:8 PCMA/8000\r\n";
    expect(opusResistente(sinOpus)).toBe(sinOpus);
  });
});

describe("la calidad del enlace", () => {
  it("lee la pérdida del audio entrante y el viaje de ida y vuelta", () => {
    expect(
      leerInformes([
        { type: "inbound-rtp", kind: "video", packetsLost: 900, packetsReceived: 10 },
        { type: "inbound-rtp", kind: "audio", packetsLost: 12, packetsReceived: 400 },
        { type: "candidate-pair", state: "failed", currentRoundTripTime: 9 },
        { type: "candidate-pair", state: "succeeded", currentRoundTripTime: 0.12 },
      ]),
    ).toEqual({ perdidos: 12, recibidos: 400, idaYVuelta: 0.12 });
  });

  it("mide la tasa del tramo, no la acumulada desde el principio", () => {
    const previa = { perdidos: 100, recibidos: 900, idaYVuelta: 0.1 };
    const actual = { perdidos: 101, recibidos: 1400, idaYVuelta: 0.1 };
    expect(tasaDePerdida(previa, actual)).toBeCloseTo(1 / 501);
    expect(enlaceDebil(previa, actual)).toBe(false);
  });

  it("avisa por pérdida alta o por latencia alta, y calla cuando no hay tráfico", () => {
    const previa = LECTURA_EN_BLANCO;
    expect(enlaceDebil(previa, { perdidos: 50, recibidos: 500, idaYVuelta: 0.05 })).toBe(true);
    expect(enlaceDebil(previa, { perdidos: 0, recibidos: 500, idaYVuelta: 0.6 })).toBe(true);
    expect(enlaceDebil(previa, LECTURA_EN_BLANCO)).toBe(false);
  });
});

describe("esperaDeReintento", () => {
  it("crece con cada intento y nunca es el mismo milisegundo para todos", () => {
    expect(esperaDeReintento(1, 0)).toBe(500);
    expect(esperaDeReintento(1, 1)).toBe(1500);
    expect(esperaDeReintento(2, 0)).toBe(1000);
    expect(esperaDeReintento(3, 1)).toBe(6000);
    expect(esperaDeReintento(2, 0.5)).toBeGreaterThan(esperaDeReintento(1, 0.5));
  });
});

describe("latidoDefinitivo", () => {
  it("solo el 404 mata el latido: la red mala es justo lo que hay que aguantar", () => {
    expect(latidoDefinitivo(problema(404, "https://sicamed.co/problemas/asistente-llamada-desconocida"))).toBe(true);
    expect(latidoDefinitivo(problema(0, "https://sicamed.co/problemas/servicio-inalcanzable"))).toBe(false);
    expect(latidoDefinitivo(problema(503, "https://sicamed.co/problemas/proveedor"))).toBe(false);
    expect(latidoDefinitivo(new Error("timeout"))).toBe(false);
  });
});

describe("cuerpoDeApertura", () => {
  it("omite la reanudación cuando no hubo caída", () => {
    expect(cuerpoDeApertura({ ruta: "/app" })).toEqual({ contexto: { ruta: "/app" } });
    expect(cuerpoDeApertura({}, "")).toEqual({ contexto: {} });
  });

  it("declara la llamada caída y descarta un identificador que el borde rechazaría", () => {
    expect(cuerpoDeApertura({}, "lla_8f3c-1")).toEqual({ contexto: {}, reanudaLlamadaId: "lla_8f3c-1" });
    expect(cuerpoDeApertura({}, "lla 8f3c")).toEqual({ contexto: {} });
  });
});
