import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClinica } from "../../../shared/api/clienteClinico";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const usePrescripciones = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["clinico", "prescripciones", filtro],
    queryFn: () => apiClinica.prescripciones(filtro),
  });

const invalidar = (cliente: ReturnType<typeof useQueryClient>) => {
  void cliente.invalidateQueries({ queryKey: ["clinico", "prescripciones"] });
  void cliente.invalidateQueries({ queryKey: ["clinico", "paciente"] });
};

export const useEmitirPrescripcion = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiClinica.emitirPrescripcion,
    onSuccess: () => invalidar(cliente),
  });
};

export const useAnularPrescripcion = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiClinica.anularPrescripcion,
    onSuccess: () => invalidar(cliente),
  });
};
