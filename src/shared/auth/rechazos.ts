import { aProblema } from "../api/problemDetails";
import type { ProblemDetail } from "../api/problemDetails";

export type ClaseDeRechazo =
  | "credencial"
  | "transito"
  | "revision"
  | "suspendida"
  | "bloqueada"
  | "sesion"
  | "captcha"
  | "servicio"
  | "otro";

const POR_TIPO: Readonly<Record<string, ClaseDeRechazo>> = {
  "credencial-invalida": "credencial",
  "clave-de-transito": "transito",
  "registro-en-revision": "revision",
  "credencial-suspendida": "suspendida",
  "cuenta-bloqueada": "bloqueada",
  "sesion-invalida": "sesion",
  "captcha-invalido": "captcha",
  "captcha-no-verificable": "captcha",
};

const RESPALDO: Readonly<Record<number, ClaseDeRechazo>> = {
  401: "credencial",
  429: "bloqueada",
};

export const nombreDelProblema = (problema: ProblemDetail): string =>
  problema.type.split("/").pop() ?? "";

export const claseDeRechazo = (error: unknown): ClaseDeRechazo => {
  const problema = aProblema(error);
  if (problema.status === 0 || problema.status >= 500) return "servicio";
  return POR_TIPO[nombreDelProblema(problema)] ?? RESPALDO[problema.status] ?? "otro";
};

const GENERICO =
  "No fue posible iniciar sesión. Revisa el correo y la contraseña e inténtalo de nuevo.";

export const mensajeDelRechazo = (error: unknown): string => {
  const problema = aProblema(error);
  if (problema.detail) return problema.detail;
  if (problema.title) return problema.title;
  return GENERICO;
};

export const exigeCambioDeClave = (error: unknown): boolean => claseDeRechazo(error) === "transito";
