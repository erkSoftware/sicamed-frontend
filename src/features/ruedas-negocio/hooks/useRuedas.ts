import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";

export const useRuedas = () =>
  useQuery({
    queryKey: ["comercial", "ruedas"],
    queryFn: () => apiComercial.ruedas(),
  });

export const useInscribirRueda = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: apiComercial.inscribirRueda,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ["comercial", "ruedas"] });
      void cliente.invalidateQueries({ queryKey: ["comercial", "eventos"] });
    },
  });
};
