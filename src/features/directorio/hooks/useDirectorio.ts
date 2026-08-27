import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../../shared/api/clienteComercial";

export const useDirectorio = (busqueda: string) =>
  useQuery({
    queryKey: ["comercial", "directorio", busqueda],
    queryFn: () => apiComercial.directorio(busqueda),
  });
