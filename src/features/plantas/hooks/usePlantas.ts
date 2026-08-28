import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const usePlantas = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "plantas", filtro],
    queryFn: () => apiComercial.plantas(filtro),
  });

export const usePlanta = (id: string) =>
  useQuery({
    queryKey: ["comercial", "planta", id],
    queryFn: () => apiComercial.planta(id),
    enabled: id.length > 0,
  });

export const useVariedades = () =>
  useQuery({
    queryKey: ["comercial", "variedades"],
    queryFn: () => apiComercial.variedades(),
  });

export const useAgroinsumos = () =>
  useQuery({
    queryKey: ["comercial", "agroinsumos"],
    queryFn: () => apiComercial.agroinsumos(),
  });

export const useCultivosDisponibles = () =>
  useQuery({
    queryKey: ["comercial", "cultivos", { porPagina: 200 }],
    queryFn: () => apiComercial.cultivos({ porPagina: 200 }),
  });

const invalidarPlantas = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["comercial", "plantas"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "planta"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "variedades"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "cupos"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
};

export const useRegistrarPlanta = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.registrarPlanta,
    onSuccess: () => invalidarPlantas(cliente),
  });
};

export const useRegistrarLabor = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.registrarLabor,
    onSuccess: () => invalidarPlantas(cliente),
  });
};

export const useCosecharPlanta = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.cosecharPlanta,
    onSuccess: () => invalidarPlantas(cliente),
  });
};

export const useRegistrarDestruccion = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.registrarDestruccion,
    onSuccess: () => {
      invalidarPlantas(cliente);
      void cliente.invalidateQueries({ queryKey: ["comercial", "destrucciones"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "lotes"] });
    },
  });
};
