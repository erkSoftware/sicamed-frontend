import { chromium } from "playwright";

const VISTAS = [
  ["nest", 1024, 600],
  ["1280x720", 1280, 720],
  ["1366x768", 1366, 768],
  ["1440x900", 1440, 900],
];
const RUTA = process.env.RUTA ?? "/app/interoperabilidad/conexiones";
const ETIQUETA = process.env.ETIQUETA ?? "antes";
const BASE = "http://localhost:5199";
const SALIDA = "/tmp/claude-1000/-home-cristiank-sicamed-frontend/75637d41-3352-4b80-a25e-d61428396bc4/scratchpad";

const navegador = await chromium.launch();
for (const [n, w, h] of VISTAS) {
  const ctx = await navegador.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto(BASE + "/acceso", { waitUntil: "domcontentloaded" });
  await p.getByRole("button", { name: /Diego Fernando Marín/ }).click();
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL(/\/app/, { timeout: 15000 });
  await p.goto(BASE + RUTA, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1500);
  const saltar = p.getByRole("button", { name: "Saltar", exact: true });
  if (await saltar.count()) await saltar.first().click().catch(() => {});
  await p.waitForTimeout(400);
  const lanzador = p.locator(".aurora-lanzador");
  if (await lanzador.count()) {
    await lanzador.click();
    const salir = p.locator(".aurora-presentacion__pie .boton");
    if (await salir.count()) await salir.first().click().catch(() => {});
  }
  await p.waitForTimeout(3000);
  const d = await p.evaluate(() => {
    const r = (s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return [Math.round(b.top), Math.round(b.bottom), Math.round(b.width) + "w"];
    };
    return {
      scroll: document.documentElement.scrollHeight,
      vista: window.innerHeight,
      desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      barra: r(".barra"),
      titulo: r(".pagina__titulo"),
      kpi: r(".rejilla-kpi"),
      asistente: r(".aurora-asistente"),
      figura: r(".aurora-figura"),
      conv: r(".aurora-conversacion"),
      panel: r(".aurora-panel"),
    };
  });
  console.log(`${n.padEnd(9)} ${(w + "x" + h).padEnd(9)} scroll=${d.scroll} vista=${d.vista} desborde=${d.desborde}`);
  console.log("    barra", d.barra, "titulo", d.titulo, "kpi", d.kpi);
  console.log("    asistente", d.asistente, "figura", d.figura, "conv", d.conv, "panel", d.panel);
  await p.screenshot({ path: `${SALIDA}/${ETIQUETA}-${n}.png` });
  await ctx.close();
}
await navegador.close();
