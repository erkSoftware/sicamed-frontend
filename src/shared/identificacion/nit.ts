const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71] as const;

const DIGITOS_DEL_NUMERO = { minimo: 6, maximo: 10 } as const;

export const soloDigitos = (valor: string): string => valor.replace(/\D/g, "");

export const digitoDeVerificacion = (numero: string): number | null => {
  if (!/^\d{1,15}$/.test(numero)) return null;
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

const partirNit = (valor: string): { numero: string; declarado: string } | null => {
  const digitos = soloDigitos(valor);
  const largo = digitos.length - 1;
  if (largo < DIGITOS_DEL_NUMERO.minimo || largo > DIGITOS_DEL_NUMERO.maximo) return null;
  return { numero: digitos.slice(0, -1), declarado: digitos.slice(-1) };
};

export type FalloDeNit = "forma" | "digito";

export const revisarNit = (valor: string): { fallo: FalloDeNit; esperado?: string } | null => {
  const partes = partirNit(valor);
  if (!partes) return { fallo: "forma" };
  const esperado = digitoDeVerificacion(partes.numero);
  if (esperado === null) return { fallo: "forma" };
  if (esperado !== Number(partes.declarado)) return { fallo: "digito", esperado: String(esperado) };
  return null;
};

export const nitCanonico = (valor: string): string | null => {
  const partes = partirNit(valor);
  return partes ? `${partes.numero}-${partes.declarado}` : null;
};
