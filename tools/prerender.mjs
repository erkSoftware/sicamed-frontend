import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadEnv } from "vite";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");
const distServidor = join(raiz, "dist-servidor");
const entorno = loadEnv(process.env.NODE_ENV ?? "production", raiz, "VITE_");
const urlPublica =
  process.env.VITE_URL_PUBLICA ?? entorno.VITE_URL_PUBLICA ?? "https://sicamed.com.co";

const cargar = (archivo) => import(pathToFileURL(join(distServidor, archivo)).href);

const { renderizar } = await cargar("entrada-servidor.js");
const { OFERTAS_PUBLICAS } = await cargar("datos-publicos.js");

const plantilla = readFileSync(join(dist, "index.html"), "utf-8");

const RUTAS_BASE = [
  "/",
  "/vitrina",
  "/actores",
  "/normativa",
  "/transparencia",
  "/accesibilidad",
  "/privacidad",
  "/registro",
];

const rutas = [...RUTAS_BASE, ...OFERTAS_PUBLICAS.map((oferta) => `/vitrina/${oferta.id}`)];

const escribir = (ruta, contenido) => {
  const destino = ruta === "/" ? join(dist, "index.html") : join(dist, ruta, "index.html");
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido, "utf-8");
};

for (const ruta of rutas) {
  const { html, cabeza, atributosHtml } = renderizar(ruta);
  const salida = plantilla
    .replace(`<html lang="es-CO">`, `<html ${atributosHtml}>`)
    .replace("</head>", `  ${cabeza}\n  </head>`)
    .replace('<div id="raiz"></div>', `<div id="raiz">${html}</div>`);
  escribir(ruta, salida);
}

const hoy = new Date().toISOString().slice(0, 10);
const prioridad = (ruta) => (ruta === "/" ? "1.0" : ruta === "/vitrina" ? "0.9" : "0.7");
const frecuencia = (ruta) =>
  ruta === "/" || ruta === "/vitrina" ? "daily" : ruta.startsWith("/vitrina/") ? "weekly" : "monthly";

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas
  .map(
    (ruta) => `  <url>
    <loc>${urlPublica}${ruta === "/" ? "/" : ruta}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${frecuencia(ruta)}</changefreq>
    <priority>${prioridad(ruta)}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(join(dist, "sitemap.xml"), sitemap, "utf-8");
writeFileSync(join(dist, "aplicacion.html"), plantilla, "utf-8");

if (existsSync(distServidor)) rmSync(distServidor, { recursive: true, force: true });

console.log(`Prerender completo: ${rutas.length} rutas estáticas + sitemap.xml + cascarón`);
