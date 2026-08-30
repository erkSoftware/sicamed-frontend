import type { CitaApi, PacienteApi, PacienteEnListaApi, ProfesionalApi } from "./contrato";
import type { Cita, EstadoTratamiento, Paciente } from "../mock/datosClinicos";
import type { Medico } from "../mock/tipos";

const ESTADO_PACIENTE: Record<PacienteEnListaApi["estado"], EstadoTratamiento> = {
  ACTIVO: "ACTIVO",
  INACTIVO: "SUSPENDIDO",
  EGRESADO: "ALTA",
};

export const aPacienteDeLista = (api: PacienteEnListaApi): Paciente => ({
  id: api.id,
  nombre: api.nombre,
  documento: "",
  edad: api.edad,
  sexo: "SIN_DATO",
  departamento: api.departamento,
  aseguradora: "",
  diagnostico: "",
  codigoDiagnostico: "",
  estado: ESTADO_PACIENTE[api.estado],
  ingreso: "",
  ultimaAtencion: "",
  medicoTratante: "",
});

export const aPaciente = (api: PacienteApi): Paciente => ({
  ...aPacienteDeLista(api),
  documento: api.documento,
  ingreso: api.registrado,
});

export const finalidadesVigentes = (api: PacienteApi): readonly string[] =>
  api.autorizaciones.filter((autorizacion) => autorizacion.vigente).map((a) => a.finalidad);

export const aCita = (api: CitaApi, nombrePaciente = "", nombreProfesional = ""): Cita => ({
  id: api.id,
  pacienteId: api.pacienteId,
  paciente: nombrePaciente === "" ? api.pacienteId : nombrePaciente,
  fecha: api.inicio,
  duracionMinutos: api.duracionMinutos,
  modalidad: api.modalidad,
  motivo: api.motivo,
  profesional: nombreProfesional === "" ? api.profesionalId : nombreProfesional,
  especialidad: "",
  estado: api.estado,
});

export const aProfesional = (api: ProfesionalApi): Medico => ({
  id: api.id,
  nombre: api.nombre,
  rethus: api.registro,
  especialidad: api.especialidad,
  ips: "",
  departamento: api.departamento,
  prescripciones: 0,
  estado: api.estado,
});
