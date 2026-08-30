import type { ContornoDepartamento } from "../api/mock/contornos";
import { departamentoEnPunto, departamentoMasCercano, departamentoPorNombre } from "./regiones";

export type UbicacionAproximada = {
  ciudad: string;
  region: string;
  pais: string;
  enColombia: boolean;
  departamento: ContornoDepartamento | null;
};

type RespuestaServicio = {
  success?: boolean;
  city?: unknown;
  region?: unknown;
  country?: unknown;
  country_code?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

const URL_SERVICIO = import.meta.env.VITE_URL_UBICACION_IP ?? "https://ipwho.is/";

const texto = (valor: unknown): string => (typeof valor === "string" ? valor.trim() : "");

const numero = (valor: unknown): number | null => {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string" && valor.trim() !== "") {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : null;
  }
  return null;
};

export const interpretarUbicacion = (datos: RespuestaServicio): UbicacionAproximada | null => {
  if (datos.success === false) return null;
  const pais = texto(datos.country);
  const codigoPais = texto(datos.country_code).toUpperCase();
  const region = texto(datos.region);
  const ciudad = texto(datos.city);
  if (!region && !ciudad) return null;

  const lon = numero(datos.longitude);
  const lat = numero(datos.latitude);
  const enColombia = codigoPais === "CO";

  const departamento = !enColombia
    ? null
    : ((lon !== null && lat !== null ? departamentoEnPunto(lon, lat) : null) ??
      (region ? departamentoPorNombre(region) : null) ??
      (lon !== null && lat !== null ? departamentoMasCercano(lon, lat) : null));

  return { ciudad, region, pais, enColombia, departamento };
};

export const consultarUbicacion = async (
  senal?: AbortSignal,
): Promise<UbicacionAproximada | null> => {
  try {
    const respuesta = await fetch(URL_SERVICIO, senal ? { signal: senal } : {});
    if (!respuesta.ok) return null;
    return interpretarUbicacion((await respuesta.json()) as RespuestaServicio);
  } catch {
    return null;
  }
};
