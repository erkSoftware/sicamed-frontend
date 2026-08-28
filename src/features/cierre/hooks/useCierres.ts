import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useCierres = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "cierres", filtro],
    queryFn: () => apiComercial.cierres(filtro),
  });

export const useDeclararMovimiento = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.declararMovimiento,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["comercial", "cierres"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};
