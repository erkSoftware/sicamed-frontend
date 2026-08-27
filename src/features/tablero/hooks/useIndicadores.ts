import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";

export const useIndicadores = () =>
  useQuery({
    queryKey: ["comercial", "indicadores", "nacionales"],
    queryFn: () => apiComercial.indicadoresNacionales(),
  });

export const useEventosRecientes = () =>
  useQuery({
    queryKey: ["comercial", "eventos", "recientes"],
    queryFn: () => apiComercial.eventos({ pagina: 1, porPagina: 6 }),
  });
