import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useLotes = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "lotes", filtro],
    queryFn: () => apiComercial.lotes(filtro),
  });

export const useCultivosDelActor = () =>
  useQuery({
    queryKey: ["comercial", "cultivos", { porPagina: 200 }],
    queryFn: () => apiComercial.cultivos({ porPagina: 200 }),
  });

const invalidarInventario = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["comercial", "lotes"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
};

export const useRegistrarLote = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.registrarLote,
    onSuccess: () => invalidarInventario(cliente),
  });
};

export const useMoverLote = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.moverLote,
    onSuccess: () => invalidarInventario(cliente),
  });
};
