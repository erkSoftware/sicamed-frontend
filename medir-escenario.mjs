import { chromium } from "playwright";
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1024, height: 600 } });
await pagina.goto("http://localhost:4173/acceso", { waitUntil: "domcontentloaded" });
await pagina.waitForSelector(".acceso__escenario");
await pagina.waitForTimeout(1500);
const datos = await pagina.evaluate(() => {
  const esc = document.querySelector(".acceso__escenario");
  const hijos = [...esc.children].map((e) => ({
    clase: e.className || e.tagName,
    alto: Math.round(e.getBoundingClientRect().height),
  }));
  const dentro = [...esc.querySelectorAll(".escena > *")].map((e) => ({
    clase: e.className,
    alto: Math.round(e.getBoundingClientRect().height),
  }));
  const est = getComputedStyle(esc);
  return { alto: Math.round(esc.getBoundingClientRect().height), relleno: est.paddingTop, hueco: est.gap, hijos, dentro };
});
console.log(JSON.stringify(datos, null, 1));
await pagina.close();
await navegador.close();
