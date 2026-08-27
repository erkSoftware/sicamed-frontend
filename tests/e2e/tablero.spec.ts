import { expect, test } from "@playwright/test";
import { iniciarSesionComo } from "./apoyo";

test("el tablero muestra los cinco eslabones del proceso", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  for (const etiqueta of ["Proveedores", "Dispensadores", "IPS", "Médicos", "Pacientes"]) {
    await expect(page.getByText(etiqueta, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText("5.200", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("1.500.000", { exact: true }).first()).toBeVisible();
});

test("el mapa cambia de dimension y mantiene la tabla equivalente", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  const grupo = page.getByRole("group", { name: "Dimensión del mapa" });
  await grupo.getByRole("button", { name: "Médicos" }).click();
  await expect(page.getByRole("button", { name: "Médicos", pressed: true })).toBeVisible();
});

test("el directorio agrupa a los actores en cinco columnas", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await page.goto("/app/directorio");
  for (const titulo of ["Proveedores", "Dispensadores", "EPS / IPS", "Médicos", "Pacientes"]) {
    await expect(page.getByRole("heading", { level: 2, name: titulo })).toBeVisible();
  }
  await expect(page.getByText("Zona clínica separada")).toBeVisible();
});
