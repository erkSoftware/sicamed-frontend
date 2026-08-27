export const CLAVE_INTRO = "SICAMED_intro_animation_seen";
export const CLAVE_TRAZA = "SICAMED_intro_debug";
export const CANAL_INTRO = "sicamed:intro";

const SELLO = "cinematica-5";
const MARCA = "[SICAMED intro]";
const LIMITE = 300;

export type AnotacionIntro = {
  ms: number;
  paso: string;
  dato: Record<string, unknown>;
};

type ConsolaIntro = {
  sello: string;
  reproducir: () => void;
  olvidar: () => void;
  estado: () => Record<string, unknown>;
  registro: () => string;
  copiar: () => Promise<string>;
};

type VentanaIntro = Window &
  typeof globalThis & {
    __sicamedIntro?: AnotacionIntro[];
    sicamedIntro?: ConsolaIntro;
  };

const ventana = (): VentanaIntro | null =>
  typeof window === "undefined" ? null : (window as VentanaIntro);

const leerClave = (clave: string): string | null => {
  try {
    return window.localStorage.getItem(clave);
  } catch (error) {
    void error;
    return null;
  }
};

const verboso = (): boolean => {
  if (import.meta.env.DEV) return true;
  return leerClave(CLAVE_TRAZA) === "true";
};

export const anotar = (paso: string, dato: Record<string, unknown> = {}): void => {
  const raiz = ventana();
  if (!raiz) return;
  const lista = raiz.__sicamedIntro ?? (raiz.__sicamedIntro = []);
  lista.push({ ms: Math.round(performance.now()), paso, dato });
  if (lista.length > LIMITE) lista.splice(0, lista.length - LIMITE);
  if (verboso()) console.info(`${MARCA} ${paso}`, dato);
};

export const pedirCinematica = (): void => {
  const raiz = ventana();
  if (!raiz) return;
  anotar("peticion-manual");
  raiz.dispatchEvent(new CustomEvent(CANAL_INTRO));
};

const visibilidadSitio = (): string => {
  const sitio = document.querySelector(".sitio");
  return sitio ? window.getComputedStyle(sitio).visibility : "sin nodo";
};

const estadoIntro = (): Record<string, unknown> => {
  const raiz = ventana();
  if (!raiz) return { sello: SELLO, entorno: "sin ventana" };
  return {
    sello: SELLO,
    href: raiz.location.href,
    ruta: raiz.location.pathname,
    hash: raiz.location.hash,
    vista: leerClave(CLAVE_INTRO),
    reducido: raiz.matchMedia("(prefers-reduced-motion: reduce)").matches,
    atributoCinematica: document.documentElement.getAttribute("data-cinematica"),
    atributoIntro: document.documentElement.getAttribute("data-intro"),
    atributoMovimiento: document.documentElement.getAttribute("data-movimiento"),
    capasEnDom: document.querySelectorAll(".cinematica").length,
    lienzosEnDom: document.querySelectorAll(".cinematica__lienzo").length,
    visibilidadSitio: visibilidadSitio(),
    ventana: `${raiz.innerWidth}x${raiz.innerHeight}`,
    agente: raiz.navigator.userAgent,
  };
};

export const registroIntro = (): string => {
  const raiz = ventana();
  if (!raiz) return "";
  const lista = raiz.__sicamedIntro ?? [];
  const cabecera = JSON.stringify(estadoIntro(), null, 2);
  const cuerpo = lista
    .map((paso) => `${String(paso.ms).padStart(7)}ms  ${paso.paso}  ${JSON.stringify(paso.dato)}`)
    .join("\n");
  return `${cabecera}\n\n${cuerpo || "sin anotaciones"}`;
};

export const instalarConsolaIntro = (): void => {
  const raiz = ventana();
  if (!raiz || raiz.sicamedIntro) return;
  raiz.sicamedIntro = {
    sello: SELLO,
    reproducir: pedirCinematica,
    olvidar: () => {
      try {
        raiz.localStorage.removeItem(CLAVE_INTRO);
      } catch (error) {
        void error;
      }
      anotar("marca-borrada");
    },
    estado: estadoIntro,
    registro: () => {
      const texto = registroIntro();
      console.log(texto);
      return texto;
    },
    copiar: async () => {
      const texto = registroIntro();
      try {
        await raiz.navigator.clipboard.writeText(texto);
        console.info(`${MARCA} registro copiado al portapapeles`);
      } catch (error) {
        console.warn(`${MARCA} no se pudo copiar`, error);
        console.log(texto);
      }
      return texto;
    },
  };
  if (verboso())
    console.info(
      `${MARCA} ${SELLO} listo · sicamedIntro.reproducir() · sicamedIntro.copiar() · sicamedIntro.olvidar()`,
    );
};
