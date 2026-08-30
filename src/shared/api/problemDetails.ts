export type ErrorDeCampo = {
  campo: string;
  motivo: string;
};

export type ProblemDetail = {
  type: string;
  title: string;
  detail: string;
  status: number;
  instance?: string;
  norma?: string | null;
  accion?: { etiqueta: string; ruta: string } | null;
  errores?: readonly ErrorDeCampo[] | null;
  reintentarEn?: number;
  solicitudId?: string;
};

export const esProblemDetail = (valor: unknown): valor is ProblemDetail =>
  typeof valor === "object" &&
  valor !== null &&
  "type" in valor &&
  "title" in valor &&
  "status" in valor;

export class ErrorApi extends Error {
  readonly problema: ProblemDetail;

  constructor(problema: ProblemDetail) {
    super(problema.title);
    this.name = "ErrorApi";
    this.problema = problema;
  }
}

export const problemaDesconocido = (status = 500): ProblemDetail => ({
  type: "https://sicamed.co/problemas/error-inesperado",
  title: "No fue posible completar la operación",
  detail:
    "El servicio respondió con un error no previsto. Intenta de nuevo; si persiste, reporta el " +
    "identificador de la solicitud al soporte de SICAMED.",
  status,
});

export const problemaDeRed = (): ProblemDetail => ({
  type: "https://sicamed.co/problemas/servicio-inalcanzable",
  title: "No fue posible contactar el servicio",
  detail:
    "La petición no llegó a SICAMED. Revisa tu conexión e intenta de nuevo; si persiste, el " +
    "servicio puede estar en mantenimiento.",
  status: 0,
});

export const aProblema = (error: unknown): ProblemDetail => {
  if (error instanceof ErrorApi) return error.problema;
  if (esProblemDetail(error)) return error;
  if (error instanceof Error) return { ...problemaDesconocido(), detail: error.message };
  return problemaDesconocido();
};

export const erroresPorCampo = (problema: ProblemDetail): Readonly<Record<string, string>> =>
  Object.fromEntries((problema.errores ?? []).map((error) => [error.campo, error.motivo]));

export const esSesionInvalida = (problema: ProblemDetail): boolean => problema.status === 401;

export const esCuentaSinOrganizacion = (problema: ProblemDetail): boolean =>
  problema.status === 404 && problema.type.endsWith("/organizacion-no-asociada");

export const esLimiteDeTasa = (problema: ProblemDetail): boolean => problema.status === 429;

export const segundosDeEspera = (problema: ProblemDetail): number =>
  Math.max(0, Math.round(problema.reintentarEn ?? 0));

export const esFallaDelServicio = (problema: ProblemDetail): boolean =>
  problema.status === 0 || problema.status >= 500;

export const admiteReintento = (problema: ProblemDetail): boolean =>
  esFallaDelServicio(problema) || problema.status === 408 || problema.status === 409;
