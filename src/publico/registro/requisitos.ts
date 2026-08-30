import { useQuery } from "@tanstack/react-query";
import { apiComercial } from "../../shared/api/clienteComercial";
import type { DocumentoRequeridoApi } from "../../shared/api/rest/contrato";
import type { TipoActor } from "../../shared/api/mock/tipos";

export type Requisito = DocumentoRequeridoApi;

const CONTRASTADOS_CONTRA_RUES: readonly string[] = ["RUT", "CAMARA_COMERCIO"];

export const seContrastaContraRues = (tipo: string): boolean =>
  CONTRASTADOS_CONTRA_RUES.includes(tipo);

export const useRequisitos = (tipoActor: TipoActor, habilitado = true) =>
  useQuery({
    queryKey: ["actores", "requisitos", tipoActor],
    queryFn: () => apiComercial.requisitosDeActor(tipoActor),
    enabled: habilitado,
    staleTime: 10 * 60_000,
  });

export const obligatoriosDe = (requisitos: readonly Requisito[]): readonly Requisito[] =>
  requisitos.filter((requisito) => requisito.obligatorio);
