const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71] as const;

const FORMA = /^(\d{9,10})-(\d)$/;

export const digitoDeVerificacion = (numero: string): number | null => {
  if (!/^\d{9,15}$/.test(numero)) return null;
  let suma = 0;
  for (let posicion = 0; posicion < numero.length; posicion += 1) {
    const digito = Number(numero[numero.length - 1 - posicion]);
    const peso = PESOS[posicion];
    if (peso === undefined) return null;
    suma += digito * peso;
  }
  const resto = suma % 11;
  return resto < 2 ? resto : 11 - resto;
};

export const nitConDigito = (numero: string): string | null => {
  const digito = digitoDeVerificacion(numero);
  return digito === null ? null : `${numero}-${digito}`;
};

export type FalloDeNit = "forma" | "digito";

export const revisarNit = (valor: string): { fallo: FalloDeNit; esperado?: string } | null => {
  const partes = FORMA.exec(valor.trim());
  if (!partes) return { fallo: "forma" };
  const numero = partes[1] ?? "";
  const declarado = partes[2] ?? "";
  const esperado = digitoDeVerificacion(numero);
  if (esperado === null) return { fallo: "forma" };
  if (esperado !== Number(declarado)) return { fallo: "digito", esperado: String(esperado) };
  return null;
};
