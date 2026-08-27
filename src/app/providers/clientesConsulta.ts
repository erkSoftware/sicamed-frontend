import { QueryClient } from "@tanstack/react-query";

export const clienteConsultaComercial = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
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
  },
});

export const limpiarAmbasZonas = (): void => {
  clienteConsultaClinico.clear();
  clienteConsultaComercial.clear();
};
