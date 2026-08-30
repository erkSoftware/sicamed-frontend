import type { Sesion } from "./tipos";
import { DURACION_SESION_MS } from "./perfiles";

export type RespuestaToken = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
};

export type Reclamaciones = {
  sub?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  rol?: string;
  rol_plataforma?: string;
  organizacion?: string;
  organizacion_id?: string;
  tenant_id?: string;
  permisos?: readonly string[];
};

export const AUTORIDAD = import.meta.env.VITE_OIDC_AUTORIDAD ?? "";

export const CLIENTE = import.meta.env.VITE_OIDC_CLIENTE ?? "sicamed-frontend";

export const decodificar = (token: string): Reclamaciones => {
  const carga = token.split(".")[1];
  if (!carga) return {};
  const normalizado = carga.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return JSON.parse(atob(normalizado)) as Reclamaciones;
  } catch {
    return {};
  }
};

export const aSesion = (token: RespuestaToken): Sesion => {
  const reclamaciones = decodificar(token.id_token ?? token.access_token);
  const vencimiento = Date.now() + token.expires_in * 1000;
  return {
    usuario: {
      id: reclamaciones.sub ?? "",
      nombre:
        reclamaciones.name ??
        reclamaciones.preferred_username ??
        reclamaciones.email ??
        "Usuario SICAMED",
      correo: reclamaciones.email ?? "",
      rol: reclamaciones.rol ?? "Usuario autenticado",
      rolPlataforma: (reclamaciones.rol_plataforma ??
        "OBSERVADOR_INSTITUCIONAL") as Sesion["usuario"]["rolPlataforma"],
      organizacionId: reclamaciones.organizacion_id ?? "",
      organizacion: reclamaciones.organizacion ?? "Organización sin asignar",
      tenantId: reclamaciones.tenant_id ?? "sicamed-co",
    },
    permisos: (reclamaciones.permisos ?? []) as Sesion["permisos"],
    expiracion: vencimiento || Date.now() + DURACION_SESION_MS,
  };
};

export type RechazoDelEmisor = {
  error?: string;
  error_description?: string;
};

const CREDENCIALES_INVALIDAS =
  "El correo o la contraseña no coinciden. Si acabas de registrar tu organización, usa el correo " +
  "de contacto que declaraste y la contraseña que escribiste al radicar.";

const CUENTA_NO_HABILITADA =
  "Tu cuenta existe pero todavía no está habilitada. La credencial que se crea al radicar queda " +
  "pendiente hasta que un administrador institucional apruebe el expediente; te avisamos al correo " +
  "de contacto cuando puedas entrar.";

const CUENTA_BLOQUEADA =
  "La cuenta quedó bloqueada temporalmente por intentos fallidos seguidos. Espera unos minutos " +
  "antes de volver a intentarlo.";

const CLIENTE_MAL_CONFIGURADO =
  "El portal no está autorizado a validar credenciales contra el emisor. Es una falla de " +
  "configuración del servidor, no de tus datos: repórtala al soporte de SICAMED.";

const DEMASIADOS_INTENTOS =
  "Demasiados intentos de acceso desde esta red. Espera un minuto antes de volver a intentarlo.";

const EMISOR_INALCANZABLE =
  "No fue posible contactar el servicio de identidad. Revisa tu conexión e inténtalo de nuevo; si " +
  "persiste, el emisor puede estar en mantenimiento.";

export const mensajeDeRechazo = (estado: number, detalle?: RechazoDelEmisor): string => {
  if (estado === 429) return DEMASIADOS_INTENTOS;
  if (estado >= 500) return EMISOR_INALCANZABLE;
  if (detalle?.error === "unauthorized_client" || detalle?.error === "invalid_client")
    return CLIENTE_MAL_CONFIGURADO;

  const descripcion = (detalle?.error_description ?? "").toLowerCase();
  if (descripcion.includes("temporarily disabled") || descripcion.includes("temporalmente"))
    return CUENTA_BLOQUEADA;
  if (
    descripcion.includes("account disabled") ||
    descripcion.includes("account is not fully set up") ||
    descripcion.includes("not enabled") ||
    descripcion.includes("deshabilitada")
  )
    return CUENTA_NO_HABILITADA;
  if (detalle?.error === "invalid_grant") return CREDENCIALES_INVALIDAS;

  return detalle?.error_description ?? detalle?.error ?? CREDENCIALES_INVALIDAS;
};

export const pedirToken = async (cuerpo: URLSearchParams): Promise<RespuestaToken> => {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${AUTORIDAD}/protocol/openid-connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "include",
      body: cuerpo,
    });
  } catch {
    throw new Error(EMISOR_INALCANZABLE);
  }
  if (!respuesta.ok) {
    const detalle = (await respuesta.json().catch(() => undefined)) as
      | RechazoDelEmisor
      | undefined;
    throw new Error(mensajeDeRechazo(respuesta.status, detalle));
  }
  return (await respuesta.json()) as RespuestaToken;
};
