import { chromium } from "playwright";
const SALIDA = "/tmp/claude-1000/-home-cristiank-sicamed-frontend/75637d41-3352-4b80-a25e-d61428396bc4/scratchpad";
const b = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await ctx.grantPermissions(["microphone"]);
const p = await ctx.newPage();
await p.route("**/asistente/sesiones**", async (ruta) => {
  await new Promise((listo) => setTimeout(listo, 9000));
  await ruta.abort();
});
await p.goto("http://localhost:5199/acceso", { waitUntil: "domcontentloaded" });
await p.getByRole("button", { name: /Diego Fernando Marín/ }).click();
await p.getByRole("button", { name: "Entrar", exact: true }).click();
await p.waitForURL(/\/app/, { timeout: 15000 });
await p.goto("http://localhost:5199/app/conexiones", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(2000);
const saltar = p.getByRole("button", { name: "Saltar", exact: true });
  if (await saltar.count()) await saltar.first().click().catch(() => {});
  await p.waitForTimeout(400);
await p.locator(".aurora-lanzador").click();
const salir = p.locator(".aurora-presentacion__pie .boton");
if (await salir.count()) await salir.first().click().catch(() => {});
const hablar = p.getByRole("button", { name: /Hablar con Aurora/ });
if (await hablar.count()) await hablar.first().click().catch(() => {});
for (const espera of [60, 140, 260, 600, 1600]) {
  await p.waitForTimeout(espera === 60 ? 60 : 0);
  const estado = await p.evaluate(() => {
    const a = document.querySelector(".aurora-asistente");
    const c = document.querySelector(".aurora-cinta__estado");
    return { voz: a?.getAttribute("data-voz"), enlazando: a?.getAttribute("data-enlazando"), rotulo: c?.textContent?.trim() ?? null };
  });
  console.log(espera, JSON.stringify(estado));
  await p.screenshot({ path: `${SALIDA}/movil-${espera}.png` });
  await p.waitForTimeout(espera);
}
await b.close();
