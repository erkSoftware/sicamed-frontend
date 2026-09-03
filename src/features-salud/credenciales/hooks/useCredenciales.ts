import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClinica } from "../../../shared/api/clienteClinico";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useCredenciales = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["clinico", "credenciales", filtro],
    queryFn: () => apiClinica.credenciales(filtro),
  });

export const useCredencial = (id: string) =>
  useQuery({
    queryKey: ["clinico", "credencial", id],
    queryFn: () => apiClinica.credencial(id),
    enabled: id.length > 0,
  });

const invalidar = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["clinico", "credenciales"] });
  void cliente.invalidateQueries({ queryKey: ["clinico", "credencial"] });
};

export const useEmitirCredencial = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiClinica.emitirCredencial,
    onSuccess: () => invalidar(cliente),
  });
};

export const useCambiarEstadoCredencial = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiClinica.cambiarEstadoCredencial,
    onSuccess: () => invalidar(cliente),
  });
};

export const useRotarCodigo = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiClinica.rotarCodigo,
    onSuccess: () => invalidar(cliente),
  });
};
