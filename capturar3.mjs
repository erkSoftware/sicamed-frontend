import { chromium } from "playwright";
const dir = process.argv[2];
const V = [["final-1050x600", "/acceso", 1050, 600], ["final-1280x666", "/acceso", 1280, 666], ["final-1920x900", "/acceso", 1920, 900]];
const navegador = await chromium.launch();
for (const [n, ruta, w, h] of V) {
  const p = await navegador.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:4173" + ruta, { waitUntil: "domcontentloaded" });
  await p.addStyleTag({ content: ".acceso__formulario .comprobacion__widget{min-height:65px;background:rgba(0,0,0,.06);border-radius:8px}" });
  await p.waitForSelector(".acceso__caja");
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${dir}/${n}.png` });
  await p.close();
}
await navegador.close();
