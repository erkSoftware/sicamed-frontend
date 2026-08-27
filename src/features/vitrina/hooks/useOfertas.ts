import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useOfertas = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "ofertas", filtro],
    queryFn: () => apiComercial.ofertas(filtro),
  });

export const useOferta = (id: string) =>
  useQuery({
    queryKey: ["comercial", "oferta", id],
    queryFn: () => apiComercial.oferta(id),
    enabled: Boolean(id),
  });

export const useManifestaciones = () =>
  useQuery({
    queryKey: ["comercial", "manifestaciones"],
    queryFn: () => apiComercial.manifestaciones(),
  });

export const usePublicarOferta = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.publicarOferta,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["comercial", "ofertas"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};
