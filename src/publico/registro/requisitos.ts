import { NOMBRE_DOCUMENTO, POLITICA_VERIFICACION } from "../../shared/api/mock/datosProceso";
import type { TipoActor, TipoDocumento } from "../../shared/api/mock/tipos";

export type Requisito = {
  documento: TipoDocumento;
  nombre: string;
  obligatorio: boolean;
  automatico: boolean;
  norma: string;
  vigenciaMeses: number | null;
};

export const requisitosDe = (tipoActor: TipoActor): readonly Requisito[] =>
  POLITICA_VERIFICACION.filter((regla) => regla.tipoActor === tipoActor).map((regla) => ({
    documento: regla.documento,
    nombre: NOMBRE_DOCUMENTO[regla.documento],
    obligatorio: regla.obligatorio,
    automatico: regla.modo === "AUTOMATICO",
    norma: regla.norma,
    vigenciaMeses: regla.vigenciaMeses,
  }));

export const porAportar = (tipoActor: TipoActor): readonly Requisito[] =>
  requisitosDe(tipoActor).filter((requisito) => !requisito.automatico);

export const consultadosSolos = (tipoActor: TipoActor): readonly Requisito[] =>
  requisitosDe(tipoActor).filter((requisito) => requisito.automatico);

export const vigenciaLegible = (meses: number | null): string | null => {
  if (meses === null) return null;
  if (meses < 12) return `Vigencia ${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = meses / 12;
  return `Vigencia ${Number.isInteger(anios) ? anios : anios.toFixed(1)} ${anios === 1 ? "año" : "años"}`;
};
