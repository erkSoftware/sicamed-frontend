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
  SoporteSimulado,
  Transformacion,
  Variedad,
} from "./tipos";

const CLAVE_ALMACEN = "sicamed.almacen-simulado";

const CLAVE_PROPIO = "sicamed.almacen-propio";

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
  soportes: [] as SoporteSimulado[],
  discrepancias: [...discrepanciasSemilla(CONEXIONES)] as Discrepancia[],
  politicaVersion: "POL-2026.1",
};

type Almacen = typeof semilla;

const vacia = (): Almacen => {
  const partida = structuredClone(semilla);
  for (const clave of Object.keys(partida) as (keyof Almacen)[]) {
    const valor = partida[clave];
    if (Array.isArray(valor)) (partida[clave] as unknown[]).length = 0;
  }
  return partida;
};

const persistible = (): boolean =>
  modoMock && typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const restaurar = (clave: string, base: Almacen): Almacen => {
  if (!persistible()) return base;
  try {
    const guardado = window.sessionStorage.getItem(clave);
    if (!guardado) return base;
    return { ...base, ...(JSON.parse(guardado) as Partial<Almacen>) };
  } catch {
    return base;
  }
};

const demostracion = restaurar(CLAVE_ALMACEN, semilla);
const propio = restaurar(CLAVE_PROPIO, vacia());

let sinSemilla = false;

export const fijarAlmacenPropio = (valor: boolean): void => {
  sinSemilla = valor;
};

export const usaAlmacenPropio = (): boolean => sinSemilla;

const activo = (): Almacen => (sinSemilla ? propio : demostracion);

export const almacen: Almacen = new Proxy(demostracion, {
  get: (_destino, clave) => activo()[clave as keyof Almacen],
  set: (_destino, clave, valor) => {
    activo()[clave as keyof Almacen] = valor as never;
    return true;
  },
  ownKeys: () => Reflect.ownKeys(activo()),
  getOwnPropertyDescriptor: (_destino, clave) =>
    Object.getOwnPropertyDescriptor(activo(), clave) ?? {
      configurable: true,
      enumerable: true,
      value: undefined,
    },
});

export const guardarAlmacen = (): void => {
  if (!persistible()) return;
  try {
    window.sessionStorage.setItem(
      sinSemilla ? CLAVE_PROPIO : CLAVE_ALMACEN,
      JSON.stringify(activo()),
    );
  } catch {
    return;
  }
};

export const reiniciarAlmacen = (): void => {
  Object.assign(demostracion, structuredClone(semilla));
  Object.assign(propio, vacia());
  if (!persistible()) return;
  window.sessionStorage.removeItem(CLAVE_ALMACEN);
  window.sessionStorage.removeItem(CLAVE_PROPIO);
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
