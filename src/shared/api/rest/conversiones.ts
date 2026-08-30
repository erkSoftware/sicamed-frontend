import type { Decimal } from "./contrato";

export const aNumero = (valor: Decimal | null | undefined, porDefecto = 0): number => {
  if (valor === null || valor === undefined || valor === "") return porDefecto;
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : porDefecto;
};

export const aTexto = (valor: string | null | undefined, porDefecto = ""): string =>
  valor === null || valor === undefined ? porDefecto : valor;

export const aNulo = (valor: string | null | undefined): string | null =>
  valor === undefined || valor === "" ? null : valor;

export const soloFecha = (instante: string | null | undefined): string =>
  instante ? (instante.split("T")[0] ?? "") : "";
