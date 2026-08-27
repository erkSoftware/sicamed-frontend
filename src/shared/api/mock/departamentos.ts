import { DEPARTAMENTOS } from "./catalogos";
import { ATESTACIONES, CULTIVOS, EVENTOS, LOTES, OFERTAS, ORGANIZACIONES } from "./datos";
import type { Cultivo, EventoTrazabilidad, Lote, Organizacion } from "./tipos";

export type ResumenVariedad = {
  variedad: string;
  cultivos: number;
  plantas: number;
};

export type ResumenDepartamento = {
  codigo: string;
  nombre: string;
  proveedores: number;
  dispensadores: number;
  ips: number;
  medicos: number;
  pacientes: number;
  organizaciones: readonly Organizacion[];
  habilitadas: number;
  atestacionesVigentes: number;
  cultivos: readonly Cultivo[];
  areaHectareas: number;
  plantas: number;
  cultivosPsicoactivos: number;
  variedades: readonly ResumenVariedad[];
  lotes: readonly Lote[];
  lotesEnTransito: number;
  lotesRetenidos: number;
  ofertasPublicadas: number;
  eventos: readonly EventoTrazabilidad[];
  municipios: readonly string[];
};

const redondear = (valor: number): number => Number(valor.toFixed(1));

const construir = (codigo: string): ResumenDepartamento | null => {
  const catalogo = DEPARTAMENTOS.find((item) => item.codigo === codigo);
  if (!catalogo) return null;

  const organizaciones = ORGANIZACIONES.filter((item) => item.departamento === catalogo.nombre);
  const identificadores = new Set(organizaciones.map((item) => item.id));
  const cultivos = CULTIVOS.filter((item) => item.departamento === catalogo.nombre);
  const lotes = LOTES.filter((item) => item.departamento === catalogo.nombre);
  const eventos = EVENTOS.filter((item) => identificadores.has(item.organizacionId));

  const porVariedad = new Map<string, ResumenVariedad>();
  for (const cultivo of cultivos) {
    const previo = porVariedad.get(cultivo.variedad) ?? { variedad: cultivo.variedad, cultivos: 0, plantas: 0 };
    porVariedad.set(cultivo.variedad, {
      variedad: cultivo.variedad,
      cultivos: previo.cultivos + 1,
      plantas: previo.plantas + cultivo.plantas,
    });
  }

  return {
    codigo: catalogo.codigo,
    nombre: catalogo.nombre,
    proveedores: catalogo.proveedores,
    dispensadores: catalogo.dispensadores,
    ips: catalogo.ips,
    medicos: catalogo.medicos,
    pacientes: catalogo.pacientes,
    organizaciones,
    habilitadas: organizaciones.filter((item) => item.estado === "HABILITADA").length,
    atestacionesVigentes: ATESTACIONES.filter(
      (item) => identificadores.has(item.organizacionId) && item.estado === "VIGENTE",
    ).length,
    cultivos,
    areaHectareas: redondear(cultivos.reduce((suma, item) => suma + item.areaHectareas, 0)),
    plantas: cultivos.reduce((suma, item) => suma + item.plantas, 0),
    cultivosPsicoactivos: cultivos.filter((item) => item.psicoactivo).length,
    variedades: [...porVariedad.values()].sort((a, b) => b.plantas - a.plantas),
    lotes,
    lotesEnTransito: lotes.filter((item) => item.estado === "EN_TRANSITO").length,
    lotesRetenidos: lotes.filter((item) => item.estado === "RETENIDO").length,
    ofertasPublicadas: OFERTAS.filter(
      (item) => item.departamento === catalogo.nombre && item.estado === "PUBLICADA",
    ).length,
    eventos: [...eventos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6),
    municipios: [...new Set(organizaciones.map((item) => item.municipio))].sort(),
  };
};

const memoria = new Map<string, ResumenDepartamento | null>();

export const resumenDepartamento = (codigo: string): ResumenDepartamento | null => {
  if (!memoria.has(codigo)) memoria.set(codigo, construir(codigo));
  return memoria.get(codigo) ?? null;
};
