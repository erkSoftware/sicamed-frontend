import { chromium } from "playwright";
const RUTAS = [["operacion", "/acceso"], ["telemedicina", "/acceso?is_ips=true"]];
const VISTAS = [["nest", 1024, 600], ["1280x720", 1280, 720], ["1366x768", 1366, 768], ["1440x900", 1440, 900], ["iphone", 390, 844], ["se", 375, 667]];
const navegador = await chromium.launch();
for (const [modo, ruta] of RUTAS) {
  for (const [n, w, h] of VISTAS) {
    const p = await navegador.newPage({ viewport: { width: w, height: h } });
    await p.goto("http://localhost:4173" + ruta, { waitUntil: "domcontentloaded" });
    await p.addStyleTag({ content: ".acceso__formulario .comprobacion__widget{min-height:65px}" });
    await p.waitForSelector(".acceso__caja");
    await p.waitForTimeout(1400);
    const d = await p.evaluate(() => {
      const b = document.querySelector(".acceso__formulario .boton");
      const esc = document.querySelector(".acceso__escenario");
      return {
        scroll: document.documentElement.scrollHeight,
        vista: window.innerHeight,
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        entrar: b ? Math.round(b.getBoundingClientRect().bottom) : null,
        esc: esc ? Math.round(esc.getBoundingClientRect().height) : null,
      };
    });
    const cabe = d.scroll <= d.vista + 1 ? "CABE" : "+" + (d.scroll - d.vista);
    console.log(`${modo.padEnd(13)} ${n.padEnd(9)} ${(w+"x"+h).padEnd(9)} ${cabe.padEnd(7)} entrar=${String(d.entrar).padEnd(4)} esc=${d.esc} desborde=${d.desborde}`);
    await p.close();
  }
}
await navegador.close();
