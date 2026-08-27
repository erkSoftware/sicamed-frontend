import { expect, test } from "@playwright/test";
import { abrirMenuSiEsMovil, iniciarSesionComo } from "./apoyo";

test("el riel carga solo las opciones del modulo elegido", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  const opciones = page.getByRole("navigation", { name: "Opciones del módulo activo" });

  await abrirMenuSiEsMovil(page);
  await expect(opciones.getByRole("link", { name: /Tablero/ })).toBeVisible();
  await expect(opciones.getByRole("link", { name: /Plantas y variedades/ })).toHaveCount(0);

  await page.getByRole("navigation", { name: "Módulos del sistema" }).getByRole("button", { name: "Cultivo" }).click();
  await abrirMenuSiEsMovil(page);

  await expect(opciones.getByRole("link", { name: /Plantas y variedades/ })).toBeVisible();
  await expect(opciones.getByRole("link", { name: /Tablero/ })).toHaveCount(0);
  await expect(page.locator(".modo__titulo")).toHaveText("Producción y origen");
});

test("la paleta de comandos salta a un destino de otro modulo", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await page.keyboard.press("Control+k");

  const campo = page.getByRole("combobox", { name: /Buscar módulos/ });
  await expect(campo).toBeFocused();
  await campo.fill("inventario");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/app\/inventario/);
  await abrirMenuSiEsMovil(page);
  await expect(
    page.getByRole("navigation", { name: "Opciones del módulo activo" }).getByRole("link", { name: /Inventario/ }),
  ).toBeVisible();
});

test("la apariencia elegida sobrevive a la recarga", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  const marco = page.locator(".marco");
  await expect(marco).toHaveAttribute("data-luminosidad", "claro");

  await page.getByRole("button", { name: "Cambiar a modo Oscuro" }).click();
  await expect(marco).toHaveAttribute("data-luminosidad", "oscuro");

  await page.reload();
  await expect(page.locator(".marco")).toHaveAttribute("data-luminosidad", "oscuro");
});
