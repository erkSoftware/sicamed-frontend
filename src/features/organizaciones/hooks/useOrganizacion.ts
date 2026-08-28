import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";

export const useOrganizacionActual = (id?: string) =>
  useQuery({
    queryKey: ["comercial", "organizacion", "actual", id],
    queryFn: () => apiComercial.organizacionActual(id),
  });

export const useOrganizacion = (id: string) =>
  useQuery({
    queryKey: ["comercial", "organizacion", id],
    queryFn: () => apiComercial.organizacion(id),
    enabled: Boolean(id),
  });

export const useAtestacionesDe = (organizacionId: string) =>
  useQuery({
    queryKey: ["comercial", "atestaciones", "organizacion", organizacionId],
    queryFn: () => apiComercial.atestaciones({ busqueda: "", porPagina: 100 }),
    select: (pagina) => pagina.datos.filter((a) => a.organizacionId === organizacionId),
    enabled: Boolean(organizacionId),
  });

export const useActualizarOrganizacion = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.actualizarOrganizacion,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["comercial", "organizacion"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "organizaciones"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};
