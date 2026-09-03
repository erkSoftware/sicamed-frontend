import { chromium } from "playwright";
const dir = process.argv[2];
const V = [["tele-nest", "/acceso?is_ips=true", 1024, 600], ["tele-1280x600", "/acceso?is_ips=true", 1280, 600], ["op-1920x900", "/acceso", 1920, 900], ["op-1366", "/acceso", 1366, 768]];
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
