import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useTransformaciones = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "transformaciones", filtro],
    queryFn: () => apiComercial.transformaciones(filtro),
  });

export const useLotesDisponibles = () =>
  useQuery({
    queryKey: ["comercial", "lotes", { estado: "EN_BODEGA", porPagina: 200 }],
    queryFn: () => apiComercial.lotes({ estado: "EN_BODEGA", porPagina: 200 }),
  });

export const useRegistrarTransformacion = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.registrarTransformacion,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["comercial", "transformaciones"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "lotes"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};
