import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useLotes = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "lotes", filtro],
    queryFn: () => apiComercial.lotes(filtro),
  });
