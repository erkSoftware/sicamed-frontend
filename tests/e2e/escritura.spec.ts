import { expect, test } from "@playwright/test";
import { iniciarSesionComo } from "./apoyo";

test("registrar un predio lo agrega al listado y lo sella en el ledger", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await page.goto("/app/produccion");

  const nombre = `Predio Verificación ${Date.now()}`;
  await page.getByRole("button", { name: "Registrar predio" }).click();

  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel(/Nombre del predio/).fill(nombre);
  await dialogo.getByLabel(/Departamento/).selectOption("Tolima");
  await dialogo.getByLabel(/Municipio/).fill("Ibagué");
  await dialogo.getByLabel(/Variedad/).selectOption({ index: 1 });
  await dialogo.getByLabel(/Área \(hectáreas\)/).fill("3.5");
  await dialogo.getByLabel(/Plantas proyectadas/).fill("120");
  await dialogo.getByLabel(/Fecha de siembra/).fill("2026-08-01");
  await dialogo.getByLabel(/Cosecha estimada/).fill("2026-12-01");
  await dialogo.getByRole("button", { name: "Registrar predio" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByLabel(/Buscar predio/).fill(nombre);
  await expect(page.getByRole("cell", { name: new RegExp(nombre) })).toBeVisible();

  await page.goto("/app/trazabilidad");
  await expect(page.getByText(new RegExp(nombre)).first()).toBeVisible();
});

test("el super administrador no puede verificar expedientes y ve la razon", async ({ page }) => {
  await iniciarSesionComo(page, "SUPER_ADMIN");
  await page.goto("/app/expedientes");
  await expect(page.getByRole("heading", { name: "Expedientes de registro" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Verificar" })).toHaveCount(0);
});

test("el analista verifica un documento y la decision persiste tras recargar", async ({ page }) => {
  await iniciarSesionComo(page, "ANALISTA_DOCUMENTAL");
  await page.goto("/app/expedientes");

  await page.getByRole("button", { name: "Revisar" }).first().click();
  const aprobar = page.getByRole("button", { name: "Aprobar" }).and(page.locator(":not([disabled])")).first();
  await aprobar.click();

  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel(/Observación/).fill("Documento legible y correspondiente al NIT.");
  await dialogo.getByRole("button", { name: "Confirmar verificación" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.goto("/app/trazabilidad");
  await expect(page.getByText(/quedó aprobado/i).first()).toBeVisible();
});

test("el super administrador invita una cuenta y queda en estado invitada", async ({ page }) => {
  await iniciarSesionComo(page, "SUPER_ADMIN");
  await page.goto("/app/usuarios");

  const correo = `prueba.${Date.now()}@sicamed.gov.co`;
  await page.getByRole("button", { name: "Invitar cuenta" }).click();

  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel(/Nombre completo/).fill("Persona de Prueba E2E");
  await dialogo.getByLabel(/Correo institucional/).fill(correo);
  await dialogo.getByLabel(/Organización/).selectOption({ index: 1 });
  await dialogo.getByRole("button", { name: "Enviar invitación" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByLabel(/Buscar cuenta/).fill(correo);
  await expect(page.getByRole("cell", { name: new RegExp(correo) })).toBeVisible();
});

test("el registro publico radica una solicitud sin autenticacion", async ({ page }) => {
  await page.goto("/registro");
  await expect(page.getByRole("heading", { name: "Registrar mi organización" })).toBeVisible();

  await page.getByLabel(/^NIT/).fill(`9019${String(Date.now()).slice(-5)}-1`);
  await page.getByLabel(/Razón social/).fill("Cultivos Verificación E2E S.A.S.");
  await page.getByLabel(/Tipo de actor/).selectOption("CULTIVADOR");
  await page.getByLabel(/Departamento/).selectOption("Tolima");
  await page.getByLabel(/Municipio/).fill("Ibagué");
  await page.getByLabel(/Representante legal/).fill("Persona Solicitante E2E");
  await page.getByLabel(/Correo de contacto/).fill("solicitud.e2e@ejemplo.co");
  await page.getByLabel(/Teléfono/).fill("+57 608 234 5678");
  await page.getByRole("button", { name: "Radicar solicitud" }).click();

  await expect(page.getByRole("heading", { name: "Solicitud recibida" })).toBeVisible();
});

test("el rechazo por cupo excedido cita el decreto y ofrece ir a cupos", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await page.goto("/app/produccion");

  await page.getByRole("button", { name: "Registrar predio" }).click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel(/Nombre del predio/).fill("Predio que excede el cupo asignado");
  await dialogo.getByLabel(/Departamento/).selectOption("Tolima");
  await dialogo.getByLabel(/Municipio/).fill("Ibagué");
  await dialogo.getByLabel(/Variedad/).selectOption({ index: 1 });
  await dialogo.getByLabel(/Área \(hectáreas\)/).fill("400");
  await dialogo.getByLabel(/Plantas proyectadas/).fill("9000000");
  await dialogo.getByLabel(/Fecha de siembra/).fill("2026-08-01");
  await dialogo.getByLabel(/Cosecha estimada/).fill("2026-12-01");
  await dialogo.getByRole("button", { name: "Registrar predio" }).click();

  const alerta = dialogo.getByRole("alert");
  await expect(alerta).toContainText("cupo");
  await expect(alerta).toContainText("Dec. 1138/2025 Art. 3");
  await expect(dialogo.getByRole("link", { name: "Ver cupos" })).toBeVisible();
});
