import { CONTORNOS } from "../../../api/mock/contornos";
import { encuadrarMercator, proyectarMercator, trazoMercator } from "../../../geo/proyecciones";

export type Papel = "cultivo" | "laboratorio" | "ips" | "paciente";

export type NodoRed = {
  codigo: string;
  ciudad: string;
  papel: Papel;
  lado: "izquierda" | "derecha";
  x: number;
  y: number;
  demora: number;
};

type Plaza = {
  codigo: string;
  ciudad: string;
  lon: number;
  lat: number;
  lado: "izquierda" | "derecha";
};

export type FormaDepartamento = {
  codigo: string;
  nombre: string;
  d: string;
  x: number;
  y: number;
};

const PLAZAS: Record<Papel, readonly Plaza[]> = {
  cultivo: [
    { codigo: "52", ciudad: "Pasto", lon: -77.281, lat: 1.214, lado: "izquierda" },
    { codigo: "73", ciudad: "Ibagué", lon: -75.232, lat: 4.439, lado: "izquierda" },
    { codigo: "66", ciudad: "Pereira", lon: -75.691, lat: 4.813, lado: "derecha" },
    { codigo: "50", ciudad: "Villavicencio", lon: -73.635, lat: 4.142, lado: "derecha" },
  ],
  laboratorio: [
    { codigo: "05", ciudad: "Medellín", lon: -75.563, lat: 6.251, lado: "derecha" },
    { codigo: "76", ciudad: "Cali", lon: -76.522, lat: 3.452, lado: "derecha" },
    { codigo: "11", ciudad: "Bogotá", lon: -74.072, lat: 4.711, lado: "derecha" },
  ],
  ips: [
    { codigo: "08", ciudad: "Barranquilla", lon: -74.796, lat: 10.964, lado: "izquierda" },
    { codigo: "13", ciudad: "Cartagena", lon: -75.514, lat: 10.391, lado: "izquierda" },
    { codigo: "68", ciudad: "Bucaramanga", lon: -73.126, lat: 7.119, lado: "derecha" },
  ],
  paciente: [
    { codigo: "47", ciudad: "Santa Marta", lon: -74.199, lat: 11.241, lado: "derecha" },
    { codigo: "54", ciudad: "Cúcuta", lon: -72.505, lat: 7.894, lado: "derecha" },
  ],
};

export const ENCUADRE = encuadrarMercator(
  CONTORNOS.flatMap((contorno) => contorno.anillos),
  1000,
);

export const RAZON = ENCUADRE.ancho / ENCUADRE.alto;

export const FORMAS: readonly FormaDepartamento[] = CONTORNOS.map((contorno) => {
  const [x, y] = proyectarMercator(contorno.lon, contorno.lat, ENCUADRE);
  return {
    codigo: contorno.codigo,
    nombre: contorno.nombre,
    d: trazoMercator(contorno.anillos, ENCUADRE),
    x,
    y,
  };
});

const POR_CODIGO = new Map(FORMAS.map((forma) => [forma.codigo, forma]));

export const formaDe = (codigo: string | null | undefined): FormaDepartamento | null =>
  codigo ? (POR_CODIGO.get(codigo) ?? null) : null;

export const NODOS: readonly NodoRed[] = (
  Object.entries(PLAZAS) as readonly (readonly [Papel, readonly Plaza[]])[]
).flatMap(([papel, plazas]) =>
  plazas.map((plaza, indice) => {
    const [x, y] = proyectarMercator(plaza.lon, plaza.lat, ENCUADRE);
    return {
      codigo: plaza.codigo,
      ciudad: plaza.ciudad,
      papel,
      lado: plaza.lado,
      x,
      y,
      demora: indice * 260 + Object.keys(PLAZAS).indexOf(papel) * 110,
    };
  }),
);

export const CENTRO: readonly [number, number] = [ENCUADRE.ancho * 0.46, ENCUADRE.alto * 0.42];

export const arco = (
  origen: readonly [number, number],
  destino: readonly [number, number],
  curvatura = 0.24,
): string => {
  const [x1, y1] = origen;
  const [x2, y2] = destino;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  return `M${x1} ${y1} Q${mx - dy * curvatura} ${my + dx * curvatura} ${x2} ${y2}`;
};

export const CADENA: readonly string[] = ["19", "25", "11"];
