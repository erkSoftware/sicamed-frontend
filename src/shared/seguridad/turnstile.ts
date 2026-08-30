export type OpcionesWidget = {
  sitekey: string;
  callback: (token: string) => void;
  "error-callback": (codigo?: string) => void;
  "expired-callback": () => void;
  "timeout-callback"?: () => void;
  action?: string;
  theme?: "light" | "dark" | "auto";
  language?: string;
  appearance?: "always" | "execute" | "interaction-only";
};

export type ApiTurnstile = {
  render: (contenedor: HTMLElement, opciones: OpcionesWidget) => string | undefined;
  remove: (widget: string) => void;
  reset: (widget?: string) => void;
};

declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

export const URL_TURNSTILE =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const CABECERA_CAPTCHA = "CF-Turnstile-Response";

export const claveDeSitio = (): string => import.meta.env.VITE_TURNSTILE_CLAVE_SITIO ?? "";

export const exigeComprobacion = (): boolean => claveDeSitio() !== "";

let carga: Promise<ApiTurnstile> | null = null;

export const olvidarCarga = (): void => {
  carga = null;
};

export const cargarTurnstile = (): Promise<ApiTurnstile> => {
  if (carga) return carga;
  if (typeof document === "undefined") {
    return Promise.reject(new Error("Turnstile solo se carga en el navegador."));
  }
  if (window.turnstile) {
    carga = Promise.resolve(window.turnstile);
    return carga;
  }

  carga = new Promise<ApiTurnstile>((resolver, rechazar) => {
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${URL_TURNSTILE}"]`);
    const guion = existente ?? document.createElement("script");
    const resolverConApi = () => {
      const api = window.turnstile;
      if (api) resolver(api);
      else rechazar(new Error("Turnstile cargó sin exponer su interfaz."));
    };
    guion.addEventListener("load", resolverConApi);
    guion.addEventListener("error", () => {
      carga = null;
      rechazar(new Error("No se pudo descargar Turnstile."));
    });
    if (existente) return;
    guion.src = URL_TURNSTILE;
    guion.async = true;
    guion.defer = true;
    document.head.append(guion);
  });

  return carga;
};
