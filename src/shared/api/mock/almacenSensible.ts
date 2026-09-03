import { CREDENCIALES, PRESCRIPCIONES } from "./datosClinicos";
import { ACTOS, CARGOS } from "./datosDispensacion";
import type { CredencialPaciente, Prescripcion } from "./datosClinicos";
import type { ActoDispensacion, CargoServicio, MetodoVerificacion, ResultadoVerificacion } from "./datosDispensacion";

export type IntentoVerificacion = {
  id: string;
  seudonimo: string | null;
  metodo: MetodoVerificacion;
  resultado: ResultadoVerificacion;
  puntoId: string;
  fecha: string;
};

const semilla = () => ({
  credenciales: [...CREDENCIALES] as CredencialPaciente[],
  prescripciones: [...PRESCRIPCIONES] as Prescripcion[],
  actos: [...ACTOS] as ActoDispensacion[],
  cargos: [...CARGOS] as CargoServicio[],
  verificaciones: [] as IntentoVerificacion[],
});

export const almacenSensible = semilla();

export const reiniciarAlmacenSensible = (): void => {
  Object.assign(almacenSensible, semilla());
};
