import { expect, test } from "@playwright/test";
import { abrirMenuSiEsMovil, iniciarSesionComo } from "./apoyo";

test("el mostrador verifica la credencial y sella la entrega en el ledger", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await page
    .getByRole("navigation", { name: "Módulos del sistema" })
    .getByRole("button", { name: "Dispensación" })
    .click();
  await abrirMenuSiEsMovil(page);
  await page
    .getByRole("navigation", { name: "Opciones del módulo activo" })
    .getByRole("link", { name: /Punto de dispensación/ })
    .click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Punto de dispensación");
  await expect(page.getByText(/El retiro es presencial/)).toBeVisible();

  await page.getByLabel(/Código de la credencial/).fill("ZZZZ-0000");
  await page.getByRole("button", { name: /Verificar credencial/ }).click();
  await expect(page.getByRole("alert")).toContainText(/No hay ninguna credencial/);
});

test("el punto de dispensación no ofrece entrega a domicilio", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await page.goto("/app/dispensacion");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Punto de dispensación");
  await expect(page.getByRole("button", { name: /domicilio/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /domicilio/i })).toHaveCount(0);
});

test("el registro de entregas muestra el seudónimo y no al paciente", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await page.goto("/app/dispensacion/registro");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Registro de entregas");
  await expect(page.getByRole("table")).toContainText("SEU-");
  await expect(page.getByRole("columnheader", { name: "Credencial" })).toBeVisible();
});

test("la liquidación separa el cobro a la farmacia del cobro al paciente", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await page.goto("/app/liquidacion");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Liquidación del servicio");
  await expect(page.getByText(/La teleconsulta no genera cargo de transacción/)).toBeVisible();

  const pestanas = page.getByRole("tablist", { name: "Flujos de cobro" });
  await expect(pestanas.getByRole("tab", { name: /A la farmacia/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await pestanas.getByRole("tab", { name: /Al paciente/ }).click();
  await expect(pestanas.getByRole("tab", { name: /Al paciente/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("la credencial pública no revela la identidad del paciente", async ({ page }) => {
  await page.goto("/paciente");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tu credencial de paciente");
  await expect(page.getByText(/El retiro es siempre presencial/)).toBeVisible();
  await expect(page.getByLabel(/Código de tu credencial/)).toBeVisible();
});
