import { crearAzar, enteroEntre, fechaRelativa, identificador } from "./aleatorio";
import { DEPARTAMENTOS, DIAGNOSTICOS, ESPECIALIDADES, NOMBRES } from "./catalogos";

const azar = crearAzar(19811012);

export type EstadoTratamiento = "ACTIVO" | "EN_TITULACION" | "SUSPENDIDO" | "ALTA";

export type Paciente = {
  id: string;
  nombre: string;
  documento: string;
  edad: number;
  sexo: "F" | "M";
  departamento: string;
  aseguradora: string;
  diagnostico: string;
  codigoDiagnostico: string;
  estado: EstadoTratamiento;
  ingreso: string;
  ultimaAtencion: string;
  medicoTratante: string;
};

export type EstadoCita = "PROGRAMADA" | "CONFIRMADA" | "ATENDIDA" | "CANCELADA" | "NO_ASISTIO";

export type Cita = {
  id: string;
  pacienteId: string;
  paciente: string;
  fecha: string;
  duracionMinutos: number;
  modalidad: "PRESENCIAL" | "TELECONSULTA";
  motivo: string;
  profesional: string;
  especialidad: string;
  estado: EstadoCita;
};

export type Prescripcion = {
  id: string;
  pacienteId: string;
  fecha: string;
  presentacion: string;
  concentracion: string;
  posologia: string;
  duracionDias: number;
  profesional: string;
  estado: "VIGENTE" | "DISPENSADA" | "VENCIDA";
};

export type NotaClinica = {
  id: string;
  pacienteId: string;
  fecha: string;
  profesional: string;
  tipo: "EVOLUCION" | "TELECONSULTA" | "TITULACION" | "EVENTO_ADVERSO";
  resumen: string;
};

const ASEGURADORAS = [
  "Nueva EPS",
  "Sanitas",
  "Sura",
  "Salud Total",
  "Compensar",
  "Coosalud",
  "Régimen especial",
] as const;

const PRESENTACIONES = [
  { presentacion: "Aceite full spectrum", concentracion: "CBD 30 mg/mL · THC 1 mg/mL" },
  { presentacion: "Aceite balanceado", concentracion: "CBD 10 mg/mL · THC 10 mg/mL" },
  { presentacion: "Fórmula magistral", concentracion: "CBD 50 mg/mL" },
  { presentacion: "Cápsula blanda", concentracion: "CBD 25 mg" },
  { presentacion: "Solución sublingual", concentracion: "THC 5 mg/mL" },
] as const;

const ocultarDocumento = (numero: number): string => `CC ••••${String(numero).slice(-4)}`;

export const PACIENTES: readonly Paciente[] = Array.from({ length: 38 }, (_, i) => {
  const diagnostico = DIAGNOSTICOS[i % DIAGNOSTICOS.length] ?? DIAGNOSTICOS[0];
  const departamento = DEPARTAMENTOS[i % DEPARTAMENTOS.length]?.nombre ?? "Cundinamarca";
  return {
    id: identificador("PAC", i),
    nombre: NOMBRES[(i * 5) % NOMBRES.length] ?? "Paciente",
    documento: ocultarDocumento(enteroEntre(azar, 10000000, 99999999)),
    edad: enteroEntre(azar, 6, 84),
    sexo: i % 2 === 0 ? "F" : "M",
    departamento,
    aseguradora: ASEGURADORAS[i % ASEGURADORAS.length] ?? "Nueva EPS",
    diagnostico: diagnostico.nombre,
    codigoDiagnostico: diagnostico.codigo,
    estado: (["ACTIVO", "ACTIVO", "EN_TITULACION", "SUSPENDIDO", "ALTA"] as const)[i % 5] ?? "ACTIVO",
    ingreso: fechaRelativa(-enteroEntre(azar, 30, 900)),
    ultimaAtencion: fechaRelativa(-enteroEntre(azar, 1, 60)),
    medicoTratante: `Dr. ${NOMBRES[(i * 7) % NOMBRES.length] ?? "Tratante"}`,
  };
});

const MOTIVOS = [
  "Control de titulación",
  "Primera valoración",
  "Ajuste de dosis",
  "Seguimiento de efectos adversos",
  "Renovación de fórmula",
  "Junta de dolor",
] as const;

export const CITAS: readonly Cita[] = Array.from({ length: 30 }, (_, i) => {
  const paciente = PACIENTES[i % PACIENTES.length] as Paciente;
  const dias = (i % 12) - 3;
  return {
    id: identificador("CIT", i),
    pacienteId: paciente.id,
    paciente: paciente.nombre,
    fecha: fechaRelativa(dias),
    duracionMinutos: [20, 30, 45][i % 3] ?? 30,
    modalidad: i % 3 === 0 ? "PRESENCIAL" : "TELECONSULTA",
    motivo: MOTIVOS[i % MOTIVOS.length] ?? "Control",
    profesional: paciente.medicoTratante,
    especialidad: ESPECIALIDADES[i % ESPECIALIDADES.length] ?? "Medicina del dolor",
    estado:
      dias < 0
        ? ((["ATENDIDA", "NO_ASISTIO", "ATENDIDA"] as const)[i % 3] ?? "ATENDIDA")
        : ((["PROGRAMADA", "CONFIRMADA"] as const)[i % 2] ?? "PROGRAMADA"),
  };
});

export const PRESCRIPCIONES: readonly Prescripcion[] = Array.from({ length: 26 }, (_, i) => {
  const paciente = PACIENTES[(i * 3) % PACIENTES.length] as Paciente;
  const formula = PRESENTACIONES[i % PRESENTACIONES.length] ?? PRESENTACIONES[0];
  return {
    id: identificador("PRE", i),
    pacienteId: paciente.id,
    fecha: fechaRelativa(-enteroEntre(azar, 2, 180)),
    presentacion: formula.presentacion,
    concentracion: formula.concentracion,
    posologia: `${enteroEntre(azar, 2, 12)} gotas cada ${[8, 12, 24][i % 3]} horas`,
    duracionDias: [30, 60, 90][i % 3] ?? 30,
    profesional: paciente.medicoTratante,
    estado: (["VIGENTE", "DISPENSADA", "VENCIDA"] as const)[i % 3] ?? "VIGENTE",
  };
});

const RESUMENES = [
  "Paciente refiere mejoría del dolor de 8/10 a 4/10 en escala visual análoga.",
  "Se inicia titulación ascendente con control de somnolencia diurna.",
  "Sin eventos adversos reportados en el último mes de tratamiento.",
  "Se ajusta posología nocturna por interferencia con la conducción.",
  "Se solicita concepto de junta médica para continuidad del tratamiento.",
] as const;

export const NOTAS: readonly NotaClinica[] = Array.from({ length: 34 }, (_, i) => {
  const paciente = PACIENTES[(i * 2) % PACIENTES.length] as Paciente;
  return {
    id: identificador("NOT", i),
    pacienteId: paciente.id,
    fecha: fechaRelativa(-enteroEntre(azar, 1, 240)),
    profesional: paciente.medicoTratante,
    tipo: (["EVOLUCION", "TELECONSULTA", "TITULACION", "EVENTO_ADVERSO"] as const)[i % 4] ?? "EVOLUCION",
    resumen: RESUMENES[i % RESUMENES.length] ?? RESUMENES[0],
  };
});

export const INDICADORES_CLINICOS = {
  pacientesActivos: PACIENTES.filter((p) => p.estado === "ACTIVO").length,
  citasHoy: CITAS.filter((c) => c.fecha.slice(0, 10) === fechaRelativa(0).slice(0, 10)).length,
  teleconsultasSemana: CITAS.filter((c) => c.modalidad === "TELECONSULTA").length,
  formulasVigentes: PRESCRIPCIONES.filter((p) => p.estado === "VIGENTE").length,
} as const;
