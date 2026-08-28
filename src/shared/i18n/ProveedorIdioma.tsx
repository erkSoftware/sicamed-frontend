import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  CLAVE_ALMACENAMIENTO_IDIOMA,
  IDIOMA_POR_DEFECTO,
  definicionIdioma,
  esCodigoIdioma,
  traducir,
  type ClaveTraduccion,
  type CodigoIdioma,
  type ValoresTraduccion,
} from "./idioma";

type ContextoIdioma = {
  idioma: CodigoIdioma;
  locale: string;
  cambiarIdioma: (codigo: CodigoIdioma) => void;
  t: (clave: ClaveTraduccion | string, valores?: ValoresTraduccion) => string;
};

const Contexto = createContext<ContextoIdioma | null>(null);

const idiomaGuardado = (): CodigoIdioma => {
  if (typeof window === "undefined") return IDIOMA_POR_DEFECTO;
  try {
    const guardado = window.localStorage.getItem(CLAVE_ALMACENAMIENTO_IDIOMA);
    return esCodigoIdioma(guardado) ? guardado : IDIOMA_POR_DEFECTO;
  } catch {
    return IDIOMA_POR_DEFECTO;
  }
};

export const ProveedorIdioma = ({ children }: PropsWithChildren) => {
  const [idioma, setIdioma] = useState<CodigoIdioma>(idiomaGuardado);
  const locale = definicionIdioma(idioma).locale;

  useEffect(() => {
    const anterior = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = anterior;
    };
  }, [locale]);

  const cambiarIdioma = useCallback((codigo: CodigoIdioma) => {
    setIdioma(codigo);
    try {
      window.localStorage.setItem(CLAVE_ALMACENAMIENTO_IDIOMA, codigo);
    } catch {
      return;
    }
  }, []);

  const valor = useMemo<ContextoIdioma>(
    () => ({
      idioma,
      locale,
      cambiarIdioma,
      t: (clave, valores) => traducir(idioma, clave, valores),
    }),
    [idioma, locale, cambiarIdioma],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const useTraduccion = (): ContextoIdioma => {
  const contexto = useContext(Contexto);
  if (contexto) return contexto;
  return {
    idioma: IDIOMA_POR_DEFECTO,
    locale: definicionIdioma(IDIOMA_POR_DEFECTO).locale,
    cambiarIdioma: () => undefined,
    t: (clave, valores) => traducir(IDIOMA_POR_DEFECTO, clave, valores),
  };
};
