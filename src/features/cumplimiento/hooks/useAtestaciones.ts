import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useAtestaciones = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "atestaciones", filtro],
    queryFn: () => apiComercial.atestaciones(filtro),
  });
