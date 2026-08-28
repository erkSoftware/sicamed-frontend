import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const useCuentas = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "cuentas", filtro],
    queryFn: () => apiComercial.cuentas(filtro),
  });

export const useOrganizaciones = () =>
  useQuery({
    queryKey: ["comercial", "organizaciones", { porPagina: 200 }],
    queryFn: () => apiComercial.organizaciones({ porPagina: 200 }),
  });

const invalidar = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["comercial", "cuentas"] });
  void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
};

export const useInvitarCuenta = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.invitarCuenta,
    onSuccess: () => invalidar(cliente),
  });
};

export const useCambiarCuenta = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.cambiarCuenta,
    onSuccess: () => invalidar(cliente),
  });
};
