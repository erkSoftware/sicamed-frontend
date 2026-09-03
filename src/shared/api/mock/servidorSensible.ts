import { ahora, registrarEvento, siguienteId } from "./almacen";
import { almacenSensible } from "./almacenSensible";
import { contiene, demorar, paginar, rechazar, rechazarNoEncontrado } from "./protocolo";
import { PUNTOS, VALOR_CREDENCIAL_B2C, VALOR_VERIFICACION_B2B } from "./datosDispensacion";
import { NORMA_DECRETO_2200, camposFaltantes } from "../../dispensacion/decreto2200";
import type { BorradorPrescripcion } from "../../dispensacion/decreto2200";
import { enLetras } from "../../i18n/letras";
import { seudonimoDe } from "../../privacidad/seudonimo";
import type { Autor, FiltroListado } from "./protocolo";
import type {
  CredencialPaciente,
  EstadoCredencial,
  NivelVerificacion,
  Prescripcion,
} from "./datosClinicos";
import type {
  ActoDispensacion,
  CargoServicio,
  FlujoCargo,
  MetodoVerificacion,
  PrescripcionEnMostrador,
  PuntoDispensacion,
  ResultadoVerificacion,
} from "./datosDispensacion";

const NORMA_PRESENCIAL =
  "Res. 1478 de 2006 Art. 5 num. 4 · confirmada por la Res. 1644 de 2026 para medicamentos de control especial";

const diasDesde = (iso: string): number => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

const vencida = (iso: string): boolean => new Date(iso).getTime() < Date.now();

const periodoActual = (): string => new Date().toISOString().slice(0, 7);

const puntoDe = (id: string): PuntoDispensacion | undefined => PUNTOS.find((punto) => punto.id === id);

const ESTADOS_DISPENSABLES = new Set(["EMITIDA", "VIGENTE", "DISPENSADA_PARCIAL"]);

const saldoDe = (prescripcion: Prescripcion): number =>
  Math.max(0, prescripcion.cantidadTotal - prescripcion.entregadas);

const diasParaHabilitar = (prescripcion: Prescripcion): number => {
  if (!prescripcion.ultimaEntrega) return 0;
  return Math.max(0, prescripcion.ventanaRecompraDias - diasDesde(prescripcion.ultimaEntrega));
};

const aMostrador = (prescripcion: Prescripcion): PrescripcionEnMostrador => ({
  codigo: prescripcion.codigo,
  seudonimo: prescripcion.seudonimo,
  denominacionComun: prescripcion.denominacionComun,
  concentracion: prescripcion.concentracion,
  formaFarmaceutica: prescripcion.formaFarmaceutica,
  viaAdministracion: prescripcion.viaAdministracion,
  unidadFarmaceutica: prescripcion.unidadFarmaceutica,
  cantidadTotal: prescripcion.cantidadTotal,
  cantidadEnLetras: prescripcion.cantidadEnLetras,
  entregadas: prescripcion.entregadas,
  saldo: saldoDe(prescripcion),
  vigenciaHasta: prescripcion.vigenciaHasta,
  fiscalizado: prescripcion.fiscalizado,
  ventanaRecompraDias: prescripcion.ventanaRecompraDias,
  ultimaEntrega: prescripcion.ultimaEntrega,
  diasParaHabilitar: diasParaHabilitar(prescripcion),
});

const anotarIntento = (
  seudonimo: string | null,
  metodo: MetodoVerificacion,
  resultado: ResultadoVerificacion,
  puntoId: string,
): void => {
  almacenSensible.verificaciones.unshift({
    id: siguienteId("VER"),
    seudonimo,
    metodo,
    resultado,
    puntoId,
    fecha: ahora(),
  });
};

const nuevoCargo = (entrada: {
  flujo: FlujoCargo;
  contraparteId: string;
  contraparte: string;
  concepto: string;
  valorUnitario: number;
  origen: CargoServicio["origen"];
  origenId: string;
  eventoId: string | null;
}): CargoServicio => {
  const cargo: CargoServicio = {
    id: siguienteId("CRG"),
    flujo: entrada.flujo,
    contraparteId: entrada.contraparteId,
    contraparte: entrada.contraparte,
    concepto: entrada.concepto,
    unidades: 1,
    valorUnitario: entrada.valorUnitario,
    periodo: periodoActual(),
    estado: "DEVENGADO",
    origen: entrada.origen,
    origenId: entrada.origenId,
    eventoId: entrada.eventoId,
    fecha: ahora(),
  };
  almacenSensible.cargos.unshift(cargo);
  return cargo;
};

export const servidorCredenciales = {
  credenciales: (filtro: FiltroListado = {}) => {
    const resultado = almacenSensible.credenciales.filter(
      (credencial) =>
        (!filtro.busqueda ||
          contiene(credencial.paciente, filtro.busqueda) ||
          contiene(credencial.seudonimo, filtro.busqueda)) &&
        (!filtro.estado || credencial.estado === filtro.estado) &&
        (!filtro.tipo || credencial.nivelVerificacion === filtro.tipo),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 8));
  },

  credencial: (id: string) => {
    const credencial = almacenSensible.credenciales.find((item) => item.id === id);
    if (!credencial) return rechazarNoEncontrado("Credencial", id);
    return demorar({
      credencial,
      prescripciones: almacenSensible.prescripciones.filter(
        (prescripcion) => prescripcion.pacienteId === credencial.pacienteId,
      ),
      entregas: almacenSensible.actos.filter((acto) => acto.seudonimo === credencial.seudonimo),
    });
  },

  emitirCredencial: (entrada: {
    pacienteId: string;
    paciente: string;
    nivelVerificacion: NivelVerificacion;
    autor: Autor;
  }) => {
    const existente = almacenSensible.credenciales.find(
      (credencial) => credencial.pacienteId === entrada.pacienteId && credencial.estado === "ACTIVA",
    );
    if (existente)
      return rechazar({
        type: "https://sicamed.co/problemas/credencial-ya-activa",
        title: "El paciente ya tiene una credencial activa",
        detail: `La credencial ${existente.id} sigue activa hasta el ${existente.vence.slice(0, 10)}. Suspéndela antes de emitir una nueva: dos credenciales activas romperían el control de recompras.`,
        status: 409,
      });

    const seudonimo = seudonimoDe(entrada.pacienteId);
    const credencial: CredencialPaciente = {
      id: siguienteId("CRE"),
      pacienteId: entrada.pacienteId,
      paciente: entrada.paciente,
      seudonimo,
      estado: "ACTIVA",
      nivelVerificacion: entrada.nivelVerificacion,
      emitida: ahora(),
      vence: new Date(Date.now() + 365 * 86_400_000).toISOString(),
      codigoRotatorio: nuevoCodigo(),
      ultimaRotacion: ahora(),
      entregasEnVentana: 0,
      motivo: null,
    };
    almacenSensible.credenciales.unshift(credencial);
    nuevoCargo({
      flujo: "B2C_CREDENCIAL",
      contraparteId: credencial.id,
      contraparte: seudonimo,
      concepto: "Emisión anual de la credencial digital del paciente",
      valorUnitario: VALOR_CREDENCIAL_B2C,
      origen: "EMISION_CREDENCIAL",
      origenId: credencial.id,
      eventoId: null,
    });
    return demorar(credencial);
  },

  cambiarEstadoCredencial: (entrada: {
    id: string;
    estado: EstadoCredencial;
    motivo: string;
    autor: Autor;
  }) => {
    const indice = almacenSensible.credenciales.findIndex((item) => item.id === entrada.id);
    const previa = almacenSensible.credenciales[indice];
    if (indice < 0 || !previa) return rechazarNoEncontrado("Credencial", entrada.id);
    if (entrada.motivo.trim().length < 10)
      return rechazar({
        type: "https://sicamed.co/problemas/motivo-insuficiente",
        title: "El cambio de estado necesita un motivo",
        detail:
          "Suspender o revocar una credencial deja al paciente sin acceso a su tratamiento en el mostrador. El motivo queda en la ficha y debe explicar la decisión.",
        status: 422,
        errores: [{ campo: "motivo", motivo: "Describe el motivo con al menos diez caracteres." }],
      });
    const actualizada = { ...previa, estado: entrada.estado, motivo: entrada.motivo.trim() };
    almacenSensible.credenciales[indice] = actualizada;
    return demorar(actualizada);
  },

  rotarCodigo: (entrada: { id: string }) => {
    const indice = almacenSensible.credenciales.findIndex((item) => item.id === entrada.id);
    const previa = almacenSensible.credenciales[indice];
    if (indice < 0 || !previa) return rechazarNoEncontrado("Credencial", entrada.id);
    const actualizada = { ...previa, codigoRotatorio: nuevoCodigo(), ultimaRotacion: ahora() };
    almacenSensible.credenciales[indice] = actualizada;
    return demorar(actualizada);
  },
};

const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let semillaCodigo = 0x9e3779b1;

const nuevoCodigo = (): string => {
  semillaCodigo = (Math.imul(semillaCodigo, 1664525) + 1013904223) >>> 0;
  let valor = semillaCodigo;
  let salida = "";
  for (let i = 0; i < 8; i += 1) {
    if (i === 4) salida += "-";
    salida += ALFABETO_CODIGO[valor % ALFABETO_CODIGO.length] ?? "A";
    valor = Math.floor(valor / ALFABETO_CODIGO.length) + 104729;
  }
  return salida;
};

export const servidorPrescripciones = {
  prescripciones: (filtro: FiltroListado = {}) => {
    const resultado = almacenSensible.prescripciones.filter(
      (prescripcion) =>
        (!filtro.busqueda ||
          contiene(prescripcion.codigo, filtro.busqueda) ||
          contiene(prescripcion.paciente, filtro.busqueda) ||
          contiene(prescripcion.denominacionComun, filtro.busqueda)) &&
        (!filtro.estado || prescripcion.estado === filtro.estado),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 8));
  },

  emitirPrescripcion: (entrada: BorradorPrescripcion & { autor: Autor }) => {
    const errores = camposFaltantes(entrada);
    if (errores.length > 0)
      return rechazar({
        type: "https://sicamed.co/problemas/prescripcion-incompleta",
        title: "La fórmula no tiene todos los campos obligatorios",
        detail: `Faltan ${errores.length} de los catorce campos que exige el ${NORMA_DECRETO_2200}. Una fórmula incompleta no puede dispensarse en el punto de entrega.`,
        status: 422,
        norma: NORMA_DECRETO_2200,
        errores,
      });

    const credencial = almacenSensible.credenciales.find(
      (item) => item.pacienteId === entrada.pacienteId && item.estado === "ACTIVA",
    );
    if (!credencial)
      return rechazar({
        type: "https://sicamed.co/problemas/paciente-sin-credencial",
        title: "El paciente no tiene credencial activa",
        detail:
          "Sin credencial activa la fórmula no se puede verificar en el mostrador. Emite primero la credencial digital del paciente.",
        status: 409,
        accion: { etiqueta: "Ir a credenciales", ruta: "/app/salud/credenciales" },
      });

    const prescripcion: Prescripcion = {
      id: siguienteId("PRE"),
      codigo: `RX-2026-${String(7100 + almacenSensible.prescripciones.length)}`,
      pacienteId: entrada.pacienteId,
      seudonimo: credencial.seudonimo,
      prestador: entrada.prestador,
      prestadorDireccion: entrada.prestadorDireccion,
      prestadorContacto: entrada.prestadorContacto,
      lugar: entrada.lugar,
      fecha: ahora(),
      paciente: entrada.paciente,
      documento: entrada.documento,
      historiaClinica: entrada.historiaClinica,
      tipoUsuario: entrada.tipoUsuario,
      denominacionComun: entrada.denominacionComun,
      presentacion: entrada.presentacion,
      concentracion: entrada.concentracion,
      formaFarmaceutica: entrada.formaFarmaceutica,
      viaAdministracion: entrada.viaAdministracion,
      posologia: entrada.posologia,
      duracionDias: entrada.duracionDias,
      cantidadTotal: entrada.cantidadTotal,
      cantidadEnLetras: enLetras(entrada.cantidadTotal),
      unidadFarmaceutica: entrada.unidadFarmaceutica,
      indicaciones: entrada.indicaciones,
      vigenciaHasta: entrada.vigenciaHasta,
      profesional: entrada.profesional,
      registroProfesional: entrada.registroProfesional,
      firma: `${entrada.profesional} · firma electrónica verificada`,
      fiscalizado: entrada.fiscalizado,
      estado: "VIGENTE",
      entregadas: 0,
      ventanaRecompraDias: entrada.fiscalizado ? 25 : 15,
      ultimaEntrega: null,
      motivoAnulacion: null,
    };
    almacenSensible.prescripciones.unshift(prescripcion);
    return demorar(prescripcion);
  },

  anularPrescripcion: (entrada: { id: string; motivo: string; autor: Autor }) => {
    const indice = almacenSensible.prescripciones.findIndex((item) => item.id === entrada.id);
    const previa = almacenSensible.prescripciones[indice];
    if (indice < 0 || !previa) return rechazarNoEncontrado("Prescripción", entrada.id);
    if (previa.estado === "DISPENSADA")
      return rechazar({
        type: "https://sicamed.co/problemas/prescripcion-ya-dispensada",
        title: "La fórmula ya fue dispensada por completo",
        detail:
          "Anular una fórmula entregada reescribiría un hecho que ya está sellado en el ledger. Registra la novedad en la historia clínica del paciente.",
        status: 409,
      });
    if (entrada.motivo.trim().length < 10)
      return rechazar({
        type: "https://sicamed.co/problemas/motivo-insuficiente",
        title: "La anulación necesita un motivo",
        detail: "El motivo queda en la fórmula y es lo que verá el punto de dispensación al consultarla.",
        status: 422,
        errores: [{ campo: "motivo", motivo: "Describe el motivo con al menos diez caracteres." }],
      });
    const actualizada: Prescripcion = {
      ...previa,
      estado: "ANULADA",
      motivoAnulacion: entrada.motivo.trim(),
    };
    almacenSensible.prescripciones[indice] = actualizada;
    return demorar(actualizada);
  },
};

export const servidorDispensacion = {
  puntos: () => demorar(PUNTOS),

  verificar: (entrada: { codigo: string; metodo: MetodoVerificacion; puntoId: string; autor: Autor }) => {
    const punto = puntoDe(entrada.puntoId);
    if (!punto) return rechazarNoEncontrado("Punto de dispensación", entrada.puntoId);
    if (vencida(punto.vigenciaLicencia))
      return rechazar({
        type: "https://sicamed.co/problemas/punto-sin-licencia-vigente",
        title: "El punto de dispensación no tiene licencia vigente",
        detail: `La licencia ${punto.licencia} venció el ${punto.vigenciaLicencia.slice(0, 10)}. Sin licencia vigente no puede registrarse una entrega de producto fiscalizado.`,
        status: 409,
        norma: NORMA_PRESENCIAL,
      });

    const buscado = entrada.codigo.trim().toUpperCase();
    const credencial = almacenSensible.credenciales.find(
      (item) => item.codigoRotatorio === buscado || item.seudonimo === buscado,
    );

    if (!credencial) {
      anotarIntento(null, entrada.metodo, "NO_ENCONTRADA", entrada.puntoId);
      return rechazar({
        type: "https://sicamed.co/problemas/credencial-no-encontrada",
        title: "No hay ninguna credencial con ese código",
        detail:
          "El código que muestra la aplicación del paciente rota cada pocos minutos. Pide que la actualice y vuelve a intentarlo; si persiste, la credencial puede estar revocada.",
        status: 404,
      });
    }

    if (credencial.estado !== "ACTIVA") {
      anotarIntento(credencial.seudonimo, entrada.metodo, "CREDENCIAL_SUSPENDIDA", entrada.puntoId);
      registrarEvento({
        tipo: "VERIFICACION_FALLIDA",
        descripcion: `Se intentó verificar la credencial ${credencial.seudonimo} en estado ${credencial.estado} en ${punto.nombre}`,
        entidad: "Credencial",
        entidadId: credencial.seudonimo,
        actor: entrada.autor.nombre,
        organizacionId: punto.organizacionId,
      });
      return rechazar({
        type: "https://sicamed.co/problemas/credencial-no-activa",
        title: `La credencial está ${credencial.estado.toLowerCase()}`,
        detail:
          credencial.motivo ??
          "La credencial no está activa. El paciente debe resolverlo con su médico tratante antes de retirar el producto.",
        status: 409,
      });
    }

    anotarIntento(credencial.seudonimo, entrada.metodo, "VERIFICADA", entrada.puntoId);
    const evento = registrarEvento({
      tipo: "CREDENCIAL_VERIFICADA",
      descripcion: `Se verificó la credencial ${credencial.seudonimo} en ${punto.nombre} por ${entrada.metodo.replace("_", " ").toLowerCase()}`,
      entidad: "Credencial",
      entidadId: credencial.seudonimo,
      actor: entrada.autor.nombre,
      organizacionId: punto.organizacionId,
    });

    const dispensables = almacenSensible.prescripciones
      .filter((prescripcion) => prescripcion.seudonimo === credencial.seudonimo)
      .filter((prescripcion) => ESTADOS_DISPENSABLES.has(prescripcion.estado))
      .filter((prescripcion) => !vencida(prescripcion.vigenciaHasta))
      .map(aMostrador);

    return demorar({
      seudonimo: credencial.seudonimo,
      nivelVerificacion: credencial.nivelVerificacion,
      vence: credencial.vence,
      eventoId: evento.id,
      prescripciones: dispensables,
    });
  },

  registrarEntrega: (entrada: {
    puntoId: string;
    seudonimo: string;
    prescripcionCodigo: string;
    unidades: number;
    metodo: MetodoVerificacion;
    operador: string;
    autor: Autor;
  }) => {
    const punto = puntoDe(entrada.puntoId);
    if (!punto) return rechazarNoEncontrado("Punto de dispensación", entrada.puntoId);

    const indice = almacenSensible.prescripciones.findIndex(
      (prescripcion) =>
        prescripcion.codigo === entrada.prescripcionCodigo &&
        prescripcion.seudonimo === entrada.seudonimo,
    );
    const prescripcion = almacenSensible.prescripciones[indice];
    if (indice < 0 || !prescripcion)
      return rechazarNoEncontrado("Prescripción", entrada.prescripcionCodigo);

    if (!ESTADOS_DISPENSABLES.has(prescripcion.estado))
      return rechazar({
        type: "https://sicamed.co/problemas/prescripcion-no-dispensable",
        title: `La fórmula está ${prescripcion.estado.replace("_", " ").toLowerCase()}`,
        detail:
          prescripcion.motivoAnulacion ??
          "Solo pueden entregarse fórmulas emitidas, vigentes o con entrega parcial pendiente.",
        status: 409,
      });

    if (vencida(prescripcion.vigenciaHasta))
      return rechazar({
        type: "https://sicamed.co/problemas/prescripcion-vencida",
        title: "La vigencia de la fórmula ya pasó",
        detail: `La fórmula ${prescripcion.codigo} venció el ${prescripcion.vigenciaHasta.slice(0, 10)}. El paciente necesita una fórmula nueva de su médico tratante.`,
        status: 409,
        norma: NORMA_DECRETO_2200,
      });

    const espera = diasParaHabilitar(prescripcion);
    if (espera > 0) {
      registrarEvento({
        tipo: "RECOMPRA_BLOQUEADA",
        descripcion: `Se bloqueó una entrega anticipada de ${prescripcion.codigo} para ${prescripcion.seudonimo}: faltan ${espera} días de la ventana`,
        entidad: "Prescripcion",
        entidadId: prescripcion.codigo,
        actor: entrada.autor.nombre,
        organizacionId: punto.organizacionId,
      });
      return rechazar({
        type: "https://sicamed.co/problemas/ventana-de-recompra",
        title: "Todavía no se cumple la ventana entre entregas",
        detail: `La última entrega de esta fórmula fue hace ${diasDesde(prescripcion.ultimaEntrega ?? ahora())} días y la ventana es de ${prescripcion.ventanaRecompraDias}. Faltan ${espera} días. El bloqueo queda registrado en el ledger.`,
        status: 409,
      });
    }

    const saldo = saldoDe(prescripcion);
    if (entrada.unidades < 1 || entrada.unidades > saldo)
      return rechazar({
        type: "https://sicamed.co/problemas/saldo-insuficiente",
        title: "La cantidad excede el saldo de la fórmula",
        detail: `Quedan ${saldo} ${prescripcion.unidadFarmaceutica} por entregar de un total de ${prescripcion.cantidadTotal}.`,
        status: 422,
        errores: [{ campo: "unidades", motivo: `Indica entre 1 y ${saldo}.` }],
      });

    const entregadas = prescripcion.entregadas + entrada.unidades;
    const actualizada: Prescripcion = {
      ...prescripcion,
      entregadas,
      ultimaEntrega: ahora(),
      estado: entregadas >= prescripcion.cantidadTotal ? "DISPENSADA" : "DISPENSADA_PARCIAL",
    };
    almacenSensible.prescripciones[indice] = actualizada;

    const evento = registrarEvento({
      tipo: "DISPENSACION_REGISTRADA",
      descripcion: `Entrega presencial de ${entrada.unidades} ${prescripcion.unidadFarmaceutica} de ${prescripcion.denominacionComun} contra ${prescripcion.codigo} en ${punto.nombre}`,
      entidad: "Dispensacion",
      entidadId: prescripcion.seudonimo,
      actor: entrada.autor.nombre,
      organizacionId: punto.organizacionId,
    });

    const acto: ActoDispensacion = {
      id: siguienteId("ACT"),
      codigo: `DIS-2026-${String(3200 + almacenSensible.actos.length)}`,
      seudonimo: prescripcion.seudonimo,
      prescripcionCodigo: prescripcion.codigo,
      denominacionComun: prescripcion.denominacionComun,
      unidades: entrada.unidades,
      unidadFarmaceutica: prescripcion.unidadFarmaceutica,
      metodo: entrada.metodo,
      puntoId: punto.id,
      punto: punto.nombre,
      municipio: punto.municipio,
      operador: entrada.operador,
      fecha: ahora(),
      eventoId: evento.id,
      fiscalizado: prescripcion.fiscalizado,
    };
    almacenSensible.actos.unshift(acto);

    const cargo = nuevoCargo({
      flujo: "B2B_VERIFICACION",
      contraparteId: punto.id,
      contraparte: punto.nombre,
      concepto: "Verificación de credencial y sellado del acto de dispensación",
      valorUnitario: VALOR_VERIFICACION_B2B,
      origen: "ACTO_DISPENSACION",
      origenId: acto.id,
      eventoId: evento.id,
    });

    const credencialIndice = almacenSensible.credenciales.findIndex(
      (item) => item.seudonimo === prescripcion.seudonimo,
    );
    const credencial = almacenSensible.credenciales[credencialIndice];
    if (credencial)
      almacenSensible.credenciales[credencialIndice] = {
        ...credencial,
        entregasEnVentana: credencial.entregasEnVentana + 1,
      };

    return demorar({ acto, cargo, prescripcion: aMostrador(actualizada) });
  },

  actos: (filtro: FiltroListado & { puntoId?: string } = {}) => {
    const resultado = almacenSensible.actos.filter(
      (acto) =>
        (!filtro.busqueda ||
          contiene(acto.codigo, filtro.busqueda) ||
          contiene(acto.seudonimo, filtro.busqueda) ||
          contiene(acto.prescripcionCodigo, filtro.busqueda)) &&
        (!filtro.puntoId || acto.puntoId === filtro.puntoId) &&
        (!filtro.tipo || acto.metodo === filtro.tipo),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 10));
  },
};

export const servidorCredencialPublica = {
  consultar: (codigo: string) => {
    const buscado = codigo.trim().toUpperCase();
    const credencial = almacenSensible.credenciales.find(
      (item) => item.codigoRotatorio === buscado || item.seudonimo === buscado,
    );
    if (!credencial)
      return rechazar({
        type: "https://sicamed.co/problemas/credencial-no-encontrada",
        title: "No encontramos esa credencial",
        detail:
          "Revisa el código tal como aparece en tu credencial. Si acaba de rotar, usa el más reciente. Por seguridad no confirmamos si un código existió antes.",
        status: 404,
      });
    return demorar({
      seudonimo: credencial.seudonimo,
      estado: credencial.estado,
      nivelVerificacion: credencial.nivelVerificacion,
      vence: credencial.vence,
      codigoRotatorio: credencial.codigoRotatorio,
      ultimaRotacion: credencial.ultimaRotacion,
      entregasEnVentana: credencial.entregasEnVentana,
      motivo: credencial.motivo,
    });
  },
};

export const servidorLiquidacion = {
  cargos: (filtro: { flujo?: FlujoCargo; periodo?: string; estado?: string; pagina?: number; porPagina?: number } = {}) => {
    const resultado = almacenSensible.cargos.filter(
      (cargo) =>
        (!filtro.flujo || cargo.flujo === filtro.flujo) &&
        (!filtro.periodo || cargo.periodo === filtro.periodo) &&
        (!filtro.estado || cargo.estado === filtro.estado),
    );
    return demorar(paginar(resultado, filtro.pagina, filtro.porPagina ?? 12));
  },

  corte: (filtro: { periodo?: string } = {}) => {
    const cargos = almacenSensible.cargos.filter(
      (cargo) => !filtro.periodo || cargo.periodo === filtro.periodo,
    );
    const totalDe = (flujo: FlujoCargo) =>
      cargos
        .filter((cargo) => cargo.flujo === flujo)
        .reduce((suma, cargo) => suma + cargo.unidades * cargo.valorUnitario, 0);
    const contarDe = (flujo: FlujoCargo) => cargos.filter((cargo) => cargo.flujo === flujo).length;
    const periodos = [...new Set(almacenSensible.cargos.map((cargo) => cargo.periodo))].sort().reverse();
    return demorar({
      periodos,
      b2b: { cargos: contarDe("B2B_VERIFICACION"), total: totalDe("B2B_VERIFICACION") },
      b2c: { cargos: contarDe("B2C_CREDENCIAL"), total: totalDe("B2C_CREDENCIAL") },
      sinEventoOrigen: cargos.filter((cargo) => cargo.flujo === "B2B_VERIFICACION" && !cargo.eventoId)
        .length,
    });
  },
};
