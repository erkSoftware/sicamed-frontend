import { useQuery } from "@tanstack/react-query";
import { apiClinica } from "../../../shared/api/clienteClinico";
import type { FiltroListado } from "../../../shared/api/mock/servidorMock";

export const usePacientes = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["clinico", "pacientes", filtro],
    queryFn: () => apiClinica.pacientes(filtro),
  });

export const usePaciente = (id: string) =>
  useQuery({
    queryKey: ["clinico", "paciente", id],
    queryFn: () => apiClinica.paciente(id),
    enabled: Boolean(id),
  });

export const useIndicadoresClinicos = () =>
  useQuery({
    queryKey: ["clinico", "indicadores"],
    queryFn: () => apiClinica.indicadores(),
  });

export const useAgenda = (filtro: FiltroListado) =>
  useQuery({
    queryKey: ["clinico", "agenda", filtro],
    queryFn: () => apiClinica.agenda(filtro),
  });

export const useTeleconsultas = () =>
  useQuery({
    queryKey: ["clinico", "teleconsultas"],
    queryFn: () => apiClinica.teleconsultas(),
  });
