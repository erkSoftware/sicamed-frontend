import { CONTORNOS } from "../api/mock/contornos";
import type { ContornoDepartamento } from "../api/mock/contornos";
import { puntoEnAnillo } from "../geo/proyecciones";

const RELLENO = /\b(departamento|department|dept|distrito|del|de|la|el|los|las|d)\b/g;

export const normalizarRegion = (texto: string): string =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(RELLENO, " ")
    .replace(/\s+/g, " ")
    .trim();

const INDICE_POR_NOMBRE = new Map(
  CONTORNOS.map((contorno) => [normalizarRegion(contorno.nombre), contorno]),
);

export const departamentoEnPunto = (lon: number, lat: number): ContornoDepartamento | null => {
  for (const contorno of CONTORNOS) {
    for (const anillo of contorno.anillos) {
      if (puntoEnAnillo(lon, lat, anillo)) return contorno;
    }
  }
  return null;
};

export const departamentoPorNombre = (nombre: string): ContornoDepartamento | null => {
  const clave = normalizarRegion(nombre);
  if (!clave) return null;
  const exacto = INDICE_POR_NOMBRE.get(clave);
  if (exacto) return exacto;
  for (const [candidato, contorno] of INDICE_POR_NOMBRE) {
    if (clave.includes(candidato) || candidato.includes(clave)) return contorno;
  }
  return null;
};

export const departamentoMasCercano = (lon: number, lat: number): ContornoDepartamento | null => {
  let elegido: ContornoDepartamento | null = null;
  let menor = Infinity;
  for (const contorno of CONTORNOS) {
    const distancia = Math.hypot(contorno.lon - lon, contorno.lat - lat);
    if (distancia < menor) {
      menor = distancia;
      elegido = contorno;
    }
  }
  return menor <= 3 ? elegido : null;
};
