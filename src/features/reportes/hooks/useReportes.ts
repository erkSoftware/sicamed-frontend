import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";

export const useReportes = () =>
  useQuery({
    queryKey: ["comercial", "reportes", "resumen"],
    queryFn: () => apiComercial.reportes(),
  });
