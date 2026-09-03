import { crearAzar, enteroEntre, fechaRelativa, identificador } from "./aleatorio";
import { DEPARTAMENTOS, DIAGNOSTICOS, ESPECIALIDADES, NOMBRES } from "./catalogos";
import { enLetras } from "../../i18n/letras";
import { seudonimoDe } from "../../privacidad/seudonimo";

const azar = crearAzar(19811012);

export type EstadoTratamiento = "ACTIVO" | "EN_TITULACION" | "SUSPENDIDO" | "ALTA";

export type Paciente = {
  id: string;
  nombre: string;
  documento: string;
  edad: number;
  sexo: "F" | "M" | "SIN_DATO";
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

export type EstadoPrescripcion =
  | "EMITIDA"
  | "VIGENTE"
  | "DISPENSADA_PARCIAL"
  | "DISPENSADA"
  | "ANULADA"
  | "VENCIDA";

export type TipoUsuario = "CONTRIBUTIVO" | "SUBSIDIADO" | "PARTICULAR" | "REGIMEN_ESPECIAL";

export type Prescripcion = {
  id: string;
  codigo: string;
  pacienteId: string;
  seudonimo: string;
  prestador: string;
  prestadorDireccion: string;
  prestadorContacto: string;
  lugar: string;
  fecha: string;
  paciente: string;
  documento: string;
  historiaClinica: string;
  tipoUsuario: TipoUsuario;
  denominacionComun: string;
  presentacion: string;
  concentracion: string;
  formaFarmaceutica: string;
  viaAdministracion: string;
  posologia: string;
  duracionDias: number;
  cantidadTotal: number;
  cantidadEnLetras: string;
  unidadFarmaceutica: string;
  indicaciones: string;
  vigenciaHasta: string;
  profesional: string;
  registroProfesional: string;
  firma: string;
  fiscalizado: boolean;
  estado: EstadoPrescripcion;
  entregadas: number;
  ventanaRecompraDias: number;
  ultimaEntrega: string | null;
  motivoAnulacion: string | null;
};

export type CampoDecreto2200 = {
  numeral: number;
  rotulo: string;
  claves: readonly (keyof Prescripcion)[];
};

export const CAMPOS_DECRETO_2200: readonly CampoDecreto2200[] = [
  { numeral: 1, rotulo: "Prestador que prescribe, con dirección y contacto", claves: ["prestador", "prestadorDireccion", "prestadorContacto"] },
  { numeral: 2, rotulo: "Lugar y fecha de la prescripción", claves: ["lugar", "fecha"] },
  { numeral: 3, rotulo: "Nombre del paciente y documento de identificación", claves: ["paciente", "documento"] },
  { numeral: 4, rotulo: "Número de la historia clínica", claves: ["historiaClinica"] },
  { numeral: 5, rotulo: "Tipo de usuario", claves: ["tipoUsuario"] },
  { numeral: 6, rotulo: "Medicamento en denominación común internacional", claves: ["denominacionComun"] },
  { numeral: 7, rotulo: "Concentración y forma farmacéutica", claves: ["concentracion", "formaFarmaceutica"] },
  { numeral: 8, rotulo: "Vía de administración", claves: ["viaAdministracion"] },
  { numeral: 9, rotulo: "Dosis y frecuencia de administración", claves: ["posologia"] },
  { numeral: 10, rotulo: "Período de duración del tratamiento", claves: ["duracionDias"] },
  { numeral: 11, rotulo: "Cantidad total en números y letras", claves: ["cantidadTotal", "cantidadEnLetras"] },
  { numeral: 12, rotulo: "Indicaciones del prescriptor", claves: ["indicaciones"] },
  { numeral: 13, rotulo: "Vigencia de la prescripción", claves: ["vigenciaHasta"] },
  { numeral: 14, rotulo: "Nombre, firma y registro profesional del prescriptor", claves: ["profesional", "firma", "registroProfesional"] },
];

export type NivelVerificacion = "DOCUMENTO" | "PRESENCIAL" | "BIOMETRICO";

export type EstadoCredencial = "ACTIVA" | "SUSPENDIDA" | "VENCIDA" | "REVOCADA";

export type CredencialPaciente = {
  id: string;
  pacienteId: string;
  paciente: string;
  seudonimo: string;
  estado: EstadoCredencial;
  nivelVerificacion: NivelVerificacion;
  emitida: string;
  vence: string;
  codigoRotatorio: string;
  ultimaRotacion: string;
  entregasEnVentana: number;
  motivo: string | null;
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
  {
    presentacion: "Aceite full spectrum",
    concentracion: "CBD 30 mg/mL · THC 1 mg/mL",
    denominacionComun: "Cannabidiol con tetrahidrocannabinol",
    formaFarmaceutica: "Solución oral en aceite",
    viaAdministracion: "Oral",
    unidadFarmaceutica: "frascos de 30 mL",
    fiscalizado: false,
  },
  {
    presentacion: "Aceite balanceado",
    concentracion: "CBD 10 mg/mL · THC 10 mg/mL",
    denominacionComun: "Cannabidiol con tetrahidrocannabinol",
    formaFarmaceutica: "Solución oral en aceite",
    viaAdministracion: "Oral",
    unidadFarmaceutica: "frascos de 30 mL",
    fiscalizado: true,
  },
  {
    presentacion: "Fórmula magistral",
    concentracion: "CBD 50 mg/mL",
    denominacionComun: "Cannabidiol",
    formaFarmaceutica: "Preparación magistral líquida",
    viaAdministracion: "Sublingual",
    unidadFarmaceutica: "frascos de 15 mL",
    fiscalizado: false,
  },
  {
    presentacion: "Cápsula blanda",
    concentracion: "CBD 25 mg",
    denominacionComun: "Cannabidiol",
    formaFarmaceutica: "Cápsula blanda",
    viaAdministracion: "Oral",
    unidadFarmaceutica: "cápsulas",
    fiscalizado: false,
  },
  {
    presentacion: "Solución sublingual",
    concentracion: "THC 5 mg/mL",
    denominacionComun: "Tetrahidrocannabinol",
    formaFarmaceutica: "Solución sublingual",
    viaAdministracion: "Sublingual",
    unidadFarmaceutica: "frascos de 10 mL",
    fiscalizado: true,
  },
] as const;

const PRESTADORES = [
  {
    nombre: "IPS Cannabis Medicinal del Valle",
    direccion: "Calle 5 # 38-25, Cali",
    contacto: "(602) 558 4400 · formulacion@ipscannabisvalle.co",
  },
  {
    nombre: "Centro del Dolor Los Andes",
    direccion: "Carrera 15 # 88-64, Bogotá",
    contacto: "(601) 742 1180 · prescripcion@losandes.health",
  },
  {
    nombre: "Unidad de Cuidado Paliativo Antioquia",
    direccion: "Carrera 48 # 20-114, Medellín",
    contacto: "(604) 444 9010 · formulas@ucpantioquia.co",
  },
] as const;

const INDICACIONES = [
  "Administrar con alimentos. Suspender y consultar ante somnolencia marcada.",
  "Iniciar con la dosis nocturna y titular cada cinco días según tolerancia.",
  "No conducir ni operar maquinaria durante las cuatro horas siguientes a la toma.",
  "Conservar entre 15 y 25 °C, protegido de la luz. No refrigerar.",
] as const;

const TIPOS_USUARIO = ["CONTRIBUTIVO", "SUBSIDIADO", "PARTICULAR", "REGIMEN_ESPECIAL"] as const;

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

const ESTADOS_PRESCRIPCION = [
  "VIGENTE",
  "VIGENTE",
  "DISPENSADA_PARCIAL",
  "DISPENSADA",
  "VENCIDA",
  "EMITIDA",
] as const;

export const PRESCRIPCIONES: readonly Prescripcion[] = Array.from({ length: 26 }, (_, i) => {
  const paciente = PACIENTES[(i * 3) % PACIENTES.length] as Paciente;
  const formula = PRESENTACIONES[i % PRESENTACIONES.length] ?? PRESENTACIONES[0];
  const prestador = PRESTADORES[i % PRESTADORES.length] ?? PRESTADORES[0];
  const emision = fechaRelativa(-enteroEntre(azar, 2, 180));
  const duracionDias = [30, 60, 90][i % 3] ?? 30;
  const cantidadTotal = formula.unidadFarmaceutica === "cápsulas" ? duracionDias * 2 : Math.ceil(duracionDias / 30);
  const estado = ESTADOS_PRESCRIPCION[i % ESTADOS_PRESCRIPCION.length] ?? "VIGENTE";
  const entregadas =
    estado === "DISPENSADA" ? cantidadTotal : estado === "DISPENSADA_PARCIAL" ? Math.max(1, Math.floor(cantidadTotal / 2)) : 0;
  return {
    id: identificador("PRE", i),
    codigo: `RX-2026-${String(7100 + i)}`,
    pacienteId: paciente.id,
    seudonimo: seudonimoDe(paciente.id),
    prestador: prestador.nombre,
    prestadorDireccion: prestador.direccion,
    prestadorContacto: prestador.contacto,
    lugar: paciente.departamento,
    fecha: emision,
    paciente: paciente.nombre,
    documento: paciente.documento,
    historiaClinica: `HC-${paciente.id.slice(-4)}-${2020 + (i % 6)}`,
    tipoUsuario: TIPOS_USUARIO[i % TIPOS_USUARIO.length] ?? "CONTRIBUTIVO",
    denominacionComun: formula.denominacionComun,
    presentacion: formula.presentacion,
    concentracion: formula.concentracion,
    formaFarmaceutica: formula.formaFarmaceutica,
    viaAdministracion: formula.viaAdministracion,
    posologia: `${enteroEntre(azar, 2, 12)} gotas cada ${[8, 12, 24][i % 3]} horas`,
    duracionDias,
    cantidadTotal,
    cantidadEnLetras: enLetras(cantidadTotal),
    unidadFarmaceutica: formula.unidadFarmaceutica,
    indicaciones: INDICACIONES[i % INDICACIONES.length] ?? INDICACIONES[0],
    vigenciaHasta: fechaRelativa(duracionDias - enteroEntre(azar, 0, 40)),
    profesional: paciente.medicoTratante,
    registroProfesional: `RM ${enteroEntre(azar, 30000, 99999)}`,
    firma: `${paciente.medicoTratante} · firma electrónica verificada`,
    fiscalizado: formula.fiscalizado,
    estado,
    entregadas,
    ventanaRecompraDias: formula.fiscalizado ? 25 : 15,
    ultimaEntrega: entregadas > 0 ? fechaRelativa(-enteroEntre(azar, 1, 40)) : null,
    motivoAnulacion: null,
  };
});

const NIVELES_VERIFICACION = ["DOCUMENTO", "PRESENCIAL", "PRESENCIAL", "BIOMETRICO"] as const;

const ESTADOS_CREDENCIAL = ["ACTIVA", "ACTIVA", "ACTIVA", "SUSPENDIDA", "VENCIDA"] as const;

const MOTIVOS_CREDENCIAL: Readonly<Record<string, string>> = {
  SUSPENDIDA: "Suspendida a solicitud del médico tratante mientras se revisa la titulación.",
  VENCIDA: "Venció el período anual sin renovación de la verificación de identidad.",
  REVOCADA: "Revocada por reporte de suplantación en el punto de dispensación.",
};

const codigoRotatorio = (semilla: number): string => {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let valor = (semilla * 2654435761) >>> 0;
  let salida = "";
  for (let i = 0; i < 8; i += 1) {
    if (i === 4) salida += "-";
    salida += alfabeto[valor % alfabeto.length] ?? "A";
    valor = Math.floor(valor / alfabeto.length) + 7919;
  }
  return salida;
};

export const CREDENCIALES: readonly CredencialPaciente[] = PACIENTES.slice(0, 24).map((paciente, i) => {
  const estado = ESTADOS_CREDENCIAL[i % ESTADOS_CREDENCIAL.length] ?? "ACTIVA";
  return {
    id: identificador("CRE", i),
    pacienteId: paciente.id,
    paciente: paciente.nombre,
    seudonimo: seudonimoDe(paciente.id),
    estado,
    nivelVerificacion: NIVELES_VERIFICACION[i % NIVELES_VERIFICACION.length] ?? "DOCUMENTO",
    emitida: fechaRelativa(-enteroEntre(azar, 40, 700)),
    vence: fechaRelativa(estado === "VENCIDA" ? -enteroEntre(azar, 5, 90) : enteroEntre(azar, 20, 330)),
    codigoRotatorio: codigoRotatorio(i + 31),
    ultimaRotacion: fechaRelativa(0),
    entregasEnVentana: i % 4 === 0 ? 1 : 0,
    motivo: MOTIVOS_CREDENCIAL[estado] ?? null,
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
  credencialesActivas: CREDENCIALES.filter((c) => c.estado === "ACTIVA").length,
} as const;
