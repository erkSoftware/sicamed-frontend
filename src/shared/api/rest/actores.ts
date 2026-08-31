import { ErrorApi } from "../problemDetails";
import type { PreparacionSoporteApi, SubidaSoporteApi } from "./contrato";

export const CAMPO_DEL_ARCHIVO = "file";

export const MIMES_ADMITIDOS: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const BYTES_MAXIMOS = 10 * 1024 * 1024;

export const NOMBRE_MAXIMO = 200;

export const CLAVE_MINIMA = 12;

export type ArchivoDeSoporte = {
  nombre: string;
  mime: string;
  bytes: number;
  contenido: Blob;
};

export const aArchivoDeSoporte = (archivo: File): ArchivoDeSoporte => ({
  nombre: archivo.name,
  mime: archivo.type,
  bytes: archivo.size,
  contenido: archivo,
});

const megas = (bytes: number): number => Math.round(bytes / 1_048_576);

export const motivoDeRechazo = (
  archivo: ArchivoDeSoporte,
  mimes: readonly string[] = MIMES_ADMITIDOS,
  bytesMaximos: number = BYTES_MAXIMOS,
): string | null => {
  if (archivo.bytes === 0) return "El archivo está vacío.";
  if (archivo.nombre.length === 0) return "El archivo no tiene nombre.";
  if (archivo.nombre.length > NOMBRE_MAXIMO)
    return `El nombre del archivo supera los ${NOMBRE_MAXIMO} caracteres. Renómbralo antes de subirlo.`;
  if (!mimes.includes(archivo.mime))
    return `El formato ${archivo.mime || "desconocido"} no está admitido. Se admiten PDF, JPG, PNG y WEBP.`;
  if (archivo.bytes > bytesMaximos) return `El archivo supera el máximo de ${megas(bytesMaximos)} MB.`;
  return null;
};

export const construirFormulario = (
  subida: SubidaSoporteApi,
  archivo: ArchivoDeSoporte,
): FormData => {
  const formulario = new FormData();
  for (const [clave, valor] of Object.entries(subida.campos ?? {})) formulario.append(clave, valor);
  formulario.append(CAMPO_DEL_ARCHIVO, archivo.contenido, archivo.nombre);
  return formulario;
};

const errorDeAlmacenamiento = (estado: number): ErrorApi =>
  new ErrorApi({
    type: "https://sicamed.co/problemas/subida-rechazada",
    title: "El almacenamiento no aceptó el archivo",
    detail:
      "La autorización de subida caduca a los diez minutos y el archivo no llegó a tiempo, o su " +
      "tamaño no coincide con el declarado. Vuelve a elegir el archivo para reintentarlo.",
    status: estado,
  });

export const subirAlAlmacenamiento = async (
  subida: SubidaSoporteApi,
  archivo: ArchivoDeSoporte,
): Promise<void> => {
  const respuesta = await fetch(subida.url, {
    method: subida.metodo,
    body: construirFormulario(subida, archivo),
  }).catch(() => undefined);

  if (!respuesta) throw errorDeAlmacenamiento(0);
  if (!respuesta.ok) throw errorDeAlmacenamiento(respuesta.status);
};

export const rechazoDeLaPreparacion = (
  preparacion: PreparacionSoporteApi,
  archivo: ArchivoDeSoporte,
): ErrorApi | null => {
  const motivo = motivoDeRechazo(archivo, preparacion.mimesAdmitidos, preparacion.bytesMaximos);
  if (!motivo) return null;
  return new ErrorApi({
    type: "https://sicamed.co/problemas/contenido-invalido",
    title: "El archivo no cumple lo que admite el trámite",
    detail: motivo,
    status: 422,
  });
};

export const claveDeIdempotencia = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "")
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
