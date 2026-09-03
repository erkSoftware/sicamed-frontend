import { chromium } from "playwright";
const navegador = await chromium.launch();
for (const [w, h] of [[1024, 600], [1280, 720]]) {
  const p = await navegador.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:4173/acceso?is_ips=true", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".telemed");
  await p.waitForTimeout(1500);
  const d = await p.evaluate(() => {
    const t = document.querySelector(".telemed");
    const r = (s) => {
      const e = document.querySelector(s);
      return e ? Math.round(e.getBoundingClientRect().height) : null;
    };
    const escenas = [...document.querySelectorAll(".telemed__escena")].map((e) =>
      Math.round(e.getBoundingClientRect().height),
    );
    const est = getComputedStyle(t);
    return {
      telemed: Math.round(t.getBoundingClientRect().height),
      filas: est.gridTemplateRows,
      laminas: r(".telemed__laminas"),
      rellenoLaminas: getComputedStyle(document.querySelector(".telemed__laminas")).paddingTop,
      escenas,
      relato: r(".telemed__relato"),
      mando: r(".telemed__mando"),
      margenMando: getComputedStyle(document.querySelector(".telemed__mando")).marginTop,
    };
  });
  console.log(w + "x" + h, JSON.stringify(d));
  await p.close();
}
await navegador.close();
