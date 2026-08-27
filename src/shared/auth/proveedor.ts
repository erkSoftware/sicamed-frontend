import { proveedorMock } from "./proveedorMock";
import { proveedorCloudflare } from "./proveedorCloudflare";
import { proveedorOidc } from "./proveedorOidc";
import type { ProveedorAutenticacion } from "./tipos";

const MODO = import.meta.env.VITE_MODO_AUTH ?? "mock";

export const proveedorAutenticacion: ProveedorAutenticacion =
  MODO === "cloudflare" ? proveedorCloudflare : MODO === "oidc" ? proveedorOidc : proveedorMock;

export const esModoDemostracion = MODO === "mock";
