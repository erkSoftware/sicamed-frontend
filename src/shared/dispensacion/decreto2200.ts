import { CAMPOS_DECRETO_2200 } from "../api/mock/datosClinicos";
import type { TipoUsuario } from "../api/mock/datosClinicos";
import type { ErrorDeCampo } from "../api/problemDetails";

export const NORMA_DECRETO_2200 = "Dec. 2200 de 2005 Art. 17";

export type BorradorPrescripcion = {
  pacienteId: string;
  paciente: string;
  documento: string;
  historiaClinica: string;
  tipoUsuario: TipoUsuario;
  prestador: string;
  prestadorDireccion: string;
  prestadorContacto: string;
  lugar: string;
  denominacionComun: string;
  presentacion: string;
  concentracion: string;
  formaFarmaceutica: string;
  viaAdministracion: string;
  posologia: string;
  duracionDias: number;
  cantidadTotal: number;
  unidadFarmaceutica: string;
  indicaciones: string;
  vigenciaHasta: string;
  profesional: string;
  registroProfesional: string;
  fiscalizado: boolean;
};

const OBLIGATORIOS: readonly (keyof BorradorPrescripcion)[] = [
  "pacienteId",
  "paciente",
  "documento",
  "historiaClinica",
  "tipoUsuario",
  "prestador",
  "prestadorDireccion",
  "prestadorContacto",
  "lugar",
  "denominacionComun",
  "concentracion",
  "formaFarmaceutica",
  "viaAdministracion",
  "posologia",
  "duracionDias",
  "cantidadTotal",
  "unidadFarmaceutica",
  "indicaciones",
  "vigenciaHasta",
  "profesional",
  "registroProfesional",
];

const ROTULO_DE_CAMPO = new Map(
  CAMPOS_DECRETO_2200.flatMap((campo) =>
    campo.claves.map((clave) => [clave as string, `${campo.numeral}. ${campo.rotulo}`] as const),
  ),
);

const vacio = (valor: unknown): boolean => {
  if (typeof valor === "number") return !Number.isFinite(valor) || valor <= 0;
  return typeof valor !== "string" || valor.trim().length === 0;
};

export const camposFaltantes = (
  borrador: Partial<BorradorPrescripcion>,
): readonly ErrorDeCampo[] =>
  OBLIGATORIOS.filter((clave) => vacio(borrador[clave])).map((clave) => ({
    campo: clave as string,
    motivo: `Campo obligatorio del ${NORMA_DECRETO_2200}: ${ROTULO_DE_CAMPO.get(clave as string) ?? clave}`,
  }));

export const numeralesCompletos = (borrador: Partial<BorradorPrescripcion>): readonly number[] =>
  CAMPOS_DECRETO_2200.filter((campo) =>
    campo.claves.every((clave) => {
      if (clave === "fecha" || clave === "firma") return true;
      return !vacio(borrador[clave as keyof BorradorPrescripcion]);
    }),
  ).map((campo) => campo.numeral);
