import type { AccionAurora } from "./acciones";
import type { Articulacion } from "./figura";

export type Tripleta = readonly [number, number, number];

export type Marco = {
  articulaciones: Record<Articulacion, Tripleta>;
  boca: number;
  alturaRaiz: number;
  giroRaiz: number;
  deslizRaiz: number;
  pulso: number;
  tinte: "marca" | "atencion";
};

type Ajuste = Partial<Record<Articulacion, Tripleta>>;

export const REPOSO_PROCEDURAL: Record<Articulacion, Tripleta> = {
  cadera: [0, 0, 0],
  torso: [0, 0, 0],
  pecho: [0, 0, 0],
  cuello: [0, 0, 0],
  cabeza: [0, 0, 0],
  hombroIzq: [0.04, 0, 0.11],
  codoIzq: [-0.28, 0, 0.06],
  munecaIzq: [0, 0, 0],
  hombroDer: [0.04, 0, -0.11],
  codoDer: [-0.28, 0, -0.06],
  munecaDer: [0, 0, 0],
  piernaIzq: [0, 0, 0.01],
  rodillaIzq: [0.03, 0, 0],
  piernaDer: [0, 0, -0.01],
  rodillaDer: [0.03, 0, 0],
};

const sumar = (a: Tripleta, b: Tripleta): Tripleta => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const componer = (ajuste: Ajuste): Record<Articulacion, Tripleta> => {
  const salida = {} as Record<Articulacion, Tripleta>;
  (Object.keys(REPOSO_PROCEDURAL) as Articulacion[]).forEach((clave) => {
    const extra = ajuste[clave];
    salida[clave] = extra ? sumar(REPOSO_PROCEDURAL[clave], extra) : REPOSO_PROCEDURAL[clave];
  });
  return salida;
};

const marco = (
  ajuste: Ajuste,
  extra: Partial<Omit<Marco, "articulaciones">> = {},
): Marco => ({
  articulaciones: componer(ajuste),
  boca: 0,
  alturaRaiz: 0,
  giroRaiz: 0,
  deslizRaiz: 0,
  pulso: 1,
  tinte: "marca",
  ...extra,
});

const onda = (t: number, ciclos: number, amplitud: number, desfase = 0) =>
  Math.sin(t * ciclos + desfase) * amplitud;

const respiracion = (t: number) => onda(t, 1.5, 1);

type Guion = (t: number) => Marco;

const reposo: Guion = (t) => {
  const aire = respiracion(t);
  return marco(
    {
      pecho: [aire * 0.014, onda(t, 0.42, 0.05), 0],
      torso: [0, onda(t, 0.31, 0.04, 1.1), onda(t, 0.27, 0.012)],
      cuello: [aire * -0.01, onda(t, 0.36, 0.07, 0.6), 0],
      cabeza: [onda(t, 0.48, 0.03, 2.1), onda(t, 0.33, 0.09, 0.4), onda(t, 0.29, 0.02)],
      hombroIzq: [aire * 0.02, 0, onda(t, 0.5, 0.014)],
      hombroDer: [aire * 0.02, 0, -onda(t, 0.5, 0.014)],
      codoIzq: [onda(t, 0.44, 0.05, 0.9), 0, 0],
      codoDer: [onda(t, 0.44, 0.05, 1.7), 0, 0],
    },
    { alturaRaiz: aire * 0.004, pulso: 0.85 + aire * 0.15 },
  );
};

const saludo: Guion = (t) => {
  const aire = respiracion(t);
  const mano = onda(t, 6.4, 0.34);
  return marco(
    {
      pecho: [aire * 0.012, -0.06, 0],
      torso: [0, -0.09, 0],
      cabeza: [-0.05, -0.05, 0.09],
      hombroDer: [-0.42, 0, -2.24],
      codoDer: [-0.5, mano * 0.5, mano - 0.15],
      munecaDer: [0, 0, mano * 0.7],
      hombroIzq: [0.12, 0, 0.05],
      codoIzq: [-0.35, 0, 0],
    },
    { boca: 0.22 + Math.max(0, mano) * 0.1, alturaRaiz: aire * 0.005, pulso: 1.15 },
  );
};

const hablar: Guion = (t) => {
  const aire = respiracion(t);
  const gesto = onda(t, 1.9, 1);
  const gestoAlterno = onda(t, 1.5, 1, 1.9);
  return marco(
    {
      pecho: [aire * 0.012, gesto * 0.05, 0],
      torso: [0, gesto * 0.07, 0],
      cabeza: [gestoAlterno * 0.05, gesto * 0.11, gestoAlterno * 0.04],
      hombroIzq: [-0.42 + gesto * 0.12, 0, 0.16],
      codoIzq: [-1.18 + gestoAlterno * 0.22, 0, 0.1],
      munecaIzq: [0, 0, gesto * 0.24],
      hombroDer: [-0.36 + gestoAlterno * 0.14, 0, -0.14],
      codoDer: [-1.05 + gesto * 0.26, 0, -0.1],
      munecaDer: [0, 0, -gestoAlterno * 0.22],
    },
    {
      boca: 0.24 + Math.abs(onda(t, 7.3, 0.42)) + Math.abs(onda(t, 11.1, 0.14, 1.3)),
      pulso: 1.05,
    },
  );
};

const escuchar: Guion = (t) => {
  const aire = respiracion(t);
  return marco(
    {
      pecho: [aire * 0.01, 0.04, 0],
      cuello: [0.05, 0.06, 0.05],
      cabeza: [0.07, 0.1, 0.19 + onda(t, 0.6, 0.02)],
      hombroIzq: [-0.52, 0, -0.05],
      codoIzq: [-1.62, 0.2, 0.05],
      hombroDer: [-0.5, 0, 0.03],
      codoDer: [-1.58, -0.2, -0.05],
      munecaIzq: [0, 0, -0.2],
      munecaDer: [0, 0, 0.2],
    },
    { boca: 0.06, pulso: 0.7 + Math.abs(onda(t, 3.1, 0.35)) },
  );
};

const senalar: Guion = (t) => {
  const empuje = onda(t, 2.6, 0.05);
  return marco(
    {
      torso: [0, -0.14, 0],
      pecho: [-0.04, -0.08, 0],
      cabeza: [0.06, -0.24, 0.03],
      hombroDer: [-1.42 + empuje, -0.18, -0.22],
      codoDer: [-0.12 + empuje * 0.6, 0, 0.04],
      munecaDer: [-0.08, 0, 0],
      hombroIzq: [0.1, 0, 0.06],
      codoIzq: [-0.42, 0, 0],
    },
    { boca: 0.12, pulso: 1.2 },
  );
};

const guiar: Guion = (t) => {
  const paso = onda(t, 1.25, 1);
  return marco(
    {
      cadera: [0, -0.16, 0],
      torso: [0, -0.22, 0],
      pecho: [0, -0.1, 0],
      cabeza: [0.02, 0.42, 0.05],
      hombroIzq: [-0.92, -0.2, 0.66],
      codoIzq: [-0.62, 0, 0.18],
      munecaIzq: [-0.25, 0, 0.1],
      hombroDer: [0.16 + paso * 0.18, 0, 0.02],
      codoDer: [-0.5, 0, 0],
      piernaIzq: [paso * 0.16, 0, 0],
      rodillaIzq: [Math.max(0, -paso) * 0.24, 0, 0],
      piernaDer: [-paso * 0.16, 0, 0],
      rodillaDer: [Math.max(0, paso) * 0.24, 0, 0],
    },
    {
      boca: 0.18,
      giroRaiz: -0.18,
      deslizRaiz: paso * 0.05,
      alturaRaiz: -Math.abs(paso) * 0.012,
      pulso: 1.1,
    },
  );
};

const pensar: Guion = (t) => {
  const aire = respiracion(t);
  const tamborileo = onda(t, 5.2, 0.07);
  return marco(
    {
      pecho: [aire * 0.01, 0.05, 0],
      cuello: [-0.04, 0.08, -0.05],
      cabeza: [-0.05, 0.12, -0.16],
      hombroDer: [-0.62, 0.1, -0.34],
      codoDer: [-2.18, 0, -0.12],
      munecaDer: [-0.35 + tamborileo, 0, 0.12],
      hombroIzq: [-0.28, 0, -0.02],
      codoIzq: [-1.24, 0, 0.3],
    },
    { boca: 0.05, pulso: 0.6 + Math.abs(onda(t, 2.4, 0.5)) },
  );
};

const asentir: Guion = (t) => {
  const cabeceo = onda(t, 4.2, 0.2);
  return marco(
    {
      pecho: [0.02, 0, 0],
      cuello: [0.08 + cabeceo * 0.4, 0, 0],
      cabeza: [0.12 + cabeceo, 0.02, 0.02],
      hombroIzq: [-0.16, 0, 0.04],
      hombroDer: [-0.16, 0, -0.04],
      codoIzq: [-0.5, 0, 0],
      codoDer: [-0.5, 0, 0],
    },
    { boca: 0.16, pulso: 1.15 },
  );
};

const negar: Guion = (t) => {
  const giro = onda(t, 4.4, 0.32);
  return marco(
    {
      pecho: [-0.02, giro * 0.18, 0],
      cuello: [-0.03, giro * 0.5, 0],
      cabeza: [-0.02, giro, 0],
      hombroDer: [-0.72, 0, -0.38],
      codoDer: [-1.24, 0, -0.24],
      munecaDer: [0, giro * 0.6, -0.1],
      hombroIzq: [0.08, 0, 0.04],
      codoIzq: [-0.42, 0, 0],
    },
    { boca: 0.12, pulso: 1.05, tinte: "atencion" },
  );
};

const celebrar: Guion = (t) => {
  const salto = Math.abs(onda(t, 3.1, 1));
  const brazos = onda(t, 3.1, 0.14);
  return marco(
    {
      cadera: [0, onda(t, 1.5, 0.06), 0],
      pecho: [-0.08, 0, 0],
      cabeza: [-0.14, onda(t, 1.6, 0.08), 0],
      hombroIzq: [-0.24 + brazos, 0, 2.42],
      codoIzq: [-0.34, 0, 0.2],
      hombroDer: [-0.24 + brazos, 0, -2.42],
      codoDer: [-0.34, 0, -0.2],
      piernaIzq: [salto * -0.12, 0, 0],
      piernaDer: [salto * -0.12, 0, 0],
      rodillaIzq: [salto * 0.22, 0, 0],
      rodillaDer: [salto * 0.22, 0, 0],
    },
    { boca: 0.55, alturaRaiz: salto * 0.045, pulso: 1.45 },
  );
};

const alerta: Guion = (t) => {
  const tension = onda(t, 8.5, 0.02);
  return marco(
    {
      cadera: [0, 0, 0],
      pecho: [-0.06, 0, 0],
      cabeza: [-0.04 + tension, 0, 0],
      hombroIzq: [-0.66, 0, 0.28],
      codoIzq: [-1.42, 0.2, 0.16],
      munecaIzq: [-0.4, 0, -0.1],
      hombroDer: [-0.66, 0, -0.28],
      codoDer: [-1.42, -0.2, -0.16],
      munecaDer: [-0.4, 0, 0.1],
    },
    {
      boca: 0.18,
      pulso: 0.8 + Math.abs(onda(t, 4.6, 0.9)),
      tinte: "atencion",
    },
  );
};

const escribir: Guion = (t) => {
  const teclaIzq = Math.max(0, onda(t, 9.4, 1));
  const teclaDer = Math.max(0, onda(t, 9.4, 1, 1.7));
  return marco(
    {
      cadera: [0.04, 0, 0],
      pecho: [0.08, 0, 0],
      cuello: [0.14, 0, 0],
      cabeza: [0.2, onda(t, 1.2, 0.08), 0],
      hombroIzq: [-0.94, -0.12, 0.06],
      codoIzq: [-1.32 - teclaIzq * 0.08, 0, 0.12],
      munecaIzq: [-0.5 + teclaIzq * 0.22, 0, -0.16],
      hombroDer: [-0.94, 0.12, -0.06],
      codoDer: [-1.32 - teclaDer * 0.08, 0, -0.12],
      munecaDer: [-0.5 + teclaDer * 0.22, 0, 0.16],
    },
    { boca: 0.08, pulso: 0.95 + teclaIzq * 0.2 },
  );
};

const descanso: Guion = (t) => {
  const aire = onda(t, 0.9, 1);
  return marco(
    {
      cadera: [0.02, 0, 0],
      pecho: [0.09 + aire * 0.014, 0, 0],
      cuello: [0.16, 0, 0],
      cabeza: [0.24, onda(t, 0.35, 0.05), 0.05],
      hombroIzq: [0.14, 0, -0.03],
      hombroDer: [0.14, 0, 0.03],
      codoIzq: [-0.2, 0, 0],
      codoDer: [-0.2, 0, 0],
    },
    { boca: 0, alturaRaiz: -0.012 + aire * 0.004, pulso: 0.28 },
  );
};

export const GUIONES: Record<AccionAurora, Guion> = {
  reposo,
  saludo,
  hablar,
  escuchar,
  senalar,
  guiar,
  pensar,
  asentir,
  negar,
  celebrar,
  alerta,
  escribir,
  descanso,
};

export const marcoDe = (accion: AccionAurora, t: number): Marco => GUIONES[accion](t);

export const marcoBase = (): Marco => marco({});
