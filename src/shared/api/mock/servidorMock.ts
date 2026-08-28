import { ErrorApi } from "../problemDetails";
import { normalizar } from "../../i18n/formato";
import {
  almacen,
  ahora,
  cupoDisponible,
  nombreOrganizacion,
  nuevaHuella,
  recalcularCupo,
  recalcularPlantasVivas,
  registrarEvento,
  siguienteId,
} from "./almacen";
import { OFERTAS_PUBLICAS, SERIE_PUBLICACIONES } from "./datos";
import { NOMBRE_DOCUMENTO } from "./datosProceso";
import type { DocumentoAdjunto } from "./tipos";
import { DEPARTAMENTOS, ETAPAS_PROCESO, TOTALES_NACIONALES } from "./catalogos";
import { CITAS, INDICADORES_CLINICOS, NOTAS, PACIENTES, PRESCRIPCIONES } from "./datosClinicos";
import type {
  Atestacion,
  CausalDestruccion,
  DocumentoExpediente,
  EstadoBeneficio,
  EstadoCuenta,
  EstadoCultivo,
  EstadoDocumento,
  EstadoLote,
  Expediente,
  Oferta,
  Organizacion,
  PasoVerificacion,
  RolPlataforma,
  TipoActor,
  TipoLabor,
  TipoLote,
} from "./tipos";

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

const rechazar = (problema: {
  type: string;
  title: string;
  detail: string;
  status: number;
  norma?: string;
  accion?: { etiqueta: string; ruta: string };
}): Promise<never> => Promise.reject(new ErrorApi(problema));

const rechazarNoEncontrado = (entidad: string, id: string): Promise<never> =>
  rechazar({
    type: "https://sicamed.co/problemas/recurso-no-encontrado",
    title: `${entidad} no encontrada`,
    detail: `No existe un registro de ${entidad.toLowerCase()} con el identificador ${id}, o no tienes permiso para consultarlo.`,
    status: 404,
  });

export type FiltroListado = {
  busqueda?: string;
  estado?: string;
  departamento?: string;
  tipo?: string;
  pagina?: number;
  porPagina?: number;
};

export type Autor = {
  usuarioId: string;
  nombre: string;
  organizacionId: string;
  rol: RolPlataforma;
};

const dias = (fecha: string): number =>
  Math.round((new Date(fecha).getTime() - Date.now()) / 86_400_000);

export const servidorMock = {
  indicadoresNacionales: () =>
    demorar({
      totales: TOTALES_NACIONALES,
      departamentos: DEPARTAMENTOS,
      etapas: ETAPAS_PROCESO,
      serie: SERIE_PUBLICACIONES,
      atestacionesPorVencer: almacen.atestaciones.filter((a) => a.estado === "POR_VENCER").length,
      ofertasPublicadas: almacen.ofertas.filter((oferta) => oferta.estado === "PUBLICADA").length,
      rechazosNormativos: SERIE_PUBLICACIONES.reduce((suma, mes) => suma + mes.rechazos, 0),
      eventosLedger: almacen.eventos.length + 148_320,
    }),

  organizacionActual: (id?: string) =>
    demorar(
      (id ? almacen.organizaciones.find((organizacion) => organizacion.id === id) : undefined) ??
        (almacen.organizaciones[5] as Organizacion),
    ),

  organizaciones: (filtro: FiltroListado = {}) => {
    const resultado = almacen.organizaciones.filter(
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
    const encontrada = almacen.organizaciones.find((organizacion) => organizacion.id === id);
    if (!encontrada) return rechazarNoEncontrado("Organización", id);
    return demorar(encontrada);
  },

  actualizarOrganizacion: (entrada: {
    id: string;
    representante: string;
    correo: string;
    telefono: string;
    municipio: string;
    autor: Autor;
  }) => {
    const indice = almacen.organizaciones.findIndex(
      (organizacion) => organizacion.id === entrada.id,
    );
    if (indice < 0) return rechazarNoEncontrado("Organización", entrada.id);
    const previa = almacen.organizaciones[indice] as Organizacion;
    const actualizada: Organizacion = {
      ...previa,
      representante: entrada.representante,
      correo: entrada.correo,
      telefono: entrada.telefono,
      municipio: entrada.municipio,
    };
    almacen.organizaciones[indice] = actualizada;
    registrarEvento({
      tipo: "ORGANIZACION_ACTUALIZADA",
      descripcion: `Se actualizó la ficha de ${actualizada.nombre}`,
      entidad: "Organización",
      entidadId: actualizada.id,
      actor: entrada.autor.nombre,
      organizacionId: actualizada.id,
    });
    return demorar(actualizada);
  },

  atestaciones: (filtro: FiltroListado = {}) => {
    const resultado = almacen.atestaciones.filter(
      (atestacion) =>
        (!filtro.busqueda ||
          contiene(atestacion.organizacion, filtro.busqueda) ||
          contiene(atestacion.acto, filtro.busqueda)) &&
        (!filtro.estado || atestacion.estado === filtro.estado) &&
        (!filtro.tipo || atestacion.tipo === filtro.tipo),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina));
  },

  registrarAtestacion: (entrada: {
    organizacionId: string;
    tipo: Atestacion["tipo"];
    acto: string;
    autoridad: string;
    expedicion: string;
    vencimiento: string;
    evidencia: string;
    expedienteId: string | null;
    autor: Autor;
  }) => {
    const expediente = entrada.expedienteId
      ? almacen.expedientes.find((registro) => registro.id === entrada.expedienteId)
      : undefined;
    if (entrada.expedienteId && expediente?.estado !== "APROBADO") {
      return rechazar({
        type: "https://sicamed.co/problemas/atestacion-sin-origen-probatorio",
        title: "No se puede registrar la atestación desde este expediente",
        detail:
          "Una atestación solo nace de una sincronización con fuente autoritativa o de un expediente " +
          "cuya evidencia documental ya fue verificada. Este expediente todavía no alcanzó ese estado.",
        status: 422,
        norma: "Res. 1241/2026 Art. 13b · origen DOCUMENTAL_VERIFICADA",
        accion: { etiqueta: "Ver expedientes", ruta: "/app/expedientes" },
      });
    }
    const restantes = dias(entrada.vencimiento);
    const atestacion: Atestacion = {
      id: siguienteId("ATT"),
      organizacionId: entrada.organizacionId,
      organizacion: nombreOrganizacion(entrada.organizacionId),
      tipo: entrada.tipo,
      acto: entrada.acto,
      autoridad: entrada.autoridad,
      expedicion: entrada.expedicion,
      vencimiento: entrada.vencimiento,
      estado: restantes < 0 ? "VENCIDA" : restantes < 45 ? "POR_VENCER" : "VIGENTE",
      evidencia: entrada.evidencia,
      huella: nuevaHuella(),
    };
    almacen.atestaciones.unshift(atestacion);
    registrarEvento({
      tipo: "ATESTACION_REGISTRADA",
      descripcion: `Se registró atestación ${entrada.acto} con evidencia documental verificada`,
      entidad: "Atestación",
      entidadId: atestacion.id,
      actor: entrada.autor.nombre,
      organizacionId: entrada.organizacionId,
    });
    return demorar(atestacion);
  },

  cultivos: (filtro: FiltroListado = {}) => {
    const resultado = almacen.cultivos.filter(
      (cultivo) =>
        (!filtro.busqueda ||
          contiene(cultivo.nombre, filtro.busqueda) ||
          contiene(cultivo.variedad, filtro.busqueda)) &&
        (!filtro.estado || cultivo.estado === filtro.estado) &&
        (!filtro.departamento || cultivo.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina));
  },

  registrarCultivo: (entrada: {
    nombre: string;
    organizacionId: string;
    departamento: string;
    municipio: string;
    variedad: string;
    areaHectareas: number;
    plantas: number;
    siembra: string;
    cosechaEstimada: string;
    autor: Autor;
  }) => {
    const variedad = almacen.variedades.find((registro) => registro.nombre === entrada.variedad);
    const psicoactivo = variedad?.tipo === "PSICOACTIVO";
    const cupo = cupoDisponible(entrada.organizacionId);

    if (psicoactivo && !cupo) {
      return rechazar({
        type: "https://sicamed.co/problemas/sin-cupo-asignado",
        title: "Siembra rechazada por ausencia de cupo asignado",
        detail:
          "La organización no tiene un cupo de plantas asignado por el MICC para la modalidad " +
          "psicoactiva. El cupo se asigna por número de plantas y debe estar vigente antes de sembrar.",
        status: 422,
        norma: "Dec. 1138/2025 Art. 3 · cupo asignado por el MICC",
        accion: { etiqueta: "Ver cupos", ruta: "/app/cupos" },
      });
    }

    if (cupo && cupo.plantasSembradas + entrada.plantas > cupo.plantasAutorizadas) {
      const excedente = cupo.plantasSembradas + entrada.plantas - cupo.plantasAutorizadas;
      return rechazar({
        type: "https://sicamed.co/problemas/cupo-excedido",
        title: "Siembra rechazada por exceder el cupo autorizado",
        detail:
          `El cupo asignado autoriza ${cupo.plantasAutorizadas.toLocaleString("es-CO")} plantas y la ` +
          `organización ya tiene ${cupo.plantasSembradas.toLocaleString("es-CO")} en pie. Registrar este ` +
          `predio excedería el cupo en ${excedente.toLocaleString("es-CO")} plantas.`,
        status: 422,
        norma: "Dec. 1138/2025 Art. 3 · el régimen de cupos opera por número de plantas",
        accion: { etiqueta: "Ver cupos", ruta: "/app/cupos" },
      });
    }

    const cultivo = {
      id: siguienteId("CUL"),
      nombre: entrada.nombre,
      organizacionId: entrada.organizacionId,
      organizacion: nombreOrganizacion(entrada.organizacionId),
      departamento: entrada.departamento,
      municipio: entrada.municipio,
      variedad: entrada.variedad,
      psicoactivo,
      areaHectareas: entrada.areaHectareas,
      plantas: entrada.plantas,
      estado: "PREPARACION" as EstadoCultivo,
      siembra: entrada.siembra,
      cosechaEstimada: entrada.cosechaEstimada,
    };
    almacen.cultivos.unshift(cultivo);
    registrarEvento({
      tipo: "CULTIVO_REGISTRADO",
      descripcion: `Se registró el predio ${entrada.nombre} con ${entrada.plantas.toLocaleString("es-CO")} plantas proyectadas`,
      entidad: "Cultivo",
      entidadId: cultivo.id,
      actor: entrada.autor.nombre,
      organizacionId: entrada.organizacionId,
    });
    return demorar(cultivo);
  },

  cambiarEtapaCultivo: (entrada: { id: string; estado: EstadoCultivo; autor: Autor }) => {
    const indice = almacen.cultivos.findIndex((cultivo) => cultivo.id === entrada.id);
    if (indice < 0) return rechazarNoEncontrado("Cultivo", entrada.id);
    const previo = almacen.cultivos[indice];
    if (!previo) return rechazarNoEncontrado("Cultivo", entrada.id);
    const actualizado = { ...previo, estado: entrada.estado };
    almacen.cultivos[indice] = actualizado;
    registrarEvento({
      tipo: "CULTIVO_CAMBIO_ETAPA",
      descripcion: `El predio ${previo.nombre} pasó de ${previo.estado} a ${entrada.estado}`,
      entidad: "Cultivo",
      entidadId: previo.id,
      actor: entrada.autor.nombre,
      organizacionId: previo.organizacionId,
    });
    return demorar(actualizado);
  },

  lotes: (filtro: FiltroListado = {}) => {
    const resultado = almacen.lotes.filter(
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

  registrarLote: (entrada: {
    organizacionId: string;
    cultivoId: string;
    tipo: TipoLote;
    cantidad: number;
    unidad: string;
    thc: number;
    cbd: number;
    bodega: string;
    departamento: string;
    vencimiento: string;
    autor: Autor;
  }) => {
    const lote = {
      id: siguienteId("LOT"),
      codigo: `L-2026-${String(4000 + almacen.lotes.length)}`,
      cultivoId: entrada.cultivoId,
      organizacionId: entrada.organizacionId,
      organizacion: nombreOrganizacion(entrada.organizacionId),
      tipo: entrada.tipo,
      cantidad: entrada.cantidad,
      unidad: entrada.unidad,
      estado: "EN_BODEGA" as EstadoLote,
      thc: entrada.thc,
      cbd: entrada.cbd,
      bodega: entrada.bodega,
      departamento: entrada.departamento,
      fecha: ahora(),
      vencimiento: entrada.vencimiento,
    };
    almacen.lotes.unshift(lote);
    registrarEvento({
      tipo: "LOTE_CREADO",
      descripcion: `Se creó el lote ${lote.codigo} con ${entrada.cantidad} ${entrada.unidad}`,
      entidad: "Lote",
      entidadId: lote.id,
      actor: entrada.autor.nombre,
      organizacionId: entrada.organizacionId,
    });
    return demorar(lote);
  },

  moverLote: (entrada: {
    id: string;
    estado: EstadoLote;
    bodega: string;
    motivo: string;
    autor: Autor;
  }) => {
    const indice = almacen.lotes.findIndex((lote) => lote.id === entrada.id);
    if (indice < 0) return rechazarNoEncontrado("Lote", entrada.id);
    const previo = almacen.lotes[indice];
    if (!previo) return rechazarNoEncontrado("Lote", entrada.id);
    if (previo.estado === "DESTRUIDO") {
      return rechazar({
        type: "https://sicamed.co/problemas/lote-destruido",
        title: "El lote ya fue destruido",
        detail:
          "Un lote con acta de destrucción registrada no admite movimientos posteriores. El ledger " +
          "no se reescribe: la disposición final es un estado terminal.",
        status: 409,
        norma: "Dec. 1138/2025 Art. 11 · disposición final",
      });
    }
    const actualizado = { ...previo, estado: entrada.estado, bodega: entrada.bodega };
    almacen.lotes[indice] = actualizado;
    registrarEvento({
      tipo: "LOTE_TRASLADADO",
      descripcion: `El lote ${previo.codigo} pasó a ${entrada.estado} · ${entrada.motivo}`,
      entidad: "Lote",
      entidadId: previo.id,
      actor: entrada.autor.nombre,
      organizacionId: previo.organizacionId,
    });
    return demorar(actualizado);
  },

  ofertas: (filtro: FiltroListado = {}) => {
    const resultado = almacen.ofertas.filter(
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
    const encontrada = almacen.ofertas.find((oferta) => oferta.id === id);
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
    autor?: Autor;
  }) => {
    const habilitante = atestacionHabilitante(borrador.organizacionId, borrador.tipoProducto);
    if (!habilitante) {
      return rechazar({
        type: "https://sicamed.co/problemas/habilitacion-no-vigente",
        title: "Publicación rechazada por falta de habilitación vigente",
        detail:
          "La organización no tiene una atestación de licencia vigente para el tipo de producto " +
          "de esta oferta. Registra la atestación con su evidencia documental y vuelve a " +
          "intentar la publicación.",
        status: 422,
        norma: "Res. 1241/2026 Art. 13b",
        accion: { etiqueta: "Ver mis licencias", ruta: "/app/licencias" },
      });
    }
    const organizacion = almacen.organizaciones.find(
      (registro) => registro.id === borrador.organizacionId,
    );
    const oferta: Oferta = {
      id: siguienteId("OFE"),
      titulo: borrador.titulo,
      tipoProducto: borrador.tipoProducto,
      organizacionId: borrador.organizacionId,
      organizacion: nombreOrganizacion(borrador.organizacionId),
      tipoActor: organizacion?.tipo ?? "CULTIVADOR",
      departamento: borrador.departamento,
      municipio: borrador.municipio,
      estado: "PUBLICADA",
      disponibilidad: borrador.disponibilidad as Oferta["disponibilidad"],
      publicada: ahora(),
      vigencia: new Date(Date.now() + 180 * 86_400_000).toISOString(),
      descripcion: borrador.descripcion,
      certificaciones: ["Sello de trazabilidad SICAMED"],
      interesados: 0,
    };
    almacen.ofertas.unshift(oferta);
    registrarEvento({
      tipo: "OFERTA_PUBLICADA",
      descripcion: `Se publicó la oferta ${borrador.titulo} en la vitrina`,
      entidad: "Oferta",
      entidadId: oferta.id,
      actor: borrador.autor?.nombre ?? "Representante legal",
      organizacionId: borrador.organizacionId,
    });
    return demorar({ id: oferta.id, estado: "PUBLICADA" as const, atestacionId: habilitante.id });
  },

  manifestaciones: () => demorar(almacen.manifestaciones),

  manifestarInteres: (entrada: {
    ofertaId: string;
    solicitante: string;
    departamento: string;
    autor: Autor;
  }) => {
    const oferta = almacen.ofertas.find((registro) => registro.id === entrada.ofertaId);
    if (!oferta) return rechazarNoEncontrado("Oferta", entrada.ofertaId);
    if (oferta.estado !== "PUBLICADA") {
      return rechazar({
        type: "https://sicamed.co/problemas/oferta-no-divulgada",
        title: "La oferta no está divulgada",
        detail:
          "Solo se puede manifestar interés sobre una oferta publicada. Una oferta en borrador, " +
          "cerrada o suspendida no es visible para el resto del ecosistema.",
        status: 409,
        norma: "Res. 1241/2026 Art. 8",
      });
    }
    const manifestacion = {
      id: siguienteId("MIN"),
      ofertaId: oferta.id,
      oferta: oferta.titulo,
      solicitante: entrada.solicitante,
      departamento: entrada.departamento,
      fecha: ahora(),
      estado: "NUEVA" as const,
    };
    almacen.manifestaciones.unshift(manifestacion);
    const indice = almacen.ofertas.findIndex((registro) => registro.id === oferta.id);
    almacen.ofertas[indice] = { ...oferta, interesados: oferta.interesados + 1 };
    registrarEvento({
      tipo: "INTERES_MANIFESTADO",
      descripcion: `${entrada.solicitante} manifestó interés sobre ${oferta.titulo}`,
      entidad: "Oferta",
      entidadId: oferta.id,
      actor: entrada.autor.nombre,
      organizacionId: oferta.organizacionId,
    });
    return demorar(manifestacion);
  },

  habilitarContacto: (entrada: { id: string; autor: Autor }) => {
    const indice = almacen.manifestaciones.findIndex((registro) => registro.id === entrada.id);
    if (indice < 0) return rechazarNoEncontrado("Manifestación", entrada.id);
    const previa = almacen.manifestaciones[indice];
    if (!previa) return rechazarNoEncontrado("Manifestación", entrada.id);
    const actualizada = { ...previa, estado: "HABILITADA" as const };
    almacen.manifestaciones[indice] = actualizada;

    const oferta = almacen.ofertas.find((registro) => registro.id === previa.ofertaId);
    const via = viaDeCierre(oferta?.tipoProducto ?? "");
    const referencia = ENTIDAD_POR_VIA[via];
    almacen.cierres.unshift({
      id: siguienteId("CEX"),
      ofertaId: previa.ofertaId,
      oferta: previa.oferta,
      tipoProducto: oferta?.tipoProducto ?? "",
      tipo: via === "FNE" ? "PSICOACTIVO" : "NO_PSICOACTIVO",
      organizacion: oferta?.organizacion ?? "",
      contraparte: previa.solicitante,
      departamento: previa.departamento,
      via,
      entidad: referencia.entidad,
      norma: referencia.norma,
      estado: "CONTACTO_HABILITADO",
      habilitado: ahora(),
      declarado: null,
      movimiento: null,
    });

    registrarEvento({
      tipo: "CONTACTO_HABILITADO",
      descripcion: `Se habilitó el canal de contacto con ${previa.solicitante}. El cierre de la operación ocurre fuera de SICAMED`,
      entidad: "Oferta",
      entidadId: previa.ofertaId,
      actor: entrada.autor.nombre,
      organizacionId: oferta?.organizacionId ?? entrada.autor.organizacionId,
    });
    return demorar(actualizada);
  },

  eventos: (filtro: FiltroListado = {}) => {
    const resultado = almacen.eventos.filter(
      (evento) =>
        (!filtro.busqueda ||
          contiene(evento.descripcion, filtro.busqueda) ||
          contiene(evento.actor, filtro.busqueda) ||
          contiene(evento.huella, filtro.busqueda)) &&
        (!filtro.tipo || evento.tipo === filtro.tipo),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 12));
  },

  ruedas: () => demorar(almacen.ruedas),

  inscribirRueda: (entrada: { id: string; autor: Autor }) => {
    const indice = almacen.ruedas.findIndex((rueda) => rueda.id === entrada.id);
    if (indice < 0) return rechazarNoEncontrado("Rueda de negocio", entrada.id);
    const previa = almacen.ruedas[indice];
    if (!previa) return rechazarNoEncontrado("Rueda de negocio", entrada.id);
    if (previa.estado === "CERRADA") {
      return rechazar({
        type: "https://sicamed.co/problemas/convocatoria-cerrada",
        title: "La convocatoria está cerrada",
        detail: "Esta rueda de negocios ya cerró inscripciones y no admite nuevos participantes.",
        status: 409,
      });
    }
    if (previa.inscritos >= previa.cupos) {
      return rechazar({
        type: "https://sicamed.co/problemas/sin-cupos",
        title: "No quedan cupos disponibles",
        detail: `La convocatoria ofrece ${previa.cupos} cupos y ya están todos asignados.`,
        status: 409,
      });
    }
    const actualizada = { ...previa, inscritos: previa.inscritos + 1 };
    almacen.ruedas[indice] = actualizada;
    registrarEvento({
      tipo: "RUEDA_INSCRIPCION",
      descripcion: `Se inscribió un actor en ${previa.nombre}`,
      entidad: "Rueda",
      entidadId: previa.id,
      actor: entrada.autor.nombre,
      organizacionId: entrada.autor.organizacionId,
    });
    return demorar(actualizada);
  },

  medicos: (filtro: FiltroListado = {}) => {
    const resultado = almacen.medicos.filter(
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
        almacen.organizaciones.filter((o) => o.tipo === "CULTIVADOR" || o.tipo === "TRANSFORMADOR"),
      ),
      dispensadores: filtrar(almacen.organizaciones.filter((o) => o.tipo === "DISPENSADOR")),
      prestadores: filtrar(
        almacen.organizaciones.filter((o) => o.tipo === "IPS" || o.tipo === "LABORATORIO"),
      ),
      medicos: filtrar(almacen.medicos),
      totales: TOTALES_NACIONALES,
    });
  },

  variedades: () => demorar(almacen.variedades),

  agroinsumos: () => demorar(almacen.agroinsumos),

  plantas: (filtro: FiltroListado = {}) => {
    const resultado = almacen.plantas.filter(
      (planta) =>
        (!filtro.busqueda ||
          contiene(planta.codigo, filtro.busqueda) ||
          contiene(planta.variedad, filtro.busqueda) ||
          contiene(planta.cultivo, filtro.busqueda) ||
          contiene(planta.madre ?? "", filtro.busqueda)) &&
        (!filtro.estado || planta.estado === filtro.estado) &&
        (!filtro.tipo || planta.origen === filtro.tipo) &&
        (!filtro.departamento || planta.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 10));
  },

  planta: (id: string) => {
    const encontrada = almacen.plantas.find((planta) => planta.id === id);
    if (!encontrada) return rechazarNoEncontrado("Planta", id);
    return demorar({
      planta: encontrada,
      labores: almacen.labores.filter((labor) => labor.plantaId === id),
      madre: encontrada.madre
        ? (almacen.plantas.find((planta) => planta.codigo === encontrada.madre) ?? null)
        : null,
      clones: almacen.plantas.filter((planta) => planta.madre === encontrada.codigo),
    });
  },

  registrarPlanta: (entrada: {
    cultivoId: string;
    variedadId: string;
    origen: "SEMILLA" | "CLON";
    madre: string | null;
    bloque: string;
    siembra: string;
    autor: Autor;
  }) => {
    const cultivo = almacen.cultivos.find((registro) => registro.id === entrada.cultivoId);
    if (!cultivo) return rechazarNoEncontrado("Cultivo", entrada.cultivoId);
    const variedad = almacen.variedades.find((registro) => registro.id === entrada.variedadId);
    if (!variedad) return rechazarNoEncontrado("Variedad", entrada.variedadId);

    if (entrada.origen === "CLON") {
      const madre = almacen.plantas.find((planta) => planta.codigo === entrada.madre);
      if (!madre) {
        return rechazar({
          type: "https://sicamed.co/problemas/madre-inexistente",
          title: "El clon exige una planta madre registrada",
          detail:
            "Toda planta de origen CLON debe declarar el código de su planta madre, y esa madre debe " +
            "existir en el registro. Sin genealogía la cadena de origen queda rota.",
          status: 422,
          norma: "Res. 1241/2026 Art. 12 · material de propagación",
        });
      }
      if (madre.origen !== "SEMILLA") {
        return rechazar({
          type: "https://sicamed.co/problemas/madre-invalida",
          title: "La planta madre declarada no proviene de semilla",
          detail:
            `La planta ${madre.codigo} tiene origen CLON. La genealogía debe remontarse a una planta ` +
            "madre de origen SEMILLA para que el material de propagación sea trazable hasta su fuente.",
          status: 422,
          norma: "Res. 1241/2026 Art. 12 y 20",
        });
      }
    }

    const cupo = cupoDisponible(cultivo.organizacionId);
    if (cupo && cupo.plantasSembradas + 1 > cupo.plantasAutorizadas) {
      return rechazar({
        type: "https://sicamed.co/problemas/cupo-excedido",
        title: "Siembra rechazada por exceder el cupo autorizado",
        detail:
          `El cupo ${cupo.actoAsignacion} autoriza ${cupo.plantasAutorizadas.toLocaleString("es-CO")} ` +
          `plantas y la organización ya tiene ${cupo.plantasSembradas.toLocaleString("es-CO")} en pie.`,
        status: 422,
        norma: "Dec. 1138/2025 Art. 3 · el régimen de cupos opera por número de plantas",
        accion: { etiqueta: "Ver cupos", ruta: "/app/cupos" },
      });
    }

    const planta = {
      id: siguienteId("PLT"),
      codigo: `PL-2026-${String(900000 + almacen.plantas.length).padStart(6, "0")}`,
      variedadId: variedad.id,
      variedad: variedad.nombre,
      tipo: variedad.tipo,
      cultivoId: cultivo.id,
      cultivo: cultivo.nombre,
      organizacionId: cultivo.organizacionId,
      departamento: cultivo.departamento,
      origen: entrada.origen,
      madre: entrada.origen === "CLON" ? entrada.madre : null,
      estado: "PROPAGACION" as const,
      siembra: entrada.siembra,
      bloque: entrada.bloque,
      labores: 0,
      aptaDesde: entrada.siembra,
      huella: nuevaHuella(),
    };
    almacen.plantas.unshift(planta);
    recalcularPlantasVivas();
    recalcularCupo(cultivo.organizacionId);
    registrarEvento({
      tipo: "PLANTA_REGISTRADA",
      descripcion: `Se registró la planta ${planta.codigo} (${entrada.origen.toLowerCase()}) en ${cultivo.nombre}`,
      entidad: "Planta",
      entidadId: planta.id,
      actor: entrada.autor.nombre,
      organizacionId: cultivo.organizacionId,
    });
    return demorar(planta);
  },

  registrarLabor: (entrada: {
    plantaId: string;
    tipo: TipoLabor;
    agroinsumoId: string | null;
    dosis: string;
    responsable: string;
    autor: Autor;
  }) => {
    const indice = almacen.plantas.findIndex((planta) => planta.id === entrada.plantaId);
    if (indice < 0) return rechazarNoEncontrado("Planta", entrada.plantaId);
    const planta = almacen.plantas[indice];
    if (!planta) return rechazarNoEncontrado("Planta", entrada.plantaId);
    if (planta.estado === "DESTRUIDA" || planta.estado === "COSECHADA") {
      return rechazar({
        type: "https://sicamed.co/problemas/planta-fuera-de-ciclo",
        title: "La planta ya salió del ciclo productivo",
        detail:
          `La planta ${planta.codigo} está en estado ${planta.estado} y no admite nuevas labores ` +
          "culturales. El registro de campo no se reescribe hacia atrás.",
        status: 409,
        norma: "Res. 1241/2026 Art. 20",
      });
    }

    const insumo = entrada.agroinsumoId
      ? almacen.agroinsumos.find((registro) => registro.id === entrada.agroinsumoId)
      : null;
    const liberacion =
      insumo && insumo.carenciaDias > 0
        ? new Date(Date.now() + insumo.carenciaDias * 86_400_000).toISOString()
        : null;

    const labor = {
      id: siguienteId("LAB"),
      plantaId: planta.id,
      planta: planta.codigo,
      tipo: entrada.tipo,
      agroinsumo: insumo ? insumo.nombre : null,
      dosis: insumo ? entrada.dosis : "—",
      responsable: entrada.responsable,
      fecha: ahora(),
      aptaDesde: liberacion,
      huella: nuevaHuella(),
    };
    almacen.labores.unshift(labor);

    const aptaDesde =
      liberacion && new Date(liberacion) > new Date(planta.aptaDesde) ? liberacion : planta.aptaDesde;
    almacen.plantas[indice] = { ...planta, labores: planta.labores + 1, aptaDesde };

    registrarEvento({
      tipo: "LABOR_REGISTRADA",
      descripcion: insumo
        ? `Labor ${entrada.tipo} en ${planta.codigo} con ${insumo.nombre}. Carencia de ${insumo.carenciaDias} días`
        : `Labor ${entrada.tipo} registrada en ${planta.codigo}`,
      entidad: "Planta",
      entidadId: planta.id,
      actor: entrada.autor.nombre,
      organizacionId: planta.organizacionId,
    });
    return demorar(labor);
  },

  cosecharPlanta: (entrada: { id: string; autor: Autor }) => {
    const indice = almacen.plantas.findIndex((planta) => planta.id === entrada.id);
    if (indice < 0) return rechazarNoEncontrado("Planta", entrada.id);
    const planta = almacen.plantas[indice];
    if (!planta) return rechazarNoEncontrado("Planta", entrada.id);
    if (new Date(planta.aptaDesde).getTime() > Date.now()) {
      return rechazar({
        type: "https://sicamed.co/problemas/carencia-activa",
        title: "Cosecha rechazada por periodo de carencia activo",
        detail:
          `La planta ${planta.codigo} recibió un agroinsumo cuyo periodo de carencia vence el ` +
          `${new Date(planta.aptaDesde).toLocaleDateString("es-CO")}. Cosechar antes de esa fecha ` +
          "invalida el lote frente al certificado de Buenas Prácticas Agrícolas.",
        status: 422,
        norma: "Res. 1241/2026 Art. 20 · BPA/GACP",
      });
    }
    const actualizada = { ...planta, estado: "COSECHADA" as const };
    almacen.plantas[indice] = actualizada;
    recalcularPlantasVivas();
    recalcularCupo(planta.organizacionId);
    registrarEvento({
      tipo: "PLANTA_COSECHADA",
      descripcion: `Se cosechó la planta ${planta.codigo}`,
      entidad: "Planta",
      entidadId: planta.id,
      actor: entrada.autor.nombre,
      organizacionId: planta.organizacionId,
    });
    return demorar(actualizada);
  },

  beneficios: (filtro: FiltroListado = {}) => {
    const resultado = almacen.beneficios.filter(
      (beneficio) =>
        (!filtro.busqueda ||
          contiene(beneficio.codigo, filtro.busqueda) ||
          contiene(beneficio.cultivo, filtro.busqueda) ||
          contiene(beneficio.variedad, filtro.busqueda)) &&
        (!filtro.estado || beneficio.estado === filtro.estado) &&
        (!filtro.departamento || beneficio.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 10));
  },

  registrarBeneficio: (entrada: {
    cultivoId: string;
    plantas: number;
    pesoHumedo: number;
    responsable: string;
    autor: Autor;
  }) => {
    const cultivo = almacen.cultivos.find((registro) => registro.id === entrada.cultivoId);
    if (!cultivo) return rechazarNoEncontrado("Cultivo", entrada.cultivoId);
    const variedad = almacen.variedades.find((registro) => registro.nombre === cultivo.variedad);
    const beneficio = {
      id: siguienteId("BEN"),
      codigo: `B-2026-${String(900 + almacen.beneficios.length)}`,
      cultivoId: cultivo.id,
      cultivo: cultivo.nombre,
      organizacionId: cultivo.organizacionId,
      organizacion: nombreOrganizacion(cultivo.organizacionId),
      departamento: cultivo.departamento,
      variedad: cultivo.variedad,
      tipo: variedad?.tipo ?? ("NO_PSICOACTIVO" as const),
      plantas: entrada.plantas,
      pesoHumedo: entrada.pesoHumedo,
      pesoSeco: 0,
      pesoAcondicionado: 0,
      humedad: 0,
      estado: "SECADO" as EstadoBeneficio,
      inicio: ahora(),
      fin: ahora(),
      loteCodigo: null,
      responsable: entrada.responsable,
      huella: nuevaHuella(),
    };
    almacen.beneficios.unshift(beneficio);
    registrarEvento({
      tipo: "BENEFICIO_INICIADO",
      descripcion: `Inició el secado ${beneficio.codigo} con ${entrada.pesoHumedo} kg húmedos de ${entrada.plantas} plantas`,
      entidad: "Beneficio",
      entidadId: beneficio.id,
      actor: entrada.autor.nombre,
      organizacionId: cultivo.organizacionId,
    });
    return demorar(beneficio);
  },

  avanzarBeneficio: (entrada: {
    id: string;
    estado: EstadoBeneficio;
    peso: number;
    humedad: number;
    autor: Autor;
  }) => {
    const indice = almacen.beneficios.findIndex((beneficio) => beneficio.id === entrada.id);
    if (indice < 0) return rechazarNoEncontrado("Beneficio", entrada.id);
    const previo = almacen.beneficios[indice];
    if (!previo) return rechazarNoEncontrado("Beneficio", entrada.id);

    if (entrada.estado === "CURADO" && entrada.peso > previo.pesoHumedo) {
      return rechazar({
        type: "https://sicamed.co/problemas/balance-de-masa",
        title: "El balance de masa no cierra",
        detail:
          `El peso seco declarado (${entrada.peso} kg) supera el peso húmedo de entrada ` +
          `(${previo.pesoHumedo} kg). El secado solo puede reducir masa: una ganancia de peso sin ` +
          "explicación rompe la cadena de origen.",
        status: 422,
        norma: "Res. 1241/2026 Art. 20 · BPA/GACP · balance de masa",
      });
    }
    if (entrada.estado === "ACONDICIONADO" && entrada.peso > previo.pesoSeco) {
      return rechazar({
        type: "https://sicamed.co/problemas/balance-de-masa",
        title: "El balance de masa no cierra",
        detail:
          `El peso acondicionado (${entrada.peso} kg) supera el peso seco registrado ` +
          `(${previo.pesoSeco} kg). El acondicionamiento solo puede reducir masa.`,
        status: 422,
        norma: "Res. 1241/2026 Art. 20 · balance de masa",
      });
    }

    const actualizado = {
      ...previo,
      estado: entrada.estado,
      pesoSeco: entrada.estado === "CURADO" ? entrada.peso : previo.pesoSeco,
      pesoAcondicionado:
        entrada.estado === "ACONDICIONADO" ? entrada.peso : previo.pesoAcondicionado,
      humedad: entrada.humedad,
      fin: ahora(),
      loteCodigo:
        entrada.estado === "ACONDICIONADO"
          ? `L-2026-${String(4000 + almacen.lotes.length)}`
          : previo.loteCodigo,
    };
    almacen.beneficios[indice] = actualizado;

    if (entrada.estado === "ACONDICIONADO") {
      almacen.lotes.unshift({
        id: siguienteId("LOT"),
        codigo: actualizado.loteCodigo ?? `L-2026-${String(4000 + almacen.lotes.length)}`,
        cultivoId: previo.cultivoId,
        organizacionId: previo.organizacionId,
        organizacion: previo.organizacion,
        tipo: "FLOR_SECA",
        cantidad: entrada.peso,
        unidad: "kg",
        estado: "EN_BODEGA",
        thc: previo.tipo === "PSICOACTIVO" ? 14.2 : 0.6,
        cbd: 11.4,
        bodega: `Bodega de acondicionamiento · ${previo.departamento}`,
        departamento: previo.departamento,
        fecha: ahora(),
        vencimiento: new Date(Date.now() + 540 * 86_400_000).toISOString(),
      });
    }

    const merma = previo.pesoHumedo > 0 ? (1 - entrada.peso / previo.pesoHumedo) * 100 : 0;
    registrarEvento({
      tipo: "BENEFICIO_AVANZADO",
      descripcion: `${previo.codigo} pasó a ${entrada.estado} con ${entrada.peso} kg y ${merma.toFixed(1)}% de merma acumulada`,
      entidad: "Beneficio",
      entidadId: previo.id,
      actor: entrada.autor.nombre,
      organizacionId: previo.organizacionId,
    });
    return demorar(actualizado);
  },

  transformaciones: (filtro: FiltroListado = {}) => {
    const resultado = almacen.transformaciones.filter(
      (transformacion) =>
        (!filtro.busqueda ||
          contiene(transformacion.codigo, filtro.busqueda) ||
          contiene(transformacion.producto, filtro.busqueda) ||
          contiene(transformacion.loteOrigen, filtro.busqueda)) &&
        (!filtro.estado || transformacion.estado === filtro.estado) &&
        (!filtro.departamento || transformacion.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 10));
  },

  registrarTransformacion: (entrada: {
    loteOrigenId: string;
    producto: string;
    formula: string;
    entradaKg: number;
    salida: number;
    unidadSalida: string;
    registroInvima: string;
    responsable: string;
    autor: Autor;
  }) => {
    const lote = almacen.lotes.find((registro) => registro.id === entrada.loteOrigenId);
    if (!lote) return rechazarNoEncontrado("Lote", entrada.loteOrigenId);

    if (entrada.entradaKg > lote.cantidad) {
      return rechazar({
        type: "https://sicamed.co/problemas/balance-de-masa",
        title: "La entrada supera las existencias del lote",
        detail:
          `El lote ${lote.codigo} tiene ${lote.cantidad} ${lote.unidad} disponibles y la fórmula ` +
          `declara una entrada de ${entrada.entradaKg}. La transformación no puede consumir más de lo que existe.`,
        status: 422,
        norma: "Res. 1241/2026 Art. 9 · balance de inventario",
      });
    }
    if (!entrada.registroInvima.trim()) {
      return rechazar({
        type: "https://sicamed.co/problemas/sin-registro-sanitario",
        title: "El producto terminado exige registro sanitario",
        detail:
          "Un producto terminado de cannabis medicinal no puede liberarse sin el registro sanitario " +
          "expedido por el INVIMA. SICAMED no expide el registro: verifica que el declarado exista.",
        status: 422,
        norma: "Dec. 1138/2025 Art. 1 núm. 38 · registro sanitario INVIMA",
        accion: { etiqueta: "Ver conexiones", ruta: "/app/conexiones" },
      });
    }

    const indiceLote = almacen.lotes.findIndex((registro) => registro.id === lote.id);
    almacen.lotes[indiceLote] = { ...lote, cantidad: Number((lote.cantidad - entrada.entradaKg).toFixed(2)) };

    const codigoResultante = `L-2026-${String(4000 + almacen.lotes.length)}`;
    const transformacion = {
      id: siguienteId("TRF"),
      codigo: `T-2026-${String(700 + almacen.transformaciones.length)}`,
      organizacionId: lote.organizacionId,
      organizacion: lote.organizacion,
      departamento: lote.departamento,
      loteOrigen: lote.codigo,
      loteOrigenId: lote.id,
      producto: entrada.producto,
      formula: entrada.formula,
      entradaKg: entrada.entradaKg,
      salida: entrada.salida,
      unidadSalida: entrada.unidadSalida,
      rendimiento: Number(((entrada.salida / entrada.entradaKg) * 100).toFixed(2)),
      registroInvima: entrada.registroInvima,
      estado: "LIBERADA" as const,
      loteResultante: codigoResultante,
      responsable: entrada.responsable,
      fecha: ahora(),
      huella: nuevaHuella(),
    };
    almacen.transformaciones.unshift(transformacion);

    almacen.lotes.unshift({
      id: siguienteId("LOT"),
      codigo: codigoResultante,
      cultivoId: lote.cultivoId,
      organizacionId: lote.organizacionId,
      organizacion: lote.organizacion,
      tipo: entrada.unidadSalida === "unidades" ? "FORMULA_MAGISTRAL" : "ACEITE",
      cantidad: entrada.salida,
      unidad: entrada.unidadSalida,
      estado: "EN_BODEGA",
      thc: lote.thc,
      cbd: lote.cbd,
      bodega: `Bodega de producto terminado · ${lote.departamento}`,
      departamento: lote.departamento,
      fecha: ahora(),
      vencimiento: new Date(Date.now() + 730 * 86_400_000).toISOString(),
    });

    registrarEvento({
      tipo: "TRANSFORMACION_REGISTRADA",
      descripcion:
        `${lote.codigo} → ${codigoResultante}: ${entrada.entradaKg} kg producen ${entrada.salida} ` +
        `${entrada.unidadSalida} de ${entrada.producto} (registro ${entrada.registroInvima})`,
      entidad: "Lote",
      entidadId: lote.id,
      actor: entrada.autor.nombre,
      organizacionId: lote.organizacionId,
    });
    return demorar(transformacion);
  },

  destrucciones: (filtro: FiltroListado = {}) => {
    const resultado = almacen.destrucciones.filter(
      (acta) =>
        (!filtro.busqueda ||
          contiene(acta.acta, filtro.busqueda) ||
          contiene(acta.referencia, filtro.busqueda) ||
          contiene(acta.organizacion, filtro.busqueda)) &&
        (!filtro.tipo || acta.causal === filtro.tipo) &&
        (!filtro.estado || acta.entidad === filtro.estado) &&
        (!filtro.departamento || acta.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 10));
  },

  registrarDestruccion: (entrada: {
    entidad: "PLANTA" | "LOTE";
    entidadId: string;
    cantidad: number;
    causal: CausalDestruccion;
    metodo: string;
    testigo: string;
    cargoTestigo: string;
    autor: Autor;
  }) => {
    if (!entrada.testigo.trim() || !entrada.cargoTestigo.trim()) {
      return rechazar({
        type: "https://sicamed.co/problemas/acta-sin-testigo",
        title: "El acta de destrucción exige testigo identificado",
        detail:
          "La disposición final de material vegetal se documenta con un acta que identifica al testigo " +
          "y su cargo. Un acta sin testigo no tiene valor probatorio frente a la autoridad.",
        status: 422,
        norma: "Dec. 1138/2025 Art. 11 · disposición final",
      });
    }

    const planta =
      entrada.entidad === "PLANTA"
        ? almacen.plantas.find((registro) => registro.id === entrada.entidadId)
        : undefined;
    const lote =
      entrada.entidad === "LOTE"
        ? almacen.lotes.find((registro) => registro.id === entrada.entidadId)
        : undefined;
    if (!planta && !lote) return rechazarNoEncontrado(entrada.entidad === "PLANTA" ? "Planta" : "Lote", entrada.entidadId);

    const organizacionId = planta?.organizacionId ?? lote?.organizacionId ?? "";
    const acta = {
      id: siguienteId("ACD"),
      acta: `ACD-2026-${String(500 + almacen.destrucciones.length)}`,
      organizacionId,
      organizacion: nombreOrganizacion(organizacionId),
      departamento: planta?.departamento ?? lote?.departamento ?? "",
      entidad: entrada.entidad,
      entidadId: entrada.entidadId,
      referencia: planta?.codigo ?? lote?.codigo ?? "",
      cantidad: entrada.cantidad,
      unidad: entrada.entidad === "PLANTA" ? "plantas" : (lote?.unidad ?? "kg"),
      causal: entrada.causal,
      metodo: entrada.metodo,
      testigo: entrada.testigo,
      cargoTestigo: entrada.cargoTestigo,
      responsable: entrada.autor.nombre,
      fecha: ahora(),
      norma: "Dec. 1138/2025 Art. 11 · disposición final de material vegetal",
      huella: nuevaHuella(),
    };
    almacen.destrucciones.unshift(acta);

    if (planta) {
      const indice = almacen.plantas.findIndex((registro) => registro.id === planta.id);
      almacen.plantas[indice] = { ...planta, estado: "DESTRUIDA" };
      recalcularPlantasVivas();
      recalcularCupo(planta.organizacionId);
    }
    if (lote) {
      const indice = almacen.lotes.findIndex((registro) => registro.id === lote.id);
      almacen.lotes[indice] = { ...lote, estado: "DESTRUIDO", cantidad: 0 };
    }

    registrarEvento({
      tipo: "DESTRUCCION_REGISTRADA",
      descripcion:
        `Acta ${acta.acta}: se destruyeron ${entrada.cantidad} ${acta.unidad} de ${acta.referencia} ` +
        `por ${entrada.causal}, con testigo ${entrada.testigo}`,
      entidad: entrada.entidad === "PLANTA" ? "Planta" : "Lote",
      entidadId: entrada.entidadId,
      actor: entrada.autor.nombre,
      organizacionId,
    });
    return demorar(acta);
  },

  expedientes: (filtro: FiltroListado = {}) => {
    const resultado = almacen.expedientes.filter(
      (expediente) =>
        (!filtro.busqueda ||
          contiene(expediente.organizacion, filtro.busqueda) ||
          contiene(expediente.radicado, filtro.busqueda)) &&
        (!filtro.estado || expediente.estado === filtro.estado) &&
        (!filtro.tipo || expediente.tipoActor === filtro.tipo) &&
        (!filtro.departamento || expediente.departamento === filtro.departamento),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 8));
  },

  decidirDocumento: (entrada: {
    expedienteId: string;
    documentoId: string;
    decision: Extract<EstadoDocumento, "APROBADO" | "DEVUELTO">;
    observacion: string;
    autor: Autor;
  }) => {
    const indice = almacen.expedientes.findIndex(
      (expediente) => expediente.id === entrada.expedienteId,
    );
    if (indice < 0) return rechazarNoEncontrado("Expediente", entrada.expedienteId);
    const expediente = almacen.expedientes[indice];
    if (!expediente) return rechazarNoEncontrado("Expediente", entrada.expedienteId);

    const negado = negarVerificacion(expediente, entrada.autor);
    if (negado) return negado;

    if (entrada.decision === "DEVUELTO" && !entrada.observacion.trim()) {
      return rechazar({
        type: "https://sicamed.co/problemas/devolucion-sin-motivo",
        title: "Devolver exige una observación",
        detail:
          "Una devolución sin motivo no le dice al solicitante qué corregir. La observación es " +
          "obligatoria y queda registrada junto con el revisor y el sello de tiempo.",
        status: 422,
        norma: "Res. 1241/2026 Art. 7 · debido proceso administrativo",
      });
    }

    const documentos = expediente.documentos.map((documento) =>
      documento.id === entrada.documentoId
        ? {
            ...documento,
            estado: entrada.decision,
            verificadoPor: entrada.autor.nombre,
            observacion: entrada.observacion.trim() || null,
          }
        : documento,
    );
    const actualizado: Expediente = {
      ...expediente,
      documentos,
      estado: estadoDerivado(documentos, expediente.tipoActor),
      analista: entrada.autor.nombre,
    };
    almacen.expedientes[indice] = actualizado;

    const documento = documentos.find((registro) => registro.id === entrada.documentoId);
    registrarEvento({
      tipo: entrada.decision === "APROBADO" ? "DOCUMENTO_VERIFICADO" : "DOCUMENTO_DEVUELTO",
      descripcion:
        `${NOMBRE_DOCUMENTO[documento?.tipo ?? "RUT"]} del expediente ${expediente.radicado} ` +
        `quedó ${entrada.decision.toLowerCase()} · huella ${documento?.huella ?? ""}`,
      entidad: "Expediente",
      entidadId: expediente.id,
      actor: entrada.autor.nombre,
      organizacionId: expediente.organizacionId,
    });
    return demorar(actualizado);
  },

  resolverPaso: (entrada: {
    expedienteId: string;
    pasoId: string;
    veredicto: Extract<VeredictoResoluble, "VERIFICADO" | "DEVUELTO">;
    observacion: string;
    autor: Autor;
  }) => {
    const indice = almacen.expedientes.findIndex(
      (expediente) => expediente.id === entrada.expedienteId,
    );
    if (indice < 0) return rechazarNoEncontrado("Expediente", entrada.expedienteId);
    const expediente = almacen.expedientes[indice];
    if (!expediente) return rechazarNoEncontrado("Expediente", entrada.expedienteId);

    const negado = negarVerificacion(expediente, entrada.autor);
    if (negado) return negado;

    const paso = expediente.pasos.find((registro) => registro.id === entrada.pasoId);
    if (!paso) return rechazarNoEncontrado("Paso de verificación", entrada.pasoId);

    if (paso.rol !== entrada.autor.rol) {
      return rechazar({
        type: "https://sicamed.co/problemas/paso-de-otro-rol",
        title: "Este paso corresponde a otro rol",
        detail:
          `El paso ${paso.orden} está asignado al rol ${paso.rol} y tu sesión actúa como ` +
          `${entrada.autor.rol}. Un rol solo resuelve el paso que le corresponde: no puede saltar pasos ajenos.`,
        status: 403,
        norma: "Blueprint §5.3-bis · invariante 3 del ExpedienteDeRegistro",
      });
    }

    const anteriores = expediente.pasos.filter((registro) => registro.orden < paso.orden);
    const pendiente = anteriores.find((registro) => registro.veredicto !== "VERIFICADO");
    if (pendiente) {
      return rechazar({
        type: "https://sicamed.co/problemas/paso-fuera-de-orden",
        title: "Hay un paso anterior sin resolver",
        detail:
          `La política vigente es secuencial: el paso ${pendiente.orden} (${pendiente.rol}) todavía ` +
          `no está verificado. No se puede resolver el paso ${paso.orden} antes que él.`,
        status: 409,
        norma: "Blueprint §5.3-bis · política de revisión SECUENCIAL",
      });
    }

    const yaResolvio = expediente.pasos.find(
      (registro) => registro.revisor === entrada.autor.nombre && registro.id !== paso.id,
    );
    if (yaResolvio) {
      return rechazar({
        type: "https://sicamed.co/problemas/doble-control",
        title: "El doble control impide que la misma persona resuelva dos pasos",
        detail:
          `${entrada.autor.nombre} ya resolvió el paso ${yaResolvio.orden} de este expediente. ` +
          "La política exige doble control: dos personas distintas deben concurrir en el trámite.",
        status: 403,
        norma: "Blueprint §5.3-bis · exige_doble_control",
      });
    }

    if (entrada.veredicto === "DEVUELTO" && !entrada.observacion.trim()) {
      return rechazar({
        type: "https://sicamed.co/problemas/devolucion-sin-motivo",
        title: "Devolver exige una observación",
        detail: "Las observaciones son obligatorias al devolver un expediente al solicitante.",
        status: 422,
        norma: "Res. 1241/2026 Art. 7 · debido proceso administrativo",
      });
    }

    const pasos = expediente.pasos.map((registro) =>
      registro.id === paso.id
        ? {
            ...registro,
            veredicto: entrada.veredicto,
            revisor: entrada.autor.nombre,
            resuelto: ahora(),
            observacion: entrada.observacion.trim() || null,
            huella: nuevaHuella(),
          }
        : registro,
    );
    const todosVerificados = pasos.every((registro) => registro.veredicto === "VERIFICADO");
    const alguienDevolvio = pasos.some((registro) => registro.veredicto === "DEVUELTO");
    const actualizado: Expediente = {
      ...expediente,
      pasos,
      estado: alguienDevolvio ? "DEVUELTO" : todosVerificados ? "APROBADO" : "EN_VERIFICACION",
    };
    almacen.expedientes[indice] = actualizado;

    registrarEvento({
      tipo: entrada.veredicto === "VERIFICADO" ? "PASO_VERIFICADO" : "EXPEDIENTE_DEVUELTO",
      descripcion:
        `Paso ${paso.orden} (${paso.rol}) del expediente ${expediente.radicado} resuelto como ` +
        `${entrada.veredicto} bajo la política ${expediente.politicaVersion}`,
      entidad: "Expediente",
      entidadId: expediente.id,
      actor: entrada.autor.nombre,
      organizacionId: expediente.organizacionId,
    });

    if (todosVerificados) {
      registrarEvento({
        tipo: "EVIDENCIA_VERIFICADA",
        descripcion:
          `El expediente ${expediente.radicado} alcanzó evidencia documental verificada. ` +
          "Habilita la caracterización de la organización y el origen DOCUMENTAL_VERIFICADA",
        entidad: "Expediente",
        entidadId: expediente.id,
        actor: entrada.autor.nombre,
        organizacionId: expediente.organizacionId,
      });
    }

    return demorar(actualizado);
  },

  politicaVerificacion: () =>
    demorar({ reglas: almacen.politica, version: almacen.politicaVersion }),

  guardarPolitica: (entrada: {
    reglas: readonly { id: string; obligatorio: boolean; modo: "MANUAL" | "AUTOMATICO" }[];
    autor: Autor;
  }) => {
    if (entrada.autor.rol !== "SUPER_ADMIN") {
      return rechazar({
        type: "https://sicamed.co/problemas/politica-restringida",
        title: "Solo el super administrador define la política",
        detail:
          "La política de verificación determina qué se le exige a cada tipo de actor. Solo el rol " +
          "SUPER_ADMIN puede modificarla, y ese mismo rol no puede verificar expedientes.",
        status: 403,
        norma: "Blueprint §5.3-bis · separación de funciones",
      });
    }
    const cambios = entrada.reglas.filter((cambio) => {
      const previa = almacen.politica.find((regla) => regla.id === cambio.id);
      return previa && (previa.obligatorio !== cambio.obligatorio || previa.modo !== cambio.modo);
    });
    almacen.politica = almacen.politica.map((regla) => {
      const cambio = entrada.reglas.find((registro) => registro.id === regla.id);
      return cambio ? { ...regla, obligatorio: cambio.obligatorio, modo: cambio.modo } : regla;
    });
    const version = `POL-2026.${Number(almacen.politicaVersion.split(".")[1] ?? "1") + 1}`;
    almacen.politicaVersion = version;

    registrarEvento({
      tipo: "POLITICA_ACTUALIZADA",
      descripcion:
        `Se publicó la política ${version} con ${cambios.length} regla(s) modificada(s). ` +
        "No reabre expedientes ya resueltos: la política queda congelada en cada expediente",
      entidad: "Política",
      entidadId: version,
      actor: entrada.autor.nombre,
      organizacionId: entrada.autor.organizacionId,
    });
    return demorar({ reglas: almacen.politica, version });
  },

  solicitudes: (filtro: FiltroListado = {}) => {
    const resultado = almacen.solicitudes.filter(
      (solicitud) =>
        (!filtro.busqueda ||
          contiene(solicitud.organizacion, filtro.busqueda) ||
          contiene(solicitud.nit, filtro.busqueda)) &&
        (!filtro.estado || solicitud.estado === filtro.estado) &&
        (!filtro.tipo || solicitud.tipoActor === filtro.tipo),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 10));
  },

  radicarSolicitud: (entrada: {
    nit: string;
    organizacion: string;
    tipoActor: TipoActor;
    departamento: string;
    municipio: string;
    representante: string;
    correo: string;
    telefono: string;
    documentos?: readonly DocumentoAdjunto[];
  }) => {
    const repetida = almacen.organizaciones.find(
      (organizacion) => normalizar(organizacion.nit) === normalizar(entrada.nit),
    );
    if (repetida) {
      return rechazar({
        type: "https://sicamed.co/problemas/nit-ya-registrado",
        title: "El NIT ya está registrado en el sistema",
        detail:
          `El NIT ${entrada.nit} corresponde a ${repetida.nombre}, que ya tiene una organización ` +
          "registrada. Si representas a esa organización, solicita una invitación a su administrador.",
        status: 409,
        norma: "Res. 1241/2026 Art. 7 · unicidad del actor registrado",
      });
    }

    const solicitud = {
      id: siguienteId("SOL"),
      nit: entrada.nit,
      organizacion: entrada.organizacion,
      tipoActor: entrada.tipoActor,
      departamento: entrada.departamento,
      municipio: entrada.municipio,
      representante: entrada.representante,
      correo: entrada.correo,
      telefono: entrada.telefono,
      estado: "RECIBIDA" as const,
      recibida: ahora(),
      expedienteId: null,
      documentos: entrada.documentos ?? [],
      huella: nuevaHuella(),
    };
    almacen.solicitudes.unshift(solicitud);
    registrarEvento({
      tipo: "SOLICITUD_RECIBIDA",
      descripcion: `Se recibió la solicitud de registro de ${entrada.organizacion} (${entrada.tipoActor})`,
      entidad: "Solicitud",
      entidadId: solicitud.id,
      actor: entrada.representante,
      organizacionId: "ORG-0000",
    });
    return demorar(solicitud);
  },

  abrirExpediente: (entrada: { solicitudId: string; autor: Autor }) => {
    const indice = almacen.solicitudes.findIndex(
      (solicitud) => solicitud.id === entrada.solicitudId,
    );
    if (indice < 0) return rechazarNoEncontrado("Solicitud", entrada.solicitudId);
    const solicitud = almacen.solicitudes[indice];
    if (!solicitud) return rechazarNoEncontrado("Solicitud", entrada.solicitudId);
    if (solicitud.estado !== "RECIBIDA") {
      return rechazar({
        type: "https://sicamed.co/problemas/solicitud-ya-tramitada",
        title: "La solicitud ya fue tramitada",
        detail: `Esta solicitud está en estado ${solicitud.estado} y no admite abrir un nuevo expediente.`,
        status: 409,
      });
    }

    const organizacion: Organizacion = {
      id: siguienteId("ORG"),
      nit: solicitud.nit,
      nombre: solicitud.organizacion,
      tipo: solicitud.tipoActor,
      departamento: solicitud.departamento,
      municipio: solicitud.municipio,
      estado: "EN_TRAMITE",
      registro: ahora(),
      representante: solicitud.representante,
      correo: solicitud.correo,
      telefono: solicitud.telefono,
      cultivos: 0,
      lotes: 0,
      ofertas: 0,
    };
    almacen.organizaciones.unshift(organizacion);

    const reglas = almacen.politica.filter((regla) => regla.tipoActor === solicitud.tipoActor);
    const idExpediente = siguienteId("EXP");
    const documentos: readonly DocumentoExpediente[] = reglas.map((regla, n) => ({
      id: `${idExpediente}-D${n + 1}`,
      tipo: regla.documento,
      archivo: `${regla.documento.toLowerCase()}-pendiente.pdf`,
      estado: "PENDIENTE",
      cargado: ahora(),
      vence: null,
      verificadoPor: null,
      observacion: "El actor todavía no ha cargado este documento obligatorio.",
      huella: nuevaHuella(),
    }));

    const pasos: readonly PasoVerificacion[] = [
      {
        id: `${idExpediente}-P1`,
        orden: 1,
        rol: "ANALISTA_DOCUMENTAL",
        veredicto: "PENDIENTE",
        revisor: null,
        resuelto: null,
        observacion: null,
        slaHoras: 72,
        huella: null,
      },
      {
        id: `${idExpediente}-P2`,
        orden: 2,
        rol: "ADMIN_INSTITUCIONAL",
        veredicto: "PENDIENTE",
        revisor: null,
        resuelto: null,
        observacion: null,
        slaHoras: 48,
        huella: null,
      },
    ];

    const expediente: Expediente = {
      id: idExpediente,
      radicado: `RAD-2026-${String(9000 + almacen.expedientes.length)}`,
      organizacionId: organizacion.id,
      organizacion: organizacion.nombre,
      tipoActor: solicitud.tipoActor,
      departamento: solicitud.departamento,
      estado: "RADICADO",
      radicacion: ahora(),
      analista: null,
      documentos,
      pasos,
      politicaVersion: almacen.politicaVersion,
    };
    almacen.expedientes.unshift(expediente);
    almacen.solicitudes[indice] = {
      ...solicitud,
      estado: "EXPEDIENTE_ABIERTO",
      expedienteId: expediente.id,
    };

    almacen.cuentas.unshift({
      id: siguienteId("USR"),
      nombre: solicitud.representante,
      correo: solicitud.correo,
      rol: "REPRESENTANTE_LEGAL",
      organizacionId: organizacion.id,
      organizacion: organizacion.nombre,
      estado: "INVITADA",
      creada: ahora(),
      ultimoAcceso: null,
      invitadaPor: entrada.autor.nombre,
      autenticacion: "OIDC",
    });

    registrarEvento({
      tipo: "ORGANIZACION_REGISTRADA",
      descripcion: `Se registró ${organizacion.nombre} en estado EN_TRAMITE y se invitó a su representante legal`,
      entidad: "Organización",
      entidadId: organizacion.id,
      actor: entrada.autor.nombre,
      organizacionId: organizacion.id,
    });
    registrarEvento({
      tipo: "EXPEDIENTE_ABIERTO",
      descripcion:
        `Se abrió el expediente ${expediente.radicado} con ${documentos.length} documentos exigidos ` +
        `por la política ${almacen.politicaVersion}, congelada en el expediente`,
      entidad: "Expediente",
      entidadId: expediente.id,
      actor: entrada.autor.nombre,
      organizacionId: organizacion.id,
    });
    return demorar(expediente);
  },

  cuentas: (filtro: FiltroListado = {}) => {
    const resultado = almacen.cuentas.filter(
      (cuenta) =>
        (!filtro.busqueda ||
          contiene(cuenta.nombre, filtro.busqueda) ||
          contiene(cuenta.correo, filtro.busqueda) ||
          contiene(cuenta.organizacion, filtro.busqueda)) &&
        (!filtro.estado || cuenta.estado === filtro.estado) &&
        (!filtro.tipo || cuenta.rol === filtro.tipo),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 10));
  },

  invitarCuenta: (entrada: {
    nombre: string;
    correo: string;
    rol: RolPlataforma;
    organizacionId: string;
    autor: Autor;
  }) => {
    if (entrada.autor.rol !== "SUPER_ADMIN") {
      return rechazar({
        type: "https://sicamed.co/problemas/alta-restringida",
        title: "Solo el super administrador crea cuentas de plataforma",
        detail:
          "El plan piloto opera con vinculación progresiva y controlada: no hay autoservicio abierto. " +
          "Las cuentas se crean por invitación de un administrador identificado.",
        status: 403,
        norma: "Res. 1241/2026 Art. 24 · onboarding controlado",
      });
    }
    const repetida = almacen.cuentas.find(
      (cuenta) => normalizar(cuenta.correo) === normalizar(entrada.correo),
    );
    if (repetida) {
      return rechazar({
        type: "https://sicamed.co/problemas/correo-ya-usado",
        title: "Ese correo ya tiene una cuenta",
        detail: `${entrada.correo} pertenece a ${repetida.nombre} en ${repetida.organizacion}.`,
        status: 409,
      });
    }
    const cuenta = {
      id: siguienteId("USR"),
      nombre: entrada.nombre,
      correo: entrada.correo,
      rol: entrada.rol,
      organizacionId: entrada.organizacionId,
      organizacion: nombreOrganizacion(entrada.organizacionId),
      estado: "INVITADA" as EstadoCuenta,
      creada: ahora(),
      ultimoAcceso: null,
      invitadaPor: entrada.autor.nombre,
      autenticacion: "OIDC" as const,
    };
    almacen.cuentas.unshift(cuenta);
    registrarEvento({
      tipo: "CUENTA_INVITADA",
      descripcion: `Se invitó a ${entrada.nombre} como ${entrada.rol} en ${cuenta.organizacion}`,
      entidad: "Cuenta",
      entidadId: cuenta.id,
      actor: entrada.autor.nombre,
      organizacionId: entrada.organizacionId,
    });
    return demorar(cuenta);
  },

  cambiarCuenta: (entrada: {
    id: string;
    estado?: EstadoCuenta;
    rol?: RolPlataforma;
    autor: Autor;
  }) => {
    if (entrada.autor.rol !== "SUPER_ADMIN") {
      return rechazar({
        type: "https://sicamed.co/problemas/alta-restringida",
        title: "Solo el super administrador gestiona las cuentas",
        detail: "Cambiar el rol o el estado de una cuenta exige el rol SUPER_ADMIN.",
        status: 403,
        norma: "Res. 1241/2026 Art. 24 · onboarding controlado",
      });
    }
    const indice = almacen.cuentas.findIndex((cuenta) => cuenta.id === entrada.id);
    if (indice < 0) return rechazarNoEncontrado("Cuenta", entrada.id);
    const previa = almacen.cuentas[indice];
    if (!previa) return rechazarNoEncontrado("Cuenta", entrada.id);

    if (previa.correo === "super.admin@sicamed.gov.co" && entrada.rol && entrada.rol !== "SUPER_ADMIN") {
      return rechazar({
        type: "https://sicamed.co/problemas/ultimo-super-admin",
        title: "No se puede degradar al único super administrador",
        detail:
          "El sistema debe conservar al menos un super administrador activo. Invita y activa otro " +
          "antes de cambiar el rol de esta cuenta.",
        status: 409,
      });
    }

    const actualizada = {
      ...previa,
      estado: entrada.estado ?? previa.estado,
      rol: entrada.rol ?? previa.rol,
    };
    almacen.cuentas[indice] = actualizada;
    registrarEvento({
      tipo: "CUENTA_ACTUALIZADA",
      descripcion:
        entrada.rol && entrada.rol !== previa.rol
          ? `La cuenta de ${previa.nombre} pasó de ${previa.rol} a ${entrada.rol}`
          : `La cuenta de ${previa.nombre} pasó a estado ${actualizada.estado}`,
      entidad: "Cuenta",
      entidadId: previa.id,
      actor: entrada.autor.nombre,
      organizacionId: previa.organizacionId,
    });
    return demorar(actualizada);
  },

  cupos: (filtro: FiltroListado = {}) => {
    const resultado = almacen.cupos.filter(
      (cupo) =>
        (!filtro.busqueda ||
          contiene(cupo.organizacion, filtro.busqueda) ||
          contiene(cupo.actoAsignacion, filtro.busqueda)) &&
        (!filtro.estado || cupo.estado === filtro.estado) &&
        (!filtro.tipo || cupo.modalidad === filtro.tipo),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 10));
  },

  conciliarCupos: (entrada: { autor: Autor }) => {
    almacen.cupos.forEach((cupo) => recalcularCupo(cupo.organizacionId));
    almacen.cupos = almacen.cupos.map((cupo) => ({ ...cupo, conciliado: ahora() }));
    registrarEvento({
      tipo: "CUPOS_CONCILIADOS",
      descripcion: `Se conciliaron ${almacen.cupos.length} cupos contra el MICC`,
      entidad: "Conexión",
      entidadId: "CNX-0001",
      actor: entrada.autor.nombre,
      organizacionId: entrada.autor.organizacionId,
    });
    return demorar(almacen.cupos);
  },

  cierres: (filtro: FiltroListado = {}) => {
    const resultado = almacen.cierres.filter(
      (cierre) =>
        (!filtro.busqueda ||
          contiene(cierre.oferta, filtro.busqueda) ||
          contiene(cierre.contraparte, filtro.busqueda) ||
          contiene(cierre.organizacion, filtro.busqueda)) &&
        (!filtro.estado || cierre.estado === filtro.estado) &&
        (!filtro.tipo || cierre.via === filtro.tipo),
    );
    return demorar(resultado);
  },

  declararMovimiento: (entrada: { id: string; movimiento: string; autor: Autor }) => {
    const indice = almacen.cierres.findIndex((cierre) => cierre.id === entrada.id);
    if (indice < 0) return rechazarNoEncontrado("Cierre", entrada.id);
    const previo = almacen.cierres[indice];
    if (!previo) return rechazarNoEncontrado("Cierre", entrada.id);
    const actualizado = {
      ...previo,
      estado: "MOVIMIENTO_DECLARADO" as const,
      declarado: ahora(),
      movimiento: entrada.movimiento,
    };
    almacen.cierres[indice] = actualizado;
    registrarEvento({
      tipo: "MOVIMIENTO_DECLARADO",
      descripcion:
        `Se declaró voluntariamente el movimiento ${entrada.movimiento} tras el trámite ante ` +
        `${previo.entidad}. La operación se cerró fuera de SICAMED`,
      entidad: "Cierre",
      entidadId: previo.id,
      actor: entrada.autor.nombre,
      organizacionId: entrada.autor.organizacionId,
    });
    return demorar(actualizado);
  },

  conexiones: () => demorar(almacen.conexiones),

  discrepancias: (filtro: FiltroListado = {}) => {
    const resultado = almacen.discrepancias.filter(
      (discrepancia) =>
        (!filtro.busqueda ||
          contiene(discrepancia.organizacion, filtro.busqueda) ||
          contiene(discrepancia.campo, filtro.busqueda)) &&
        (!filtro.estado || discrepancia.estado === filtro.estado) &&
        (!filtro.tipo || discrepancia.sigla === filtro.tipo),
    );
    return demorar(resultado);
  },

  resolverDiscrepancia: (entrada: {
    id: string;
    resolucion: "RESUELTA_EXTERNO" | "RESUELTA_LOCAL";
    autor: Autor;
  }) => {
    const indice = almacen.discrepancias.findIndex(
      (discrepancia) => discrepancia.id === entrada.id,
    );
    if (indice < 0) return rechazarNoEncontrado("Discrepancia", entrada.id);
    const previa = almacen.discrepancias[indice];
    if (!previa) return rechazarNoEncontrado("Discrepancia", entrada.id);

    if (entrada.resolucion === "RESUELTA_LOCAL" && previa.autoritativo === "EXTERNO") {
      return rechazar({
        type: "https://sicamed.co/problemas/fuente-autoritativa",
        title: "El registro externo es la fuente autoritativa de este campo",
        detail:
          `Para «${previa.campo}» la fuente autoritativa es ${previa.sigla}. SICAMED no puede imponer ` +
          "su valor local sobre el del registro que la norma designa como autoritativo: hay que " +
          "corregir el dato local o tramitar la corrección ante la entidad.",
        status: 409,
        norma: "Res. 1241/2026 Art. 7 · jerarquía probatoria de las fuentes",
      });
    }

    const actualizada = {
      ...previa,
      estado: entrada.resolucion,
      resuelta: ahora(),
      resueltaPor: entrada.autor.nombre,
    };
    almacen.discrepancias[indice] = actualizada;

    const indiceConexion = almacen.conexiones.findIndex(
      (conexion) => conexion.id === previa.conexionId,
    );
    const conexion = almacen.conexiones[indiceConexion];
    if (conexion) {
      almacen.conexiones[indiceConexion] = {
        ...conexion,
        conciliados: conexion.conciliados + 1,
        discrepancias: Math.max(0, conexion.discrepancias - 1),
      };
    }

    registrarEvento({
      tipo: "DISCREPANCIA_RESUELTA",
      descripcion:
        `Se resolvió la discrepancia de «${previa.campo}» con ${previa.sigla} adoptando el valor ` +
        `${entrada.resolucion === "RESUELTA_EXTERNO" ? "del registro externo" : "local"}`,
      entidad: "Conexión",
      entidadId: previa.conexionId,
      actor: entrada.autor.nombre,
      organizacionId: previa.organizacionId,
    });
    return demorar(actualizada);
  },

  sincronizarConexion: (entrada: { id: string; autor: Autor }) => {
    const indice = almacen.conexiones.findIndex((conexion) => conexion.id === entrada.id);
    if (indice < 0) return rechazarNoEncontrado("Conexión", entrada.id);
    const previa = almacen.conexiones[indice];
    if (!previa) return rechazarNoEncontrado("Conexión", entrada.id);
    if (previa.estado === "NO_CONECTADA") {
      return rechazar({
        type: "https://sicamed.co/problemas/sin-interfaz-tecnica",
        title: `${previa.sigla} no expone interfaz técnica`,
        detail:
          `${previa.nombre} no tiene servicio en línea: ${previa.mecanismo} No hay nada que ` +
          "sincronizar, y declararlo operativo sería una degradación silenciosa.",
        status: 501,
        norma: previa.norma,
      });
    }
    almacen.conexiones[indice] = { ...previa, ultimaLectura: ahora() };
    registrarEvento({
      tipo: "CONEXION_SINCRONIZADA",
      descripcion: `Se ejecutó una lectura manual contra ${previa.sigla} (${previa.entidad})`,
      entidad: "Conexión",
      entidadId: previa.id,
      actor: entrada.autor.nombre,
      organizacionId: entrada.autor.organizacionId,
    });
    return demorar(almacen.conexiones[indice]);
  },

  ambiente: (filtro: FiltroListado = {}) => {
    const resultado = almacen.ambiente.filter(
      (lectura) =>
        (!filtro.estado || lectura.estado === filtro.estado) &&
        (!filtro.departamento || lectura.departamento === filtro.departamento),
    );
    return demorar(resultado);
  },

  reportes: () =>
    demorar({
      serie: SERIE_PUBLICACIONES,
      departamentos: DEPARTAMENTOS,
      etapas: ETAPAS_PROCESO,
      porTipoActor: [
        { etiqueta: "Cultivadores", valor: almacen.organizaciones.filter((o) => o.tipo === "CULTIVADOR").length },
        { etiqueta: "Transformadores", valor: almacen.organizaciones.filter((o) => o.tipo === "TRANSFORMADOR").length },
        { etiqueta: "Dispensadores", valor: almacen.organizaciones.filter((o) => o.tipo === "DISPENSADOR").length },
        { etiqueta: "IPS", valor: almacen.organizaciones.filter((o) => o.tipo === "IPS").length },
        { etiqueta: "Laboratorios", valor: almacen.organizaciones.filter((o) => o.tipo === "LABORATORIO").length },
      ],
      cumplimiento: [
        { etiqueta: "Vigentes", valor: almacen.atestaciones.filter((a) => a.estado === "VIGENTE").length },
        { etiqueta: "Por vencer", valor: almacen.atestaciones.filter((a) => a.estado === "POR_VENCER").length },
        { etiqueta: "Vencidas", valor: almacen.atestaciones.filter((a) => a.estado === "VENCIDA").length },
        { etiqueta: "En trámite", valor: almacen.atestaciones.filter((a) => a.estado === "EN_TRAMITE").length },
      ],
    }),
};

type VeredictoResoluble = "VERIFICADO" | "DEVUELTO";

const negarVerificacion = (expediente: Expediente, autor: Autor): Promise<never> | null => {
  if (autor.rol === "SUPER_ADMIN") {
    return rechazar({
      type: "https://sicamed.co/problemas/separacion-de-funciones",
      title: "El super administrador no verifica expedientes",
      detail:
        "El SUPER_ADMIN define la política de revisión, los checklists, los roles y el SLA. " +
        "Verificar expedientes bajo reglas que él mismo puede cambiar destruiría el valor probatorio " +
        "del registro. La verificación corresponde al analista documental y al administrador institucional.",
      status: 403,
      norma: "Blueprint §5.3-bis · separación de funciones",
      accion: { etiqueta: "Ir a la política", ruta: "/app/politicas" },
    });
  }
  if (expediente.organizacionId === autor.organizacionId) {
    return rechazar({
      type: "https://sicamed.co/problemas/expediente-propio",
      title: "Nadie verifica su propio expediente",
      detail:
        `Tu sesión pertenece a ${nombreOrganizacion(autor.organizacionId)}, que es la titular de este ` +
        "expediente. La separación de funciones impide que un actor verifique su propia evidencia.",
      status: 403,
      norma: "Blueprint §5.3-bis · invariante 2 del ExpedienteDeRegistro",
    });
  }
  if (autor.rol !== "ANALISTA_DOCUMENTAL" && autor.rol !== "ADMIN_INSTITUCIONAL") {
    return rechazar({
      type: "https://sicamed.co/problemas/rol-sin-verificacion",
      title: "Tu rol no participa en la verificación documental",
      detail:
        `El rol ${autor.rol} no tiene un paso asignado en la política de revisión. Solo el analista ` +
        "documental y el administrador institucional resuelven pasos del trámite.",
      status: 403,
      norma: "Blueprint §5.3-bis · roles del trámite",
    });
  }
  return null;
};

const estadoDerivado = (
  documentos: readonly DocumentoExpediente[],
  tipoActor: TipoActor,
): Expediente["estado"] => {
  const obligatorio = (documento: DocumentoExpediente) =>
    almacen.politica.find(
      (regla) => regla.tipoActor === tipoActor && regla.documento === documento.tipo,
    )?.obligatorio ?? false;
  if (documentos.some((documento) => documento.estado === "DEVUELTO")) return "DEVUELTO";
  if (documentos.some((documento) => documento.estado === "EN_VERIFICACION")) return "EN_VERIFICACION";
  if (documentos.some((documento) => obligatorio(documento) && documento.estado !== "APROBADO"))
    return "RADICADO";
  return "APROBADO";
};

const VIA_POR_PRODUCTO: Record<string, "FNE" | "CONTRATO_DIRECTO" | "EXPORTACION"> = {
  "Flor seca psicoactiva": "FNE",
  "Extracto de espectro completo": "FNE",
  "Aceite estandarizado THC:CBD": "FNE",
  "Flor seca no psicoactiva": "CONTRATO_DIRECTO",
  "Biomasa vegetal": "CONTRATO_DIRECTO",
  "Aceite estandarizado CBD": "CONTRATO_DIRECTO",
  "Fórmula magistral": "CONTRATO_DIRECTO",
  "Semilla certificada": "CONTRATO_DIRECTO",
};

const ENTIDAD_POR_VIA: Record<
  "FNE" | "CONTRATO_DIRECTO" | "EXPORTACION",
  { entidad: string; norma: string }
> = {
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

const viaDeCierre = (tipoProducto: string) =>
  VIA_POR_PRODUCTO[tipoProducto] ?? "CONTRATO_DIRECTO";

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
  return almacen.atestaciones.find(
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
  almacen.organizaciones.find((organizacion) => organizacion.id === id);

export type OrdenVitrina = "RECIENTES" | "TERRITORIO" | "PRODUCTO";

export type ConsultaVitrina = {
  busqueda?: string;
  departamento?: string;
  tipoProducto?: string;
  tipoActor?: string;
  disponibilidad?: string;
  orden?: OrdenVitrina;
};

export type PaginaVitrina = {
  ofertas: readonly Oferta[];
  cursorSiguiente: string | null;
  cursorAnterior: string | null;
  desde: number;
  hasta: number;
};

export type FacetasVitrina = {
  tipoProducto: Readonly<Record<string, number>>;
  departamento: Readonly<Record<string, number>>;
  tipoActor: Readonly<Record<string, number>>;
  disponibilidad: Readonly<Record<string, number>>;
};

export type TotalesVitrina = {
  ofertas: number;
  actores: number;
  departamentos: number;
};

export type EstadisticasVitrina = {
  ofertas: number;
  actores: number;
  departamentos: number;
  totales: TotalesVitrina;
  actualizacion: string;
  facetas: FacetasVitrina;
};

const COMPARADORES: Record<OrdenVitrina, (a: Oferta, b: Oferta) => number> = {
  RECIENTES: (a, b) => b.publicada.localeCompare(a.publicada),
  TERRITORIO: (a, b) =>
    a.departamento.localeCompare(b.departamento, "es") || b.publicada.localeCompare(a.publicada),
  PRODUCTO: (a, b) =>
    a.tipoProducto.localeCompare(b.tipoProducto, "es") || b.publicada.localeCompare(a.publicada),
};

const coincideVitrina = (oferta: Oferta, consulta: ConsultaVitrina): boolean =>
  (!consulta.busqueda ||
    contiene(oferta.tipoProducto, consulta.busqueda) ||
    contiene(oferta.organizacion, consulta.busqueda) ||
    contiene(oferta.departamento, consulta.busqueda) ||
    contiene(oferta.municipio, consulta.busqueda)) &&
  (!consulta.departamento || oferta.departamento === consulta.departamento) &&
  (!consulta.tipoProducto || oferta.tipoProducto === consulta.tipoProducto) &&
  (!consulta.tipoActor || oferta.tipoActor === consulta.tipoActor) &&
  (!consulta.disponibilidad || oferta.disponibilidad === consulta.disponibilidad);

const ordenarVitrina = (consulta: ConsultaVitrina): readonly Oferta[] =>
  [...OFERTAS_PUBLICAS.filter((oferta) => coincideVitrina(oferta, consulta))].sort(
    COMPARADORES[consulta.orden ?? "RECIENTES"],
  );

const conteoPor = (
  ofertas: readonly Oferta[],
  seleccionar: (oferta: Oferta) => string,
): Record<string, number> => {
  const conteo: Record<string, number> = {};
  for (const oferta of ofertas) {
    const clave = seleccionar(oferta);
    conteo[clave] = (conteo[clave] ?? 0) + 1;
  }
  return conteo;
};

export const paginaVitrinaMock = (
  consulta: ConsultaVitrina,
  cursor: string | null,
  limite: number,
): PaginaVitrina => {
  const ordenadas = ordenarVitrina(consulta);
  const indice = cursor ? ordenadas.findIndex((oferta) => oferta.id === cursor) : 0;
  const desplazamiento = indice < 0 ? 0 : indice;
  const ofertas = ordenadas.slice(desplazamiento, desplazamiento + limite);
  const siguiente = ordenadas[desplazamiento + limite];
  const anterior = desplazamiento > 0 ? ordenadas[Math.max(0, desplazamiento - limite)] : undefined;

  return {
    ofertas,
    cursorSiguiente: siguiente ? siguiente.id : null,
    cursorAnterior: anterior ? anterior.id : null,
    desde: ofertas.length === 0 ? 0 : desplazamiento + 1,
    hasta: desplazamiento + ofertas.length,
  };
};

export const estadisticasVitrinaMock = (consulta: ConsultaVitrina): EstadisticasVitrina => {
  const filtradas = ordenarVitrina(consulta);
  const sinFiltroProducto = OFERTAS_PUBLICAS.filter((oferta) =>
    coincideVitrina(oferta, { ...consulta, tipoProducto: undefined }),
  );
  const sinFiltroDepartamento = OFERTAS_PUBLICAS.filter((oferta) =>
    coincideVitrina(oferta, { ...consulta, departamento: undefined }),
  );
  const sinFiltroActor = OFERTAS_PUBLICAS.filter((oferta) =>
    coincideVitrina(oferta, { ...consulta, tipoActor: undefined }),
  );
  const sinFiltroDisponibilidad = OFERTAS_PUBLICAS.filter((oferta) =>
    coincideVitrina(oferta, { ...consulta, disponibilidad: undefined }),
  );

  return {
    ofertas: filtradas.length,
    actores: new Set(filtradas.map((oferta) => oferta.organizacionId)).size,
    departamentos: new Set(filtradas.map((oferta) => oferta.departamento)).size,
    totales: {
      ofertas: OFERTAS_PUBLICAS.length,
      actores: new Set(OFERTAS_PUBLICAS.map((oferta) => oferta.organizacionId)).size,
      departamentos: new Set(OFERTAS_PUBLICAS.map((oferta) => oferta.departamento)).size,
    },
    actualizacion:
      [...OFERTAS_PUBLICAS]
        .map((oferta) => oferta.publicada)
        .sort((a, b) => b.localeCompare(a))[0] ?? new Date().toISOString(),
    facetas: {
      tipoProducto: conteoPor(sinFiltroProducto, (oferta) => oferta.tipoProducto),
      departamento: conteoPor(sinFiltroDepartamento, (oferta) => oferta.departamento),
      tipoActor: conteoPor(sinFiltroActor, (oferta) => oferta.tipoActor),
      disponibilidad: conteoPor(sinFiltroDisponibilidad, (oferta) => oferta.disponibilidad),
    },
  };
};

export type SugerenciaVitrina = {
  tipo: "PRODUCTO" | "ACTOR" | "TERRITORIO";
  valor: string;
  conteo: number;
};

export const sugerenciasVitrinaMock = (texto: string, limite = 6): readonly SugerenciaVitrina[] => {
  if (texto.trim().length < 2) return [];
  const coincidentes = OFERTAS_PUBLICAS.filter(
    (oferta) =>
      contiene(oferta.tipoProducto, texto) ||
      contiene(oferta.organizacion, texto) ||
      contiene(oferta.departamento, texto),
  );

  const construir = (
    tipo: SugerenciaVitrina["tipo"],
    seleccionar: (oferta: Oferta) => string,
  ): readonly SugerenciaVitrina[] =>
    Object.entries(
      conteoPor(
        coincidentes.filter((oferta) => contiene(seleccionar(oferta), texto)),
        seleccionar,
      ),
    )
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .map(([valor, conteo]) => ({ tipo, valor, conteo }));

  return [
    ...construir("PRODUCTO", (oferta) => oferta.tipoProducto),
    ...construir("ACTOR", (oferta) => oferta.organizacion),
    ...construir("TERRITORIO", (oferta) => oferta.departamento),
  ].slice(0, limite);
};
