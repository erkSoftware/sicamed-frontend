export type ProblemDetail = {
  type: string;
  title: string;
  detail: string;
  status: number;
  instance?: string;
  norma?: string;
  accion?: { etiqueta: string; ruta: string };
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

export const aProblema = (error: unknown): ProblemDetail => {
  if (error instanceof ErrorApi) return error.problema;
  if (esProblemDetail(error)) return error;
  if (error instanceof Error)
    return { ...problemaDesconocido(), detail: error.message };
  return problemaDesconocido();
};
