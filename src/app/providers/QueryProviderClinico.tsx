import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { clienteConsultaClinico } from "./clientesConsulta";

export const QueryProviderClinico = ({ children }: PropsWithChildren) => {
  useEffect(() => () => clienteConsultaClinico.clear(), []);
  return <QueryClientProvider client={clienteConsultaClinico}>{children}</QueryClientProvider>;
};
