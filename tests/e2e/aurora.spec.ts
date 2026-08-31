import { expect, test } from "@playwright/test";
import { iniciarSesionComo } from "./apoyo";

test("navigate_to resuelve lo que dice la persona contra el menu real", async ({ page }) => {
  await iniciarSesionComo(page, "ANALISTA_DOCUMENTAL");
  await page.goto("/app/aurora");

  await page.getByLabel(/Lo que dice la persona/).fill("llévame a cumplimiento");
  await page.getByRole("button", { name: /Ir a/ }).click();
  await expect(page).toHaveURL(/\/app\/licencias/);
});

test("un destino que no existe contesta igual, con motivo y con las pantallas que si alcanza", async ({
  page,
}) => {
  await iniciarSesionComo(page, "ANALISTA_DOCUMENTAL");
  await page.goto("/app/aurora");

  await page.getByLabel(/Lo que dice la persona/).fill("la sala de máquinas");
  const respuesta = page.locator("pre.vista-previa");
  await expect(respuesta).toContainText('"ok": false');
  await expect(respuesta).toContainText("disponibles");
  await expect(page.getByRole("button", { name: /Ir a/ })).toHaveCount(0);
});

test("configurar a AURORA avisa de que no cambia la conversacion en curso y repinta desde la respuesta", async ({
  page,
}) => {
  await iniciarSesionComo(page, "SUPER_ADMIN");
  await page.goto("/app/aurora/configuracion");

  await expect(page.getByText(/aperturas siguientes/).first()).toBeVisible();
  await expect(page.getByText("Configuración de fábrica")).toBeVisible();

  await page.getByRole("button", { name: "Editar" }).first().click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel(/Nombre del asistente/).fill("AURORA del Valle");
  await dialogo.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await expect(page.getByText("AURORA del Valle").first()).toBeVisible();
  await expect(page.getByText("Configuración propia")).toBeVisible();
  await expect(page.getByRole("button", { name: "Restaurar de fábrica" })).toBeVisible();
});
