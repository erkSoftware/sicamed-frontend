import type { Credenciales, ProveedorAutenticacion, Sesion } from "./tipos";
import { AUTORIDAD, CLIENTE, aSesion, pedirToken } from "./keycloak";
import type { RespuestaToken } from "./keycloak";

let credencialEnMemoria: string | undefined;
let renovacionEnMemoria: string | undefined;

const guardar = (token: RespuestaToken): Sesion => {
  credencialEnMemoria = token.access_token;
  renovacionEnMemoria = token.refresh_token;
  return aSesion(token);
};

const olvidar = (): void => {
  credencialEnMemoria = undefined;
  renovacionEnMemoria = undefined;
};

export const proveedorContrasena: ProveedorAutenticacion = {
  nombre: "keycloak-contrasena",

  restaurar: async () => {
    if (!renovacionEnMemoria) return null;
    try {
      return guardar(
        await pedirToken(
          new URLSearchParams({
            grant_type: "refresh_token",
            client_id: CLIENTE,
            refresh_token: renovacionEnMemoria,
          }),
        ),
      );
    } catch {
      olvidar();
      return null;
    }
  },

  iniciarSesion: async (credenciales?: Credenciales) => {
    const usuario = credenciales?.usuario?.trim() ?? "";
    const clave = credenciales?.clave ?? "";
    if (!usuario || !clave) throw new Error("Faltan las credenciales de acceso");
    return guardar(
      await pedirToken(
        new URLSearchParams({
          grant_type: "password",
          client_id: CLIENTE,
          scope: "openid profile email",
          username: usuario,
          password: clave,
        }),
      ),
    );
  },

  cerrarSesion: async () => {
    const renovacion = renovacionEnMemoria;
    olvidar();
    if (!renovacion) return;
    await fetch(`${AUTORIDAD}/protocol/openid-connect/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: CLIENTE, refresh_token: renovacion }),
    }).catch(() => undefined);
  },

  credencial: () => credencialEnMemoria,
};
