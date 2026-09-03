import { chromium } from "playwright";
const navegador = await chromium.launch();
for (const [n, w, h] of [["iphone", 390, 844], ["se", 375, 667], ["iphone-h", 844, 390]]) {
  const p = await navegador.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:4173/acceso", { waitUntil: "domcontentloaded" });
  await p.addStyleTag({ content: ".acceso__formulario .comprobacion__widget{min-height:65px}" });
  await p.waitForSelector(".acceso__caja");
  await p.waitForTimeout(1000);
  const d = await p.evaluate(() => {
    const pista = document.querySelector(".pista-deslizar");
    const boton = document.querySelector(".acceso__formulario .boton");
    if (!pista) return { pista: null };
    const a = pista.getBoundingClientRect();
    const b = boton.getBoundingClientRect();
    const choca = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    return {
      pista: { x: Math.round(a.left), y: Math.round(a.top), w: Math.round(a.width) },
      boton: { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) },
      choca,
    };
  });
  console.log(n, JSON.stringify(d));
  await p.close();
}
await navegador.close();
