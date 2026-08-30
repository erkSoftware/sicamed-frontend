import { modoMock, solicitar } from "./transporte";
import { servidorMockClinico } from "./mock/servidorMock";
import type { FiltroListado } from "./mock/servidorMock";
import type { CitaApi, PacienteApi, PacienteEnListaApi, PaginaApi } from "./rest/contrato";
import { aCita, aPaciente, aPacienteDeLista } from "./rest/mapeadoresClinicos";
import { aParametrosDeListado, mapearPagina } from "./rest/paginacion";
import { sinContrato } from "./rest/peticiones";
import type { Cita, Paciente, Prescripcion, NotaClinica } from "./mock/datosClinicos";

export type DetallePaciente = {
  paciente: Paciente;
  citas: readonly Cita[];
  prescripciones: readonly Prescripcion[];
  notas: readonly NotaClinica[];
};

const FINALIDAD_DE_LECTURA = "ATENCION_ASISTENCIAL";

export const apiClinica = {
  indicadores: () =>
    modoMock ? servidorMockClinico.indicadores() : sinContrato("los indicadores clínicos"),

  pacientes: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMockClinico.pacientes(filtro)
      : solicitar<PaginaApi<PacienteEnListaApi>>("clinico", "/pacientes", {
          parametros: aParametrosDeListado({ ...filtro, tipo: undefined }),
        }).then((sobre) => mapearPagina(sobre, aPacienteDeLista)),

  paciente: (id: string): Promise<DetallePaciente> =>
    modoMock
      ? servidorMockClinico.paciente(id)
      : Promise.all([
          solicitar<PacienteApi>("clinico", `/pacientes/${id}`, {
            parametros: { finalidad: FINALIDAD_DE_LECTURA },
          }),
          solicitar<readonly CitaApi[]>("clinico", "/agenda", { parametros: { pacienteId: id } }),
        ]).then(([paciente, citas]) => ({
          paciente: aPaciente(paciente),
          citas: citas.map((cita) => aCita(cita, paciente.nombre)),
          prescripciones: [],
          notas: [],
        })),

  agenda: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMockClinico.agenda(filtro)
      : solicitar<readonly CitaApi[]>("clinico", "/agenda", {
          parametros: { estado: filtro.estado, tipo: filtro.tipo },
        }).then((citas) => citas.map((cita) => aCita(cita))),

  teleconsultas: () =>
    modoMock
      ? servidorMockClinico.teleconsultas()
      : solicitar<readonly CitaApi[]>("clinico", "/teleconsultas").then((citas) =>
          citas.map((cita) => aCita(cita)),
        ),
};
