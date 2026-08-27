import { expect, test } from "@playwright/test";

test("la vitrina publica se consulta sin autenticacion", async ({ page }) => {
  await page.goto("/vitrina");
  await expect(page.getByRole("heading", { level: 1, name: "Vitrina de ofertas" })).toBeVisible();
  await expect(page.getByText(/ofertas encontradas/)).toBeVisible();
  await expect(page).not.toHaveURL(/acceso/);
});

test("la ficha publica nunca expone cantidades ni datos de contacto", async ({ page }) => {
  await page.goto("/vitrina");
  await page.getByRole("link", { name: /Ver ficha completa/ }).first().click();
  await expect(page.getByRole("heading", { level: 2, name: "Información no publicada" })).toBeVisible();
  await expect(page.getByText("Cantidades exactas")).toBeVisible();
  await expect(page.getByText("Datos de contacto")).toBeVisible();
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
