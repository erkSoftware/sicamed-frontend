import { readFileSync, writeFileSync } from "node:fs";

const ORIGEN = process.argv[2];
const DESTINO = process.argv[3];

const REGION = { minLon: -95, maxLon: -45, minLat: -25, maxLat: 30 };
const TOLERANCIA_LEJOS = 0.32;
const TOLERANCIA_CERCA = 0.035;
const AREA_MINIMA_LEJOS = 1.2;
const AREA_MINIMA_CERCA = 0.012;

const cerca = ([lon, lat]) =>
  lon >= REGION.minLon && lon <= REGION.maxLon && lat >= REGION.minLat && lat <= REGION.maxLat;

const distanciaCuadrada = (p, a, b) => {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = b[0]; y = b[1]; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
};

const simplificar = (puntos) => {
  if (puntos.length <= 5) return puntos;
  const lejos = TOLERANCIA_LEJOS * TOLERANCIA_LEJOS;
  const cercaLimite = TOLERANCIA_CERCA * TOLERANCIA_CERCA;
  const conservar = new Uint8Array(puntos.length);
  conservar[0] = 1;
  conservar[puntos.length - 1] = 1;
  const pila = [[0, puntos.length - 1]];
  while (pila.length > 0) {
    const [inicio, fin] = pila.pop();
    let maximo = 0;
    let indice = -1;
    let limite = lejos;
    for (let i = inicio + 1; i < fin; i += 1) {
      const d = distanciaCuadrada(puntos[i], puntos[inicio], puntos[fin]);
      if (d > maximo) { maximo = d; indice = i; limite = cerca(puntos[i]) ? cercaLimite : lejos; }
    }
    if (maximo > limite && indice !== -1) {
      conservar[indice] = 1;
      pila.push([inicio, indice], [indice, fin]);
    }
  }
  return puntos.filter((_, i) => conservar[i] === 1);
};

const areaAnillo = (anillo) => {
  let total = 0;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i, i += 1) {
    total += (anillo[j][0] - anillo[i][0]) * (anillo[j][1] + anillo[i][1]);
  }
  return Math.abs(total / 2);
};

const tocaRegion = (anillo) => anillo.some(cerca);

const geo = JSON.parse(readFileSync(ORIGEN, "utf8"));

const anillosDe = (feature) => {
  const bruto = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const salida = [];
  for (const poligono of bruto) {
    const exterior = poligono[0];
    const proximo = tocaRegion(exterior);
    if (areaAnillo(exterior) < (proximo ? AREA_MINIMA_CERCA : AREA_MINIMA_LEJOS)) continue;
    const reducido = simplificar(exterior);
    if (reducido.length >= 4) salida.push(reducido);
  }
  return salida;
};

const redondear = (lon, lat) =>
  cerca([lon, lat])
    ? [Math.round(lon * 1000) / 1000, Math.round(lat * 1000) / 1000]
    : [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10];

const aplanar = (anillo) => anillo.flatMap(([lon, lat]) => redondear(lon, lat));

const mundo = [];
const colombia = [];
let puntos = 0;

for (const feature of geo.features) {
  const esColombia = feature.properties.ADM0_A3 === "COL";
  for (const anillo of anillosDe(feature)) {
    const plano = aplanar(anillo);
    puntos += plano.length / 2;
    (esColombia ? colombia : mundo).push(plano);
  }
}

const serie = (lista) => lista.map((anillo) => `  [${anillo.join(",")}],`).join("\n");

writeFileSync(DESTINO, `export const ANILLOS_MUNDO: readonly (readonly number[])[] = [
${serie(mundo)}
];

export const ANILLOS_COLOMBIA: readonly (readonly number[])[] = [
${serie(colombia)}
];

export const CENTRO_COLOMBIA = { lon: -73.2, lat: 4.1 } as const;
`);

console.log(`anillos: ${mundo.length + colombia.length}  puntos: ${puntos}  peso: ${(readFileSync(DESTINO).length / 1024).toFixed(1)} kB`);
