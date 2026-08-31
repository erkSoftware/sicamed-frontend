import { crearAzar, enteroEntre, fechaRelativa, identificador } from "./aleatorio";
import { NOMBRES } from "./catalogos";
import { ATESTACIONES, CULTIVOS, LOTES, ORGANIZACIONES } from "./datos";
import { PLANTAS, POLITICA_VERIFICACION } from "./datosProceso";
import type {
  ActaDestruccion,
  Atestacion,
  CausalDestruccion,
  Conexion,
  CuentaUsuario,
  CupoMicc,
  Cultivo,
  Discrepancia,
  EstadoCuenta,
  Lote,
  Organizacion,
  Planta,
  RolPlataforma,
  SolicitudRegistro,
  Transformacion,
} from "./tipos";

const azar = crearAzar(20260828);

const huella = (): string => `0x${(azar() * 1e18).toString(16).replace(".", "").slice(0, 16)}`;

const ORGANIZACION_PLATAFORMA = "SICAMED · Administración de la plataforma";

const EQUIPO_PLATAFORMA: readonly Omit<CuentaUsuario, "id" | "creada" | "ultimoAcceso">[] = [
  {
    nombre: "Diego Fernando Marín",
    correo: "super.admin@sicamed.gov.co",
    rol: "SUPER_ADMIN",
    organizacionId: "ORG-0000",
    organizacion: ORGANIZACION_PLATAFORMA,
    estado: "ACTIVA",
    invitadaPor: "Instalación inicial",
    autenticacion: "OIDC",
  },
  {
    nombre: "Lida Almeciga",
    correo: "lida.almeciga@sicamed.gov.co",
    rol: "ANALISTA_DOCUMENTAL",
    organizacionId: "ORG-0000",
    organizacion: ORGANIZACION_PLATAFORMA,
    estado: "ACTIVA",
    invitadaPor: "Diego Fernando Marín",
    autenticacion: "OIDC",
  },
  {
    nombre: "Néstor Iván Quintero",
    correo: "nestor.quintero@sicamed.gov.co",
    rol: "ANALISTA_DOCUMENTAL",
    organizacionId: "ORG-0000",
    organizacion: ORGANIZACION_PLATAFORMA,
    estado: "ACTIVA",
    invitadaPor: "Diego Fernando Marín",
    autenticacion: "OIDC",
  },
  {
    nombre: "Claudia Liliana Pardo",
    correo: "claudia.pardo@sicamed.gov.co",
    rol: "ANALISTA_DOCUMENTAL",
    organizacionId: "ORG-0000",
    organizacion: ORGANIZACION_PLATAFORMA,
    estado: "SUSPENDIDA",
    invitadaPor: "Diego Fernando Marín",
    autenticacion: "OIDC",
  },
  {
    nombre: "Fabián Alberto Cruz",
    correo: "fabian.cruz@sicamed.gov.co",
    rol: "ANALISTA_DOCUMENTAL",
    organizacionId: "ORG-0000",
    organizacion: ORGANIZACION_PLATAFORMA,
    estado: "INVITADA",
    invitadaPor: "Diego Fernando Marín",
    autenticacion: "OIDC",
  },
  {
    nombre: "Andrés Beltrán",
    correo: "andres.beltran@mincit.gov.co",
    rol: "ADMIN_INSTITUCIONAL",
    organizacionId: "ORG-0001",
    organizacion: "Ministerio de Comercio, Industria y Turismo",
    estado: "ACTIVA",
    invitadaPor: "Diego Fernando Marín",
    autenticacion: "OIDC",
  },
  {
    nombre: "Paula Andrea Rincón",
    correo: "paula.rincon@mincit.gov.co",
    rol: "OBSERVADOR_INSTITUCIONAL",
    organizacionId: "ORG-0001",
    organizacion: "Ministerio de Comercio, Industria y Turismo",
    estado: "ACTIVA",
    invitadaPor: "Andrés Beltrán",
    autenticacion: "OIDC",
  },
];

const ROLES_ACTOR: readonly RolPlataforma[] = [
  "REPRESENTANTE_LEGAL",
  "OPERARIO_CAMPO",
  "OPERARIO_CAMPO",
];

const ESTADOS_CUENTA: readonly EstadoCuenta[] = [
  "ACTIVA",
  "ACTIVA",
  "ACTIVA",
  "ACTIVA",
  "INVITADA",
  "SUSPENDIDA",
  "INACTIVA",
];

const CUENTAS_DE_ACTORES: readonly CuentaUsuario[] = ORGANIZACIONES.slice(0, 34).flatMap(
  (organizacion, i) => {
    const cuantas = organizacion.tipo === "IPS" ? 2 : 1 + (i % 2);
    return Array.from({ length: cuantas }, (_, n) => {
      const indice = i * 3 + n;
      const esClinico = organizacion.tipo === "IPS" && n === 1;
      return {
        id: identificador("USR", indice + EQUIPO_PLATAFORMA.length),
        nombre:
          n === 0
            ? organizacion.representante
            : (NOMBRES[(indice * 5) % NOMBRES.length] ?? "Operario"),
        correo:
          n === 0
            ? organizacion.correo
            : `usuario${indice}@${organizacion.correo.split("@")[1] ?? "sicamed.co"}`,
        rol: esClinico
          ? ("EQUIPO_CLINICO" as RolPlataforma)
          : (ROLES_ACTOR[n % ROLES_ACTOR.length] ?? "OPERARIO_CAMPO"),
        organizacionId: organizacion.id,
        organizacion: organizacion.nombre,
        estado: ESTADOS_CUENTA[indice % ESTADOS_CUENTA.length] ?? "ACTIVA",
        creada: fechaRelativa(-enteroEntre(azar, 30, 900)),
        ultimoAcceso: indice % 7 === 3 ? null : fechaRelativa(-enteroEntre(azar, 0, 45)),
        invitadaPor: n === 0 ? "Lida Almeciga" : organizacion.representante,
        autenticacion: "OIDC" as const,
      };
    });
  },
);

export const CUENTAS: readonly CuentaUsuario[] = [
  ...EQUIPO_PLATAFORMA.map((cuenta, i) => ({
    ...cuenta,
    id: identificador("USR", i),
    creada: fechaRelativa(-enteroEntre(azar, 200, 1000)),
    ultimoAcceso: cuenta.estado === "INVITADA" ? null : fechaRelativa(-enteroEntre(azar, 0, 12)),
  })),
  ...CUENTAS_DE_ACTORES,
];

export const ETIQUETA_ROL: Record<RolPlataforma, string> = {
  SUPER_ADMIN: "Super administrador",
  ADMIN_INSTITUCIONAL: "Administrador institucional",
  ANALISTA_DOCUMENTAL: "Analista de cumplimiento",
  REPRESENTANTE_LEGAL: "Representante legal",
  OPERARIO_CAMPO: "Operario de campo",
  EQUIPO_CLINICO: "Equipo clínico",
  OBSERVADOR_INSTITUCIONAL: "Observador institucional",
};

export const ALCANCE_ROL: Record<RolPlataforma, string> = {
  SUPER_ADMIN:
    "Define la política de verificación, los roles y el SLA. No verifica expedientes: separación de funciones.",
  ADMIN_INSTITUCIONAL:
    "Resuelve el paso final del trámite y caracteriza la organización. Nunca su propio expediente.",
  ANALISTA_DOCUMENTAL:
    "Verifica completitud, legibilidad, integridad y correspondencia con el NIT declarado.",
  REPRESENTANTE_LEGAL:
    "Gestiona la organización, sus predios, su inventario y su oferta en la vitrina.",
  OPERARIO_CAMPO: "Registra labores, plantas y beneficio del predio al que está asignado.",
  EQUIPO_CLINICO: "Accede a la zona clínica. Frontera dura con la zona comercial.",
  OBSERVADOR_INSTITUCIONAL: "Consulta agregada de solo lectura sobre el ecosistema.",
};

const CUPOS_BASE = ATESTACIONES.filter(
  (atestacion) =>
    atestacion.tipo === "CULTIVO_PSICOACTIVO" || atestacion.tipo === "CULTIVO_NO_PSICOACTIVO",
).slice(0, 26);

export const CUPOS: readonly CupoMicc[] = CUPOS_BASE.map((atestacion: Atestacion, i) => {
  const sembradas = PLANTAS.filter(
    (planta) =>
      planta.organizacionId === atestacion.organizacionId &&
      planta.estado !== "COSECHADA" &&
      planta.estado !== "DESTRUIDA",
  ).length;
  const autorizadas = Math.max(sembradas + enteroEntre(azar, -40, 900), 120);
  const dias = [-30, 20, 95, 240, 400][i % 5] ?? 200;
  const ocupacion = autorizadas === 0 ? 1 : sembradas / autorizadas;
  return {
    id: identificador("CUP", i),
    organizacionId: atestacion.organizacionId,
    organizacion: atestacion.organizacion,
    modalidad: atestacion.tipo,
    actoAsignacion: `Cupo MICC ${enteroEntre(azar, 1000, 9999)} de 2026`,
    plantasAutorizadas: autorizadas,
    plantasSembradas: sembradas,
    vigencia: fechaRelativa(dias),
    estado:
      dias < 0
        ? "SIN_CUPO"
        : ocupacion >= 1
          ? "AGOTADO"
          : dias < 45 || ocupacion > 0.9
            ? "POR_VENCER"
            : "VIGENTE",
    conciliado: fechaRelativa(-enteroEntre(azar, 0, 3)),
    norma: "Dec. 1138/2025 Art. 3 · cupo asignado por el MICC",
  };
});

const FORMULAS = [
  {
    producto: "Aceite estandarizado CBD",
    formula: "Extracción CO₂ supercrítico · winterización · estandarización a 30 mg/mL",
    unidad: "L",
    rendimiento: 0.062,
  },
  {
    producto: "Extracto de espectro completo",
    formula: "Extracción etanólica en frío · descarboxilación controlada",
    unidad: "L",
    rendimiento: 0.085,
  },
  {
    producto: "Aceite estandarizado THC:CBD",
    formula: "Extracción CO₂ · mezcla 1:1 titulada · vehículo MCT",
    unidad: "L",
    rendimiento: 0.048,
  },
  {
    producto: "Fórmula magistral",
    formula: "Dilución magistral en preparación individualizada por prescripción",
    unidad: "unidades",
    rendimiento: 12.5,
  },
] as const;

const ESTADOS_TRANSFORMACION = ["LIBERADA", "LIBERADA", "EN_PROCESO", "RECHAZADA"] as const;

export const TRANSFORMACIONES: readonly Transformacion[] = Array.from({ length: 32 }, (_, i) => {
  const lote = LOTES[(i * 13) % LOTES.length] as Lote;
  const receta = FORMULAS[i % FORMULAS.length] ?? FORMULAS[0];
  const estado = ESTADOS_TRANSFORMACION[i % ESTADOS_TRANSFORMACION.length] ?? "LIBERADA";
  const entradaKg = Number((enteroEntre(azar, 40, 620) / 1).toFixed(1));
  const salida = Number((entradaKg * receta.rendimiento).toFixed(2));
  return {
    id: identificador("TRF", i),
    codigo: `T-2026-${String(200 + i)}`,
    organizacionId: lote.organizacionId,
    organizacion: lote.organizacion,
    departamento: lote.departamento,
    loteOrigen: lote.codigo,
    loteOrigenId: lote.id,
    producto: receta.producto,
    formula: receta.formula,
    entradaKg,
    salida,
    unidadSalida: receta.unidad,
    rendimiento: Number((receta.rendimiento * 100).toFixed(2)),
    registroInvima: estado === "LIBERADA" ? `INVIMA-M-${enteroEntre(azar, 100000, 999999)}` : null,
    estado,
    loteResultante: estado === "LIBERADA" ? `L-2026-${String(1400 + i * 2)}` : null,
    responsable: NOMBRES[(i * 7) % NOMBRES.length] ?? "Director técnico",
    fecha: fechaRelativa(-(6 + ((i * 11) % 200))),
    huella: huella(),
  };
});

const CAUSALES: readonly CausalDestruccion[] = [
  "PLAGA_NO_CONTROLABLE",
  "FUERA_DE_ESPECIFICACION",
  "VENCIMIENTO",
  "ORDEN_AUTORIDAD",
  "EXCEDENTE_DE_CUPO",
];

const METODOS = [
  "Incineración en horno autorizado con registro de temperatura",
  "Compostaje controlado con desnaturalización previa",
  "Trituración e inertización con cal viva",
  "Entrega a gestor autorizado de residuos peligrosos",
] as const;

const CARGOS_TESTIGO = [
  "Delegado del Fondo Nacional de Estupefacientes",
  "Inspector del ICA",
  "Auditor interno de calidad",
  "Delegado de la Secretaría de Salud departamental",
] as const;

export const DESTRUCCIONES: readonly ActaDestruccion[] = Array.from({ length: 24 }, (_, i) => {
  const esPlanta = i % 2 === 0;
  const planta = PLANTAS[(i * 17) % PLANTAS.length] as Planta;
  const lote = LOTES[(i * 19) % LOTES.length] as Lote;
  const organizacion =
    ORGANIZACIONES.find(
      (registro) => registro.id === (esPlanta ? planta.organizacionId : lote.organizacionId),
    ) ?? (ORGANIZACIONES[0] as Organizacion);
  return {
    id: identificador("ACD", i),
    acta: `ACD-2026-${String(80 + i * 3)}`,
    organizacionId: organizacion.id,
    organizacion: organizacion.nombre,
    departamento: organizacion.departamento,
    entidad: esPlanta ? "PLANTA" : "LOTE",
    entidadId: esPlanta ? planta.id : lote.id,
    referencia: esPlanta ? planta.codigo : lote.codigo,
    cantidad: esPlanta ? enteroEntre(azar, 1, 40) : enteroEntre(azar, 5, 220),
    unidad: esPlanta ? "plantas" : lote.unidad,
    causal: CAUSALES[i % CAUSALES.length] ?? "VENCIMIENTO",
    metodo: METODOS[i % METODOS.length] ?? METODOS[0],
    testigo: NOMBRES[(i * 3) % NOMBRES.length] ?? "Testigo designado",
    cargoTestigo: CARGOS_TESTIGO[i % CARGOS_TESTIGO.length] ?? CARGOS_TESTIGO[0],
    responsable: organizacion.representante,
    fecha: fechaRelativa(-(4 + ((i * 13) % 240))),
    norma: "Dec. 1138/2025 Art. 11 · disposición final de material vegetal",
    huella: huella(),
  };
});

const ESTADOS_SOLICITUD = ["RECIBIDA", "EN_TRAMITE", "APROBADA", "RECHAZADA"] as const;

export const SOLICITUDES: readonly SolicitudRegistro[] = Array.from({ length: 9 }, (_, i) => {
  const cultivo = CULTIVOS[(i * 23) % CULTIVOS.length] as Cultivo;
  const estado = ESTADOS_SOLICITUD[i % ESTADOS_SOLICITUD.length] ?? "RECIBIDA";
  return {
    id: identificador("SOL", i),
    nit: `${901500000 + i * 811}-${(i % 9) + 1}`,
    organizacion: `${["Agrícola Sumapaz", "Cannabis Andino", "Verde Pacífico", "Bioextractos del Sur", "Cultivos La Cumbre", "Fitomedicina Caribe", "Semillas del Valle", "Terapéuticos Andinos", "Aromas del Quindío"][i] ?? "Nueva organización"} S.A.S.`,
    tipoActor: (["CULTIVADOR", "TRANSFORMADOR", "DISPENSADOR", "LABORATORIO", "IPS"] as const)[i % 5] ?? "CULTIVADOR",
    departamento: cultivo.departamento,
    municipio: cultivo.municipio,
    representante: NOMBRES[(i * 11) % NOMBRES.length] ?? "Representante legal",
    correo: `registro${i + 1}@solicitante.co`,
    telefono: `+57 60${enteroEntre(azar, 1, 8)} ${enteroEntre(azar, 200, 899)} ${enteroEntre(azar, 1000, 9999)}`,
    estado,
    recibida: fechaRelativa(-(1 + i * 6)),
    expedienteId: estado === "RECIBIDA" ? null : identificador("EXP", i),
    motivoRechazo:
      estado === "RECHAZADA"
        ? "La licencia adjunta corresponde a otra modalidad y su vigencia expiró antes de radicar."
        : null,
    documentos: POLITICA_VERIFICACION.filter(
      (regla) =>
        regla.tipoActor ===
          ((["CULTIVADOR", "TRANSFORMADOR", "DISPENSADOR", "LABORATORIO", "IPS"] as const)[i % 5] ??
            "CULTIVADOR") && regla.obligatorio,
    ).map((regla, n) => ({
      tipo: regla.documento,
      soporteId: identificador("SOP", i * 10 + n),
    })),
    huella: huella(),
  };
});

const CAMPOS_DISCREPANCIA = [
  { campo: "Estado de matrícula mercantil", local: "Activa", externo: "Cancelada", sigla: "RUES" },
  { campo: "Modalidad de licencia", local: "Cultivo psicoactivo", externo: "Cultivo no psicoactivo", sigla: "MICC" },
  { campo: "Vigencia de la licencia", local: "2028-04-30", externo: "2027-04-30", sigla: "MICC" },
  { campo: "Registro sanitario del producto", local: "INVIMA-M-448210", externo: "Sin registro asociado", sigla: "INVIMA" },
  { campo: "Registro del predio", local: "ICA-PR-99120", externo: "ICA-PR-99121", sigla: "ICA" },
  { campo: "Representante legal", local: "Registrado en SICAMED", externo: "Cambio inscrito en cámara", sigla: "RUES" },
  { campo: "Cupo de plantas asignado", local: "12 000", externo: "9 500", sigla: "MICC" },
  { campo: "Variedad registrada", local: "Sativa Tolima 04", externo: "No inscrita en el registro", sigla: "ICA" },
];

const ESTADOS_DISCREPANCIA = ["ABIERTA", "ABIERTA", "RESUELTA_EXTERNO", "RESUELTA_LOCAL"] as const;

export const discrepanciasSemilla = (conexiones: readonly Conexion[]): readonly Discrepancia[] =>
  Array.from({ length: 21 }, (_, i) => {
    const plantilla = (CAMPOS_DISCREPANCIA[i % CAMPOS_DISCREPANCIA.length] ??
      CAMPOS_DISCREPANCIA[0]) as (typeof CAMPOS_DISCREPANCIA)[number];
    const conexion = conexiones.find((registro) => registro.sigla === plantilla.sigla);
    const organizacion = ORGANIZACIONES[(i * 7) % ORGANIZACIONES.length] as Organizacion;
    const estado = ESTADOS_DISCREPANCIA[i % ESTADOS_DISCREPANCIA.length] ?? "ABIERTA";
    const detectada = -(1 + ((i * 5) % 60));
    return {
      id: identificador("DSC", i),
      conexionId: conexion?.id ?? "CNX-0001",
      sigla: plantilla.sigla,
      organizacionId: organizacion.id,
      organizacion: organizacion.nombre,
      campo: plantilla.campo,
      valorLocal: plantilla.local,
      valorExterno: plantilla.externo,
      autoritativo: plantilla.sigla === "INVIMA" ? "LOCAL" : "EXTERNO",
      estado,
      detectada: fechaRelativa(detectada),
      resuelta: estado === "ABIERTA" ? null : fechaRelativa(detectada + 4),
      resueltaPor: estado === "ABIERTA" ? null : "Lida Almeciga",
    };
  });
