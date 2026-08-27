import { ErrorApi } from "../problemDetails";
import { normalizar } from "../../i18n/formato";
import {
  ATESTACIONES,
  CULTIVOS,
  EVENTOS,
  LOTES,
  MANIFESTACIONES,
  MEDICOS,
  OFERTAS,
  OFERTAS_PUBLICAS,
  ORGANIZACIONES,
  ORGANIZACION_ACTUAL,
  RUEDAS,
  SERIE_PUBLICACIONES,
} from "./datos";
import { DEPARTAMENTOS, ETAPAS_PROCESO, TOTALES_NACIONALES } from "./catalogos";
import { CITAS, INDICADORES_CLINICOS, NOTAS, PACIENTES, PRESCRIPCIONES } from "./datosClinicos";
import type { Atestacion, Oferta, Organizacion } from "./tipos";

export type Pagina<T> = {
  datos: readonly T[];
  total: number;
  pagina: number;
  porPagina: number;
};

const LATENCIA_MINIMA = 120;
const LATENCIA_MAXIMA = 420;

const demorar = <T,>(valor: T): Promise<T> =>
  new Promise((resolver) =>
    setTimeout(
      () => resolver(valor),
      LATENCIA_MINIMA + Math.random() * (LATENCIA_MAXIMA - LATENCIA_MINIMA),
    ),
  );

export const paginar = <T,>(coleccion: readonly T[], pagina = 1, porPagina = 10): Pagina<T> => ({
  datos: coleccion.slice((pagina - 1) * porPagina, pagina * porPagina),
  total: coleccion.length,
  pagina,
  porPagina,
});

const contiene = (texto: string, consulta: string): boolean =>
  normalizar(texto).includes(normalizar(consulta));

export type FiltroListado = {
  busqueda?: string;
  estado?: string;
  departamento?: string;
  tipo?: string;
  pagina?: number;
  porPagina?: number;
};

export const servidorMock = {
  indicadoresNacionales: () =>
    demorar({
      totales: TOTALES_NACIONALES,
      departamentos: DEPARTAMENTOS,
      etapas: ETAPAS_PROCESO,
      serie: SERIE_PUBLICACIONES,
      atestacionesPorVencer: ATESTACIONES.filter((a) => a.estado === "POR_VENCER").length,
      ofertasPublicadas: OFERTAS_PUBLICAS.length,
      rechazosNormativos: SERIE_PUBLICACIONES.reduce((suma, mes) => suma + mes.rechazos, 0),
      eventosLedger: EVENTOS.length + 148_320,
    }),

  organizacionActual: (id?: string) =>
    demorar(
      (id ? ORGANIZACIONES.find((organizacion) => organizacion.id === id) : undefined) ??
        ORGANIZACION_ACTUAL,
    ),

  organizaciones: (filtro: FiltroListado = {}) => {
    const resultado = ORGANIZACIONES.filter(
      (organizacion) =>
        (!filtro.busqueda ||
          contiene(organizacion.nombre, filtro.busqueda) ||
          contiene(organizacion.nit, filtro.busqueda) ||
          contiene(organizacion.representante, filtro.busqueda)) &&
        (!filtro.estado || organizacion.estado === filtro.estado) &&
        (!filtro.tipo || organizacion.tipo === filtro.tipo) &&
        (!filtro.departamento || organizacion.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina));
  },

  organizacion: (id: string) => {
    const encontrada = ORGANIZACIONES.find((organizacion) => organizacion.id === id);
    if (!encontrada) return rechazarNoEncontrado("Organización", id);
    return demorar(encontrada);
  },

  atestaciones: (filtro: FiltroListado = {}) => {
    const resultado = ATESTACIONES.filter(
      (atestacion) =>
        (!filtro.busqueda ||
          contiene(atestacion.organizacion, filtro.busqueda) ||
          contiene(atestacion.acto, filtro.busqueda)) &&
        (!filtro.estado || atestacion.estado === filtro.estado) &&
        (!filtro.tipo || atestacion.tipo === filtro.tipo),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina));
  },

  cultivos: (filtro: FiltroListado = {}) => {
    const resultado = CULTIVOS.filter(
      (cultivo) =>
        (!filtro.busqueda ||
          contiene(cultivo.nombre, filtro.busqueda) ||
          contiene(cultivo.variedad, filtro.busqueda)) &&
        (!filtro.estado || cultivo.estado === filtro.estado) &&
        (!filtro.departamento || cultivo.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina));
  },

  lotes: (filtro: FiltroListado = {}) => {
    const resultado = LOTES.filter(
      (lote) =>
        (!filtro.busqueda ||
          contiene(lote.codigo, filtro.busqueda) ||
          contiene(lote.organizacion, filtro.busqueda)) &&
        (!filtro.estado || lote.estado === filtro.estado) &&
        (!filtro.tipo || lote.tipo === filtro.tipo) &&
        (!filtro.departamento || lote.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina));
  },

  ofertas: (filtro: FiltroListado = {}) => {
    const resultado = OFERTAS.filter(
      (oferta) =>
        (!filtro.busqueda ||
          contiene(oferta.titulo, filtro.busqueda) ||
          contiene(oferta.organizacion, filtro.busqueda)) &&
        (!filtro.estado || oferta.estado === filtro.estado) &&
        (!filtro.departamento || oferta.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina));
  },

  oferta: (id: string) => {
    const encontrada = OFERTAS.find((oferta) => oferta.id === id);
    if (!encontrada) return rechazarNoEncontrado("Oferta", id);
    return demorar(encontrada);
  },

  publicarOferta: (borrador: {
    organizacionId: string;
    tipoProducto: string;
    titulo: string;
    departamento: string;
    municipio: string;
    disponibilidad: string;
    descripcion: string;
  }) => {
    const habilitante = atestacionHabilitante(borrador.organizacionId, borrador.tipoProducto);
    if (!habilitante) {
      return Promise.reject(
        new ErrorApi({
          type: "https://sicamed.co/problemas/habilitacion-no-vigente",
          title: "Publicación rechazada por falta de habilitación vigente",
          detail:
            "La organización no tiene una atestación de licencia vigente para el tipo de producto " +
            "de esta oferta. Registra la atestación con su evidencia documental y vuelve a " +
            "intentar la publicación.",
          status: 422,
          norma: "Res. 1241/2026 Art. 13b",
          accion: { etiqueta: "Ver mis licencias", ruta: "/app/licencias" },
        }),
      );
    }
    return demorar({
      id: `OFE-${Date.now()}`,
      estado: "PUBLICADA" as const,
      atestacionId: habilitante.id,
    });
  },

  manifestaciones: () => demorar(MANIFESTACIONES),

  eventos: (filtro: FiltroListado = {}) => {
    const resultado = EVENTOS.filter(
      (evento) =>
        (!filtro.busqueda ||
          contiene(evento.descripcion, filtro.busqueda) ||
          contiene(evento.actor, filtro.busqueda) ||
          contiene(evento.huella, filtro.busqueda)) &&
        (!filtro.tipo || evento.tipo === filtro.tipo),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 12));
  },

  ruedas: () => demorar(RUEDAS),

  medicos: (filtro: FiltroListado = {}) => {
    const resultado = MEDICOS.filter(
      (medico) =>
        (!filtro.busqueda ||
          contiene(medico.nombre, filtro.busqueda) ||
          contiene(medico.rethus, filtro.busqueda) ||
          contiene(medico.especialidad, filtro.busqueda)) &&
        (!filtro.estado || medico.estado === filtro.estado) &&
        (!filtro.departamento || medico.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 8));
  },

  directorio: (busqueda = "") => {
    const filtrar = <T extends { nombre: string }>(coleccion: readonly T[]) =>
      busqueda ? coleccion.filter((item) => contiene(item.nombre, busqueda)) : coleccion;
    return demorar({
      proveedores: filtrar(
        ORGANIZACIONES.filter((o) => o.tipo === "CULTIVADOR" || o.tipo === "TRANSFORMADOR"),
      ),
      dispensadores: filtrar(ORGANIZACIONES.filter((o) => o.tipo === "DISPENSADOR")),
      prestadores: filtrar(
        ORGANIZACIONES.filter((o) => o.tipo === "IPS" || o.tipo === "LABORATORIO"),
      ),
      medicos: filtrar(MEDICOS),
      totales: TOTALES_NACIONALES,
    });
  },

  reportes: () =>
    demorar({
      serie: SERIE_PUBLICACIONES,
      departamentos: DEPARTAMENTOS,
      etapas: ETAPAS_PROCESO,
      porTipoActor: [
        { etiqueta: "Cultivadores", valor: ORGANIZACIONES.filter((o) => o.tipo === "CULTIVADOR").length },
        { etiqueta: "Transformadores", valor: ORGANIZACIONES.filter((o) => o.tipo === "TRANSFORMADOR").length },
        { etiqueta: "Dispensadores", valor: ORGANIZACIONES.filter((o) => o.tipo === "DISPENSADOR").length },
        { etiqueta: "IPS", valor: ORGANIZACIONES.filter((o) => o.tipo === "IPS").length },
        { etiqueta: "Laboratorios", valor: ORGANIZACIONES.filter((o) => o.tipo === "LABORATORIO").length },
      ],
      cumplimiento: [
        { etiqueta: "Vigentes", valor: ATESTACIONES.filter((a) => a.estado === "VIGENTE").length },
        { etiqueta: "Por vencer", valor: ATESTACIONES.filter((a) => a.estado === "POR_VENCER").length },
        { etiqueta: "Vencidas", valor: ATESTACIONES.filter((a) => a.estado === "VENCIDA").length },
        { etiqueta: "En trámite", valor: ATESTACIONES.filter((a) => a.estado === "EN_TRAMITE").length },
      ],
    }),
};

export const servidorMockClinico = {
  indicadores: () => demorar(INDICADORES_CLINICOS),

  pacientes: (filtro: FiltroListado = {}) => {
    const resultado = PACIENTES.filter(
      (paciente) =>
        (!filtro.busqueda ||
          contiene(paciente.nombre, filtro.busqueda) ||
          contiene(paciente.diagnostico, filtro.busqueda) ||
          contiene(paciente.documento, filtro.busqueda)) &&
        (!filtro.estado || paciente.estado === filtro.estado) &&
        (!filtro.departamento || paciente.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 8));
  },

  paciente: (id: string) => {
    const encontrado = PACIENTES.find((paciente) => paciente.id === id);
    if (!encontrado) return rechazarNoEncontrado("Paciente", id);
    return demorar({
      paciente: encontrado,
      citas: CITAS.filter((cita) => cita.pacienteId === id),
      prescripciones: PRESCRIPCIONES.filter((prescripcion) => prescripcion.pacienteId === id),
      notas: NOTAS.filter((nota) => nota.pacienteId === id),
    });
  },

  agenda: (filtro: FiltroListado = {}) => {
    const resultado = CITAS.filter(
      (cita) =>
        (!filtro.busqueda ||
          contiene(cita.paciente, filtro.busqueda) ||
          contiene(cita.profesional, filtro.busqueda)) &&
        (!filtro.estado || cita.estado === filtro.estado) &&
        (!filtro.tipo || cita.modalidad === filtro.tipo),
    );
    return demorar([...resultado].sort((a, b) => a.fecha.localeCompare(b.fecha)));
  },

  teleconsultas: () =>
    demorar(
      CITAS.filter((cita) => cita.modalidad === "TELECONSULTA").sort((a, b) =>
        a.fecha.localeCompare(b.fecha),
      ),
    ),
};

const rechazarNoEncontrado = (entidad: string, id: string): Promise<never> =>
  Promise.reject(
    new ErrorApi({
      type: "https://sicamed.co/problemas/recurso-no-encontrado",
      title: `${entidad} no encontrada`,
      detail: `No existe un registro de ${entidad.toLowerCase()} con el identificador ${id}, o no tienes permiso para consultarlo.`,
      status: 404,
    }),
  );

const TIPO_PRODUCTO_A_ATESTACION: Record<string, Atestacion["tipo"]> = {
  "Flor seca no psicoactiva": "CULTIVO_NO_PSICOACTIVO",
  "Semilla certificada": "CULTIVO_NO_PSICOACTIVO",
  "Biomasa vegetal": "CULTIVO_NO_PSICOACTIVO",
  "Flor seca psicoactiva": "CULTIVO_PSICOACTIVO",
  "Extracto de espectro completo": "FABRICACION_DERIVADOS",
  "Aceite estandarizado CBD": "FABRICACION_DERIVADOS",
  "Aceite estandarizado THC:CBD": "FABRICACION_DERIVADOS",
  "Fórmula magistral": "DISPENSACION",
};

export const atestacionHabilitante = (
  organizacionId: string,
  tipoProducto: string,
): Atestacion | undefined => {
  const requerida = TIPO_PRODUCTO_A_ATESTACION[tipoProducto];
  if (!requerida) return undefined;
  return ATESTACIONES.find(
    (atestacion) =>
      atestacion.organizacionId === organizacionId &&
      atestacion.tipo === requerida &&
      (atestacion.estado === "VIGENTE" || atestacion.estado === "POR_VENCER"),
  );
};

export const ofertasPublicasMock = (filtro: {
  busqueda?: string;
  departamento?: string;
  tipoProducto?: string;
}): readonly Oferta[] =>
  OFERTAS_PUBLICAS.filter(
    (oferta) =>
      (!filtro.busqueda ||
        contiene(oferta.titulo, filtro.busqueda) ||
        contiene(oferta.organizacion, filtro.busqueda) ||
        contiene(oferta.tipoProducto, filtro.busqueda)) &&
      (!filtro.departamento || oferta.departamento === filtro.departamento) &&
      (!filtro.tipoProducto || oferta.tipoProducto === filtro.tipoProducto),
  );

export const organizacionPorId = (id: string): Organizacion | undefined =>
  ORGANIZACIONES.find((organizacion) => organizacion.id === id);
