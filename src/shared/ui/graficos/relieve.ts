export type PuntoRelieve = {
  x: number;
  y: number;
};

export type Cresta = {
  semilla: number;
  base: number;
  amplitud: number;
  dientes: number;
  ancho: number;
  alto: number;
  apertura?: (x: number) => number;
};

export const azar = (semilla: number): number => {
  const valor = Math.sin(semilla * 12.9898) * 43758.5453;
  return valor - Math.floor(valor);
};

export const aperturaCentral =
  (centro: number, radio: number, hondura: number) =>
  (x: number): number =>
    1 - hondura * Math.exp(-(((x - centro) / radio) ** 2));

export const cresta = ({
  semilla,
  base,
  amplitud,
  dientes,
  ancho,
  alto,
  apertura,
}: Cresta): string => {
  const puntos: PuntoRelieve[] = Array.from({ length: dientes + 1 }, (_, indice) => {
    const x = (indice / dientes) * ancho;
    const macizo = azar(semilla + indice * 0.09);
    const ladera = azar(semilla * 3.1 + indice * 0.28);
    const risco = azar(semilla * 7.7 + indice * 1.31);
    const relieve = macizo * 0.54 + ladera * 0.32 + risco * 0.14;
    return { x, y: base - amplitud * relieve * (apertura ? apertura(x) : 1) };
  });

  const arranque = puntos.at(0) ?? { x: 0, y: base };
  const cierre = puntos.at(-1) ?? arranque;

  const trazo = puntos.reduce(
    (acumulado, punto, indice) =>
      indice === 0 ? acumulado : `${acumulado} L ${punto.x.toFixed(1)} ${punto.y.toFixed(1)}`,
    `M ${arranque.x} ${arranque.y.toFixed(1)}`,
  );

  return `${trazo} L ${ancho} ${cierre.y.toFixed(1)} L ${ancho} ${alto} L 0 ${alto} Z`;
};

export const foliolo = (largo: number, ancho: number): string =>
  [
    "M 0 0",
    `C ${ancho * 0.34} ${-largo * 0.13} ${ancho * 0.98} ${-largo * 0.34} ${ancho * 0.38} ${-largo * 0.49}`,
    `L ${ancho * 0.68} ${-largo * 0.55}`,
    `C ${ancho * 0.52} ${-largo * 0.73} ${ancho * 0.26} ${-largo * 0.87} 0 ${-largo}`,
    `C ${-ancho * 0.26} ${-largo * 0.87} ${-ancho * 0.52} ${-largo * 0.73} ${-ancho * 0.68} ${-largo * 0.55}`,
    `L ${-ancho * 0.38} ${-largo * 0.49}`,
    `C ${-ancho * 0.98} ${-largo * 0.34} ${-ancho * 0.34} ${-largo * 0.13} 0 0`,
    "Z",
  ].join(" ");

export const ABANICO_CANNABIS = [
  { giro: 0, largo: 142, ancho: 27 },
  { giro: 25, largo: 128, ancho: 25 },
  { giro: -25, largo: 128, ancho: 25 },
  { giro: 51, largo: 102, ancho: 21 },
  { giro: -51, largo: 102, ancho: 21 },
  { giro: 78, largo: 70, ancho: 16 },
  { giro: -78, largo: 70, ancho: 16 },
] as const;
