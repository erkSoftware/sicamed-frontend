import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useCupos = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "cupos", filtro],
    queryFn: () => apiComercial.cupos(filtro),
  });

export const useConciliarCupos = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.conciliarCupos,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["comercial", "cupos"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};
