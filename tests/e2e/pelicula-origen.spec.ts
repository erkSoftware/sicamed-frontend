import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { CLAVE_INTRO, CLAVE_ORIGEN, omitirCinematica } from "./apoyo";

const omitirSoloIntro = async (page: Page) => {
  await page.addInitScript((clave: string) => {
    try {
      window.localStorage.setItem(clave, "true");
    } catch {
      return;
    }
  }, CLAVE_INTRO);
};

test("la pelicula del origen sale sola la primera vez que se entra a la vitrina", async ({
  page,
}) => {
  await omitirSoloIntro(page);
  await page.goto("/vitrina");
  await expect(page.locator(".cine")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ver experiencia" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Omitir" })).toBeVisible();
});

test("omitir la deja pasar y no vuelve a salir sola", async ({ page }) => {
  await omitirSoloIntro(page);
  await page.goto("/vitrina");
  await page.getByRole("button", { name: "Omitir" }).click();
  await expect(page.locator(".cine")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Vitrina de ofertas" })).toBeVisible();
  await expect(page.evaluate((clave) => localStorage.getItem(clave), CLAVE_ORIGEN)).resolves.toBe(
    "true",
  );

  await page.reload();
  await expect(page.getByRole("combobox")).toBeVisible();
  await expect(page.locator(".cine")).toHaveCount(0);
});

test("el boton de por que comprar colombiano vuelve a lanzarla", async ({ page }) => {
  await omitirCinematica(page);
  await page.goto("/vitrina");
  await expect(page.locator(".cine")).toHaveCount(0);
  await page.getByRole("button", { name: /Por qué comprar colombiano/ }).click();
  await expect(page.locator(".cine")).toBeVisible();
  await page.getByRole("button", { name: "Saltar la experiencia" }).click();
  await expect(page.locator(".cine")).toHaveCount(0);
});

test("las dos animaciones no se pisan: cada una vive en su ruta", async ({ page }) => {
  await omitirSoloIntro(page);
  await page.goto("/");
  await expect(page.locator(".cine")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ver la introducción" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Por qué comprar colombiano/ })).toHaveCount(0);

  await omitirCinematica(page);
  await page.goto("/vitrina");
  await expect(page.locator(".cinematica")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ver la introducción" })).toHaveCount(0);
});

test("el panel de diagnostico explica por que no se ve cada animacion", async ({ page }) => {
  await omitirCinematica(page);
  await page.goto("/vitrina#animaciones");
  const panel = page.getByRole("complementary", { name: /Diagnóstico de las animaciones/ });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Introducción de la portada")).toBeVisible();
  await expect(panel.getByText("Por qué comprar colombiano", { exact: true })).toBeVisible();
  await expect(panel.getByText(/Ya la viste/).first()).toBeVisible();
  await expect(panel.getByText(/Solo arranca en la portada/)).toBeVisible();
});
