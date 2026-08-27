export type Punto = readonly [number, number];

export type Encuadre = {
  ancho: number;
  alto: number;
  escala: number;
  desplazamientoX: number;
  desplazamientoY: number;
};

const GRADOS = Math.PI / 180;

export const mercatorY = (lat: number): number =>
  (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * GRADOS) / 2));

export const encuadrarMercator = (anillos: readonly (readonly number[])[], ancho: number): Encuadre => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const anillo of anillos) {
    for (let i = 0; i < anillo.length; i += 2) {
      const x = anillo[i] as number;
      const y = mercatorY(anillo[i + 1] as number);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const escala = ancho / (maxX - minX);
  return {
    ancho,
    alto: Math.round((maxY - minY) * escala),
    escala,
    desplazamientoX: minX,
    desplazamientoY: maxY,
  };
};

export const proyectarMercator = (lon: number, lat: number, encuadre: Encuadre): Punto => [
  Math.round((lon - encuadre.desplazamientoX) * encuadre.escala * 10) / 10,
  Math.round((encuadre.desplazamientoY - mercatorY(lat)) * encuadre.escala * 10) / 10,
];

export const trazoMercator = (anillos: readonly (readonly number[])[], encuadre: Encuadre): string => {
  let d = "";
  for (const anillo of anillos) {
    for (let i = 0; i < anillo.length; i += 2) {
      const [x, y] = proyectarMercator(anillo[i] as number, anillo[i + 1] as number, encuadre);
      d += `${i === 0 ? "M" : "L"}${x} ${y}`;
    }
    d += "Z";
  }
  return d;
};

export type Camara = {
  lon: number;
  lat: number;
  radio: number;
  centroX: number;
  centroY: number;
};

export const proyectarOrtografica = (
  lon: number,
  lat: number,
  camara: Camara,
): { x: number; y: number; visible: boolean } => {
  const fi = lat * GRADOS;
  const lambda = (lon - camara.lon) * GRADOS;
  const fi0 = camara.lat * GRADOS;
  const senoFi = Math.sin(fi);
  const cosenoFi = Math.cos(fi);
  const cosenoLambda = Math.cos(lambda);
  const coseno = Math.sin(fi0) * senoFi + Math.cos(fi0) * cosenoFi * cosenoLambda;
  return {
    x: camara.centroX + camara.radio * cosenoFi * Math.sin(lambda),
    y: camara.centroY - camara.radio * (Math.cos(fi0) * senoFi - Math.sin(fi0) * cosenoFi * cosenoLambda),
    visible: coseno >= 0,
  };
};

export const invertirOrtografica = (
  x: number,
  y: number,
  camara: Camara,
): { lon: number; lat: number } | null => {
  const xr = (x - camara.centroX) / camara.radio;
  const yr = (camara.centroY - y) / camara.radio;
  const rho = Math.hypot(xr, yr);
  if (rho > 1) return null;

  const cosC = Math.sqrt(1 - rho * rho);
  const fi0 = camara.lat * GRADOS;
  const senoFi0 = Math.sin(fi0);
  const cosenoFi0 = Math.cos(fi0);

  const lat = Math.asin(cosC * senoFi0 + yr * cosenoFi0) / GRADOS;
  const lon = camara.lon + Math.atan2(xr, cosC * cosenoFi0 - yr * senoFi0) / GRADOS;
  return { lon, lat };
};

export const puntoEnAnillo = (lon: number, lat: number, anillo: readonly number[]): boolean => {
  let dentro = false;
  const total = anillo.length;
  for (let i = 0, j = total - 2; i < total; j = i, i += 2) {
    const xi = anillo[i] as number;
    const yi = anillo[i + 1] as number;
    const xj = anillo[j] as number;
    const yj = anillo[j + 1] as number;
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
};
