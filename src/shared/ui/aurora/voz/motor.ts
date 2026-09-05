import {
  abrirSesionAsistente,
  cerrarLlamadaAsistente,
  despedirLlamadaAsistente,
} from "../../../api/clienteAsistente";
import type {
  ContextoAsistente,
  HerramientaAsistente,
  MotivoCierre,
  SesionAsistente,
} from "../../../api/clienteAsistente";
import { useAurora } from "../almacen";
import { vigilarCalidad } from "./calidad";
import { arrancarDemostracion } from "./demostracion";
import type { Demostracion } from "./demostracion";
import { diagnosticar } from "./diagnostico";
import { clasificarEvento } from "./eventos";
import type { EventoProveedor } from "./eventos";
import { empezarLatido } from "./latido";
import { crearMedidor } from "./nivel";
import type { Medidor } from "./nivel";
import {
  conectar,
  cortarRespuesta,
  desconectar,
  enviarContexto,
  pedirMicrofono,
  responderHerramienta,
} from "./sesion";
import type { Conexion } from "./sesion";
import { mensajeDeAviso, planDeLlamada } from "./llamada";
import { despachar } from "./despacho";
import type { EntornoDeDespacho } from "./despacho";
import { rechazarFirma } from "./confirmacion";
import { vaciarBitacora } from "./bitacora";
import { escucharPantalla } from "../pantalla/bus";
import { instantaneaViva } from "../pantalla/contextoVivo";
import type { Permiso } from "../../../auth/tipos";

export type OpcionesConversacion = {
  audio: HTMLAudioElement;
  navegar: (ruta: string) => void;
  permisos: readonly Permiso[];
  ruta: () => string;
  contexto?: ContextoAsistente;
};

const VOLUMEN_ATENUADO = 0.18;

export const REINTENTOS_DE_RECONEXION = 3;

export const esperaDeReintento = (intento: number, azar = Math.random()): number =>
  Math.round(500 * 2 ** intento * (0.5 + azar));

const esperar = (milisegundos: number): Promise<void> =>
  new Promise((seguir) => {
    window.setTimeout(seguir, milisegundos);
  });

let entorno: OpcionesConversacion | null = null;
let conexion: Conexion | null = null;
let demostracion: Demostracion | null = null;
let contextoAudio: AudioContext | null = null;
let medidorLocal: Medidor | null = null;
let medidorRemoto: Medidor | null = null;
let microfonoVivo: MediaStream | null = null;
let elementoAudio: HTMLAudioElement | null = null;
let herramientas: readonly HerramientaAsistente[] = [];
let navegar: ((ruta: string) => void) | null = null;
let permisosVigentes: readonly Permiso[] = [];
let hablando = false;
let llamadaAbierta = "";
let llamadaDelProveedor = "";
let llamadaCaida = "";
let proveedorCaido = "";
let pararLatido: (() => void) | null = null;
let pararVigilancia: (() => void) | null = null;
let turno = 0;
let enMarcha: Promise<void> | null = null;
let reconectando = false;
let recuperaciones = 0;
let soltando = false;
let rutaDebil = false;
let medidaDebil = false;
let avisoProgramado: number | undefined;
let finProgramado: number | undefined;
let cuentaAtras: number | undefined;
let dejarDeEscucharPantalla: (() => void) | null = null;
let huellaEnviada = "";
let contextoPendiente = true;

const rutaVigente = (): string => entorno?.ruta() ?? "";

const alFinDeConversacion = () => {
  const estado = useAurora.getState();
  soltarRecursos();
  estado.cerrarTurnoDeVoz();
  estado.fallarVoz({
    titulo: "La conversación ya estaba cerrada",
    detalle:
      "SICAMED no reconoce esta llamada: se cerró antes de que la herramienta llegara. Abre el " +
      "micrófono otra vez para seguir.",
    reintentable: true,
  });
};

const entornoDeDespacho: EntornoDeDespacho = {
  herramientas: () => herramientas,
  permisos: () => permisosVigentes,
  ruta: rutaVigente,
  llamadaId: () => llamadaAbierta,
  navegar: (destino) => navegar?.(destino),
  alFinDeConversacion,
};

export const contextoDelTurno = (): string => {
  const ruta = rutaVigente();
  if (ruta === "") return "";
  const instantanea = instantaneaViva(ruta, permisosVigentes);
  if (instantanea.huella === huellaEnviada) return "";
  huellaEnviada = instantanea.huella;
  return instantanea.texto;
};

const empujarContexto = (canal: RTCDataChannel) => {
  if (!contextoPendiente) return;
  const texto = contextoDelTurno();
  contextoPendiente = false;
  if (texto !== "") enviarContexto(canal, texto);
};

const cerrarContexto = (audio: AudioContext | null) => {
  if (!audio || audio.state === "closed") return;
  void Promise.resolve(audio.close()).catch(() => undefined);
};

const refrescarEnlace = () => {
  useAurora.getState().fijarConexionDebil(rutaDebil || medidaDebil);
};

const atenuar = (atenuado: boolean) => {
  if (elementoAudio) elementoAudio.volume = atenuado ? VOLUMEN_ATENUADO : 1;
};

const cancelarTemporizadores = () => {
  window.clearTimeout(avisoProgramado);
  window.clearTimeout(finProgramado);
  window.clearInterval(cuentaAtras);
  avisoProgramado = undefined;
  finProgramado = undefined;
  cuentaAtras = undefined;
};

const cerrarRegistro = (motivo: MotivoCierre) => {
  const llamada = llamadaAbierta;
  const enElProveedor = llamadaDelProveedor;
  const anterior = llamadaCaida;
  const suyaAnterior = proveedorCaido;
  llamadaAbierta = "";
  llamadaDelProveedor = "";
  llamadaCaida = "";
  proveedorCaido = "";
  if (llamada) void cerrarLlamadaAsistente(llamada, motivo, enElProveedor);
  if (anterior && anterior !== llamada) {
    void cerrarLlamadaAsistente(anterior, "connection_error", suyaAnterior);
  }
};

const programarLimite = (sesion: SesionAsistente, canal: RTCDataChannel) => {
  const plan = planDeLlamada(sesion);

  if (plan.avisoSegundos !== null) {
    avisoProgramado = window.setTimeout(() => {
      if (canal.readyState !== "open") return;
      canal.send(mensajeDeAviso(plan.frase));
    }, plan.avisoSegundos * 1000);
  }

  if (plan.duracionSegundos === null) return;

  const duracion = plan.duracionSegundos;
  useAurora.getState().fijarRestante(duracion);
  const vence = Date.now() + duracion * 1000;
  cuentaAtras = window.setInterval(() => {
    useAurora.getState().fijarRestante(Math.max(0, Math.round((vence - Date.now()) / 1000)));
  }, 1000);

  finProgramado = window.setTimeout(() => {
    const estado = useAurora.getState();
    soltarRecursos("completed");
    estado.cerrarTurnoDeVoz();
    estado.fallarVoz({
      titulo: "La conversación llegó a su tiempo máximo",
      detalle:
        "Cada llamada tiene un tope fijado por la entidad. Vuelve a abrir el micrófono si necesitas seguir.",
      reintentable: true,
    });
  }, duracion * 1000);
};

const soltarRecursos = (motivo: MotivoCierre | null = null, conservandoEntorno = false) => {
  soltando = true;
  cancelarTemporizadores();
  rechazarFirma();
  dejarDeEscucharPantalla?.();
  dejarDeEscucharPantalla = null;
  huellaEnviada = "";
  contextoPendiente = true;
  pararLatido?.();
  pararLatido = null;
  pararVigilancia?.();
  pararVigilancia = null;
  if (motivo) cerrarRegistro(motivo);
  demostracion?.cerrar();
  demostracion = null;
  medidorLocal?.desechar();
  medidorLocal = null;
  medidorRemoto?.desechar();
  medidorRemoto = null;
  desconectar(conexion);
  conexion = null;
  microfonoVivo?.getTracks().forEach((pista) => pista.stop());
  microfonoVivo = null;
  if (elementoAudio) {
    elementoAudio.pause();
    elementoAudio.srcObject = null;
    elementoAudio.volume = 1;
  }
  cerrarContexto(contextoAudio);
  contextoAudio = null;
  herramientas = [];
  hablando = false;
  llamadaAbierta = "";
  llamadaDelProveedor = "";
  if (!conservandoEntorno) {
    turno += 1;
    elementoAudio = null;
    entorno = null;
    navegar = null;
    permisosVigentes = [];
    llamadaCaida = "";
    proveedorCaido = "";
  }
  rutaDebil = false;
  medidaDebil = false;
  const estado = useAurora.getState();
  estado.fijarRestante(null);
  estado.fijarConexionDebil(false);
  soltando = false;
};

const atenderHerramienta = async (evento: EventoProveedor, canal: RTCDataChannel) => {
  const llamada = evento.call_id ?? "";
  const resultado = await despachar(
    entornoDeDespacho,
    evento.name ?? "",
    llamada,
    evento.arguments,
  );
  responderHerramienta(canal, llamada, resultado);
};

const alEvento = (evento: EventoProveedor, canal: RTCDataChannel) => {
  const estado = useAurora.getState();
  switch (clasificarEvento(evento.type)) {
    case "herramienta":
      void atenderHerramienta(evento, canal);
      return;
    case "transcripcion":
      if (evento.delta) estado.transcribir(evento.delta);
      return;
    case "habla-inicia":
      hablando = false;
      atenuar(true);
      empujarContexto(canal);
      estado.fijarVoz("escuchando");
      return;
    case "habla-termina":
      atenuar(false);
      return;
    case "respuesta-inicia":
      hablando = true;
      atenuar(false);
      estado.fijarVoz("hablando");
      return;
    case "respuesta-termina":
      hablando = false;
      contextoPendiente = true;
      empujarContexto(canal);
      estado.cerrarTurnoDeVoz();
      estado.fijarVoz("escuchando");
      return;
    case "error":
      estado.fallarVoz({
        titulo: "El asistente reportó un error",
        detalle: evento.error?.message ?? "La sesión de voz devolvió un error sin descripción.",
        reintentable: true,
      });
      return;
    default:
  }
};

const alMorirLaLlamada = () => {
  const estado = useAurora.getState();
  soltarRecursos();
  estado.cerrarTurnoDeVoz();
  estado.fallarVoz({
    titulo: "El servidor dio la conversación por terminada",
    detalle:
      "SICAMED dejó de recibir señales de vida de esta llamada y la cerró. No se te cobra el " +
      "tiempo que no hablaste: vuelve a abrir el micrófono cuando quieras seguir.",
    reintentable: true,
  });
};

const reconectar = async (caida: string, enElProveedor: string): Promise<void> => {
  const actual = entorno;
  if (reconectando || !actual) return;

  const mio = turno;
  reconectando = true;
  recuperaciones += 1;
  llamadaCaida = caida;
  proveedorCaido = enElProveedor;
  soltarRecursos(null, true);

  useAurora.getState().fijarVoz("reconectando");
  rutaDebil = true;
  refrescarEnlace();

  const permitidos = recuperaciones > REINTENTOS_DE_RECONEXION ? 0 : REINTENTOS_DE_RECONEXION;

  for (let intento = 1; intento <= permitidos; intento += 1) {
    await esperar(esperaDeReintento(intento));
    if (mio !== turno || entorno !== actual) {
      reconectando = false;
      return;
    }

    try {
      await lanzar(actual, caida, mio);
      llamadaCaida = "";
      proveedorCaido = "";
      reconectando = false;
      rutaDebil = false;
      refrescarEnlace();
      return;
    } catch {
      const abortada = llamadaAbierta;
      const suya = llamadaDelProveedor;
      soltarRecursos(null, true);
      if (abortada && abortada !== caida) {
        void cerrarLlamadaAsistente(abortada, "connection_error", suya);
      }
    }
  }

  reconectando = false;
  const estado = useAurora.getState();
  soltarRecursos("connection_error");
  estado.cerrarTurnoDeVoz();
  estado.fallarVoz({
    titulo: "No se pudo restablecer la conversación",
    detalle:
      "La conexión de audio se cayó y los reintentos no la recuperaron. La llamada quedó cerrada " +
      "en el servidor, así que no te consume más cupo: revisa tu red antes de volver a abrirla.",
    reintentable: true,
  });
};

const alCaer = () => {
  if (soltando || reconectando || !entorno) return;
  void reconectar(llamadaAbierta, llamadaDelProveedor);
};

export const nivelDeVoz = (): number => {
  if (demostracion) return demostracion.nivel();
  if (hablando && medidorRemoto) return medidorRemoto.nivel();
  return medidorLocal?.nivel() ?? 0;
};

export const conversando = (): boolean =>
  conexion !== null || demostracion !== null || reconectando;

export const despedirConversacion = (): void => {
  const llamada = llamadaAbierta;
  const enElProveedor = llamadaDelProveedor;
  const anterior = llamadaCaida;
  const suyaAnterior = proveedorCaido;
  llamadaAbierta = "";
  llamadaDelProveedor = "";
  llamadaCaida = "";
  proveedorCaido = "";
  cancelarTemporizadores();
  if (llamada) despedirLlamadaAsistente(llamada, "user_ended", enElProveedor);
  if (anterior) despedirLlamadaAsistente(anterior, "connection_error", suyaAnterior);
  soltarRecursos();
};

export const terminarConversacion = (): void => {
  const estado = useAurora.getState();
  soltarRecursos("user_ended");
  estado.cerrarTurnoDeVoz();
  estado.fijarVoz("inactiva");
};

export const interrumpir = (): void => {
  if (demostracion) {
    demostracion.interrumpir();
    return;
  }
  if (!conexion) return;
  cortarRespuesta(conexion.canal);
  hablando = false;
  const estado = useAurora.getState();
  estado.cerrarTurnoDeVoz();
  estado.fijarVoz("escuchando");
};

const arrancar = async (
  opciones: OpcionesConversacion,
  reanuda: string,
  mio: number,
): Promise<void> => {
  let microfono: MediaStream | null = null;
  let audio: AudioContext | null = null;
  let sesion: SesionAsistente | null = null;
  let enlace: Conexion | null = null;
  let publicada = false;

  const abandonada = (): boolean => {
    if (mio === turno) return false;

    desconectar(enlace);
    microfono?.getTracks().forEach((pista) => pista.stop());
    cerrarContexto(audio);

    const mia = sesion?.llamadaId ?? "";
    if (mia && (!publicada || llamadaAbierta === mia)) {
      if (llamadaAbierta === mia) {
        llamadaAbierta = "";
        llamadaDelProveedor = "";
      }
      void cerrarLlamadaAsistente(mia, "user_ended", enlace?.callId ?? "");
    }
    return true;
  };

  microfono = await pedirMicrofono();
  if (abandonada()) return;

  const estado = useAurora.getState();
  estado.fijarVoz(reanuda === "" ? "conectando" : "reconectando");

  sesion = await abrirSesionAsistente(opciones.contexto ?? {}, reanuda);
  if (abandonada()) return;

  audio = new AudioContext();
  if (audio.state === "suspended") await audio.resume();
  if (abandonada()) return;

  microfonoVivo = microfono;
  contextoAudio = audio;
  herramientas = sesion.herramientas;
  llamadaAbierta = sesion.llamadaId ?? "";
  publicada = true;
  estado.fijarDemostrativa(Boolean(sesion.demostracion));
  estado.fijarCupo(sesion.restanteDiarioSegundos ?? null);
  estado.fijarResumenDeEntidad((sesion.resumenEntidad ?? "").trim());

  if (sesion.demostracion) {
    demostracion = arrancarDemostracion({
      contexto: audio,
      microfono,
      alFase: (fase) => useAurora.getState().fijarVoz(fase),
      alFragmento: (fragmento) => useAurora.getState().transcribir(fragmento),
      alCerrarTurno: (texto) => useAurora.getState().cerrarTurnoDeVoz(texto),
    });
    estado.fijarVoz("hablando");
    return;
  }

  elementoAudio = opciones.audio;
  medidorLocal = crearMedidor(audio, microfono);

  enlace = await conectar(sesion, {
    microfono,
    alPistaRemota: (flujo) => {
      if (!elementoAudio) return;
      elementoAudio.srcObject = flujo;
      void elementoAudio.play().catch(() => undefined);
      if (contextoAudio) medidorRemoto = crearMedidor(contextoAudio, flujo);
    },
    alEvento,
    alDebilitarse: (debil) => {
      rutaDebil = debil;
      refrescarEnlace();
    },
    alCaer,
    alAbrirse: empujarContexto,
  });
  if (abandonada()) return;

  conexion = enlace;
  llamadaDelProveedor = enlace.callId;
  dejarDeEscucharPantalla = escucharPantalla(() => {
    contextoPendiente = true;
  });
  programarLimite(sesion, enlace.canal);
  pararLatido = empezarLatido(llamadaAbierta, alMorirLaLlamada);
  pararVigilancia = vigilarCalidad(enlace.pc, (debil) => {
    medidaDebil = debil;
    refrescarEnlace();
  });
  estado.fijarVoz("escuchando");
};

const lanzar = async (
  opciones: OpcionesConversacion,
  reanuda: string,
  mio: number,
): Promise<void> => {
  const tarea = arrancar(opciones, reanuda, mio);
  enMarcha = tarea;
  try {
    await tarea;
  } finally {
    if (enMarcha === tarea) enMarcha = null;
  }
};

export const iniciarConversacion = async (opciones: OpcionesConversacion): Promise<void> => {
  const inicial = useAurora.getState();
  if (!inicial.vozDisponible) return;

  if (inicial.voz !== "inactiva" && inicial.voz !== "fallo") {
    if (conversando() || enMarcha) return;
    soltarRecursos();
  }

  turno += 1;
  const mio = turno;
  vaciarBitacora();
  useAurora.getState().reiniciar();
  useAurora.getState().fijarVoz("permiso");

  const anterior = enMarcha;
  if (anterior) await anterior.catch(() => undefined);
  if (mio !== turno) return;

  entorno = opciones;
  navegar = opciones.navegar;
  permisosVigentes = opciones.permisos;
  recuperaciones = 0;

  try {
    await lanzar(opciones, "", mio);
  } catch (motivo) {
    if (mio !== turno) return;
    soltarRecursos(llamadaAbierta ? "system_error" : null);
    const { vedar, fallo } = diagnosticar(motivo);
    const actual = useAurora.getState();
    actual.fallarVoz(fallo);
    if (vedar) actual.vedarVoz();
  }
};
