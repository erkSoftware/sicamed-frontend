import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export const iniciarSesionComo = async (page: Page, perfil: string) => {
  await page.goto("/acceso");
  const nombres: Record<string, string> = {
    PRODUCTOR_HABILITADO: "Marcela Ospina",
    PRODUCTOR_SIN_ATESTACION: "Hernán Cifuentes",
    EQUIPO_CLINICO: "Dra. Alejandra Ríos",
    INSTITUCIONAL: "Andrés Beltrán",
  };
  const etiqueta = nombres[perfil];
  if (!etiqueta) throw new Error(`Perfil de demostración desconocido: ${perfil}`);
  await page.getByRole("button", { name: new RegExp(etiqueta) }).click();
  await page.getByRole("button", { name: "Entrar con este perfil" }).click();
  await expect(page).toHaveURL(/\/app/);
};

export const diligenciarOfertaValida = async (page: Page) => {
  await page.getByLabel(/Título de la oferta/).fill("Aceite estandarizado CBD para dolor crónico");
  await page.getByLabel(/Tipo de producto/).selectOption("Aceite estandarizado CBD");
  await page.getByLabel(/Departamento/).selectOption("Tolima");
  await page.getByLabel(/Municipio/).fill("Ibagué");
  await page
    .getByLabel(/Descripción pública/)
    .fill("Oferta de aceite estandarizado producido bajo buenas prácticas de manufactura.");
};

export const abrirMenuSiEsMovil = async (page: Page) => {
  const boton = page.getByRole("button", { name: "Abrir el menú de navegación" });
  if (await boton.isVisible()) await boton.click();
};
