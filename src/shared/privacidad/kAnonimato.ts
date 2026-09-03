export type Celda = {
  etiqueta: string;
  valor: number;
};

export type CorteAnonimizado = {
  celdas: readonly Celda[];
  k: number;
  suprimidas: number;
  masaSuprimida: number;
};

export const K_POR_DEFECTO = 5;

export const ETIQUETA_RESIDUO = "Otros territorios";

export const suprimirCeldasPequenas = (
  celdas: readonly Celda[],
  k: number = K_POR_DEFECTO,
  etiquetaResiduo: string = ETIQUETA_RESIDUO,
): CorteAnonimizado => {
  const publicables = celdas.filter((celda) => celda.valor === 0 || celda.valor >= k);
  const pequenas = celdas.filter((celda) => celda.valor > 0 && celda.valor < k);
  const masa = pequenas.reduce((suma, celda) => suma + celda.valor, 0);
  const residuo: readonly Celda[] = masa >= k ? [{ etiqueta: etiquetaResiduo, valor: masa }] : [];
  return {
    celdas: [...publicables, ...residuo],
    k,
    suprimidas: pequenas.length,
    masaSuprimida: masa >= k ? 0 : masa,
  };
};

export const cumpleKAnonimato = (celdas: readonly Celda[], k: number = K_POR_DEFECTO): boolean =>
  celdas.every((celda) => celda.valor === 0 || celda.valor >= k);

export const notaDeSupresion = (corte: CorteAnonimizado): string =>
  corte.suprimidas === 0
    ? `k = ${corte.k} · ninguna celda requirió supresión`
    : `k = ${corte.k} · ${corte.suprimidas} ${corte.suprimidas === 1 ? "celda suprimida" : "celdas suprimidas"}`;
