import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";

export const CLAVE_CONFIGURACION_AURORA = ["comercial", "asistente", "configuracion"] as const;

export const CLAVE_BLOQUEOS_AURORA = ["comercial", "asistente", "bloqueos"] as const;

export const useConfiguracionAurora = () =>
  useQuery({
    queryKey: CLAVE_CONFIGURACION_AURORA,
    queryFn: () => apiComercial.configuracionAsistente(),
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });

export const useGuardarConfiguracionAurora = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.guardarConfiguracionAsistente,
    onSuccess: (configuracion) => {
      cliente.setQueryData(CLAVE_CONFIGURACION_AURORA, configuracion);
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};

export const useProbarConexionAurora = () =>
  useMutation({ mutationFn: () => apiComercial.probarConexionAsistente() });

export const useBloqueosAurora = (soloActivos: boolean) =>
  useQuery({
    queryKey: [...CLAVE_BLOQUEOS_AURORA, soloActivos],
    queryFn: () => apiComercial.bloqueosAsistente({ soloActivos }),
    retry: false,
  });

export const useCuentasParaBloqueo = (busqueda: string, habilitado: boolean) =>
  useQuery({
    queryKey: [...CLAVE_BLOQUEOS_AURORA, "cuentas", busqueda],
    queryFn: () => apiComercial.cuentas({ busqueda, porPagina: 20 }),
    enabled: habilitado,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

export const useBloquearAurora = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.bloquearAsistente,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: CLAVE_BLOQUEOS_AURORA });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};

export const useDesbloquearAurora = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.desbloquearAsistente,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: CLAVE_BLOQUEOS_AURORA });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};
