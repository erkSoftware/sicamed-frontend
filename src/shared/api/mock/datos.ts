import { crearAzar, enteroEntre, fechaRelativa, identificador } from "./aleatorio";
import {
  DEPARTAMENTOS,
  ESPECIALIDADES,
  NOMBRES,
  RAZONES_SOCIALES,
  TIPOS_PRODUCTO,
  VARIEDADES,
} from "./catalogos";
import type {
  Atestacion,
  Cultivo,
  EstadoAtestacion,
  EstadoHabilitacion,
  EventoTrazabilidad,
  Lote,
  ManifestacionInteres,
  Medico,
  Oferta,
  Organizacion,
  RuedaNegocio,
  TipoActor,
  TipoAtestacion,
  TipoLote,
} from "./tipos";

const azar = crearAzar(20260826);

const TIPOS_ACTOR: readonly TipoActor[] = [
  "CULTIVADOR",
  "TRANSFORMADOR",
  "DISPENSADOR",
  "IPS",
  "LABORATORIO",
];

const MUNICIPIOS: Record<string, readonly string[]> = {
  Cundinamarca: ["Bogotá D.C.", "Fusagasugá", "Zipaquirá", "Facatativá", "Chía"],
  "Valle del Cauca": ["Cali", "Palmira", "Buga", "Tuluá", "Jamundí"],
  Tolima: ["Ibagué", "Espinal", "Líbano", "Melgar", "Chaparral"],
  Atlántico: ["Barranquilla", "Soledad", "Malambo", "Sabanalarga"],
  Antioquia: ["Medellín", "Rionegro", "Envigado", "La Ceja", "Santa Rosa de Osos"],
  Caldas: ["Manizales", "Villamaría", "Chinchiná", "Riosucio"],
  Risaralda: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"],
  Quindío: ["Armenia", "Calarcá", "Montenegro", "Quimbaya"],
  Cauca: ["Popayán", "Santander de Quilichao", "Corinto", "Miranda"],
  Nariño: ["Pasto", "Ipiales", "Tumaco", "Túquerres"],
  Santander: ["Bucaramanga", "Floridablanca", "Girón", "San Gil"],
  Boyacá: ["Tunja", "Duitama", "Sogamoso", "Villa de Leyva"],
  Meta: ["Villavicencio", "Acacías", "Granada"],
  Huila: ["Neiva", "Pitalito", "Garzón"],
  Bolívar: ["Cartagena", "Magangué", "Turbaco"],
};

const municipioDe = (departamento: string, indice: number): string => {
  const lista = MUNICIPIOS[departamento] ?? ["Cabecera municipal"];
  return lista[indice % lista.length] ?? "Cabecera municipal";
};

const ESTADOS_HABILITACION: readonly EstadoHabilitacion[] = [
  "HABILITADA",
  "HABILITADA",
  "HABILITADA",
  "EN_TRAMITE",
  "SUSPENDIDA",
  "VENCIDA",
];

export const ORGANIZACIONES: readonly Organizacion[] = Array.from({ length: 96 }, (_, i) => {
  const departamento = DEPARTAMENTOS[i % DEPARTAMENTOS.length]?.nombre ?? "Cundinamarca";
  const base = RAZONES_SOCIALES[i % RAZONES_SOCIALES.length] ?? "Organización";
  const sufijo = i < RAZONES_SOCIALES.length ? "S.A.S." : `S.A.S. ${Math.floor(i / RAZONES_SOCIALES.length) + 1}`;
  return {
    id: identificador("ORG", i),
    nit: `${900000000 + i * 1337}-${(i % 9) + 1}`,
    nombre: `${base} ${sufijo}`,
    tipo: TIPOS_ACTOR[i % TIPOS_ACTOR.length] ?? "CULTIVADOR",
    departamento,
    municipio: municipioDe(departamento, i),
    estado: ESTADOS_HABILITACION[i % ESTADOS_HABILITACION.length] ?? "HABILITADA",
    registro: fechaRelativa(-enteroEntre(azar, 120, 1400)),
    representante: NOMBRES[i % NOMBRES.length] ?? "Representante legal",
    correo: `contacto@${base.toLowerCase().replace(/[^a-z]/g, "")}.co`,
    telefono: `+57 60${enteroEntre(azar, 1, 8)} ${enteroEntre(azar, 200, 899)} ${enteroEntre(azar, 1000, 9999)}`,
    cultivos: enteroEntre(azar, 0, 9),
    lotes: enteroEntre(azar, 2, 40),
    ofertas: enteroEntre(azar, 0, 7),
  };
});

export const ORGANIZACION_ACTUAL = ORGANIZACIONES[5] as Organizacion;

const TIPOS_ATESTACION: readonly TipoAtestacion[] = [
  "CULTIVO_NO_PSICOACTIVO",
  "CULTIVO_PSICOACTIVO",
  "FABRICACION_DERIVADOS",
  "DISPENSACION",
  "EXPORTACION",
];

const AUTORIDADES = [
  "Ministerio de Salud y Protección Social",
  "Ministerio de Justicia y del Derecho",
  "ICA",
  "INVIMA",
  "Fondo Nacional de Estupefacientes",
] as const;

const estadoPorVencimiento = (dias: number): EstadoAtestacion => {
  if (dias < 0) return "VENCIDA";
  if (dias < 45) return "POR_VENCER";
  return "VIGENTE";
};

const ORGANIZACIONES_SIN_ATESTACION = new Set([46, 47, 62, 71, 88, 93]);

const INDICES_CON_ATESTACION = ORGANIZACIONES.map((_, i) => i).filter(
  (i) => !ORGANIZACIONES_SIN_ATESTACION.has(i),
);

export const ATESTACIONES: readonly Atestacion[] = INDICES_CON_ATESTACION.map((indice, i) => {
  const organizacion = ORGANIZACIONES[indice] as Organizacion;
  const dias = [-120, -14, 12, 30, 88, 210, 365, 540][i % 8] ?? 200;
  const enTramite = i % 11 === 3;
  return {
    id: identificador("ATT", i),
    organizacionId: organizacion.id,
    organizacion: organizacion.nombre,
    tipo: TIPOS_ATESTACION[i % TIPOS_ATESTACION.length] ?? "CULTIVO_NO_PSICOACTIVO",
    acto: `Resolución ${enteroEntre(azar, 1000, 9999)} de 202${enteroEntre(azar, 4, 6)}`,
    autoridad: AUTORIDADES[i % AUTORIDADES.length] ?? "INVIMA",
    expedicion: fechaRelativa(dias - 730),
    vencimiento: fechaRelativa(dias),
    estado: enTramite ? "EN_TRAMITE" : estadoPorVencimiento(dias),
    evidencia: `expediente-${identificador("EXP", i).toLowerCase()}.pdf`,
    huella: `sha256:${(azar() * 1e17).toString(16).padStart(14, "0").slice(0, 14)}`,
  };
});

const ESTADOS_CULTIVO = ["PREPARACION", "VEGETATIVO", "FLORACION", "COSECHA", "CERRADO"] as const;

export const CULTIVOS: readonly Cultivo[] = Array.from({ length: 128 }, (_, i) => {
  const organizacion = ORGANIZACIONES[(i * 3) % ORGANIZACIONES.length] as Organizacion;
  return {
    id: identificador("CUL", i),
    nombre: `Predio ${["La Esperanza", "El Mirador", "San Rafael", "Alto Verde", "Los Cámbulos", "Buenavista"][i % 6]} ${i + 1}`,
    organizacionId: organizacion.id,
    organizacion: organizacion.nombre,
    departamento: organizacion.departamento,
    municipio: organizacion.municipio,
    variedad: VARIEDADES[i % VARIEDADES.length] ?? "Charlotte's Angel",
    psicoactivo: i % 3 === 0,
    areaHectareas: Number((enteroEntre(azar, 5, 120) / 10).toFixed(1)),
    plantas: enteroEntre(azar, 800, 24000),
    estado: ESTADOS_CULTIVO[i % ESTADOS_CULTIVO.length] ?? "VEGETATIVO",
    siembra: fechaRelativa(-enteroEntre(azar, 40, 300)),
    cosechaEstimada: fechaRelativa(enteroEntre(azar, 5, 160)),
  };
});

const TIPOS_LOTE: readonly TipoLote[] = [
  "FLOR_SECA",
  "BIOMASA",
  "EXTRACTO",
  "ACEITE",
  "FORMULA_MAGISTRAL",
];

const UNIDAD_POR_TIPO: Record<TipoLote, string> = {
  FLOR_SECA: "kg",
  BIOMASA: "kg",
  EXTRACTO: "L",
  ACEITE: "L",
  FORMULA_MAGISTRAL: "unidades",
};

const ESTADOS_LOTE = ["EN_BODEGA", "EN_TRANSITO", "DISPENSADO", "RETENIDO", "EN_BODEGA"] as const;

export const LOTES: readonly Lote[] = Array.from({ length: 190 }, (_, i) => {
  const cultivo = CULTIVOS[i % CULTIVOS.length] as Cultivo;
  const tipo = TIPOS_LOTE[i % TIPOS_LOTE.length] ?? "FLOR_SECA";
  return {
    id: identificador("LOT", i),
    codigo: `L-2026-${String(1000 + i)}`,
    cultivoId: cultivo.id,
    organizacionId: cultivo.organizacionId,
    organizacion: cultivo.organizacion,
    tipo,
    cantidad: enteroEntre(azar, 20, 4800),
    unidad: UNIDAD_POR_TIPO[tipo],
    estado: ESTADOS_LOTE[i % ESTADOS_LOTE.length] ?? "EN_BODEGA",
    thc: Number((azar() * (cultivo.psicoactivo ? 18 : 0.9)).toFixed(2)),
    cbd: Number((azar() * 16 + 2).toFixed(2)),
    bodega: `Bodega ${String.fromCharCode(65 + (i % 6))} · ${cultivo.municipio}`,
    departamento: cultivo.departamento,
    fecha: fechaRelativa(-enteroEntre(azar, 5, 220)),
    vencimiento: fechaRelativa(enteroEntre(azar, 30, 700)),
  };
});

const ESTADOS_OFERTA = ["PUBLICADA", "PUBLICADA", "PUBLICADA", "BORRADOR", "RECHAZADA", "CERRADA"] as const;
const DISPONIBILIDADES = ["INMEDIATA", "PROGRAMADA", "POR_CAMPAÑA"] as const;

const CERTIFICACIONES = [
  "BPA — Buenas Prácticas Agrícolas",
  "BPM — Buenas Prácticas de Manufactura",
  "ICA — Registro de predio",
  "INVIMA — Certificado sanitario",
  "Sello de trazabilidad SICAMED",
] as const;

export const OFERTAS: readonly Oferta[] = Array.from({ length: 96 }, (_, i) => {
  const organizacion = ORGANIZACIONES[(i * 5) % ORGANIZACIONES.length] as Organizacion;
  const tipoProducto = TIPOS_PRODUCTO[i % TIPOS_PRODUCTO.length] ?? "Biomasa vegetal";
  return {
    id: identificador("OFE", i),
    titulo: `${tipoProducto} — ${organizacion.departamento}`,
    tipoProducto,
    organizacionId: organizacion.id,
    organizacion: organizacion.nombre,
    tipoActor: organizacion.tipo,
    departamento: organizacion.departamento,
    municipio: organizacion.municipio,
    estado: ESTADOS_OFERTA[i % ESTADOS_OFERTA.length] ?? "PUBLICADA",
    disponibilidad: DISPONIBILIDADES[i % DISPONIBILIDADES.length] ?? "INMEDIATA",
    publicada: fechaRelativa(-enteroEntre(azar, 1, 120)),
    vigencia: fechaRelativa(enteroEntre(azar, 20, 240)),
    descripcion:
      `Oferta registrada por un actor habilitado del ecosistema de cannabis medicinal en ` +
      `${organizacion.municipio}, ${organizacion.departamento}. La existencia de la oferta y la ` +
      `identidad del actor son información pública conforme a la Ley 1712 de 2014; las cantidades ` +
      `y la capacidad productiva son información reservada de carácter comercial.`,
    certificaciones: CERTIFICACIONES.slice(0, (i % 4) + 2),
    interesados: enteroEntre(azar, 0, 34),
  };
});

export const OFERTAS_PUBLICAS = OFERTAS.filter((oferta) => oferta.estado === "PUBLICADA");

const TIPOS_EVENTO = [
  { tipo: "ORGANIZACION_REGISTRADA", descripcion: "Se registró la organización en el sistema" },
  { tipo: "EXPEDIENTE_ABIERTO", descripcion: "Se abrió expediente de registro" },
  { tipo: "ATESTACION_REGISTRADA", descripcion: "Se registró atestación de licencia con evidencia" },
  { tipo: "PUBLICACION_RECHAZADA", descripcion: "Se rechazó la publicación por falta de habilitación vigente" },
  { tipo: "OFERTA_PUBLICADA", descripcion: "Se publicó la oferta en la vitrina" },
  { tipo: "LOTE_CREADO", descripcion: "Se creó el lote a partir de la cosecha" },
  { tipo: "LOTE_TRASLADADO", descripcion: "Se trasladó el lote entre bodegas" },
  { tipo: "INTERES_MANIFESTADO", descripcion: "Un actor manifestó interés sobre la oferta" },
  { tipo: "CONTACTO_HABILITADO", descripcion: "Se habilitó el canal de contacto entre actores" },
] as const;

export const EVENTOS: readonly EventoTrazabilidad[] = Array.from({ length: 150 }, (_, i) => {
  const plantilla = TIPOS_EVENTO[i % TIPOS_EVENTO.length] ?? TIPOS_EVENTO[0];
  const organizacion = ORGANIZACIONES[(i * 7) % ORGANIZACIONES.length] as Organizacion;
  const huella = `0x${(azar() * 1e18).toString(16).replace(".", "").slice(0, 16)}`;
  const previa = `0x${(azar() * 1e18).toString(16).replace(".", "").slice(0, 16)}`;
  return {
    id: identificador("EVT", i),
    secuencia: 100000 + i,
    tipo: plantilla.tipo,
    descripcion: plantilla.descripcion,
    entidad: plantilla.tipo.startsWith("LOTE") ? "Lote" : plantilla.tipo.startsWith("OFERTA") ? "Oferta" : "Organización",
    entidadId: identificador("ENT", i),
    actor: NOMBRES[i % NOMBRES.length] ?? "Operador",
    organizacionId: organizacion.id,
    fecha: fechaRelativa(-i),
    huella,
    huellaPrevia: previa,
  };
});

export const RUEDAS: readonly RuedaNegocio[] = Array.from({ length: 9 }, (_, i) => {
  const departamento = DEPARTAMENTOS[i % DEPARTAMENTOS.length]?.nombre ?? "Cundinamarca";
  const cupos = enteroEntre(azar, 40, 220);
  return {
    id: identificador("RDN", i),
    nombre: `Rueda de negocios ${["Andina", "Pacífico", "Caribe", "Oriente", "Eje Cafetero"][i % 5]} 2026`,
    fecha: fechaRelativa(enteroEntre(azar, -60, 150)),
    modalidad: (["PRESENCIAL", "VIRTUAL", "MIXTA"] as const)[i % 3] ?? "MIXTA",
    sede: `Centro de eventos ${municipioDe(departamento, i)}`,
    departamento,
    estado: (["ABIERTA", "EN_CURSO", "CERRADA"] as const)[i % 3] ?? "ABIERTA",
    cupos,
    inscritos: enteroEntre(azar, 10, cupos),
    enfoque: ["Exportación", "Fitoterapéuticos", "Fórmulas magistrales", "Semilla certificada"][i % 4] ?? "Exportación",
  };
});

export const MEDICOS: readonly Medico[] = Array.from({ length: 34 }, (_, i) => {
  const departamento = DEPARTAMENTOS[i % DEPARTAMENTOS.length]?.nombre ?? "Cundinamarca";
  return {
    id: identificador("MED", i),
    nombre: `Dr. ${NOMBRES[(i * 3) % NOMBRES.length] ?? "Profesional"}`,
    rethus: `RT-${enteroEntre(azar, 100000, 999999)}`,
    especialidad: ESPECIALIDADES[i % ESPECIALIDADES.length] ?? "Medicina del dolor",
    ips: `IPS ${RAZONES_SOCIALES[(i * 2) % RAZONES_SOCIALES.length] ?? "Alivio"}`,
    departamento,
    prescripciones: enteroEntre(azar, 4, 480),
    estado: (["ACTIVO", "ACTIVO", "ACTIVO", "EN_VERIFICACION", "INACTIVO"] as const)[i % 5] ?? "ACTIVO",
  };
});

export const MANIFESTACIONES: readonly ManifestacionInteres[] = Array.from({ length: 14 }, (_, i) => {
  const oferta = OFERTAS_PUBLICAS[i % OFERTAS_PUBLICAS.length] as Oferta;
  return {
    id: identificador("MIN", i),
    ofertaId: oferta.id,
    oferta: oferta.titulo,
    solicitante: RAZONES_SOCIALES[(i * 4) % RAZONES_SOCIALES.length] ?? "Actor interesado",
    departamento: DEPARTAMENTOS[(i * 2) % DEPARTAMENTOS.length]?.nombre ?? "Cundinamarca",
    fecha: fechaRelativa(-enteroEntre(azar, 1, 45)),
    estado: (["NUEVA", "EN_REVISION", "HABILITADA", "DESCARTADA"] as const)[i % 4] ?? "NUEVA",
  };
});

export const SERIE_PUBLICACIONES = Array.from({ length: 12 }, (_, i) => ({
  etiqueta: ["Sep", "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"][i] ?? "",
  valor: enteroEntre(azar, 40, 260),
  rechazos: enteroEntre(azar, 4, 48),
}));
