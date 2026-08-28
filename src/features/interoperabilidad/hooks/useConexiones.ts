import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useConexiones = () =>
  useQuery({
    queryKey: ["comercial", "conexiones"],
    queryFn: () => apiComercial.conexiones(),
  });

export const useAmbiente = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "ambiente", filtro],
    queryFn: () => apiComercial.ambiente(filtro),
  });

export const useDiscrepancias = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "discrepancias", filtro],
    queryFn: () => apiComercial.discrepancias(filtro),
  });

const invalidarInteroperabilidad = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["comercial", "conexiones"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "discrepancias"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
};

export const useSincronizarConexion = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.sincronizarConexion,
    onSuccess: () => invalidarInteroperabilidad(cliente),
  });
};

export const useResolverDiscrepancia = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.resolverDiscrepancia,
    onSuccess: () => invalidarInteroperabilidad(cliente),
  });
};
