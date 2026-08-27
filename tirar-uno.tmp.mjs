import { chromium } from "@playwright/test";
const [ruta, nombre, modo, scrollY] = process.argv.slice(2);
const movil = modo === "movil";
const nav = await chromium.launch();
const ctx = await nav.newContext({
  viewport: movil ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  isMobile: movil, hasTouch: movil, reducedMotion: "reduce",
});
const p = await ctx.newPage();
await p.goto("http://localhost:5175/acceso", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /entrar|ingresar/i }).first().click();
await p.waitForURL(/\/app/);
await p.goto(`http://localhost:5175${ruta}`, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
if (scrollY) { await p.evaluate((y) => window.scrollTo(0, Number(y)), scrollY); await p.waitForTimeout(500); }
await p.screenshot({ path: nombre });
await nav.close();
