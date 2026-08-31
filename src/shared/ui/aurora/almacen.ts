import { create } from "zustand";
import { ACCION_INICIAL, fichaDeAccion } from "./acciones";
import type { AccionAurora } from "./acciones";
import type { Encuadre } from "./escena";

export type Mensaje = {
  id: string;
  autor: "aurora" | "usuario";
  texto: string;
};

export type EstadoVoz =
  | "inactiva"
  | "permiso"
  | "conectando"
  | "escuchando"
  | "hablando"
  | "fallo";

export type FalloVozVisible = {
  titulo: string;
  detalle: string;
  reintentable: boolean;
};

type EstadoAurora = {
  visible: boolean;
  presentando: boolean;
  accion: AccionAurora;
  encuadre: Encuadre;
  mensajes: readonly Mensaje[];
  voz: EstadoVoz;
  vozDisponible: boolean;
  vozDemostrativa: boolean;
  transcripcion: string;
  falloVoz: FalloVozVisible | null;
  segundosRestantes: number | null;
  cupoRestante: number | null;
  alternarVisible: () => void;
  mostrar: () => void;
  ocultar: () => void;
  presentar: () => void;
  cerrarPresentacion: () => void;
  fijarAccion: (accion: AccionAurora, milisegundos?: number) => void;
  fijarEncuadre: (encuadre: Encuadre) => void;
  decir: (texto: string, accion?: AccionAurora) => void;
  preguntar: (texto: string) => void;
  fijarVoz: (voz: EstadoVoz) => void;
  vedarVoz: () => void;
  fijarDemostrativa: (demostrativa: boolean) => void;
  fijarRestante: (segundos: number | null) => void;
  fijarCupo: (segundos: number | null) => void;
  transcribir: (fragmento: string) => void;
  cerrarTurnoDeVoz: (texto?: string) => void;
  fallarVoz: (fallo: FalloVozVisible) => void;
  reiniciar: () => void;
};

let temporizador: number | undefined;

const identificador = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const RESPUESTAS: readonly { claves: readonly string[]; texto: string; accion: AccionAurora }[] = [
  {
    claves: ["registrar", "registro", "crear", "nuevo", "nueva"],
    texto:
      "Puedo acompañarte en el registro paso a paso. Dime qué vas a crear: un cultivo, un lote de inventario o una oferta de vitrina.",
    accion: "escribir",
  },
  {
    claves: ["licencia", "licencias", "vencimiento", "vence"],
    texto:
      "Tus licencias viven en Cumplimiento. Ahí ves la atestación vigente y la fecha en que cada una vence.",
    accion: "alerta",
  },
  {
    claves: ["trazabilidad", "ledger", "evento", "cadena"],
    texto:
      "La trazabilidad es un ledger encadenado por hash: cada evento queda escrito y ninguno se reescribe.",
    accion: "senalar",
  },
  {
    claves: ["vitrina", "oferta", "comprador", "vender"],
    texto:
      "En la vitrina la oferta se divulga de manera informativa. El contacto se habilita cuando ambas partes están al día.",
    accion: "guiar",
  },
  {
    claves: ["paciente", "teleconsulta", "agenda", "clinica", "clínica"],
    texto:
      "La zona clínica está separada por frontera dura de la comercial. Entro contigo, pero los datos de salud no cruzan.",
    accion: "hablar",
  },
  {
    claves: ["hola", "buenas", "aurora"],
    texto: "Hola. Soy Aurora, tu guía dentro de SICAMED. ¿Qué necesitas hacer hoy?",
    accion: "saludo",
  },
];

const RESPUESTA_POR_DEFECTO = {
  texto:
    "Todavía estoy aprendiendo a conversar. Por ahora te muestro cómo me muevo: pídeme señalar, guiar, escribir o celebrar.",
  accion: "pensar" as AccionAurora,
};

const responder = (texto: string) => {
  const limpio = texto.toLowerCase();
  const encontrada = RESPUESTAS.find((opcion) =>
    opcion.claves.some((clave) => limpio.includes(clave)),
  );
  return encontrada ?? RESPUESTA_POR_DEFECTO;
};

export const useAurora = create<EstadoAurora>((set, get) => ({
  visible: false,
  presentando: false,
  accion: ACCION_INICIAL,
  encuadre: "busto",
  mensajes: [],
  voz: "inactiva",
  vozDisponible: true,
  vozDemostrativa: false,
  transcripcion: "",
  falloVoz: null,
  segundosRestantes: null,
  cupoRestante: null,

  alternarVisible: () => set({ visible: !get().visible }),
  mostrar: () => set({ visible: true }),
  ocultar: () => set({ visible: false }),
  presentar: () => set({ presentando: true, visible: false }),
  cerrarPresentacion: () => set({ presentando: false }),

  fijarAccion: (accion, milisegundos) => {
    window.clearTimeout(temporizador);
    set({ accion });
    if (milisegundos && accion !== "reposo") {
      temporizador = window.setTimeout(() => set({ accion: "reposo" }), milisegundos);
    }
  },

  fijarEncuadre: (encuadre) => set({ encuadre }),

  decir: (texto, accion = "hablar") => {
    get().fijarAccion(accion, 6000);
    const nuevo: Mensaje = { id: identificador(), autor: "aurora", texto };
    set({ mensajes: [...get().mensajes, nuevo].slice(-12) });
  },

  preguntar: (texto) => {
    const limpio = texto.trim();
    if (!limpio) return;
    const nuevo: Mensaje = { id: identificador(), autor: "usuario", texto: limpio };
    set({ mensajes: [...get().mensajes, nuevo].slice(-12) });
    get().fijarAccion("escuchar");
    const respuesta = responder(limpio);
    window.setTimeout(() => get().decir(respuesta.texto, respuesta.accion), 620);
  },

  fijarVoz: (voz) => {
    const estado = get();
    if (voz === "hablando") estado.fijarAccion("hablar");
    if (voz === "escuchando") estado.fijarAccion("escuchar");
    if (voz === "conectando") estado.fijarAccion("pensar");
    if (voz === "inactiva" || voz === "fallo") estado.fijarAccion(ACCION_INICIAL);
    set({ voz, ...(voz === "fallo" ? {} : { falloVoz: null }) });
  },

  vedarVoz: () => set({ vozDisponible: false }),

  fijarDemostrativa: (demostrativa) => set({ vozDemostrativa: demostrativa }),

  fijarRestante: (segundos) => set({ segundosRestantes: segundos }),

  fijarCupo: (segundos) => set({ cupoRestante: segundos }),

  transcribir: (fragmento) => set({ transcripcion: get().transcripcion + fragmento }),

  cerrarTurnoDeVoz: (texto) => {
    const limpio = (texto ?? get().transcripcion).trim();
    if (!limpio) {
      set({ transcripcion: "" });
      return;
    }
    const nuevo: Mensaje = { id: identificador(), autor: "aurora", texto: limpio };
    set({ mensajes: [...get().mensajes, nuevo].slice(-12), transcripcion: "" });
  },

  fallarVoz: (fallo) => {
    get().fijarAccion(ACCION_INICIAL);
    set({ voz: "fallo", falloVoz: fallo, transcripcion: "" });
  },

  reiniciar: () => {
    window.clearTimeout(temporizador);
    set({
      mensajes: [],
      accion: ACCION_INICIAL,
      transcripcion: "",
      falloVoz: null,
      segundosRestantes: null,
      cupoRestante: null,
    });
  },
}));

export const presentarse = (nombre?: string): void => {
  const estado = useAurora.getState();
  if (estado.mensajes.length > 0) return;
  const saludo = nombre
    ? `Hola ${nombre}. Soy Aurora y te acompaño dentro de SICAMED.`
    : fichaDeAccion("saludo").frase;
  estado.decir(saludo, "saludo");
};
