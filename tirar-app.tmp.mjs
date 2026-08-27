import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5175";
const RUTAS = [
  ["tablero", "/app"],
  ["directorio", "/app/directorio"],
  ["vitrina", "/app/vitrina"],
  ["organizacion", "/app/organizacion"],
  ["produccion", "/app/produccion"],
  ["inventario", "/app/inventario"],
  ["ruedas", "/app/ruedas-negocio"],
  ["licencias", "/app/licencias"],
  ["trazabilidad", "/app/trazabilidad"],
  ["reportes", "/app/reportes"],
  ["pacientes", "/app/salud/pacientes"],
  ["agenda", "/app/salud/agenda"],
  ["teleconsulta", "/app/salud/teleconsulta"],
];

const modo = process.argv[2] ?? "escritorio";
const movil = modo === "movil";
const dir = `tiros/${modo}`;
mkdirSync(dir, { recursive: true });

const navegador = await chromium.launch();
const ctx = await navegador.newContext({
  viewport: movil ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  isMobile: movil,
  hasTouch: movil,
  reducedMotion: "reduce",
});
const pag = await ctx.newPage();
const fallos = [];
pag.on("pageerror", (e) => fallos.push(`[pageerror] ${e.message}`));
pag.on("console", (m) => { if (m.type() === "error") fallos.push(`[console] ${m.text()}`); });

await pag.goto(`${BASE}/acceso`, { waitUntil: "networkidle" });
await pag.getByRole("button", { name: /entrar|ingresar/i }).first().click();
await pag.waitForURL(/\/app/, { timeout: 10000 });

for (const [nombre, ruta] of RUTAS) {
  fallos.length = 0;
  await pag.goto(`${BASE}${ruta}`, { waitUntil: "networkidle" });
  await pag.waitForTimeout(900);
  const m = await pag.evaluate(() => ({
    alto: document.documentElement.scrollHeight,
    anchoDoc: document.documentElement.scrollWidth,
    anchoVista: window.innerWidth,
  }));
  const desborde = m.anchoDoc - m.anchoVista;
  console.log(`${nombre.padEnd(14)} alto=${String(m.alto).padStart(6)}px  desborde=${desborde}px  ${fallos.length ? "ERR: " + fallos.slice(0,2).join(" | ") : ""}`);
  await pag.screenshot({ path: `${dir}/${nombre}.png`, fullPage: false });
}

await navegador.close();
