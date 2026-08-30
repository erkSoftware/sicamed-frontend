import { proveedorMock } from "./proveedorMock";
import { proveedorCloudflare } from "./proveedorCloudflare";
import { proveedorOidc } from "./proveedorOidc";
import { proveedorContrasena } from "./proveedorContrasena";
import { proveedorServidor } from "./proveedorServidor";
import type { ProveedorAutenticacion } from "./tipos";

const MODO = import.meta.env.VITE_MODO_AUTH ?? "servidor";

const CATALOGO: Record<string, ProveedorAutenticacion> = {
  cloudflare: proveedorCloudflare,
  oidc: proveedorOidc,
  contrasena: proveedorContrasena,
  servidor: proveedorServidor,
  mock: proveedorMock,
};

export const modoAutenticacion = MODO;

export const proveedorAutenticacion: ProveedorAutenticacion = CATALOGO[MODO] ?? proveedorServidor;

export const esModoDemostracion = MODO === "mock";

export const pideCredenciales = MODO === "mock" || MODO === "contrasena" || MODO === "servidor";

export const usaIdentidadDelServidor = MODO === "servidor";
