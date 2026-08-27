import { useQuery } from "@tanstack/react-query";
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
