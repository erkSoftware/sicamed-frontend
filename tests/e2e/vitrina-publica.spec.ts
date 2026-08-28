import { expect, test } from "@playwright/test";
import { omitirCinematica } from "./apoyo";

test.beforeEach(async ({ page }) => {
  await omitirCinematica(page);
});

test("la vitrina publica se consulta sin autenticacion", async ({ page }) => {
  await page.goto("/vitrina");
  await expect(page.getByRole("heading", { level: 1, name: "Vitrina de ofertas" })).toBeVisible();
  await expect(page.getByRole("combobox")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Resultados/ })).toContainText(/\d+/);
  await expect(page).not.toHaveURL(/acceso/);
});

test("la ficha publica nunca expone cantidades ni datos de contacto", async ({ page }) => {
  await page.goto("/vitrina?modo=resultados");
  await page.getByRole("link", { name: "Ver oferta" }).first().click();
  await expect(
    page.getByRole("heading", { level: 2, name: /Información comercial reservada/ }),
  ).toBeVisible();
  await expect(page.getByText("Cantidades exactas")).toBeVisible();
  await expect(page.getByText("Datos de contacto", { exact: true })).toBeVisible();
});

test("manifestar interes no es una accion anonima: exige organizacion registrada", async ({
  page,
}) => {
  await page.goto("/vitrina?modo=resultados");
  await page.getByRole("button", { name: "Manifestar interés" }).first().click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText(/organización registrada/i)).toBeVisible();
  await expect(dialogo.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await expect(dialogo.getByText(/datos de contacto/i).first()).toBeVisible();
});

test("los filtros y la busqueda viajan en la url y sobreviven a la paginacion", async ({ page }) => {
  await page.goto("/vitrina?modo=resultados");
  await page.getByRole("button", { name: /^Filtros/ }).click();
  const cajon = page.getByRole("dialog");
  await expect(cajon).toBeVisible();
  await cajon.getByRole("radio", { name: /Inmediata/ }).check();
  await cajon.getByRole("button", { name: /^Ver / }).click();
  await expect(page).toHaveURL(/disponibilidad=INMEDIATA/);
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page).toHaveURL(/disponibilidad=INMEDIATA/);
  await expect(page).toHaveURL(/cursor=/);
});

test("buscar desde el paisaje salta solo a la vista de resultados", async ({ page }) => {
  await page.goto("/vitrina");
  await expect(page.locator(".portal")).toHaveAttribute("data-modo", "buscador");
  await expect(page.locator(".paisaje")).toBeVisible();
  await page.getByRole("combobox").fill("Biomasa");
  await expect(page).toHaveURL(/busqueda=Biomasa/);
  await expect(page.locator(".portal")).toHaveAttribute("data-modo", "resultados");
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("las dos vistas se conmutan con los botones de la parte superior", async ({ page }) => {
  await page.goto("/vitrina");
  await expect(page.getByRole("article")).toHaveCount(0);
  await page.getByRole("button", { name: /^Resultados/ }).click();
  await expect(page.locator(".portal")).toHaveAttribute("data-modo", "resultados");
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.getByRole("button", { name: /^Buscador/ }).click();
  await expect(page.locator(".portal")).toHaveAttribute("data-modo", "buscador");
  await expect(page.locator(".paisaje")).toBeVisible();
});

test("cada pagina publica declara su titulo y su canonica", async ({ page }) => {
  await page.goto("/normativa");
  await expect(page).toHaveTitle(/Marco normativo del cannabis medicinal en Colombia/);
  const canonica = page.locator('link[rel="canonical"]');
  await expect(canonica).toHaveAttribute("href", /\/normativa$/);
});

test("el sitio publico es navegable por teclado desde el salto al contenido", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido principal" })).toBeFocused();
});
