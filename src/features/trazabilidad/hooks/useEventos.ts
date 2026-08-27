import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useEventos = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "eventos", filtro],
    queryFn: () => apiComercial.eventos(filtro),
  });
