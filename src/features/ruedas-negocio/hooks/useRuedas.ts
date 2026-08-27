import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";

export const useRuedas = () =>
  useQuery({
    queryKey: ["comercial", "ruedas"],
    queryFn: () => apiComercial.ruedas(),
  });
