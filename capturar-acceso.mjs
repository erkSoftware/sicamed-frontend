import { chromium } from "playwright";
const dir = process.argv[2];
const VISTAS = [["nest", 1024, 600], ["laptop", 1366, 768], ["iphone", 390, 844], ["se", 375, 667]];
const navegador = await chromium.launch();
for (const [n, w, h] of VISTAS) {
  const p = await navegador.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await p.goto("http://localhost:4173/acceso", { waitUntil: "domcontentloaded" });
  await p.addStyleTag({ content: ".acceso__formulario .comprobacion__widget{min-height:65px;background:rgba(0,0,0,.06);border-radius:8px}" });
  await p.waitForSelector(".acceso__caja");
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${dir}/acceso-${n}.png` });
  await p.close();
}
await navegador.close();
