const BASE32 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const revolver = (texto: string, semilla: number): number => {
  let acumulado = semilla >>> 0;
  for (let i = 0; i < texto.length; i += 1) {
    acumulado ^= texto.charCodeAt(i);
    acumulado = Math.imul(acumulado, 16777619) >>> 0;
  }
  return acumulado >>> 0;
};

const bloque = (valor: number): string => {
  let resto = valor;
  let salida = "";
  for (let i = 0; i < 4; i += 1) {
    salida += BASE32[resto % BASE32.length] ?? "A";
    resto = Math.floor(resto / BASE32.length);
  }
  return salida;
};

export const SAL_DE_SEUDONIMO = 0x51ca3ed;

export const seudonimoDe = (identificadorClinico: string): string =>
  `SEU-${bloque(revolver(identificadorClinico, SAL_DE_SEUDONIMO))}-${bloque(
    revolver(`${identificadorClinico}:2`, SAL_DE_SEUDONIMO),
  )}`;

export const esSeudonimo = (valor: string): boolean => /^SEU-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(valor);
