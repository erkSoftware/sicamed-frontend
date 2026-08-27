import { chromium } from "@playwright/test";
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
const p = await ctx.newPage();
await p.goto("http://localhost:5175/acceso", { waitUntil: "networkidle" });
await p.getByRole("button", { name: /entrar|ingresar/i }).first().click();
await p.waitForURL(/\/app/);
await p.waitForTimeout(600);
console.log(await p.evaluate(() => {
  const b = document.querySelector(".lateral-boton");
  const barra = document.querySelector(".barra");
  const sel = document.querySelector(".selector-contexto");
  const cs = b && getComputedStyle(b);
  return {
    existe: !!b,
    display: cs?.display,
    rect: b?.getBoundingClientRect().toJSON(),
    barraRect: barra?.getBoundingClientRect().toJSON(),
    barraAlto: barra && getComputedStyle(barra).height,
    selRect: sel?.getBoundingClientRect().toJSON(),
    ancho: window.innerWidth,
  };
}));
await nav.close();
