import { crearAzar, enteroEntre, fechaRelativa, identificador } from "./aleatorio";

const azar = crearAzar(20260901);

export type MetodoVerificacion = "CODIGO_ROTATORIO" | "DOCUMENTO" | "BIOMETRICO";

export type ResultadoVerificacion =
  | "VERIFICADA"
  | "CODIGO_VENCIDO"
  | "CREDENCIAL_SUSPENDIDA"
  | "NO_ENCONTRADA";

export type PuntoDispensacion = {
  id: string;
  nombre: string;
  organizacionId: string;
  municipio: string;
  departamento: string;
  licencia: string;
  vigenciaLicencia: string;
};

export type PrescripcionEnMostrador = {
  codigo: string;
  seudonimo: string;
  denominacionComun: string;
  concentracion: string;
  formaFarmaceutica: string;
  viaAdministracion: string;
  unidadFarmaceutica: string;
  cantidadTotal: number;
  cantidadEnLetras: string;
  entregadas: number;
  saldo: number;
  vigenciaHasta: string;
  fiscalizado: boolean;
  ventanaRecompraDias: number;
  ultimaEntrega: string | null;
  diasParaHabilitar: number;
};

export type ActoDispensacion = {
  id: string;
  codigo: string;
  seudonimo: string;
  prescripcionCodigo: string;
  denominacionComun: string;
  unidades: number;
  unidadFarmaceutica: string;
  metodo: MetodoVerificacion;
  puntoId: string;
  punto: string;
  municipio: string;
  operador: string;
  fecha: string;
  eventoId: string;
  fiscalizado: boolean;
};

export type FlujoCargo = "B2B_VERIFICACION" | "B2C_CREDENCIAL";

export type EstadoCargo = "DEVENGADO" | "LIQUIDADO" | "CONCILIADO";

export type CargoServicio = {
  id: string;
  flujo: FlujoCargo;
  contraparteId: string;
  contraparte: string;
  concepto: string;
  unidades: number;
  valorUnitario: number;
  periodo: string;
  estado: EstadoCargo;
  origen: "ACTO_DISPENSACION" | "EMISION_CREDENCIAL";
  origenId: string;
  eventoId: string | null;
  fecha: string;
};

export const VALOR_VERIFICACION_B2B = 2400;

export const VALOR_CREDENCIAL_B2C = 38000;

export const PUNTOS: readonly PuntoDispensacion[] = [
  {
    id: "PDD-0001",
    nombre: "Droguería Vida Verde · sede Chapinero",
    organizacionId: "ORG-0004",
    municipio: "Bogotá D.C.",
    departamento: "Cundinamarca",
    licencia: "FNE-DISP-2026-0412",
    vigenciaLicencia: fechaRelativa(240),
  },
  {
    id: "PDD-0002",
    nombre: "Farmacia Andina · sede Poblado",
    organizacionId: "ORG-0006",
    municipio: "Medellín",
    departamento: "Antioquia",
    licencia: "FNE-DISP-2026-0518",
    vigenciaLicencia: fechaRelativa(180),
  },
  {
    id: "PDD-0003",
    nombre: "Dispensario Pacífico · sede Norte",
    organizacionId: "ORG-0009",
    municipio: "Cali",
    departamento: "Valle del Cauca",
    licencia: "FNE-DISP-2026-0623",
    vigenciaLicencia: fechaRelativa(95),
  },
];

const OPERADORES = [
  "Marcela Ruiz · regente",
  "Julián Ortega · químico farmacéutico",
  "Nury Castaño · regente",
  "Andrés Peña · director técnico",
] as const;

const FORMULAS_ENTREGADAS = [
  { denominacionComun: "Cannabidiol", unidadFarmaceutica: "frascos de 30 mL", fiscalizado: false },
  { denominacionComun: "Cannabidiol con tetrahidrocannabinol", unidadFarmaceutica: "frascos de 30 mL", fiscalizado: true },
  { denominacionComun: "Cannabidiol", unidadFarmaceutica: "cápsulas", fiscalizado: false },
  { denominacionComun: "Tetrahidrocannabinol", unidadFarmaceutica: "frascos de 10 mL", fiscalizado: true },
] as const;

const SEUDONIMOS_SEMILLA = [
  "SEU-M4TK-9PQZ",
  "SEU-B7XR-2LNH",
  "SEU-K9WD-5TCV",
  "SEU-Q2FJ-8RSM",
  "SEU-Z5HN-3BKP",
  "SEU-T8VC-6MDQ",
] as const;

export const ACTOS: readonly ActoDispensacion[] = Array.from({ length: 42 }, (_, i) => {
  const punto = PUNTOS[i % PUNTOS.length] as PuntoDispensacion;
  const formula = FORMULAS_ENTREGADAS[i % FORMULAS_ENTREGADAS.length] ?? FORMULAS_ENTREGADAS[0];
  return {
    id: identificador("ACT", i),
    codigo: `DIS-2026-${String(3200 + i)}`,
    seudonimo: SEUDONIMOS_SEMILLA[i % SEUDONIMOS_SEMILLA.length] ?? "SEU-M4TK-9PQZ",
    prescripcionCodigo: `RX-2026-${String(7100 + (i % 26))}`,
    denominacionComun: formula.denominacionComun,
    unidades: enteroEntre(azar, 1, 3),
    unidadFarmaceutica: formula.unidadFarmaceutica,
    metodo: (["CODIGO_ROTATORIO", "CODIGO_ROTATORIO", "DOCUMENTO", "BIOMETRICO"] as const)[i % 4] ?? "CODIGO_ROTATORIO",
    puntoId: punto.id,
    punto: punto.nombre,
    municipio: punto.municipio,
    operador: OPERADORES[i % OPERADORES.length] ?? OPERADORES[0],
    fecha: fechaRelativa(-enteroEntre(azar, 1, 75)),
    eventoId: `EVT-SEED-${String(i + 1).padStart(4, "0")}`,
    fiscalizado: formula.fiscalizado,
  };
});

const periodoDe = (iso: string): string => iso.slice(0, 7);

export const CARGOS: readonly CargoServicio[] = [
  ...ACTOS.map((acto, i) => ({
    id: identificador("CRG", i),
    flujo: "B2B_VERIFICACION" as FlujoCargo,
    contraparteId: acto.puntoId,
    contraparte: acto.punto,
    concepto: "Verificación de credencial y sellado del acto de dispensación",
    unidades: 1,
    valorUnitario: VALOR_VERIFICACION_B2B,
    periodo: periodoDe(acto.fecha),
    estado: (["DEVENGADO", "LIQUIDADO", "CONCILIADO"] as const)[i % 3] ?? "DEVENGADO",
    origen: "ACTO_DISPENSACION" as const,
    origenId: acto.id,
    eventoId: acto.eventoId,
    fecha: acto.fecha,
  })),
  ...Array.from({ length: 18 }, (_, i) => ({
    id: identificador("CRG", ACTOS.length + i),
    flujo: "B2C_CREDENCIAL" as FlujoCargo,
    contraparteId: identificador("CRE", i),
    contraparte: SEUDONIMOS_SEMILLA[i % SEUDONIMOS_SEMILLA.length] ?? "SEU-M4TK-9PQZ",
    concepto: "Emisión anual de la credencial digital del paciente",
    unidades: 1,
    valorUnitario: VALOR_CREDENCIAL_B2C,
    periodo: periodoDe(fechaRelativa(-enteroEntre(azar, 1, 120))),
    estado: (["LIQUIDADO", "CONCILIADO", "DEVENGADO"] as const)[i % 3] ?? "LIQUIDADO",
    origen: "EMISION_CREDENCIAL" as const,
    origenId: identificador("CRE", i),
    eventoId: null,
    fecha: fechaRelativa(-enteroEntre(azar, 1, 120)),
  })),
];
