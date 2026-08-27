import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { clienteConsultaComercial } from "./clientesConsulta";

export const QueryProviderComercial = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={clienteConsultaComercial}>{children}</QueryClientProvider>
);
