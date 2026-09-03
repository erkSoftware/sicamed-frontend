import { QueryClient } from "@tanstack/react-query";
import { admiteReintento, aProblema, segundosDeEspera } from "../../shared/api/problemDetails";

const REINTENTOS_MAXIMOS = 2;

export const debeReintentar = (intento: number, error: unknown): boolean =>
  intento < REINTENTOS_MAXIMOS && admiteReintento(aProblema(error));

export const esperaAntesDeReintentar = (intento: number, error: unknown): number => {
  const declarada = segundosDeEspera(aProblema(error));
  if (declarada > 0) return declarada * 1000;
  return Math.min(30_000, 1_000 * 2 ** intento);
};

export const clienteConsultaComercial = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: debeReintentar,
      retryDelay: esperaAntesDeReintentar,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export const clienteConsultaClinico = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 0,
      staleTime: 0,
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: "always",
    },
    mutations: {
      retry: false,
    },
  },
});

export const clienteConsultaDispensacion = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 0,
      staleTime: 0,
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: "always",
    },
    mutations: {
      retry: false,
    },
  },
});

export const limpiarAmbasZonas = (): void => {
  clienteConsultaClinico.clear();
  clienteConsultaDispensacion.clear();
  clienteConsultaComercial.clear();
};
