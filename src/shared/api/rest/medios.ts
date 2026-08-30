import { ErrorApi } from "../problemDetails";
import { solicitar } from "../transporte";
import type {
  ConfirmarApi,
  MedioApi,
  PreparacionApi,
  PrepararApi,
  RestriccionesApi,
  SubidaApi,
} from "./contrato";

export const CAMPO_DEL_ARCHIVO = "file";

export const prepararMedio = (peticion: PrepararApi): Promise<PreparacionApi> =>
  solicitar<PreparacionApi>("comercial", "/medios:preparar", {
    metodo: "POST",
    cuerpo: peticion,
  });

export const confirmarMedio = (medioId: string, confirmacion: ConfirmarApi): Promise<MedioApi> =>
  solicitar<MedioApi>("comercial", `/medios/${medioId}:confirmar`, {
    metodo: "POST",
    cuerpo: confirmacion,
  });

export type ArchivoASubir = {
  nombre: string;
  mime: string;
  bytes: number;
  contenido: Blob;
};

export const motivoDeRechazo = (
  restricciones: RestriccionesApi,
  archivo: ArchivoASubir,
): string | null => {
  if (restricciones.restantes <= 0)
    return `Esta entidad ya alcanzó el máximo de ${restricciones.cantidadMaxima} archivos.`;
  if (!restricciones.mimes.includes(archivo.mime))
    return `El formato ${archivo.mime} no está admitido. Admitidos: ${restricciones.mimes.join(", ")}.`;
  if (archivo.bytes > restricciones.bytesMaximos)
    return `El archivo supera el máximo de ${Math.round(restricciones.bytesMaximos / 1_048_576)} MB.`;
  return null;
};

export const construirFormulario = (subida: SubidaApi, archivo: ArchivoASubir): FormData => {
  const formulario = new FormData();
  for (const [clave, valor] of Object.entries(subida.campos ?? {})) formulario.append(clave, valor);
  formulario.append(CAMPO_DEL_ARCHIVO, archivo.contenido, archivo.nombre);
  return formulario;
};

const errorDeAlmacenamiento = (estado: number): ErrorApi =>
  new ErrorApi({
    type: "https://sicamed.co/problemas/subida-rechazada",
    title: "El almacenamiento rechazó el archivo",
    detail:
      "La autorización de subida venció o el archivo no cumple la política firmada. Vuelve a " +
      "preparar la subida e inténtalo de nuevo.",
    status: estado,
  });

export const subirAlAlmacenamiento = async (
  subida: SubidaApi,
  archivo: ArchivoASubir,
): Promise<void> => {
  const esFormulario = subida.metodo.toUpperCase() === "POST";
  const respuesta = await fetch(subida.url, {
    method: subida.metodo,
    headers: esFormulario ? undefined : { ...subida.cabeceras, "Content-Type": archivo.mime },
    body: esFormulario ? construirFormulario(subida, archivo) : archivo.contenido,
  }).catch(() => undefined);

  if (!respuesta) throw errorDeAlmacenamiento(0);
  if (!respuesta.ok) throw errorDeAlmacenamiento(respuesta.status);
};

export const subirMedio = async (
  peticion: PrepararApi,
  archivo: ArchivoASubir,
  confirmacion: ConfirmarApi,
): Promise<MedioApi> => {
  const preparacion = await prepararMedio(peticion);
  const rechazo = motivoDeRechazo(preparacion.restricciones, archivo);
  if (rechazo)
    throw new ErrorApi({
      type: "https://sicamed.co/problemas/contenido-invalido",
      title: "El archivo no cumple las restricciones del medio",
      detail: rechazo,
      status: 422,
    });
  await subirAlAlmacenamiento(preparacion.subida, archivo);
  return confirmarMedio(preparacion.medioId, confirmacion);
};

export const galeriaDe = (coleccion: string, entidadId: string): Promise<readonly MedioApi[]> =>
  solicitar<readonly MedioApi[]>("comercial", `/${coleccion}/${entidadId}/medios`);

export const reordenarGaleria = (
  coleccion: string,
  entidadId: string,
  orden: readonly string[],
): Promise<readonly MedioApi[]> =>
  solicitar<readonly MedioApi[]>("comercial", `/${coleccion}/${entidadId}/medios`, {
    metodo: "PATCH",
    cuerpo: { orden },
  });
