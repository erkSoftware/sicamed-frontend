import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useAtestaciones = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "atestaciones", filtro],
    queryFn: () => apiComercial.atestaciones(filtro),
  });

export const useExpedientesAprobados = () =>
  useQuery({
    queryKey: ["comercial", "expedientes", { estado: "APROBADO", porPagina: 100 }],
    queryFn: () => apiComercial.expedientes({ estado: "APROBADO", porPagina: 100 }),
  });

export const useRegistrarAtestacion = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.registrarAtestacion,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["comercial", "atestaciones"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "indicadores"] });
    },
  });
};
