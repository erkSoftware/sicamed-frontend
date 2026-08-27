import { PERFILES_DEMO, perfilPorDefecto, sesionDesdePerfil } from "./perfiles";
import type { ProveedorAutenticacion, Sesion } from "./tipos";

const CLAVE_PERFIL = "sicamed.perfil-demo";

let credencialEnMemoria: string | undefined;

const perfilPorClave = (clave: string | null) =>
  PERFILES_DEMO.find((perfil) => perfil.clave === clave) ?? perfilPorDefecto();

export const proveedorMock: ProveedorAutenticacion = {
  nombre: "mock",

  restaurar: async () => {
    const clave = window.sessionStorage.getItem(CLAVE_PERFIL);
    if (!clave) return null;
    const perfil = perfilPorClave(clave);
    if (!perfil) return null;
    credencialEnMemoria = `demo.${perfil.clave}`;
    return sesionDesdePerfil(perfil);
  },

  iniciarSesion: async (perfilDemo?: string): Promise<Sesion> => {
    const perfil = perfilPorClave(perfilDemo ?? null);
    if (!perfil) throw new Error("Perfil de demostración no disponible");
    window.sessionStorage.setItem(CLAVE_PERFIL, perfil.clave);
    credencialEnMemoria = `demo.${perfil.clave}`;
    return sesionDesdePerfil(perfil);
  },

  cerrarSesion: async () => {
    window.sessionStorage.removeItem(CLAVE_PERFIL);
    credencialEnMemoria = undefined;
  },

  credencial: () => credencialEnMemoria,
};
