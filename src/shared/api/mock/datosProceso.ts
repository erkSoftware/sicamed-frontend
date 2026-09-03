import { crearAzar, enteroEntre, fechaRelativa, identificador } from "./aleatorio";
import { NOMBRES, VARIEDADES } from "./catalogos";
import { CULTIVOS, MANIFESTACIONES, OFERTAS_PUBLICAS, ORGANIZACIONES } from "./datos";
import { PASOS_DE_LA_POLITICA } from "./pasosDeVerificacion";
import type {
  Agroinsumo,
  Beneficio,
  CierreExterno,
  Conexion,
  Cultivo,
  DocumentoExpediente,
  Expediente,
  Labor,
  LecturaAmbiente,
  Oferta,
  Organizacion,
  PasoVerificacion,
  Planta,
  ReglaVerificacion,
  TipoCannabis,
  TipoDocumento,
  Variedad,
  VeredictoPaso,
  ViaCierre,
} from "./tipos";

const azar = crearAzar(20260827);

const huella = (): string => `0x${(azar() * 1e18).toString(16).replace(".", "").slice(0, 16)}`;

const PERFIL_VARIEDAD: Record<string, { tipo: TipoCannabis; thc: number; cbd: number }> = {
  "Charlotte's Angel": { tipo: "NO_PSICOACTIVO", thc: 0.6, cbd: 15.4 },
  "ACDC Colombia": { tipo: "NO_PSICOACTIVO", thc: 0.8, cbd: 17.1 },
  "Cannatonic CO": { tipo: "NO_PSICOACTIVO", thc: 0.9, cbd: 12.8 },
  "Harlequin Andina": { tipo: "PSICOACTIVO", thc: 5.4, cbd: 9.2 },
  "Sativa Tolima 04": { tipo: "PSICOACTIVO", thc: 16.7, cbd: 1.1 },
  "Índica Cauca 11": { tipo: "PSICOACTIVO", thc: 19.2, cbd: 0.7 },
  "Ruderalis Alt-2600": { tipo: "NO_PSICOACTIVO", thc: 0.4, cbd: 6.3 },
};

const PROCEDENCIAS = [
  "Banco de germoplasma propio",
  "Importación autorizada · Países Bajos",
  "Obtentor nacional registrado",
  "Selección campesina caracterizada",
] as const;

const CATALOGO_VARIEDADES: readonly Omit<Variedad, "plantasVivas">[] = VARIEDADES.map((nombre, i) => {
  const perfil = PERFIL_VARIEDAD[nombre] ?? { tipo: "NO_PSICOACTIVO" as TipoCannabis, thc: 0.5, cbd: 8 };
  return {
    id: identificador("VAR", i),
    nombre,
    tipo: perfil.tipo,
    thc: perfil.thc,
    cbd: perfil.cbd,
    registroIca: `ICA-SEM-${2400 + i * 17}`,
    procedencia: PROCEDENCIAS[i % PROCEDENCIAS.length] ?? PROCEDENCIAS[0],
  };
});

export const AGROINSUMOS: readonly Agroinsumo[] = [
  { id: "AGI-0001", nombre: "Bioestimulante radicular Raizal", categoria: "BIOLOGICO", registroIca: "ICA-8841", ingrediente: "Trichoderma harzianum", carenciaDias: 0 },
  { id: "AGI-0002", nombre: "Fertilizante foliar Nutrimax K", categoria: "FERTILIZANTE", registroIca: "ICA-7712", ingrediente: "Potasio soluble 30%", carenciaDias: 3 },
  { id: "AGI-0003", nombre: "Fungicida Azufron WG", categoria: "FITOSANITARIO", registroIca: "ICA-6204", ingrediente: "Azufre 80%", carenciaDias: 14 },
  { id: "AGI-0004", nombre: "Insecticida botánico Neemcol", categoria: "FITOSANITARIO", registroIca: "ICA-9130", ingrediente: "Azadiractina 1.2%", carenciaDias: 7 },
  { id: "AGI-0005", nombre: "Sustrato certificado Fibra Andina", categoria: "SUSTRATO", registroIca: "ICA-5507", ingrediente: "Fibra de coco lavada", carenciaDias: 0 },
  { id: "AGI-0006", nombre: "Control biológico Beauvicol", categoria: "BIOLOGICO", registroIca: "ICA-8377", ingrediente: "Beauveria bassiana", carenciaDias: 1 },
  { id: "AGI-0007", nombre: "Corrector de calcio Calmag Plus", categoria: "FERTILIZANTE", registroIca: "ICA-7045", ingrediente: "Calcio 12% · Magnesio 4%", carenciaDias: 2 },
  { id: "AGI-0008", nombre: "Acaricida Abamec 1.8", categoria: "FITOSANITARIO", registroIca: "ICA-6688", ingrediente: "Abamectina 1.8%", carenciaDias: 21 },
];

const TIPOS_LABOR = ["TRASPLANTE", "RIEGO", "PODA", "FERTILIZACION", "FITOSANITARIO", "MONITOREO"] as const;

const ESTADOS_PLANTA = ["PROPAGACION", "VEGETATIVO", "VEGETATIVO", "FLORACION", "FLORACION", "COSECHADA", "DESTRUIDA"] as const;

const laboresAcumuladas: Labor[] = [];

const codigoPlanta = (indice: number): string => `PL-2026-${String(indice + 1).padStart(6, "0")}`;

export const PLANTAS: readonly Planta[] = Array.from({ length: 264 }, (_, i) => {
  const cultivo = CULTIVOS[(i * 7) % CULTIVOS.length] as Cultivo;
  const variedad =
    CATALOGO_VARIEDADES.find((registro) => registro.nombre === cultivo.variedad) ??
    (CATALOGO_VARIEDADES[0] as Omit<Variedad, "plantasVivas">);
  const esMadre = i % 4 === 0;
  const diaSiembra = -(45 + ((i * 13) % 210));
  const codigo = codigoPlanta(i);
  const cantidadLabores = 2 + (i % 3);
  let aptaDesdeDia = diaSiembra;

  for (let n = 0; n < cantidadLabores; n += 1) {
    const tipo = TIPOS_LABOR[(i + n) % TIPOS_LABOR.length] ?? "MONITOREO";
    const usaInsumo = tipo === "FERTILIZACION" || tipo === "FITOSANITARIO";
    const insumo = usaInsumo ? (AGROINSUMOS[(i + n * 3) % AGROINSUMOS.length] as Agroinsumo) : null;
    const diaLabor = diaSiembra + 14 + n * 21;
    const liberacion = insumo && insumo.carenciaDias > 0 ? diaLabor + insumo.carenciaDias : null;
    if (liberacion !== null && liberacion > aptaDesdeDia) aptaDesdeDia = liberacion;
    laboresAcumuladas.push({
      id: identificador("LAB", laboresAcumuladas.length),
      plantaId: identificador("PLT", i),
      planta: codigo,
      tipo,
      agroinsumo: insumo ? insumo.nombre : null,
      dosis: insumo ? `${(enteroEntre(azar, 8, 45) / 10).toFixed(1)} cc/L` : "—",
      responsable: NOMBRES[(i + n) % NOMBRES.length] ?? "Operario de campo",
      fecha: fechaRelativa(diaLabor),
      aptaDesde: liberacion !== null ? fechaRelativa(liberacion) : null,
      huella: huella(),
    });
  }

  return {
    id: identificador("PLT", i),
    codigo,
    variedadId: variedad.id,
    variedad: variedad.nombre,
    tipo: variedad.tipo,
    cultivoId: cultivo.id,
    cultivo: cultivo.nombre,
    organizacionId: cultivo.organizacionId,
    departamento: cultivo.departamento,
    origen: esMadre ? "SEMILLA" : "CLON",
    madre: esMadre ? null : codigoPlanta(i - (i % 4)),
    estado: ESTADOS_PLANTA[i % ESTADOS_PLANTA.length] ?? "VEGETATIVO",
    siembra: fechaRelativa(diaSiembra),
    bloque: `Bloque ${String.fromCharCode(65 + (i % 6))} · Cama ${(i % 18) + 1}`,
    labores: cantidadLabores,
    aptaDesde: fechaRelativa(aptaDesdeDia),
    huella: huella(),
  };
});

export const LABORES: readonly Labor[] = laboresAcumuladas;

export const VARIEDADES_REGISTRADAS: readonly Variedad[] = CATALOGO_VARIEDADES.map((variedad) => ({
  ...variedad,
  plantasVivas: PLANTAS.filter(
    (planta) =>
      planta.variedadId === variedad.id &&
      planta.estado !== "COSECHADA" &&
      planta.estado !== "DESTRUIDA",
  ).length,
}));

const ESTADOS_BENEFICIO = ["SECADO", "CURADO", "CURADO", "ACONDICIONADO", "ACONDICIONADO", "RECHAZADO"] as const;

export const BENEFICIOS: readonly Beneficio[] = Array.from({ length: 54 }, (_, i) => {
  const cultivo = CULTIVOS[(i * 11) % CULTIVOS.length] as Cultivo;
  const variedad =
    CATALOGO_VARIEDADES.find((registro) => registro.nombre === cultivo.variedad) ??
    (CATALOGO_VARIEDADES[0] as Omit<Variedad, "plantasVivas">);
  const organizacion =
    ORGANIZACIONES.find((registro) => registro.id === cultivo.organizacionId) ??
    (ORGANIZACIONES[0] as Organizacion);
  const estado = ESTADOS_BENEFICIO[i % ESTADOS_BENEFICIO.length] ?? "CURADO";
  const plantas = enteroEntre(azar, 120, 1800);
  const pesoHumedo = Number((plantas * (enteroEntre(azar, 32, 78) / 100)).toFixed(1));
  const rendimiento = enteroEntre(azar, 19, 26) / 100;
  const pesoSeco = Number((pesoHumedo * rendimiento).toFixed(1));
  const pesoAcondicionado =
    estado === "ACONDICIONADO" ? Number((pesoSeco * 0.94).toFixed(1)) : 0;
  const inicio = -(20 + ((i * 9) % 180));
  return {
    id: identificador("BEN", i),
    codigo: `B-2026-${String(400 + i)}`,
    cultivoId: cultivo.id,
    cultivo: cultivo.nombre,
    organizacionId: cultivo.organizacionId,
    organizacion: organizacion.nombre,
    departamento: cultivo.departamento,
    variedad: variedad.nombre,
    tipo: variedad.tipo,
    plantas,
    pesoHumedo,
    pesoSeco,
    pesoAcondicionado,
    humedad: Number((enteroEntre(azar, 85, 125) / 10).toFixed(1)),
    estado,
    inicio: fechaRelativa(inicio),
    fin: fechaRelativa(inicio + enteroEntre(azar, 12, 34)),
    loteCodigo: estado === "ACONDICIONADO" ? `L-2026-${String(1000 + ((i * 3) % 190))}` : null,
    responsable: NOMBRES[(i * 5) % NOMBRES.length] ?? "Responsable de beneficio",
    huella: huella(),
  };
});

export const NOMBRE_DOCUMENTO: Record<TipoDocumento, string> = {
  CAMARA_COMERCIO: "Certificado de existencia y representación legal",
  RUT: "Registro Único Tributario",
  LICENCIA_CULTIVO: "Licencia de cultivo de plantas de cannabis",
  LICENCIA_FABRICACION: "Licencia de fabricación de derivados",
  CERTIFICADO_BPA: "Certificado de Buenas Prácticas Agrícolas",
  CUPO_FNE: "Asignación de cupo ante el FNE",
  AUTORIZACION_SANITARIA: "Autorización sanitaria del establecimiento",
  PLANO_PREDIO: "Plano georreferenciado del predio",
};

export const POLITICA_VERIFICACION: readonly ReglaVerificacion[] = [
  { id: "RGV-0001", tipoActor: "CULTIVADOR", documento: "CAMARA_COMERCIO", obligatorio: true, modo: "AUTOMATICO", vigenciaMeses: 1, norma: "Res. 1241/2026 Art. 7 · consulta RUES" },
  { id: "RGV-0002", tipoActor: "CULTIVADOR", documento: "RUT", obligatorio: true, modo: "AUTOMATICO", vigenciaMeses: null, norma: "Res. 1241/2026 Art. 7" },
  { id: "RGV-0003", tipoActor: "CULTIVADOR", documento: "LICENCIA_CULTIVO", obligatorio: true, modo: "MANUAL", vigenciaMeses: 60, norma: "Dec. 1138/2025 Art. 3" },
  { id: "RGV-0004", tipoActor: "CULTIVADOR", documento: "PLANO_PREDIO", obligatorio: true, modo: "MANUAL", vigenciaMeses: null, norma: "Res. 1241/2026 Art. 12 · apoyo ICA" },
  { id: "RGV-0005", tipoActor: "CULTIVADOR", documento: "CERTIFICADO_BPA", obligatorio: false, modo: "MANUAL", vigenciaMeses: 24, norma: "Res. 1241/2026 Art. 20" },
  { id: "RGV-0006", tipoActor: "CULTIVADOR", documento: "CUPO_FNE", obligatorio: false, modo: "MANUAL", vigenciaMeses: 12, norma: "Dec. 1138/2025 Art. 10 · solo psicoactivo" },
  { id: "RGV-0007", tipoActor: "TRANSFORMADOR", documento: "CAMARA_COMERCIO", obligatorio: true, modo: "AUTOMATICO", vigenciaMeses: 1, norma: "Res. 1241/2026 Art. 7" },
  { id: "RGV-0008", tipoActor: "TRANSFORMADOR", documento: "LICENCIA_FABRICACION", obligatorio: true, modo: "MANUAL", vigenciaMeses: 60, norma: "Dec. 1138/2025 Art. 4" },
  { id: "RGV-0009", tipoActor: "TRANSFORMADOR", documento: "AUTORIZACION_SANITARIA", obligatorio: true, modo: "MANUAL", vigenciaMeses: 60, norma: "Res. 1241/2026 Art. 13b · apoyo INVIMA" },
  { id: "RGV-0010", tipoActor: "LABORATORIO", documento: "AUTORIZACION_SANITARIA", obligatorio: true, modo: "MANUAL", vigenciaMeses: 60, norma: "Dec. 1138/2025 Art. 11" },
  { id: "RGV-0011", tipoActor: "LABORATORIO", documento: "CAMARA_COMERCIO", obligatorio: true, modo: "AUTOMATICO", vigenciaMeses: 1, norma: "Res. 1241/2026 Art. 7" },
  { id: "RGV-0012", tipoActor: "DISPENSADOR", documento: "AUTORIZACION_SANITARIA", obligatorio: true, modo: "MANUAL", vigenciaMeses: 36, norma: "Dec. 780/2016 Título VIII" },
  { id: "RGV-0013", tipoActor: "DISPENSADOR", documento: "RUT", obligatorio: true, modo: "AUTOMATICO", vigenciaMeses: null, norma: "Res. 1241/2026 Art. 7" },
  { id: "RGV-0014", tipoActor: "IPS", documento: "AUTORIZACION_SANITARIA", obligatorio: true, modo: "MANUAL", vigenciaMeses: 48, norma: "Res. 3100/2019 · habilitación de servicios" },
  { id: "RGV-0015", tipoActor: "IPS", documento: "CAMARA_COMERCIO", obligatorio: true, modo: "AUTOMATICO", vigenciaMeses: 1, norma: "Res. 1241/2026 Art. 7" },
];

const ESTADOS_DOCUMENTO = ["APROBADO", "APROBADO", "EN_VERIFICACION", "PENDIENTE", "DEVUELTO", "VENCIDO"] as const;

const OBSERVACIONES: Record<string, string> = {
  DEVUELTO: "El acto administrativo cargado no corresponde a la modalidad declarada. Adjunta la resolución vigente.",
  VENCIDO: "La vigencia del documento expiró. La organización no puede publicar hasta renovarlo.",
  EN_VERIFICACION: "En cola de verificación documental. Asignado al analista responsable.",
  PENDIENTE: "El actor todavía no ha cargado este documento obligatorio.",
};

const ANALISTAS = [
  "Lida Almeciga",
  "Néstor Iván Quintero",
  "Claudia Liliana Pardo",
  "Fabián Alberto Cruz",
] as const;

export const EXPEDIENTES: readonly Expediente[] = Array.from({ length: 28 }, (_, i) => {
  const organizacion = ORGANIZACIONES[(i * 3 + 1) % ORGANIZACIONES.length] as Organizacion;
  const requeridos = POLITICA_VERIFICACION.filter((regla) => regla.tipoActor === organizacion.tipo);
  const documentos: readonly DocumentoExpediente[] = requeridos.map((regla, n) => {
    const estado = ESTADOS_DOCUMENTO[(i + n) % ESTADOS_DOCUMENTO.length] ?? "APROBADO";
    const diaCarga = -(5 + ((i * 7 + n * 3) % 120));
    return {
      id: `${identificador("EXP", i)}-D${n + 1}`,
      tipo: regla.documento,
      archivo: `${regla.documento.toLowerCase()}-${organizacion.nit.split("-")[0] ?? "0"}.pdf`,
      estado,
      cargado: fechaRelativa(diaCarga),
      vence: regla.vigenciaMeses ? fechaRelativa(diaCarga + regla.vigenciaMeses * 30) : null,
      verificadoPor: estado === "APROBADO" || estado === "DEVUELTO" ? (ANALISTAS[(i + n) % ANALISTAS.length] ?? null) : null,
      observacion: OBSERVACIONES[estado] ?? null,
      huella: huella(),
    };
  });

  const faltan = documentos.some(
    (documento) => documento.estado !== "APROBADO" && (requeridos.find((r) => r.documento === documento.tipo)?.obligatorio ?? false),
  );
  const devuelto = documentos.some((documento) => documento.estado === "DEVUELTO");
  const enCurso = documentos.some((documento) => documento.estado === "EN_VERIFICACION");
  const estado = devuelto ? "DEVUELTO" : enCurso ? "EN_VERIFICACION" : faltan ? "RADICADO" : "APROBADO";
  const radicacion = -(10 + i * 4);

  const revisorPrincipal = ANALISTAS[i % ANALISTAS.length] ?? "Lida Almeciga";
  const segundoRevisor = ANALISTAS[(i + 1) % ANALISTAS.length] ?? "Néstor Iván Quintero";

  const pasos: readonly PasoVerificacion[] = PASOS_DE_LA_POLITICA.map((regla) => {
    const cierra = regla.exigeDobleControl;
    const veredicto: VeredictoPaso =
      estado === "APROBADO" ? "VERIFICADO" : devuelto && regla.orden === 1 ? "DEVUELTO" : "PENDIENTE";
    const resuelto = veredicto !== "PENDIENTE";
    return {
      id: `${identificador("EXP", i)}-P${regla.orden}`,
      reglaId: regla.reglaId,
      etiqueta: regla.etiqueta,
      orden: regla.orden,
      rol: regla.rol,
      exigeDobleControl: regla.exigeDobleControl,
      veredicto,
      revisor: resuelto ? (cierra ? segundoRevisor : revisorPrincipal) : null,
      resuelto: resuelto ? fechaRelativa(radicacion + 2 + regla.orden) : null,
      observacion:
        veredicto === "DEVUELTO" ? "Documentación incompleta frente al checklist vigente." : null,
      slaHoras: regla.slaHoras,
      huella: resuelto ? huella() : null,
    };
  });

  return {
    id: identificador("EXP", i),
    radicado: `RAD-2026-${String(3100 + i * 7)}`,
    organizacionId: organizacion.id,
    organizacion: organizacion.nombre,
    tipoActor: organizacion.tipo,
    departamento: organizacion.departamento,
    estado,
    radicacion: fechaRelativa(radicacion),
    analista: enCurso || devuelto ? (ANALISTAS[i % ANALISTAS.length] ?? null) : null,
    documentos,
    pasos,
    politicaVersion: "POL-2026.1",
  };
});

const VIA_POR_PRODUCTO: Record<string, ViaCierre> = {
  "Flor seca psicoactiva": "FNE",
  "Extracto de espectro completo": "FNE",
  "Aceite estandarizado THC:CBD": "FNE",
  "Flor seca no psicoactiva": "CONTRATO_DIRECTO",
  "Biomasa vegetal": "CONTRATO_DIRECTO",
  "Aceite estandarizado CBD": "CONTRATO_DIRECTO",
  "Fórmula magistral": "CONTRATO_DIRECTO",
  "Semilla certificada": "CONTRATO_DIRECTO",
};

const ENTIDAD_POR_VIA: Record<ViaCierre, { entidad: string; norma: string }> = {
  FNE: {
    entidad: "Fondo Nacional de Estupefacientes",
    norma: "Dec. 1138/2025 Art. 10 · Res. 1478/2006",
  },
  CONTRATO_DIRECTO: {
    entidad: "Acuerdo privado entre las partes",
    norma: "Dec. 1138/2025 Art. 9",
  },
  EXPORTACION: {
    entidad: "DIAN · INVIMA · autoridad del país de destino",
    norma: "Dec. 1138/2025 Art. 5 · Res. 1241/2026 Art. 10b",
  },
};

const ESTADOS_CIERRE = ["CONTACTO_HABILITADO", "TRAMITE_EXTERNO", "MOVIMIENTO_DECLARADO", "SIN_DECLARAR"] as const;

export const CIERRES: readonly CierreExterno[] = Array.from({ length: 18 }, (_, i) => {
  const oferta = OFERTAS_PUBLICAS[(i * 5) % OFERTAS_PUBLICAS.length] as Oferta;
  const manifestacion = MANIFESTACIONES[i % MANIFESTACIONES.length];
  const exporta = i % 6 === 2;
  const via = exporta ? "EXPORTACION" : (VIA_POR_PRODUCTO[oferta.tipoProducto] ?? "CONTRATO_DIRECTO");
  const referencia = ENTIDAD_POR_VIA[via];
  const estado = ESTADOS_CIERRE[i % ESTADOS_CIERRE.length] ?? "CONTACTO_HABILITADO";
  const habilitado = -(3 + ((i * 5) % 60));
  return {
    id: identificador("CEX", i),
    ofertaId: oferta.id,
    oferta: oferta.titulo,
    tipoProducto: oferta.tipoProducto,
    tipo: via === "FNE" ? "PSICOACTIVO" : "NO_PSICOACTIVO",
    organizacion: oferta.organizacion,
    contraparte: manifestacion ? manifestacion.solicitante : "Actor interesado",
    departamento: oferta.departamento,
    via,
    entidad: referencia.entidad,
    norma: referencia.norma,
    estado,
    habilitado: fechaRelativa(habilitado),
    declarado: estado === "MOVIMIENTO_DECLARADO" ? fechaRelativa(habilitado + 18) : null,
    movimiento: estado === "MOVIMIENTO_DECLARADO" ? `MOV-2026-${String(700 + i * 3)}` : null,
  };
});

export const CONEXIONES: readonly Conexion[] = [
  {
    id: "CNX-0001",
    sigla: "MICC",
    nombre: "Mecanismo de Información para el Control del Cannabis",
    entidad: "Ministerio de Justicia y del Derecho",
    proposito: "Consultar licencias, modalidades y cupos asignados a cada licenciatario.",
    direccion: "CONSULTA",
    estado: "OPERATIVA",
    ultimaLectura: fechaRelativa(0),
    conciliados: 4187,
    discrepancias: 12,
    mecanismo: "Servicio REST con firma mutua · lectura cada 6 horas",
    norma: "Dec. 1138/2025 Art. 3 · Res. 1241/2026 Art. 7",
  },
  {
    id: "CNX-0002",
    sigla: "RUES",
    nombre: "Registro Único Empresarial y Social",
    entidad: "Confecámaras",
    proposito: "Validar existencia, representación legal y matrícula de cada organización.",
    direccion: "CONSULTA",
    estado: "OPERATIVA",
    ultimaLectura: fechaRelativa(0),
    conciliados: 5896,
    discrepancias: 31,
    mecanismo: "Servicio REST público · verificación al radicar el expediente",
    norma: "Res. 1241/2026 Art. 7",
  },
  {
    id: "CNX-0003",
    sigla: "INVIMA",
    nombre: "Registros sanitarios y establecimientos autorizados",
    entidad: "INVIMA",
    proposito: "Confirmar el registro sanitario del producto terminado y la autorización del establecimiento.",
    direccion: "CONSULTA",
    estado: "DEGRADADA",
    ultimaLectura: fechaRelativa(-1),
    conciliados: 1642,
    discrepancias: 87,
    mecanismo: "Archivo plano diario · pendiente el servicio en línea",
    norma: "Dec. 1138/2025 Art. 1 núm. 38 · Res. 1241/2026 Art. 13b",
  },
  {
    id: "CNX-0004",
    sigla: "ICA",
    nombre: "Registro de predios y de material de propagación",
    entidad: "Instituto Colombiano Agropecuario",
    proposito: "Verificar el registro del predio y de la variedad sembrada.",
    direccion: "CONSULTA",
    estado: "OPERATIVA",
    ultimaLectura: fechaRelativa(0),
    conciliados: 1284,
    discrepancias: 9,
    mecanismo: "Servicio REST con token de entidad · lectura diaria",
    norma: "Res. 1241/2026 Art. 12 y 20",
  },
  {
    id: "CNX-0005",
    sigla: "FNE",
    nombre: "Cupos y trámite de transferencia de cannabis psicoactivo",
    entidad: "Fondo Nacional de Estupefacientes",
    proposito: "Leer el cupo vigente y el estado del trámite donde se formaliza la operación entre las partes.",
    direccion: "BIDIRECCIONAL",
    estado: "NO_CONECTADA",
    ultimaLectura: fechaRelativa(-96),
    conciliados: 0,
    discrepancias: 0,
    mecanismo: "Sin interfaz técnica. El trámite se surte por fuera del sistema.",
    norma: "Dec. 1138/2025 Art. 10 · Res. 1478/2006",
  },
  {
    id: "CNX-0007",
    sigla: "SICAMED",
    nombre: "SICAMED central del MinCIT",
    entidad: "Ministerio de Comercio, Industria y Turismo",
    proposito:
      "Reportar al sistema central la información del registro, la vitrina y la analítica agregada que exija el anexo técnico.",
    direccion: "REPORTE",
    estado: "NO_CONECTADA",
    ultimaLectura: fechaRelativa(-120),
    conciliados: 0,
    discrepancias: 0,
    mecanismo:
      "Sin interfaz publicada. El anexo técnico del Art. 13 no ha salido: el adaptador está aislado tras el ACL para que su forma final no toque el dominio.",
    norma: "Res. 1241/2026 Art. 13 ¶ · Art. 22",
  },
  {
    id: "CNX-0008",
    sigla: "POS",
    nombre: "Punto de venta de las farmacias",
    entidad: "Sistemas propios de cada establecimiento",
    proposito:
      "Recibir del POS la salida de inventario dispensado y devolverle la constancia del acto verificado, para que la farmacia no cambie de sistema.",
    direccion: "BIDIRECCIONAL",
    estado: "DEGRADADA",
    ultimaLectura: fechaRelativa(0),
    conciliados: 318,
    discrepancias: 24,
    mecanismo:
      "Dos modos de adopción: servicio REST contra el POS existente, o la pantalla del punto de dispensación para quien no tenga integración.",
    norma: "Res. 1478/2006 Art. 5 núm. 4 · Dec. 2200/2005",
  },
  {
    id: "CNX-0006",
    sigla: "RPBPN",
    nombre: "Registro de Productores de Bienes Nacionales",
    entidad: "Ministerio de Comercio, Industria y Turismo",
    proposito: "Reportar la condición de productor nacional para trámites de origen y exportación.",
    direccion: "REPORTE",
    estado: "SIN_RESPUESTA",
    ultimaLectura: fechaRelativa(-4),
    conciliados: 318,
    discrepancias: 0,
    mecanismo: "Envío programado semanal · el servicio no confirma recepción",
    norma: "Res. 1241/2026 Art. 11 y 19",
  },
];

const estadoLectura = (temperatura: number, humedad: number, conductividad: number) => {
  if (temperatura < 16 || temperatura > 30) return "FUERA_DE_RANGO" as const;
  if (humedad < 38 || humedad > 72) return "FUERA_DE_RANGO" as const;
  if (conductividad > 2.6) return "FUERA_DE_RANGO" as const;
  return "EN_RANGO" as const;
};

export const AMBIENTE: readonly LecturaAmbiente[] = Array.from({ length: 42 }, (_, i) => {
  const cultivo = CULTIVOS[(i * 5) % CULTIVOS.length] as Cultivo;
  const sinSenal = i % 13 === 6;
  const temperatura = Number((enteroEntre(azar, 145, 325) / 10).toFixed(1));
  const humedad = Number((enteroEntre(azar, 340, 780) / 10).toFixed(1));
  const conductividad = Number((enteroEntre(azar, 8, 31) / 10).toFixed(1));
  return {
    id: identificador("AMB", i),
    cultivoId: cultivo.id,
    cultivo: cultivo.nombre,
    bloque: `Bloque ${String.fromCharCode(65 + (i % 6))}`,
    departamento: cultivo.departamento,
    temperatura,
    humedad,
    conductividad,
    luz: enteroEntre(azar, 180, 940),
    estado: sinSenal ? "SIN_SENAL" : estadoLectura(temperatura, humedad, conductividad),
    registro: fechaRelativa(-Math.floor(i / 6)),
  };
});
