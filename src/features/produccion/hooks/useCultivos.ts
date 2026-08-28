import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useCultivos = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "cultivos", filtro],
    queryFn: () => apiComercial.cultivos(filtro),
  });

export const useVariedades = () =>
  useQuery({
    queryKey: ["comercial", "variedades"],
    queryFn: () => apiComercial.variedades(),
  });

const invalidarProduccion = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["comercial", "cultivos"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "cupos"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "indicadores"] });
};

export const useRegistrarCultivo = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.registrarCultivo,
    onSuccess: () => invalidarProduccion(cliente),
  });
};

export const useCambiarEtapa = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.cambiarEtapaCultivo,
    onSuccess: () => invalidarProduccion(cliente),
  });
};
