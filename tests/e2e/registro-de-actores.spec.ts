import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { cerrarSesion, iniciarSesionComo } from "./apoyo";

const admitirLaPrimeraSolicitud = async (page: Page) => {
  await page.goto("/app/solicitudes");
  await page.getByRole("button", { name: "Admitir a trámite" }).first().click();
  await expect(page).toHaveURL(/\/app\/expedientes\?expediente=/);
  await expect(page.getByRole("heading", { name: /Trámite del expediente/ })).toBeVisible();
  return page.url();
};

const resolverPasoEnTurno = async (
  page: Page,
  etiquetaBoton: string,
  etiquetaEnviar: string,
  observacion?: string,
) => {
  await page.getByRole("button", { name: etiquetaBoton, exact: true }).first().click();
  const dialogo = page.getByRole("dialog");
  if (observacion) await dialogo.getByLabel(/Observación/).fill(observacion);
  await dialogo.getByRole("button", { name: etiquetaEnviar, exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
};

test("admitir a tramite abre el expediente con sus cuatro pasos y solo el primero decide", async ({
  page,
}) => {
  await iniciarSesionComo(page, "ANALISTA_DOCUMENTAL");
  await admitirLaPrimeraSolicitud(page);

  await expect(page.locator(".pasos__paso")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Aprobar", exact: true })).toHaveCount(1);
  await expect(page.getByText(/Espera a que se resuelva/).first()).toBeVisible();

  await page.goto("/app/solicitudes");
  await expect(page.getByText("En trámite").first()).toBeVisible();
});

test("un registro necesita dos analistas: el ultimo paso no lo cierra quien resolvio los otros", async ({
  page,
}) => {
  await iniciarSesionComo(page, "ANALISTA_DOCUMENTAL");
  const expediente = await admitirLaPrimeraSolicitud(page);

  await resolverPasoEnTurno(page, "Aprobar", "Aprobar el paso");
  await resolverPasoEnTurno(page, "Aprobar", "Aprobar el paso");
  await resolverPasoEnTurno(page, "Aprobar", "Aprobar el paso");

  await expect(page.getByText(/lo cierra un segundo analista/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Aprobar", exact: true })).toHaveCount(0);

  await cerrarSesion(page);
  await iniciarSesionComo(page, "ANALISTA_SEGUNDO_CONTROL");
  await page.goto(expediente);
  await resolverPasoEnTurno(page, "Aprobar", "Aprobar el paso");

  await expect(page.getByText("Aprobado").first()).toBeVisible();

  await page.goto("/app/solicitudes");
  await expect(page.getByText("Aprobada").first()).toBeVisible();
});

test("rechazar un paso exige el motivo y ese motivo llega a la bandeja", async ({ page }) => {
  await iniciarSesionComo(page, "ANALISTA_DOCUMENTAL");
  await admitirLaPrimeraSolicitud(page);

  const motivo = "La licencia adjunta corresponde a otra modalidad y no ampara este cultivo.";
  await page.getByRole("button", { name: "Rechazar", exact: true }).first().click();
  const dialogo = page.getByRole("dialog");
  const enviar = dialogo.getByRole("button", { name: "Rechazar", exact: true });
  await expect(enviar).toBeDisabled();
  await dialogo.getByLabel(/Observación/).fill(motivo);
  await enviar.click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.goto("/app/solicitudes");
  await expect(page.getByText(motivo).first()).toBeVisible();
});
