import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useCultivos = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "cultivos", filtro],
    queryFn: () => apiComercial.cultivos(filtro),
  });
