import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { iniciarSesionComo, omitirCinematica } from "./apoyo";

const RUTAS_PUBLICAS = [
  "/",
  "/vitrina",
  "/vitrina?modo=resultados",
  "/actores",
  "/normativa",
  "/transparencia",
];

for (const ruta of RUTAS_PUBLICAS) {
  test(`sin violaciones criticas ni serias en ${ruta}`, async ({ page }) => {
    await omitirCinematica(page);
    await page.goto(ruta);
    await expect(page.locator("html")).toHaveAttribute("data-intro", "listo");
    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const graves = resultado.violations.filter(
      (violacion) => violacion.impact === "critical" || violacion.impact === "serious",
    );
    expect(graves.map((violacion) => `${violacion.id}: ${violacion.help}`)).toEqual([]);
  });
}

test("sin violaciones criticas ni serias en el tablero autenticado", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const graves = resultado.violations.filter(
    (violacion) => violacion.impact === "critical" || violacion.impact === "serious",
  );
  expect(graves.map((violacion) => `${violacion.id}: ${violacion.help}`)).toEqual([]);
});
