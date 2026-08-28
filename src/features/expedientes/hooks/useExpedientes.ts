import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useExpedientes = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "expedientes", filtro],
    queryFn: () => apiComercial.expedientes(filtro),
  });

export const usePoliticaVerificacion = () =>
  useQuery({
    queryKey: ["comercial", "politica-verificacion"],
    queryFn: () => apiComercial.politicaVerificacion(),
  });

export const useSolicitudes = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "solicitudes", filtro],
    queryFn: () => apiComercial.solicitudes(filtro),
  });

const invalidarTramite = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["comercial", "expedientes"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "solicitudes"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
};

export const useDecidirDocumento = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.decidirDocumento,
    onSuccess: () => invalidarTramite(cliente),
  });
};

export const useResolverPaso = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.resolverPaso,
    onSuccess: () => invalidarTramite(cliente),
  });
};

export const useGuardarPolitica = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.guardarPolitica,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["comercial", "politica-verificacion"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};

export const useAbrirExpediente = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.abrirExpediente,
    onSuccess: () => {
      invalidarTramite(cliente);
      void cliente.invalidateQueries({ queryKey: ["comercial", "organizaciones"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "cuentas"] });
    },
  });
};
