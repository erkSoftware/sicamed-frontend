import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const usePlantas = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["comercial", "plantas", filtro],
    queryFn: () => apiComercial.plantas(filtro),
  });

export const usePlanta = (id: string) =>
  useQuery({
    queryKey: ["comercial", "planta", id],
    queryFn: () => apiComercial.planta(id),
    enabled: id.length > 0,
  });

export const useVariedades = () =>
  useQuery({
    queryKey: ["comercial", "variedades"],
    queryFn: () => apiComercial.variedades(),
  });

export const useAgroinsumos = () =>
  useQuery({
    queryKey: ["comercial", "agroinsumos"],
    queryFn: () => apiComercial.agroinsumos(),
  });
