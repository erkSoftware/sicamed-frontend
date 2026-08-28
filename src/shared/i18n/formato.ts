const LOCALE = "es-CO";

export const numero = (valor: number, locale: string = LOCALE): string =>
  new Intl.NumberFormat(locale).format(valor);

export const compacto = (valor: number, locale: string = LOCALE): string =>
  new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(valor);

export const porcentaje = (valor: number, decimales = 1): string =>
  new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);

export const fecha = (iso: string, locale: string = LOCALE): string =>
  new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  );

export const fechaCorta = (iso: string): string =>
  new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short", year: "numeric" })
    .formatToParts(new Date(iso))
    .filter((parte) => parte.type !== "literal")
    .map((parte) => (parte.type === "month" ? parte.value.replace(".", "") : parte.value))
    .join(" ");

export const fechaHora = (iso: string): string =>
  new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export const fechaLarga = (iso: string, locale: string = LOCALE): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso));

export const diasHasta = (iso: string): number =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

export const iniciales = (nombre: string): string =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");

export const normalizar = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const magnitud = (valor: number, unidad: string): string => `${compacto(valor)} ${unidad}`;
