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
import { arrancarDemostracion } from "./demostracion";
import type { Demostracion } from "./demostracion";
import { diagnosticar } from "./diagnostico";
import { clasificarEvento } from "./eventos";
import type { EventoProveedor } from "./eventos";
import { crearMedidor } from "./nivel";
import type { Medidor } from "./nivel";
import {
  conectar,
  cortarRespuesta,
  desconectar,
  pedirMicrofono,
  responderHerramienta,
} from "./sesion";
import type { Conexion } from "./sesion";
import { mensajeDeAviso, planDeLlamada } from "./llamada";
import { resultadoDeNavegacion } from "../destinos";
import type { Permiso } from "../../../auth/tipos";

export type ResultadoHerramienta = {
  ok: boolean;
  motivo?: string;
  destino?: string;
  ruta?: string;
  disponibles?: readonly string[];
};

export type OpcionesConversacion = {
  audio: HTMLAudioElement;
  navegar: (ruta: string) => void;
  permisos: readonly Permiso[];
  contexto?: ContextoAsistente;
};

const VOLUMEN_ATENUADO = 0.18;

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
let avisoProgramado: number | undefined;
let finProgramado: number | undefined;
let cuentaAtras: number | undefined;

const argumento = (argumentos: Record<string, unknown>, claves: readonly string[]): string => {
  for (const clave of claves) {
    const valor = argumentos[clave];
    if (typeof valor === "string" && valor.trim() !== "") return valor;
  }
  return "";
};

const irA = (argumentos: Record<string, unknown>): ResultadoHerramienta => {
  if (!navegar) return { ok: false, motivo: "la pantalla no puede navegar ahora" };
  const destino = argumento(argumentos, ["destino", "destination", "ruta", "route", "modulo", "module", "pantalla", "screen"]);
  const resultado = resultadoDeNavegacion(destino, permisosVigentes);
  if (resultado.ok && resultado.ruta) navegar(resultado.ruta);
  return resultado;
};

const ACCIONES_UI: Record<string, (argumentos: Record<string, unknown>) => ResultadoHerramienta> = {
  open_lot_form: () => {
    if (!navegar) return { ok: false, motivo: "la pantalla no puede navegar ahora" };
    navegar("/app/inventario?crear=lote");
    return { ok: true };
  },
  navigate_to: irA,
  open_screen: irA,
  ir_a: irA,
};

const confirmar = (herramienta: HerramientaAsistente): boolean =>
  typeof window === "undefined"
    ? false
    : window.confirm(`Aurora quiere ejecutar «${herramienta.descripcion}». ¿Lo autorizas?`);

export const leerArgumentos = (crudos: string | undefined): Record<string, unknown> => {
  if (!crudos) return {};
  try {
    const valor: unknown = JSON.parse(crudos);
    return typeof valor === "object" && valor !== null ? (valor as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

export const ejecutarHerramienta = (
  nombre: string,
  crudos?: string,
): ResultadoHerramienta => {
  const herramienta = herramientas.find((opcion) => opcion.nombre === nombre);
  if (!herramienta) return { ok: false, motivo: "herramienta no concedida" };

  if (herramienta.clase === "ui") {
    const accion = ACCIONES_UI[nombre];
    return accion
      ? accion(leerArgumentos(crudos))
      : { ok: false, motivo: "esta versión no resuelve esa acción" };
  }

  if (herramienta.confirmacionPrevia && !confirmar(herramienta)) {
    return { ok: false, motivo: "el usuario no confirmó" };
  }

  return { ok: false, motivo: "esa herramienta se ejecuta en el servidor y aún no tiene ruta publicada" };
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
  llamadaAbierta = "";
  llamadaDelProveedor = "";
  if (llamada) void cerrarLlamadaAsistente(llamada, motivo, enElProveedor);
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

const soltarRecursos = (motivo: MotivoCierre | null = null) => {
  cancelarTemporizadores();
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
  elementoAudio = null;
  void contextoAudio?.close();
  contextoAudio = null;
  herramientas = [];
  navegar = null;
  permisosVigentes = [];
  hablando = false;
  llamadaAbierta = "";
  llamadaDelProveedor = "";
  useAurora.getState().fijarRestante(null);
};

const alEvento = (evento: EventoProveedor, canal: RTCDataChannel) => {
  const estado = useAurora.getState();
  switch (clasificarEvento(evento.type)) {
    case "herramienta":
      responderHerramienta(
        canal,
        evento.call_id ?? "",
        ejecutarHerramienta(evento.name ?? "", evento.arguments),
      );
      return;
    case "transcripcion":
      if (evento.delta) estado.transcribir(evento.delta);
      return;
    case "habla-inicia":
      hablando = false;
      atenuar(true);
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

const alCaer = () => {
  soltarRecursos("connection_error");
  useAurora.getState().fallarVoz({
    titulo: "La conversación se cerró",
    detalle:
      "La sesión de voz dura unos minutos y no se renueva sola. Vuelve a abrirla cuando quieras seguir.",
    reintentable: true,
  });
};

export const nivelDeVoz = (): number => {
  if (demostracion) return demostracion.nivel();
  if (hablando && medidorRemoto) return medidorRemoto.nivel();
  return medidorLocal?.nivel() ?? 0;
};

export const conversando = (): boolean => conexion !== null || demostracion !== null;

export const despedirConversacion = (): void => {
  const llamada = llamadaAbierta;
  const enElProveedor = llamadaDelProveedor;
  llamadaAbierta = "";
  llamadaDelProveedor = "";
  cancelarTemporizadores();
  if (llamada) despedirLlamadaAsistente(llamada, "user_ended", enElProveedor);
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

export const iniciarConversacion = async (opciones: OpcionesConversacion): Promise<void> => {
  const estado = useAurora.getState();
  if (estado.voz !== "inactiva" && estado.voz !== "fallo") return;
  if (!estado.vozDisponible) return;

  estado.fijarVoz("permiso");
  navegar = opciones.navegar;
  permisosVigentes = opciones.permisos;

  try {
    microfonoVivo = await pedirMicrofono();
    estado.fijarVoz("conectando");

    const sesion = await abrirSesionAsistente(opciones.contexto ?? {});
    herramientas = sesion.herramientas;
    llamadaAbierta = sesion.llamadaId ?? "";
    estado.fijarDemostrativa(Boolean(sesion.demostracion));
    estado.fijarCupo(sesion.restanteDiarioSegundos ?? null);

    contextoAudio = new AudioContext();
    if (contextoAudio.state === "suspended") await contextoAudio.resume();

    if (sesion.demostracion) {
      demostracion = arrancarDemostracion({
        contexto: contextoAudio,
        microfono: microfonoVivo,
        alFase: (fase) => useAurora.getState().fijarVoz(fase),
        alFragmento: (fragmento) => useAurora.getState().transcribir(fragmento),
        alCerrarTurno: (texto) => useAurora.getState().cerrarTurnoDeVoz(texto),
      });
      estado.fijarVoz("hablando");
      return;
    }

    elementoAudio = opciones.audio;
    medidorLocal = crearMedidor(contextoAudio, microfonoVivo);

    conexion = await conectar(sesion, {
      microfono: microfonoVivo,
      alPistaRemota: (flujo) => {
        if (!elementoAudio) return;
        elementoAudio.srcObject = flujo;
        void elementoAudio.play().catch(() => undefined);
        if (contextoAudio) medidorRemoto = crearMedidor(contextoAudio, flujo);
      },
      alEvento,
      alCaer,
    });

    llamadaDelProveedor = conexion.callId;
    programarLimite(sesion, conexion.canal);
    estado.fijarVoz("escuchando");
  } catch (motivo) {
    soltarRecursos(llamadaAbierta ? "system_error" : null);
    const { vedar, fallo } = diagnosticar(motivo);
    const actual = useAurora.getState();
    actual.fallarVoz(fallo);
    if (vedar) actual.vedarVoz();
  }
};
