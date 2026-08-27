import { readFileSync, writeFileSync } from "node:fs";

const ORIGEN = process.argv[2];
const DESTINO = process.argv[3];
const TOLERANCIA = 0.011;
const AREA_MINIMA = 0.004;

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

const simplificar = (puntos, tolerancia) => {
  if (puntos.length <= 4) return puntos;
  const limite = tolerancia * tolerancia;
  const conservar = new Uint8Array(puntos.length);
  conservar[0] = 1;
  conservar[puntos.length - 1] = 1;
  const pila = [[0, puntos.length - 1]];
  while (pila.length > 0) {
    const [inicio, fin] = pila.pop();
    let maximo = 0;
    let indice = -1;
    for (let i = inicio + 1; i < fin; i += 1) {
      const d = distanciaCuadrada(puntos[i], puntos[inicio], puntos[fin]);
      if (d > maximo) { maximo = d; indice = i; }
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

const geo = JSON.parse(readFileSync(ORIGEN, "utf8"));
const EXCLUIDOS = new Set(["88"]);

const NOMBRES = {
  "05": "Antioquia", "08": "Atlántico", "11": "Bogotá D.C.", "13": "Bolívar", "15": "Boyacá",
  "17": "Caldas", "18": "Caquetá", "19": "Cauca", "20": "Cesar", "23": "Córdoba",
  "25": "Cundinamarca", "27": "Chocó", "41": "Huila", "44": "La Guajira", "47": "Magdalena",
  "50": "Meta", "52": "Nariño", "54": "Norte de Santander", "63": "Quindío", "66": "Risaralda",
  "68": "Santander", "70": "Sucre", "73": "Tolima", "76": "Valle del Cauca", "81": "Arauca",
  "85": "Casanare", "86": "Putumayo", "88": "San Andrés y Providencia", "91": "Amazonas",
  "94": "Guainía", "95": "Guaviare", "97": "Vaupés", "99": "Vichada",
};

const crudos = geo.features.filter((f) => !EXCLUIDOS.has(f.properties.DPTO)).map((f) => {
  const codigo = f.properties.DPTO;
  const bruto = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const poligonos = [];
  for (const poligono of bruto) {
    const exterior = poligono[0];
    if (areaAnillo(exterior) < AREA_MINIMA) continue;
    const anillos = poligono
      .filter((anillo) => areaAnillo(anillo) >= AREA_MINIMA)
      .map((anillo) => simplificar(anillo, TOLERANCIA))
      .filter((anillo) => anillo.length >= 4);
    if (anillos.length > 0) poligonos.push(anillos);
  }
  return { codigo, nombre: NOMBRES[codigo] ?? f.properties.NOMBRE_DPT, poligonos };
});

const continental = crudos;

const limites = (lista) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of lista) for (const p of d.poligonos) for (const a of p) for (const [x, y] of a) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
};

const aplanar = (anillo) => anillo.flatMap(([lon, lat]) => [Math.round(lon * 100) / 100, Math.round(lat * 100) / 100]);

const centroide = (departamento) => {
  let mayor = null;
  let area = -1;
  for (const poligono of departamento.poligonos) {
    const a = areaAnillo(poligono[0]);
    if (a > area) { area = a; mayor = poligono[0]; }
  }
  let sx = 0, sy = 0, sa = 0;
  for (let i = 0, j = mayor.length - 1; i < mayor.length; j = i, i += 1) {
    const cruz = mayor[j][0] * mayor[i][1] - mayor[i][0] * mayor[j][1];
    sa += cruz;
    sx += (mayor[j][0] + mayor[i][0]) * cruz;
    sy += (mayor[j][1] + mayor[i][1]) * cruz;
  }
  sa *= 0.5;
  return [Math.round((sx / (6 * sa)) * 100) / 100, Math.round((sy / (6 * sa)) * 100) / 100];
};

const salida = continental
  .map((d) => {
    const [lon, lat] = centroide(d);
    const anillos = d.poligonos.flat().map((anillo) => `[${aplanar(anillo).join(",")}]`).join(", ");
    return `  { codigo: "${d.codigo}", nombre: "${d.nombre}", lon: ${lon}, lat: ${lat}, anillos: [${anillos}] },`;
  })
  .join("\n");

writeFileSync(DESTINO, `export type ContornoDepartamento = {
  codigo: string;
  nombre: string;
  lon: number;
  lat: number;
  anillos: readonly (readonly number[])[];
};

export const CONTORNOS: readonly ContornoDepartamento[] = [
${salida}
];
`);

const bytes = readFileSync(DESTINO).length;
console.log(`departamentos: ${crudos.length}  peso: ${(bytes / 1024).toFixed(1)} kB`);
