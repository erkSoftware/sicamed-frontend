import { ErrorApi, esProblemDetail, problemaDeRed, problemaDesconocido } from "./problemDetails";

export type Zona = "comercial" | "clinico" | "publico" | "identidad";

export type ValorParametro = string | number | boolean | readonly string[] | undefined;

export type Parametros = Record<string, ValorParametro>;

export type OpcionesSolicitud = {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  parametros?: Parametros;
  cabeceras?: Record<string, string>;
};

export const modoMock = (import.meta.env.VITE_MODO_API ?? "mock") !== "http";

export const modoMockRegistro =
  modoMock && (import.meta.env.VITE_MODO_AUTH ?? "servidor") !== "servidor";

const BORDE = import.meta.env.VITE_URL_API ?? "http://localhost:8080";

const PREFIJOS: Record<Zona, string> = {
  comercial: "/api/v1/comercial",
  clinico: "/api/v1/clinica",
  publico: "/api/v1/publico",
  identidad: "/auth",
};

const SOBREESCRITURAS: Record<Zona, string | undefined> = {
  comercial: import.meta.env.VITE_URL_API_COMERCIAL,
  clinico: import.meta.env.VITE_URL_API_CLINICA,
  publico: import.meta.env.VITE_URL_API_PUBLICA,
  identidad: import.meta.env.VITE_URL_API_IDENTIDAD,
};

export const baseDeZona = (zona: Zona): string =>
  SOBREESCRITURAS[zona] ?? `${BORDE}${PREFIJOS[zona]}`;

let obtenerCredencial: () => string | undefined = () => undefined;

export const registrarCredencial = (proveedor: () => string | undefined): void => {
  obtenerCredencial = proveedor;
};

const origen = (): string =>
  typeof window === "undefined" ? "http://localhost" : window.location.origin;

export const construirUrl = (zona: Zona, ruta: string, parametros: Parametros = {}): URL => {
  const url = new URL(`${baseDeZona(zona)}${ruta}`, origen());
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === "") continue;
    if (Array.isArray(valor)) {
      for (const elemento of valor) url.searchParams.append(clave, elemento);
      continue;
    }
    url.searchParams.set(clave, String(valor));
  }
  return url;
};

const encabezados = (
  zona: Zona,
  llevaCuerpo: boolean,
  extra: Record<string, string> = {},
): Record<string, string> => {
  const credencial = obtenerCredencial();
  const base: Record<string, string> = {
    Accept: "application/json, application/problem+json",
    "Accept-Language": "es-CO",
  };
  if (llevaCuerpo) base["Content-Type"] = "application/json";
  if (credencial && zona !== "publico") base.Authorization = `Bearer ${credencial}`;
  for (const [clave, valor] of Object.entries(extra)) {
    if (valor !== "") base[clave] = valor;
  }
  return base;
};

const esperaDeclarada = (respuesta: Response): number | undefined => {
  const cabecera = respuesta.headers.get("ratelimit-reset") ?? respuesta.headers.get("retry-after");
  const segundos = Number(cabecera);
  return Number.isFinite(segundos) ? segundos : undefined;
};

export const identificadorDeSolicitud = (respuesta: Response): string | undefined =>
  respuesta.headers.get("x-request-id") ?? undefined;

const fallar = async (respuesta: Response): Promise<never> => {
  const cuerpo = await respuesta.json().catch(() => undefined);
  const problema = esProblemDetail(cuerpo) ? cuerpo : problemaDesconocido(respuesta.status);
  const espera = respuesta.status === 429 ? esperaDeclarada(respuesta) : undefined;
  throw new ErrorApi({
    ...problema,
    ...(espera === undefined ? {} : { reintentarEn: espera }),
    ...(problema.solicitudId ? {} : { solicitudId: identificadorDeSolicitud(respuesta) }),
  });
};

export const solicitar = async <T>(
  zona: Zona,
  ruta: string,
  opciones: OpcionesSolicitud = {},
): Promise<T> => {
  const url = construirUrl(zona, ruta, opciones.parametros);
  const llevaCuerpo = opciones.cuerpo !== undefined;

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: opciones.metodo ?? "GET",
      headers: encabezados(zona, llevaCuerpo, opciones.cabeceras),
      credentials: zona === "publico" ? "omit" : "include",
      cache: zona === "clinico" || zona === "identidad" ? "no-store" : "default",
      body: llevaCuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    });
  } catch {
    throw new ErrorApi(problemaDeRed());
  }

  if (!respuesta.ok) return fallar(respuesta);
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
};
