import { useQuery } from "@tanstack/react-query";
import { apiPublica } from "../../shared/api/clientePublico";
import type { ConsultaVitrina } from "../../shared/api/mock/servidorMock";

const MINUTO = 60_000;

export const useOfertasPublicas = (
  consulta: ConsultaVitrina,
  cursor: string | null,
  limite: number,
) =>
  useQuery({
    queryKey: ["publico", "ofertas", consulta, cursor, limite],
    queryFn: () => apiPublica.ofertas(consulta, cursor, limite),
    staleTime: MINUTO,
  });

export const useEstadisticasVitrina = (consulta: ConsultaVitrina) =>
  useQuery({
    queryKey: ["publico", "estadisticas", consulta],
    queryFn: () => apiPublica.estadisticas(consulta),
    staleTime: MINUTO,
  });

export const useOfertaPublica = (id: string) =>
  useQuery({
    queryKey: ["publico", "oferta", id],
    queryFn: () => apiPublica.oferta(id),
    enabled: Boolean(id),
    staleTime: MINUTO,
  });
