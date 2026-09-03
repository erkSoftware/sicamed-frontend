import { chromium } from "playwright";

const VISTAS = [
  ["nest-hub", 1024, 600],
  ["800x600", 800, 600],
  ["1280x720", 1280, 720],
  ["1366x768", 1366, 768],
  ["1024x640", 1024, 640],
  ["macbook", 1440, 789],
  ["ipad-h", 1180, 820],
  ["ipad-v", 820, 1180],
  ["iphone-v", 390, 844],
  ["iphone-se", 375, 667],
  ["iphone-max", 430, 932],
  ["690x680", 690, 680],
];

const navegador = await chromium.launch();
for (const [nombre, ancho, alto] of VISTAS) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  await pagina.goto("http://localhost:4173/acceso", { waitUntil: "domcontentloaded" });
  await pagina.addStyleTag({ content: ".acceso__formulario .comprobacion__widget{min-height:65px}" });
  await pagina.waitForSelector(".acceso__caja");
  await pagina.waitForTimeout(1200);
  const d = await pagina.evaluate(() => {
    const b = document.querySelector(".acceso__formulario .boton");
    const campo = document.querySelector(".acceso__formulario .campo__control");
    const caja = document.querySelector(".acceso__caja");
    return {
      scroll: document.documentElement.scrollHeight,
      vista: window.innerHeight,
      desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      entrar: b ? Math.round(b.getBoundingClientRect().bottom) : null,
      cajaAbajo: Math.round(caja.getBoundingClientRect().bottom),
      fuenteCampo: campo ? getComputedStyle(campo).fontSize : null,
      altoCampo: campo ? Math.round(campo.getBoundingClientRect().height) : null,
    };
  });
  const cabe = d.scroll <= d.vista + 1 ? "CABE" : "scroll +" + (d.scroll - d.vista);
  const boton = d.entrar <= d.vista ? "boton-visible" : "BOTON-CORTADO";
  console.log(
    `${nombre.padEnd(10)} ${(ancho + "x" + alto).padEnd(9)} ${cabe.padEnd(12)} ${boton.padEnd(14)} entrar=${d.entrar} caja=${d.cajaAbajo} campo=${d.altoCampo}/${d.fuenteCampo} desborde=${d.desborde}`,
  );
  await pagina.close();
}
await navegador.close();
