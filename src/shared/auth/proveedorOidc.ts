import type { ProveedorAutenticacion, Sesion } from "./tipos";
import { AUTORIDAD, CLIENTE, aSesion, pedirToken } from "./keycloak";

const RUTA_RETORNO = import.meta.env.VITE_OIDC_REDIRECCION ?? "/acceso";
const CLAVE_VERIFICADOR = "sicamed.pkce";

let credencialEnMemoria: string | undefined;
let renovacionEnMemoria: string | undefined;

const urlDeRetorno = (): string => new URL(RUTA_RETORNO, window.location.origin).toString();

const aBase64Url = (datos: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(datos)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const generarVerificador = (): string => {
  const aleatorio = new Uint8Array(32);
  crypto.getRandomValues(aleatorio);
  return aBase64Url(aleatorio.buffer);
};

const generarDesafio = async (verificador: string): Promise<string> =>
  aBase64Url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verificador)));

const canjear = async (cuerpo: URLSearchParams): Promise<Sesion> => {
  const token = await pedirToken(cuerpo);
  credencialEnMemoria = token.access_token;
  renovacionEnMemoria = token.refresh_token;
  return aSesion(token);
};

export const proveedorOidc: ProveedorAutenticacion = {
  nombre: "oidc-pkce",

  restaurar: async () => {
    const parametros = new URLSearchParams(window.location.search);
    const codigo = parametros.get("code");
    const verificador = window.sessionStorage.getItem(CLAVE_VERIFICADOR);
    if (codigo && verificador) {
      window.sessionStorage.removeItem(CLAVE_VERIFICADOR);
      const sesion = await canjear(
        new URLSearchParams({
          grant_type: "authorization_code",
          client_id: CLIENTE,
          code: codigo,
          code_verifier: verificador,
          redirect_uri: urlDeRetorno(),
        }),
      );
      window.history.replaceState({}, "", "/app");
      return sesion;
    }
    if (!renovacionEnMemoria) return null;
    try {
      return await canjear(
        new URLSearchParams({
          grant_type: "refresh_token",
          client_id: CLIENTE,
          refresh_token: renovacionEnMemoria,
        }),
      );
    } catch {
      renovacionEnMemoria = undefined;
      return null;
    }
  },

  iniciarSesion: async () => {
    const verificador = generarVerificador();
    const desafio = await generarDesafio(verificador);
    window.sessionStorage.setItem(CLAVE_VERIFICADOR, verificador);
    const url = new URL(`${AUTORIDAD}/protocol/openid-connect/auth`);
    url.searchParams.set("client_id", CLIENTE);
    url.searchParams.set("redirect_uri", urlDeRetorno());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid profile email");
    url.searchParams.set("code_challenge", desafio);
    url.searchParams.set("code_challenge_method", "S256");
    window.location.assign(url.toString());
    return new Promise<Sesion>(() => undefined);
  },

  cerrarSesion: async () => {
    credencialEnMemoria = undefined;
    renovacionEnMemoria = undefined;
    window.location.assign(
      `${AUTORIDAD}/protocol/openid-connect/logout?client_id=${CLIENTE}` +
        `&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`,
    );
  },

  credencial: () => credencialEnMemoria,
};
