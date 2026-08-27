import { expect, test } from "@playwright/test";

test("el mapa publico abre la ficha del departamento con datos de cultivo", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-intro", "listo");
  await page.locator(".seccion--tinta").scrollIntoViewIfNeeded();

  await page.getByRole("button", { name: /Antioquia/ }).first().click();

  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByRole("heading", { name: "Antioquia" })).toBeVisible();
  await expect(dialogo.getByText(/predios registrados/)).toBeVisible();
  await expect(dialogo.getByText(/lotes con cadena de custodia/)).toBeVisible();
  await expect(dialogo.getByRole("link", { name: /Ver ofertas del departamento/ })).toBeVisible();
});

test("la ficha del departamento se cierra con la tecla de escape", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-intro", "listo");
  await page.locator(".seccion--tinta").scrollIntoViewIfNeeded();

  await page.getByRole("button", { name: /Antioquia/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("el globo abre la ficha al pulsar una region de Colombia", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-intro", "listo");

  await page.getByRole("button", { name: /Ver la operación en Colombia/i }).click();
  await expect(page.getByRole("button", { name: /Volver al mundo/i })).toBeVisible();
  await page.waitForTimeout(1800);

  const disco = page.locator(".globo__disco");
  const caja = await disco.boundingBox();
  if (!caja) throw new Error("El globo no tiene dimensiones");
  const x = caja.x + caja.width / 2 - caja.width * 0.03;
  const y = caja.y + caja.height / 2 - caja.height * 0.06;

  await page.mouse.move(x, y);
  await expect(disco).toHaveAttribute("data-sobre", "departamento");

  await page.mouse.click(x, y);
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText(/plantas en pie/)).toBeVisible();
});
