import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDispensacion } from "../../../shared/api/clienteDispensacion";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const usePuntos = () =>
  useQuery({
    queryKey: ["dispensacion", "puntos"],
    queryFn: () => apiDispensacion.puntos(),
  });

export const useActos = (filtro: FiltroListado & { puntoId?: string }) =>
  useQuery({
    queryKey: ["dispensacion", "actos", filtro],
    queryFn: () => apiDispensacion.actos(filtro),
  });

export const useVerificarCredencial = () =>
  useMutation({ mutationFn: apiDispensacion.verificar });

export const useRegistrarEntrega = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiDispensacion.registrarEntrega,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["dispensacion", "actos"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "cargos"] });
    },
  });
};
