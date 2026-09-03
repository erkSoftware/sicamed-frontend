import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { clienteConsultaDispensacion } from "./clientesConsulta";

export const QueryProviderDispensacion = ({ children }: PropsWithChildren) => {
  useEffect(() => () => clienteConsultaDispensacion.clear(), []);
  return (
    <QueryClientProvider client={clienteConsultaDispensacion}>{children}</QueryClientProvider>
  );
};
