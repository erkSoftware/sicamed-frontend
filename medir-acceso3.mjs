import { chromium } from "playwright";
const anchos = [1024, 1280, 1366, 1440, 1600, 1920];
const altos = [600, 666, 720, 768, 800, 860, 900];
const navegador = await chromium.launch();
const malas = [];
let peor = 0;
for (const ruta of ["/acceso", "/acceso?is_ips=true"]) {
  for (const w of anchos) {
    for (const h of altos) {
      const p = await navegador.newPage({ viewport: { width: w, height: h } });
      await p.goto("http://localhost:4173" + ruta, { waitUntil: "domcontentloaded" });
      await p.addStyleTag({ content: ".acceso__formulario .comprobacion__widget{min-height:65px}" });
      await p.waitForSelector(".acceso__caja");
      await p.waitForTimeout(700);
      const d = await p.evaluate(() => {
        const b = document.querySelector(".acceso__formulario .boton");
        const l = document.querySelector(".acceso__escenario .escena__lienzo");
        return {
          s: document.documentElement.scrollHeight,
          v: window.innerHeight,
          x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          entrar: b ? Math.round(b.getBoundingClientRect().bottom) : null,
          lienzo: l ? Math.round(l.getBoundingClientRect().width) : null,
        };
      });
      peor = Math.max(peor, d.s - d.v);
      if (d.entrar > d.v || d.x > 0) malas.push(`${ruta} ${w}x${h} boton=${d.entrar}/${d.v} ancho+${d.x}`);
      if (w === 1280 || w === 1920) console.log(`${ruta.padEnd(20)} ${w}x${h} scroll+${Math.max(0, d.s - d.v)} entrar=${d.entrar} lienzo=${d.lienzo}`);
      await p.close();
    }
  }
}
console.log(malas.length ? "PROBLEMAS:\n" + malas.join("\n") : "boton siempre visible y sin desborde horizontal en 84 combinaciones");
console.log("peor desplazamiento vertical:", peor);
await navegador.close();
