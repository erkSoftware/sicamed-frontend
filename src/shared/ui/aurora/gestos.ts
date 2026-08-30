import type { Articulacion } from "./figura";
import type { Tripleta } from "./poses";

export type Ajuste = Partial<Record<Articulacion, Tripleta>>;

export const ESPERA_GESTO = 6.5;

export const HOLGURA_GESTO = 7;

export type Gesto = {
  clave: string;
  duracion: number;
  trazo: (u: number) => Ajuste;
};

const suave = (v: number) => v * v * (3 - 2 * v);

export const envolvente = (u: number) => {
  if (u <= 0 || u >= 1) return 0;
  const entrada = Math.min(1, u / 0.24);
  const salida = Math.min(1, (1 - u) / 0.3);
  return suave(Math.min(entrada, salida));
};

const ladear: Gesto = {
  clave: "ladear",
  duracion: 3.1,
  trazo: () => ({
    cuello: [0.01, -0.04, 0.06],
    cabeza: [-0.02, -0.09, 0.15],
    hombroIzq: [0, 0, 0.02],
  }),
};

const ojear: Gesto = {
  clave: "ojear",
  duracion: 3.8,
  trazo: (u) => {
    const barrido = Math.sin(u * Math.PI * 1.4);
    return {
      cuello: [0.02, barrido * 0.13, 0],
      cabeza: [0.03, barrido * 0.26, barrido * -0.05],
      pecho: [0, barrido * 0.04, 0],
    };
  },
};

const respirarHondo: Gesto = {
  clave: "respirarHondo",
  duracion: 4.4,
  trazo: (u) => {
    const aire = Math.sin(u * Math.PI);
    return {
      pecho: [aire * -0.05, 0, 0],
      torso: [aire * -0.02, 0, 0],
      cuello: [aire * -0.03, 0, 0],
      cabeza: [aire * -0.05, 0, 0],
      hombroIzq: [aire * -0.09, 0, aire * 0.04],
      hombroDer: [aire * -0.09, 0, aire * -0.04],
    };
  },
};

const recolocarBrazo: Gesto = {
  clave: "recolocarBrazo",
  duracion: 3.2,
  trazo: (u) => {
    const alcance = Math.sin(u * Math.PI);
    return {
      hombroDer: [alcance * -0.22, 0, alcance * -0.07],
      codoDer: [alcance * -0.38, 0, alcance * -0.06],
      munecaDer: [0, 0, alcance * 0.16],
      cabeza: [alcance * 0.04, alcance * -0.06, 0],
    };
  },
};

const estirarCuello: Gesto = {
  clave: "estirarCuello",
  duracion: 3.6,
  trazo: (u) => {
    const giro = Math.sin(u * Math.PI);
    return {
      cuello: [-0.04, giro * 0.1, giro * -0.05],
      cabeza: [-0.07, giro * 0.19, giro * -0.11],
      hombroDer: [giro * -0.06, 0, 0],
    };
  },
};

export const GESTOS: readonly Gesto[] = [
  ladear,
  ojear,
  respirarHondo,
  recolocarBrazo,
  estirarCuello,
];

export const gestoAlAzar = (previo: Gesto | null, azar: () => number = Math.random): Gesto => {
  const posibles = previo ? GESTOS.filter((gesto) => gesto.clave !== previo.clave) : GESTOS;
  const indice = Math.floor(azar() * posibles.length);
  return posibles[Math.min(Math.max(0, indice), posibles.length - 1)] ?? ladear;
};

export const trazarGesto = (gesto: Gesto, transcurrido: number): Ajuste => {
  const u = Math.min(1, Math.max(0, transcurrido / gesto.duracion));
  const peso = envolvente(u);
  const crudo = gesto.trazo(u);
  const salida: Ajuste = {};
  (Object.keys(crudo) as Articulacion[]).forEach((clave) => {
    const valor = crudo[clave];
    if (valor) salida[clave] = [valor[0] * peso, valor[1] * peso, valor[2] * peso];
  });
  return salida;
};

export type RitmoGestos = {
  avanzar: (delta: number, habilitado: boolean) => Ajuste;
  claveActiva: () => string | null;
};

export const crearRitmoGestos = (azar: () => number = Math.random): RitmoGestos => {
  let activo: Gesto | null = null;
  let previo: Gesto | null = null;
  let transcurrido = 0;
  let espera = ESPERA_GESTO + azar() * HOLGURA_GESTO;
  let ajuste: Ajuste = {};

  const reiniciar = () => {
    activo = null;
    transcurrido = 0;
    ajuste = {};
    espera = ESPERA_GESTO + azar() * HOLGURA_GESTO;
  };

  return {
    avanzar: (delta, habilitado) => {
      if (!habilitado) {
        if (activo) reiniciar();
        return ajuste;
      }
      if (activo) {
        transcurrido += delta;
        if (transcurrido >= activo.duracion) reiniciar();
        else ajuste = trazarGesto(activo, transcurrido);
        return ajuste;
      }
      espera -= delta;
      if (espera <= 0) {
        activo = gestoAlAzar(previo, azar);
        previo = activo;
        transcurrido = 0;
      }
      return ajuste;
    },
    claveActiva: () => activo?.clave ?? null,
  };
};
