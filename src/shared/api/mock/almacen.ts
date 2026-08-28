import { modoMock } from "../transporte";
import {
  ATESTACIONES,
  CULTIVOS,
  EVENTOS,
  LOTES,
  MANIFESTACIONES,
  MEDICOS,
  OFERTAS,
  ORGANIZACIONES,
  RUEDAS,
} from "./datos";
import {
  AGROINSUMOS,
  AMBIENTE,
  BENEFICIOS,
  CIERRES,
  CONEXIONES,
  EXPEDIENTES,
  LABORES,
  PLANTAS,
  POLITICA_VERIFICACION,
  VARIEDADES_REGISTRADAS,
} from "./datosProceso";
import {
  CUENTAS,
  CUPOS,
  DESTRUCCIONES,
  SOLICITUDES,
  TRANSFORMACIONES,
  discrepanciasSemilla,
} from "./datosGobierno";
import type {
  ActaDestruccion,
  Agroinsumo,
  Atestacion,
  Beneficio,
  CierreExterno,
  Conexion,
  CuentaUsuario,
  CupoMicc,
  Cultivo,
  Discrepancia,
  EventoTrazabilidad,
  Expediente,
  Labor,
  LecturaAmbiente,
  Lote,
  ManifestacionInteres,
  Medico,
  Oferta,
  Organizacion,
  Planta,
  ReglaVerificacion,
  RuedaNegocio,
  SolicitudRegistro,
  Transformacion,
  Variedad,
} from "./tipos";

const CLAVE_ALMACEN = "sicamed.almacen-simulado";

const semilla = {
  organizaciones: [...ORGANIZACIONES] as Organizacion[],
  atestaciones: [...ATESTACIONES] as Atestacion[],
  cultivos: [...CULTIVOS] as Cultivo[],
  lotes: [...LOTES] as Lote[],
  ofertas: [...OFERTAS] as Oferta[],
  eventos: [...EVENTOS] as EventoTrazabilidad[],
  manifestaciones: [...MANIFESTACIONES] as ManifestacionInteres[],
  ruedas: [...RUEDAS] as RuedaNegocio[],
  medicos: [...MEDICOS] as Medico[],
  plantas: [...PLANTAS] as Planta[],
  labores: [...LABORES] as Labor[],
  variedades: [...VARIEDADES_REGISTRADAS] as Variedad[],
  agroinsumos: [...AGROINSUMOS] as Agroinsumo[],
  beneficios: [...BENEFICIOS] as Beneficio[],
  expedientes: [...EXPEDIENTES] as Expediente[],
  politica: [...POLITICA_VERIFICACION] as ReglaVerificacion[],
  cierres: [...CIERRES] as CierreExterno[],
  conexiones: [...CONEXIONES] as Conexion[],
  ambiente: [...AMBIENTE] as LecturaAmbiente[],
  cuentas: [...CUENTAS] as CuentaUsuario[],
  cupos: [...CUPOS] as CupoMicc[],
  transformaciones: [...TRANSFORMACIONES] as Transformacion[],
  destrucciones: [...DESTRUCCIONES] as ActaDestruccion[],
  solicitudes: [...SOLICITUDES] as SolicitudRegistro[],
  discrepancias: [...discrepanciasSemilla(CONEXIONES)] as Discrepancia[],
  politicaVersion: "POL-2026.1",
};

type Almacen = typeof semilla;

const persistible = (): boolean =>
  modoMock && typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const restaurar = (): Almacen => {
  if (!persistible()) return semilla;
  try {
    const guardado = window.sessionStorage.getItem(CLAVE_ALMACEN);
    if (!guardado) return semilla;
    const recuperado = JSON.parse(guardado) as Partial<Almacen>;
    return { ...semilla, ...recuperado };
  } catch {
    return semilla;
  }
};

export const almacen: Almacen = restaurar();

export const guardarAlmacen = (): void => {
  if (!persistible()) return;
  try {
    window.sessionStorage.setItem(CLAVE_ALMACEN, JSON.stringify(almacen));
  } catch {
    return;
  }
};

export const reiniciarAlmacen = (): void => {
  Object.assign(almacen, structuredClone(semilla));
  if (persistible()) window.sessionStorage.removeItem(CLAVE_ALMACEN);
};

const contadores: Record<string, number> = {};

export const siguienteId = (prefijo: string): string => {
  contadores[prefijo] = (contadores[prefijo] ?? 0) + 1;
  return `${prefijo}-N${String(contadores[prefijo]).padStart(4, "0")}`;
};

export const ahora = (): string => new Date().toISOString();

let semillaHuella = 0x5ca7ed;

export const nuevaHuella = (): string => {
  semillaHuella = (semillaHuella * 1103515245 + 12345) >>> 0;
  const alto = semillaHuella.toString(16).padStart(8, "0");
  semillaHuella = (semillaHuella * 1103515245 + 12345) >>> 0;
  return `0x${alto}${semillaHuella.toString(16).padStart(8, "0")}`;
};

export type EntradaEvento = {
  tipo: string;
  descripcion: string;
  entidad: string;
  entidadId: string;
  actor: string;
  organizacionId: string;
};

export const registrarEvento = (entrada: EntradaEvento): EventoTrazabilidad => {
  const anterior = almacen.eventos[0];
  const secuencia = almacen.eventos.reduce(
    (maximo, evento) => Math.max(maximo, evento.secuencia),
    100_000,
  );
  const evento: EventoTrazabilidad = {
    id: siguienteId("EVT"),
    secuencia: secuencia + 1,
    tipo: entrada.tipo,
    descripcion: entrada.descripcion,
    entidad: entrada.entidad,
    entidadId: entrada.entidadId,
    actor: entrada.actor,
    organizacionId: entrada.organizacionId,
    fecha: ahora(),
    huella: nuevaHuella(),
    huellaPrevia: anterior?.huella ?? "0x0000000000000000",
  };
  almacen.eventos.unshift(evento);
  guardarAlmacen();
  return evento;
};

export const organizacionDe = (id: string): Organizacion | undefined =>
  almacen.organizaciones.find((organizacion) => organizacion.id === id);

export const nombreOrganizacion = (id: string): string =>
  organizacionDe(id)?.nombre ?? "Organización no registrada";

export const recalcularPlantasVivas = (): void => {
  almacen.variedades = almacen.variedades.map((variedad) => ({
    ...variedad,
    plantasVivas: almacen.plantas.filter(
      (planta) =>
        planta.variedadId === variedad.id &&
        planta.estado !== "COSECHADA" &&
        planta.estado !== "DESTRUIDA",
    ).length,
  }));
};

export const recalcularCupo = (organizacionId: string): void => {
  almacen.cupos = almacen.cupos.map((cupo) => {
    if (cupo.organizacionId !== organizacionId) return cupo;
    const sembradas = almacen.plantas.filter(
      (planta) =>
        planta.organizacionId === organizacionId &&
        planta.estado !== "COSECHADA" &&
        planta.estado !== "DESTRUIDA",
    ).length;
    const ocupacion = cupo.plantasAutorizadas === 0 ? 1 : sembradas / cupo.plantasAutorizadas;
    const vencido = new Date(cupo.vigencia).getTime() < Date.now();
    return {
      ...cupo,
      plantasSembradas: sembradas,
      estado: vencido
        ? "SIN_CUPO"
        : ocupacion >= 1
          ? "AGOTADO"
          : ocupacion > 0.9
            ? "POR_VENCER"
            : "VIGENTE",
    };
  });
};

export const cupoDisponible = (organizacionId: string): CupoMicc | undefined =>
  almacen.cupos.find((cupo) => cupo.organizacionId === organizacionId);
