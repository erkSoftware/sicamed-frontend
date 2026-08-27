import { ErrorApi, esProblemDetail, problemaDesconocido } from "./problemDetails";

export type Zona = "comercial" | "clinico";

export const modoMock = (import.meta.env.VITE_MODO_API ?? "mock") !== "http";

const BASES: Record<Zona, string> = {
  comercial: import.meta.env.VITE_URL_API_COMERCIAL ?? "/api/comercial",
  clinico: import.meta.env.VITE_URL_API_CLINICA ?? "/api/clinico",
};

let obtenerCredencial: () => string | undefined = () => undefined;

export const registrarCredencial = (proveedor: () => string | undefined): void => {
  obtenerCredencial = proveedor;
};

const encabezados = (zona: Zona): HeadersInit => {
  const credencial = obtenerCredencial();
  const base: Record<string, string> = {
    Accept: "application/json, application/problem+json",
    "Content-Type": "application/json",
    "Accept-Language": "es-CO",
  };
  if (credencial) base.Authorization = `Bearer ${credencial}`;
  if (zona === "clinico") base["Cache-Control"] = "no-store";
  return base;
};

export const solicitar = async <T,>(
  zona: Zona,
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown; parametros?: Record<string, string | number | undefined> } = {},
): Promise<T> => {
  const url = new URL(`${BASES[zona]}${ruta}`, window.location.origin);
  for (const [clave, valor] of Object.entries(opciones.parametros ?? {})) {
    if (valor !== undefined && valor !== "") url.searchParams.set(clave, String(valor));
  }

  const respuesta = await fetch(url, {
    method: opciones.metodo ?? "GET",
    headers: encabezados(zona),
    credentials: "include",
    cache: zona === "clinico" ? "no-store" : "default",
    body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => undefined);
    throw new ErrorApi(
      esProblemDetail(cuerpo) ? cuerpo : problemaDesconocido(respuesta.status),
    );
  }

  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
};
