import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FlujoCargo } from "../../../shared/api/mock/datosDispensacion";

export const useCargos = (filtro: {
  flujo?: FlujoCargo;
  periodo?: string;
  estado?: string;
  pagina?: number;
}) =>
  useQuery({
    queryKey: ["comercial", "cargos", filtro],
    queryFn: () => apiComercial.cargos(filtro),
  });

export const useCorteLiquidacion = (filtro: { periodo?: string }) =>
  useQuery({
    queryKey: ["comercial", "corte-liquidacion", filtro],
    queryFn: () => apiComercial.corteLiquidacion(filtro),
  });
