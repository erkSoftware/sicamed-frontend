import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useDestrucciones = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "destrucciones", filtro],
    queryFn: () => apiComercial.destrucciones(filtro),
  });

export const useLotesDestruibles = () =>
  useQuery({
    queryKey: ["comercial", "lotes", { porPagina: 200, destruibles: true }],
    queryFn: () => apiComercial.lotes({ porPagina: 200 }),
  });

export const useRegistrarActa = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.registrarDestruccion,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["comercial", "destrucciones"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "lotes"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "plantas"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "cupos"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};
