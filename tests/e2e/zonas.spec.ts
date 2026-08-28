import { expect, test } from "@playwright/test";
import { abrirMenuSiEsMovil, iniciarSesionComo } from "./apoyo";

test("un productor no ve el modulo clinico ni sus opciones", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await abrirMenuSiEsMovil(page);

  const modulos = page.getByRole("navigation", { name: "Módulos del sistema" });
  await expect(modulos.getByRole("button", { name: "Telemedicina" })).toHaveCount(0);
  await expect(modulos.getByRole("button", { name: "Mercado" })).toBeVisible();

  const opciones = page.getByRole("navigation", { name: "Opciones del módulo activo" });
  await expect(opciones.getByRole("link", { name: /Pacientes/ })).toHaveCount(0);
});

test("un productor que fuerza la ruta clinica es rechazado", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await page.goto("/app/salud/pacientes");
  await expect(page).toHaveURL(/sin-permiso/);
  await expect(page.getByText("clinico:atencion:leer")).toBeVisible();
});

test("el equipo clinico entra a la zona clinica y ve la banda de advertencia", async ({ page }) => {
  await iniciarSesionComo(page, "EQUIPO_CLINICO");
  await page.goto("/app/salud/pacientes");
  await expect(page.getByText(/Zona clínica · datos sensibles/)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Pacientes" })).toBeVisible();
});

test("la zona clinica no persiste nada en el dispositivo", async ({ page }) => {
  await iniciarSesionComo(page, "EQUIPO_CLINICO");
  await page.goto("/app/salud/pacientes");
  await expect(page.getByRole("heading", { level: 1, name: "Pacientes" })).toBeVisible();

  const almacenamiento = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    sesion: Object.keys(window.sessionStorage),
  }));

  const PREFERENCIAS_DE_INTERFAZ = ["sicamed.perfil-demo", "sicamed.tema."];
  const sospechosas = [...almacenamiento.local, ...almacenamiento.sesion].filter(
    (clave) => !PREFERENCIAS_DE_INTERFAZ.some((permitido) => clave.startsWith(permitido)),
  );
  expect(sospechosas).toEqual([]);
});

test("el cierre de sesion devuelve al acceso y no deja sesion recuperable", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_HABILITADO");
  await abrirMenuSiEsMovil(page);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.goto("/app");
  await expect(page).toHaveURL(/acceso/);
});
