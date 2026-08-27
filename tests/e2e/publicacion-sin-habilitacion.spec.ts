import { expect, test } from "@playwright/test";
import { diligenciarOfertaValida, iniciarSesionComo } from "./apoyo";

test("no se publica una oferta sin atestacion vigente y se cita la norma", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_SIN_ATESTACION");
  await page.goto("/app/vitrina/nueva");
  await diligenciarOfertaValida(page);
  await page.getByRole("button", { name: "Publicar" }).click();

  const alerta = page.getByRole("alert");
  await expect(alerta).toContainText("falta de habilitación vigente");
  await expect(alerta).toContainText("Res. 1241/2026 Art. 13b");
  await expect(page.getByRole("link", { name: "Ver mis licencias" })).toBeVisible();
});

test("la validacion de forma no viaja al servidor ni cita norma alguna", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_SIN_ATESTACION");
  await page.goto("/app/vitrina/nueva");
  await page.getByRole("button", { name: "Publicar" }).click();

  await expect(page.getByText("Selecciona el tipo de producto.")).toBeVisible();
  await expect(page.getByText("Res. 1241/2026")).toHaveCount(0);
});
