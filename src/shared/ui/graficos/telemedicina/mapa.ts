import { CONTORNOS } from "../../../api/mock/contornos";
import { encuadrarMercator, proyectarMercator, trazoMercator } from "../../../geo/proyecciones";

export type Papel = "cultivo" | "laboratorio" | "ips" | "paciente";

export type NodoRed = {
  codigo: string;
  papel: Papel;
  x: number;
  y: number;
  demora: number;
};

export type FormaDepartamento = {
  codigo: string;
  nombre: string;
  d: string;
  x: number;
  y: number;
};

const PAPELES: Record<Papel, readonly string[]> = {
  cultivo: ["19", "73", "15", "05", "52", "17"],
  laboratorio: ["25", "05", "76"],
  ips: ["11", "08", "68", "76", "13"],
  paciente: ["50", "66", "20", "23"],
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
  Object.entries(PAPELES) as readonly (readonly [Papel, readonly string[]])[]
).flatMap(([papel, codigos]) =>
  codigos.flatMap((codigo, indice) => {
    const forma = POR_CODIGO.get(codigo);
    if (!forma) return [];
    return [
      {
        codigo,
        papel,
        x: forma.x,
        y: forma.y,
        demora: indice * 260 + Object.keys(PAPELES).indexOf(papel) * 110,
      },
    ];
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
