const UNIDADES = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
] as const;

const DECENAS = [
  "",
  "",
  "veinte",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
] as const;

const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
] as const;

const decenas = (valor: number): string => {
  if (valor <= 20) return UNIDADES[valor] ?? "";
  if (valor < 30) return `veinti${UNIDADES[valor - 20] ?? ""}`;
  const decena = DECENAS[Math.floor(valor / 10)] ?? "";
  const unidad = valor % 10;
  return unidad === 0 ? decena : `${decena} y ${UNIDADES[unidad] ?? ""}`;
};

const centenas = (valor: number): string => {
  if (valor === 100) return "cien";
  if (valor < 100) return decenas(valor);
  const centena = CENTENAS[Math.floor(valor / 100)] ?? "";
  const resto = valor % 100;
  return resto === 0 ? centena : `${centena} ${decenas(resto)}`;
};

export const enLetras = (valor: number): string => {
  if (!Number.isFinite(valor) || valor < 0) return "";
  const entero = Math.floor(valor);
  if (entero < 1000) return centenas(entero);
  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;
  const prefijo = miles === 1 ? "mil" : `${centenas(miles)} mil`;
  return resto === 0 ? prefijo : `${prefijo} ${centenas(resto)}`;
};
