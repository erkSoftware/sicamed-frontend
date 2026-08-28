import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useBeneficios = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "beneficios", filtro],
    queryFn: () => apiComercial.beneficios(filtro),
  });

export const useCultivosEnCosecha = () =>
  useQuery({
    queryKey: ["comercial", "cultivos", { porPagina: 200 }],
    queryFn: () => apiComercial.cultivos({ porPagina: 200 }),
  });

const invalidarBeneficio = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["comercial", "beneficios"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "lotes"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
};

export const useRegistrarBeneficio = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.registrarBeneficio,
    onSuccess: () => invalidarBeneficio(cliente),
  });
};

export const useAvanzarBeneficio = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.avanzarBeneficio,
    onSuccess: () => invalidarBeneficio(cliente),
  });
};
