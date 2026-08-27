import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useCierres = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "cierres", filtro],
    queryFn: () => apiComercial.cierres(filtro),
  });
