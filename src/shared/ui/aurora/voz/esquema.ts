import type { ErrorDeCampo } from "../../../api/problemDetails";
import type { EsquemaHerramienta, PropiedadDeEsquema } from "../../../api/clienteAsistente";

export const MAXIMO_DE_ARGUMENTOS = 20;

export type ArgumentosValidados =
  | { ok: true; argumentos: Readonly<Record<string, unknown>> }
  | { ok: false; errores: readonly ErrorDeCampo[] };

export const leerArgumentos = (crudos: string | undefined): Record<string, unknown> => {
  if (!crudos) return {};
  try {
    const valor: unknown = JSON.parse(crudos);
    return typeof valor === "object" && valor !== null && !Array.isArray(valor)
      ? (valor as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const numeroDe = (valor: unknown): number | null => {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string" || valor.trim() === "") return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
};

const booleanoDe = (valor: unknown): boolean | null => {
  if (typeof valor === "boolean") return valor;
  if (valor === "true") return true;
  if (valor === "false") return false;
  return null;
};

const enumeradoAdmite = (propiedad: PropiedadDeEsquema, valor: unknown): boolean =>
  (propiedad.enum ?? []).some((admitido) => String(admitido) === String(valor));

const validarCadena = (
  propiedad: PropiedadDeEsquema,
  valor: unknown,
): { valor: string } | { motivo: string } => {
  if (typeof valor !== "string") return { motivo: "Debe ser texto." };
  if (propiedad.minLength !== undefined && valor.length < propiedad.minLength) {
    return { motivo: `No puede tener menos de ${propiedad.minLength} caracteres.` };
  }
  if (propiedad.maxLength !== undefined && valor.length > propiedad.maxLength) {
    return { motivo: `No puede tener más de ${propiedad.maxLength} caracteres.` };
  }
  if (propiedad.pattern !== undefined) {
    try {
      if (!new RegExp(propiedad.pattern, "u").test(valor)) {
        return { motivo: "No tiene el formato esperado." };
      }
    } catch {
      return { valor };
    }
  }
  return { valor };
};

const validarNumero = (
  propiedad: PropiedadDeEsquema,
  valor: unknown,
): { valor: number } | { motivo: string } => {
  const convertido = numeroDe(valor);
  if (convertido === null) return { motivo: "Debe ser un número." };
  if (propiedad.type === "integer" && !Number.isInteger(convertido)) {
    return { motivo: "Debe ser un número entero." };
  }
  if (propiedad.minimum !== undefined && convertido < propiedad.minimum) {
    return { motivo: `No puede ser menor que ${propiedad.minimum}.` };
  }
  if (propiedad.maximum !== undefined && convertido > propiedad.maximum) {
    return { motivo: `No puede ser mayor que ${propiedad.maximum}.` };
  }
  return { valor: convertido };
};

const validarPropiedad = (
  propiedad: PropiedadDeEsquema,
  valor: unknown,
): { valor: unknown } | { motivo: string } => {
  if (propiedad.enum && !enumeradoAdmite(propiedad, valor)) {
    return { motivo: `Solo admite: ${(propiedad.enum ?? []).join(", ")}.` };
  }

  if (propiedad.type === "number" || propiedad.type === "integer") {
    return validarNumero(propiedad, valor);
  }
  if (propiedad.type === "boolean") {
    const convertido = booleanoDe(valor);
    return convertido === null ? { motivo: "Debe ser sí o no." } : { valor: convertido };
  }
  if (propiedad.type === "array") {
    return Array.isArray(valor) ? { valor } : { motivo: "Debe ser una lista." };
  }
  if (propiedad.type === "string") return validarCadena(propiedad, valor);
  return { valor };
};

export const validarArgumentos = (
  esquema: EsquemaHerramienta | undefined,
  argumentos: Readonly<Record<string, unknown>>,
): ArgumentosValidados => {
  const claves = Object.keys(argumentos);
  if (claves.length > MAXIMO_DE_ARGUMENTOS) {
    return {
      ok: false,
      errores: [
        {
          campo: "argumentos",
          motivo: `No se admiten más de ${MAXIMO_DE_ARGUMENTOS} argumentos.`,
        },
      ],
    };
  }

  if (!esquema || esquema.type !== "object") return { ok: true, argumentos };

  const propiedades = esquema.properties ?? {};
  const errores: ErrorDeCampo[] = [];
  const limpios: Record<string, unknown> = {};

  for (const campo of esquema.required ?? []) {
    const valor = argumentos[campo];
    if (valor === undefined || valor === null || valor === "") {
      errores.push({ campo, motivo: "Es obligatorio." });
    }
  }

  for (const [campo, valor] of Object.entries(argumentos)) {
    const propiedad = propiedades[campo];
    if (!propiedad) {
      if (esquema.additionalProperties === false) {
        errores.push({ campo, motivo: "No es un argumento de esta herramienta." });
        continue;
      }
      limpios[campo] = valor;
      continue;
    }
    if (valor === undefined || valor === null) continue;

    const revisado = validarPropiedad(propiedad, valor);
    if ("motivo" in revisado) {
      errores.push({ campo, motivo: revisado.motivo });
      continue;
    }
    limpios[campo] = revisado.valor;
  }

  return errores.length > 0 ? { ok: false, errores } : { ok: true, argumentos: limpios };
};

export const etiquetaDeArgumento = (
  esquema: EsquemaHerramienta | undefined,
  campo: string,
): string => {
  const descripcion = esquema?.properties?.[campo]?.description ?? "";
  const primera = descripcion.split(/[.\n]/u)[0]?.trim() ?? "";
  return primera === "" ? campo : primera;
};

export const motivoDeErrores = (errores: readonly ErrorDeCampo[]): string =>
  errores.map((error) => `${error.campo} (${error.motivo.replace(/\.$/u, "")})`).join(", ");
