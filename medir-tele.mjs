import { chromium } from "playwright";
const navegador = await chromium.launch();
const p = await navegador.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto("http://localhost:4173/acceso?is_ips=true", { waitUntil: "domcontentloaded" });
await p.waitForSelector(".acceso__escenario");
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(() => {
  const esc = document.querySelector(".acceso__escenario");
  const rec = (e, prof) => ({
    clase: (e.className || e.tagName).toString().slice(0, 40),
    alto: Math.round(e.getBoundingClientRect().height),
    minAlto: getComputedStyle(e).minHeight,
    hijos: prof > 0 ? [...e.children].map((h) => rec(h, prof - 1)) : undefined,
  });
  return rec(esc, 3);
}), null, 1));
await p.close();
await navegador.close();
