import { chromium } from "playwright";

const VISTAS = [
  ["nest-hub", 1024, 600],
  ["portatil-768", 1024, 768],
  ["escritorio", 1440, 900],
  ["iphone-h", 844, 390],
  ["iphone-v", 390, 844],
  ["iphone-se", 375, 667],
];

const navegador = await chromium.launch();
for (const [nombre, ancho, alto] of VISTAS) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  await pagina.goto("http://localhost:4173/acceso", { waitUntil: "domcontentloaded" });
  await pagina.addStyleTag({
    content: ".acceso__formulario .comprobacion__widget{min-height:65px}",
  });
  await pagina.waitForSelector(".acceso__caja");
  await pagina.waitForTimeout(1200);
  const datos = await pagina.evaluate(() => {
    const caja = (s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { arriba: Math.round(r.top), abajo: Math.round(r.bottom), alto: Math.round(r.height) };
    };
    const panel = document.querySelector(".acceso__panel");
    const estilo = panel ? getComputedStyle(panel) : null;
    const boton = document.querySelector(".acceso__formulario .boton");
    return {
      scroll: document.documentElement.scrollHeight,
      vista: window.innerHeight,
      desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      panelRelleno: estilo ? estilo.paddingTop : null,
      caja: caja(".acceso__caja"),
      marca: caja(".acceso__marca"),
      modos: caja(".acceso__modos"),
      titulo: caja(".acceso__titulo"),
      entrada: caja(".acceso__entrada"),
      formulario: caja(".acceso__formulario"),
      entrar: boton
        ? { abajo: Math.round(boton.getBoundingClientRect().bottom), texto: boton.textContent }
        : null,
      pie: caja(".acceso__pie"),
      escenario: caja(".acceso__escenario"),
    };
  });
  console.log(nombre, ancho + "x" + alto, JSON.stringify(datos, null, 1));
  await pagina.close();
}
await navegador.close();
