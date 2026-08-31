import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export const iniciarSesionComo = async (page: Page, perfil: string) => {
  await page.goto("/acceso");
  const nombres: Record<string, string> = {
    PRODUCTOR_HABILITADO: "Marcela Ospina",
    PRODUCTOR_SIN_ATESTACION: "Hernán Cifuentes",
    OPERARIO_CAMPO: "Jairo Peñaloza",
    EQUIPO_CLINICO: "Dra. Alejandra Ríos",
    INSTITUCIONAL: "Paula Andrea Rincón",
    ADMIN_INSTITUCIONAL: "Andrés Beltrán",
    ANALISTA_DOCUMENTAL: "Lida Almeciga",
    ANALISTA_SEGUNDO_CONTROL: "Claudia Liliana Pardo",
    SUPER_ADMIN: "Diego Fernando Marín",
  };
  const etiqueta = nombres[perfil];
  if (!etiqueta) throw new Error(`Perfil de demostración desconocido: ${perfil}`);
  await page.getByRole("button", { name: new RegExp(etiqueta) }).click();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
};

export const cerrarSesion = async (page: Page) => {
  await abrirMenuSiEsMovil(page);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/acceso/);
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
  if (!(await boton.isVisible())) return;
  if ((await boton.getAttribute("aria-expanded")) === "true") return;
  await boton.click();
  await expect(page.locator("#navegacion-lateral")).toHaveAttribute("data-abierto", "true");
};

export const CLAVE_INTRO = "SICAMED_intro_animation_seen";
export const CLAVE_ORIGEN = "SICAMED_vitrina_origen_seen";

export const omitirCinematica = async (page: Page) => {
  await page.addInitScript((claves: string[]) => {
    try {
      for (const clave of claves) window.localStorage.setItem(clave, "true");
    } catch {
      return;
    }
  }, [CLAVE_INTRO, CLAVE_ORIGEN]);
};
