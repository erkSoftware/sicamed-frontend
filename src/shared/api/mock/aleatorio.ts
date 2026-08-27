export const crearAzar = (semilla: number) => {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
};


export const enteroEntre = (azar: () => number, minimo: number, maximo: number): number =>
  minimo + Math.floor(azar() * (maximo - minimo + 1));

export const fechaRelativa = (dias: number): string => {
  const base = new Date("2026-08-26T09:00:00-05:00");
  base.setDate(base.getDate() + dias);
  return base.toISOString();
};

export const identificador = (prefijo: string, indice: number): string =>
  `${prefijo}-${String(indice + 1).padStart(4, "0")}`;
