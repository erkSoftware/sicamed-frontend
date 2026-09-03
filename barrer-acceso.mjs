import { chromium } from "playwright";
const anchos = [1024, 1152, 1280, 1366, 1440, 1600, 1920];
const altos = [600, 640, 700, 720, 768, 800, 820, 860, 900];
const navegador = await chromium.launch();
const malas = [];
for (const ruta of ["/acceso", "/acceso?is_ips=true"]) {
  for (const w of anchos) {
    for (const h of altos) {
      const p = await navegador.newPage({ viewport: { width: w, height: h } });
      await p.goto("http://localhost:4173" + ruta, { waitUntil: "domcontentloaded" });
      await p.addStyleTag({ content: ".acceso__formulario .comprobacion__widget{min-height:65px}" });
      await p.waitForSelector(".acceso__caja");
      await p.waitForTimeout(700);
      const d = await p.evaluate(() => ({
        s: document.documentElement.scrollHeight,
        v: window.innerHeight,
        x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }));
      if (d.s > d.v + 1 || d.x > 0) malas.push(`${ruta} ${w}x${h} alto+${d.s - d.v} ancho+${d.x}`);
      await p.close();
    }
  }
}
console.log(malas.length ? malas.join("\n") : "sin desbordes en " + anchos.length * altos.length * 2 + " combinaciones");
await navegador.close();
