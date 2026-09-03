import { modoMock, solicitar } from "./transporte";
import { servidorMockClinico } from "./mock/servidorMock";
import { servidorCredenciales, servidorPrescripciones } from "./mock/servidorSensible";
import type { BorradorPrescripcion } from "../dispensacion/decreto2200";
import type { Autor } from "./mock/protocolo";
import type { EstadoCredencial, NivelVerificacion } from "./mock/datosClinicos";
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

  credenciales: (filtro: FiltroListado = {}) =>
    modoMock ? servidorCredenciales.credenciales(filtro) : sinContrato("las credenciales de paciente"),

  credencial: (id: string) =>
    modoMock ? servidorCredenciales.credencial(id) : sinContrato("la ficha de la credencial"),

  emitirCredencial: (entrada: {
    pacienteId: string;
    paciente: string;
    nivelVerificacion: NivelVerificacion;
    autor: Autor;
  }) =>
    modoMock
      ? servidorCredenciales.emitirCredencial(entrada)
      : sinContrato("la emisión de la credencial digital"),

  cambiarEstadoCredencial: (entrada: {
    id: string;
    estado: EstadoCredencial;
    motivo: string;
    autor: Autor;
  }) =>
    modoMock
      ? servidorCredenciales.cambiarEstadoCredencial(entrada)
      : sinContrato("el cambio de estado de la credencial"),

  rotarCodigo: (entrada: { id: string }) =>
    modoMock ? servidorCredenciales.rotarCodigo(entrada) : sinContrato("la rotación del código"),

  prescripciones: (filtro: FiltroListado = {}) =>
    modoMock ? servidorPrescripciones.prescripciones(filtro) : sinContrato("las prescripciones"),

  emitirPrescripcion: (entrada: BorradorPrescripcion & { autor: Autor }) =>
    modoMock
      ? servidorPrescripciones.emitirPrescripcion(entrada)
      : sinContrato("la emisión de la prescripción digital"),

  anularPrescripcion: (entrada: { id: string; motivo: string; autor: Autor }) =>
    modoMock
      ? servidorPrescripciones.anularPrescripcion(entrada)
      : sinContrato("la anulación de la prescripción"),
};
