import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useBeneficios = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "beneficios", filtro],
    queryFn: () => apiComercial.beneficios(filtro),
  });
