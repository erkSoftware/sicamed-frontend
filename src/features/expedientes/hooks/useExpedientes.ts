import { useQuery } from "@tanstack/react-query";
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
