import { crearMedidor } from "./nivel";
import type { Medidor } from "./nivel";

export type FaseDemo = "escuchando" | "hablando";

export type OpcionesDemostracion = {
  contexto: AudioContext;
  microfono: MediaStream;
  alFase: (fase: FaseDemo) => void;
  alFragmento: (fragmento: string) => void;
  alCerrarTurno: (texto: string) => void;
};

export type Demostracion = {
  nivel: () => number;
  interrumpir: () => void;
  cerrar: () => void;
};

export const GUION: readonly string[] = [
  "Buenas. Soy AURORA, la guía de SICAMED. Puedo acompañarle en cumplimiento, inventario, trazabilidad y vitrina.",
  "Sus licencias viven en Cumplimiento. Ahí ve la atestación vigente y la fecha en que cada una vence.",
  "La trazabilidad es un ledger encadenado por hash. Cada evento queda escrito y ninguno se reescribe.",
  "En la vitrina la oferta se divulga de manera informativa. El contacto se habilita cuando ambas partes están al día.",
  "Puedo abrirle el formulario de un lote nuevo. Dígame cuándo y lo dejo listo en pantalla.",
];

const PASO = 120;

const CADENCIA = 140;

const UMBRAL_VOZ = 0.16;

const SILENCIO = 900;

export const envolventeHabla = (segundos: number): number => {
  const silaba = Math.abs(Math.sin(segundos * 9.4));
  const palabra = 0.55 + 0.45 * Math.sin(segundos * 2.3);
  const matiz = 0.25 * Math.abs(Math.sin(segundos * 15.7 + 1.1));
  return Math.min(1, Math.max(0, silaba * palabra * 0.8 + matiz));
};

export const trocear = (texto: string): readonly string[] => {
  const palabras = texto.split(" ").filter(Boolean);
  const trozos: string[] = [];
  for (let indice = 0; indice < palabras.length; indice += 2) {
    trozos.push(`${palabras.slice(indice, indice + 2).join(" ")} `);
  }
  return trozos;
};

export const arrancarDemostracion = (opciones: OpcionesDemostracion): Demostracion => {
  const medidor: Medidor = crearMedidor(opciones.contexto, opciones.microfono);
  let fase: FaseDemo = "hablando";
  let turno = 0;
  let trozos: readonly string[] = [];
  let dicho = 0;
  let arranqueHabla = 0;
  let hablo = false;
  let ultimaVoz = 0;
  let vivo = true;

  const hablar = () => {
    const linea = GUION[turno % GUION.length] ?? "";
    turno += 1;
    trozos = trocear(linea);
    dicho = 0;
    arranqueHabla = performance.now();
    fase = "hablando";
    opciones.alFase("hablando");
  };

  const escuchar = (texto: string) => {
    fase = "escuchando";
    hablo = false;
    ultimaVoz = 0;
    opciones.alCerrarTurno(texto.trim());
    opciones.alFase("escuchando");
  };

  const latir = () => {
    if (!vivo) return;

    if (fase === "hablando") {
      const transcurrido = performance.now() - arranqueHabla;
      const objetivo = Math.min(trozos.length, Math.floor(transcurrido / CADENCIA));
      while (dicho < objetivo) {
        opciones.alFragmento(trozos[dicho] ?? "");
        dicho += 1;
      }
      if (dicho >= trozos.length && transcurrido > trozos.length * CADENCIA + 400) {
        escuchar(trozos.join(""));
      }
      return;
    }

    const ahora = performance.now();
    if (medidor.nivel() > UMBRAL_VOZ) {
      hablo = true;
      ultimaVoz = ahora;
      return;
    }
    if (hablo && ahora - ultimaVoz > SILENCIO) hablar();
  };

  hablar();
  const reloj = window.setInterval(latir, PASO);

  return {
    nivel: () =>
      fase === "hablando"
        ? envolventeHabla((performance.now() - arranqueHabla) / 1000)
        : medidor.nivel(),
    interrumpir: () => {
      if (fase === "hablando") escuchar(trozos.slice(0, dicho).join(""));
    },
    cerrar: () => {
      vivo = false;
      window.clearInterval(reloj);
      medidor.desechar();
    },
  };
};
