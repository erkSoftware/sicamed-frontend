import { abrirSesionAsistente } from "../../../api/clienteAsistente";
import type { ContextoAsistente, HerramientaAsistente } from "../../../api/clienteAsistente";
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

export type ResultadoHerramienta = { ok: boolean; motivo?: string };

export type OpcionesConversacion = {
  audio: HTMLAudioElement;
  navegar: (ruta: string) => void;
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
let hablando = false;

const ACCIONES_UI: Record<string, () => ResultadoHerramienta> = {
  open_lot_form: () => {
    if (!navegar) return { ok: false, motivo: "la pantalla no puede navegar ahora" };
    navegar("/app/inventario?crear=lote");
    return { ok: true };
  },
};

const confirmar = (herramienta: HerramientaAsistente): boolean =>
  typeof window === "undefined"
    ? false
    : window.confirm(`Aurora quiere ejecutar «${herramienta.descripcion}». ¿Lo autorizas?`);

export const ejecutarHerramienta = (nombre: string): ResultadoHerramienta => {
  const herramienta = herramientas.find((opcion) => opcion.nombre === nombre);
  if (!herramienta) return { ok: false, motivo: "herramienta no concedida" };

  if (herramienta.clase === "ui") {
    const accion = ACCIONES_UI[nombre];
    return accion ? accion() : { ok: false, motivo: "esta versión no resuelve esa acción" };
  }

  if (herramienta.confirmacionPrevia && !confirmar(herramienta)) {
    return { ok: false, motivo: "el usuario no confirmó" };
  }

  return { ok: false, motivo: "esa herramienta se ejecuta en el servidor y aún no tiene ruta publicada" };
};

const atenuar = (atenuado: boolean) => {
  if (elementoAudio) elementoAudio.volume = atenuado ? VOLUMEN_ATENUADO : 1;
};

const soltarRecursos = () => {
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
  hablando = false;
};

const alEvento = (evento: EventoProveedor, canal: RTCDataChannel) => {
  const estado = useAurora.getState();
  switch (clasificarEvento(evento.type)) {
    case "herramienta":
      responderHerramienta(canal, evento.call_id ?? "", ejecutarHerramienta(evento.name ?? ""));
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
  soltarRecursos();
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

export const terminarConversacion = (): void => {
  const estado = useAurora.getState();
  soltarRecursos();
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

  try {
    microfonoVivo = await pedirMicrofono();
    estado.fijarVoz("conectando");

    const sesion = await abrirSesionAsistente(opciones.contexto ?? {});
    herramientas = sesion.herramientas;
    estado.fijarDemostrativa(Boolean(sesion.demostracion));

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

    estado.fijarVoz("escuchando");
  } catch (motivo) {
    soltarRecursos();
    const { vedar, fallo } = diagnosticar(motivo);
    const actual = useAurora.getState();
    actual.fallarVoz(fallo);
    if (vedar) actual.vedarVoz();
  }
};
