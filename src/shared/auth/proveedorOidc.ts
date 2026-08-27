import type { ProveedorAutenticacion, Sesion } from "./tipos";
import { DURACION_SESION_MS } from "./perfiles";

type RespuestaToken = {
  access_token: string;
  expires_in: number;
  id_token?: string;
};

type Reclamaciones = {
  sub?: string;
  name?: string;
  email?: string;
  rol?: string;
  organizacion?: string;
  organizacion_id?: string;
  tenant_id?: string;
  permisos?: readonly string[];
};

const AUTORIDAD = import.meta.env.VITE_OIDC_AUTORIDAD ?? "";
const CLIENTE = import.meta.env.VITE_OIDC_CLIENTE ?? "sicamed-web";
const CLAVE_VERIFICADOR = "sicamed.pkce";

let credencialEnMemoria: string | undefined;
let vencimiento = 0;

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

const decodificar = (token: string): Reclamaciones => {
  const carga = token.split(".")[1];
  if (!carga) return {};
  const normalizado = carga.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(normalizado)) as Reclamaciones;
};

const aSesion = (token: RespuestaToken): Sesion => {
  const reclamaciones = decodificar(token.id_token ?? token.access_token);
  credencialEnMemoria = token.access_token;
  vencimiento = Date.now() + token.expires_in * 1000;
  return {
    usuario: {
      id: reclamaciones.sub ?? "",
      nombre: reclamaciones.name ?? reclamaciones.email ?? "Usuario SICAMED",
      correo: reclamaciones.email ?? "",
      rol: reclamaciones.rol ?? "Usuario autenticado",
      organizacionId: reclamaciones.organizacion_id ?? "",
      organizacion: reclamaciones.organizacion ?? "Organización sin asignar",
      tenantId: reclamaciones.tenant_id ?? "sicamed-co",
    },
    permisos: (reclamaciones.permisos ?? []) as Sesion["permisos"],
    expiracion: vencimiento || Date.now() + DURACION_SESION_MS,
  };
};

const canjear = async (cuerpo: URLSearchParams): Promise<Sesion> => {
  const respuesta = await fetch(`${AUTORIDAD}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "include",
    body: cuerpo,
  });
  if (!respuesta.ok) throw new Error("No fue posible canjear el código de autorización");
  return aSesion((await respuesta.json()) as RespuestaToken);
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
          redirect_uri: `${window.location.origin}/acceso`,
        }),
      );
      window.history.replaceState({}, "", "/app");
      return sesion;
    }
    try {
      return await canjear(new URLSearchParams({ grant_type: "refresh_token", client_id: CLIENTE }));
    } catch {
      return null;
    }
  },

  iniciarSesion: async () => {
    const verificador = generarVerificador();
    const desafio = await generarDesafio(verificador);
    window.sessionStorage.setItem(CLAVE_VERIFICADOR, verificador);
    const url = new URL(`${AUTORIDAD}/protocol/openid-connect/auth`);
    url.searchParams.set("client_id", CLIENTE);
    url.searchParams.set("redirect_uri", `${window.location.origin}/acceso`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid profile email");
    url.searchParams.set("code_challenge", desafio);
    url.searchParams.set("code_challenge_method", "S256");
    window.location.assign(url.toString());
    return new Promise<Sesion>(() => undefined);
  },

  cerrarSesion: async () => {
    credencialEnMemoria = undefined;
    vencimiento = 0;
    window.location.assign(
      `${AUTORIDAD}/protocol/openid-connect/logout?client_id=${CLIENTE}` +
        `&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`,
    );
  },

  credencial: () => credencialEnMemoria,
};
