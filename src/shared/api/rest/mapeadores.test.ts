import { describe, expect, it } from "vitest";
import {
  aAtestacion,
  aBeneficio,
  aCuenta,
  aCultivo,
  aCupo,
  aDetallePlanta,
  aLote,
  aOferta,
  aOfertaPublica,
  aOrganizacion,
  aPlanta,
  aRolPlataforma,
  aRueda,
  aSolicitud,
  aTransformacion,
  tieneDatosDeContacto,
} from "./mapeadores";
import type {
  AtestacionApi,
  BeneficioApi,
  CuentaApi,
  CultivoApi,
  CupoApi,
  LoteApi,
  OfertaApi,
  OfertaPublicaApi,
  OrganizacionApi,
  PlantaApi,
  RuedaApi,
  SolicitudApi,
  TransformacionApi,
} from "./contrato";
import type { Catalogo } from "./catalogo";

const organizacionCompleta: OrganizacionApi = {
  id: "ORG-0006",
  nit: "900123456-8",
  nombre: "Laboratorios Fitomed S.A.S.",
  tipo: "LABORATORIO",
  departamento: "Tolima",
  municipio: "Ibagué",
  estado: "HABILITADA",
  registro: "2026-01-15T10:00:00.000Z",
  representante: "Marcela Ospina",
  correo: "contacto@fitomed.co",
  telefono: "+57 300 000 0000",
  cultivos: 3,
  lotes: 12,
  ofertas: 4,
};

const catalogo: Catalogo = {
  organizaciones: new Map([["ORG-0006", "Laboratorios Fitomed S.A.S."]]),
  variedades: new Map([["VAR-1", { nombre: "Charlotte's Angel", tipo: "PSICOACTIVO" as const }]]),
  cultivos: new Map([
    ["CUL-1", { nombre: "Predio La Esperanza", departamento: "Cauca", variedadId: "VAR-1" }],
  ]),
  lotes: new Map([["LOT-1", "LOT-2026-001"]]),
};

describe("proyeccion de organizacion segun quien pregunta", () => {
  it("un rol con contacto recibe representante, correo y telefono", () => {
    const organizacion = aOrganizacion(organizacionCompleta);
    expect(organizacion.correo).toBe("contacto@fitomed.co");
    expect(tieneDatosDeContacto(organizacionCompleta)).toBe(true);
  });

  it("la proyeccion sin contacto del Art. 21 no deja campos indefinidos en la vista", () => {
    const publica: OrganizacionApi = {
      id: organizacionCompleta.id,
      nit: organizacionCompleta.nit,
      nombre: organizacionCompleta.nombre,
      tipo: organizacionCompleta.tipo,
      departamento: organizacionCompleta.departamento,
      municipio: organizacionCompleta.municipio,
      estado: organizacionCompleta.estado,
      registro: organizacionCompleta.registro,
      cultivos: organizacionCompleta.cultivos,
      lotes: organizacionCompleta.lotes,
      ofertas: organizacionCompleta.ofertas,
    };
    const organizacion = aOrganizacion(publica);
    expect(organizacion.correo).toBe("");
    expect(organizacion.representante).toBe("");
    expect(organizacion.telefono).toBe("");
    expect(tieneDatosDeContacto(publica)).toBe(false);
  });

  it("el estado INACTIVA del contrato se muestra como suspendida", () => {
    expect(aOrganizacion({ ...organizacionCompleta, estado: "INACTIVA" }).estado).toBe("SUSPENDIDA");
  });

  it("los contadores ausentes valen cero y no NaN", () => {
    const sinContadores: OrganizacionApi = { ...organizacionCompleta };
    delete sinContadores.cultivos;
    delete sinContadores.lotes;
    delete sinContadores.ofertas;
    expect(aOrganizacion(sinContadores).cultivos).toBe(0);
  });
});

const ofertaAutenticada: OfertaApi = {
  id: "OFE-1",
  titulo: "Aceite estandarizado CBD",
  descripcion: "Producto verificado",
  tipoProducto: "ACEITE",
  tipoActor: "LABORATORIO",
  organizacion: "Laboratorios Fitomed S.A.S.",
  organizacionId: "ORG-0006",
  departamento: "Tolima",
  municipio: "Ibagué",
  estado: "PUBLICADA",
  disponibilidad: "INMEDIATA",
  publicada: "2026-08-01T09:00:00.000Z",
  vigencia: "2026-12-01",
  certificaciones: ["BPA"],
  interesados: 4,
};

describe("ofertas", () => {
  it("una oferta pausada se muestra como suspendida y una despublicada como rechazada", () => {
    expect(aOferta({ ...ofertaAutenticada, estado: "PAUSADA" }).estado).toBe("SUSPENDIDA");
    expect(aOferta({ ...ofertaAutenticada, estado: "DESPUBLICADA" }).estado).toBe("RECHAZADA");
  });

  it("un borrador sin fecha de publicacion no arrastra null a la vista", () => {
    const borrador = aOferta({ ...ofertaAutenticada, estado: "BORRADOR", publicada: null, vigencia: null });
    expect(borrador.publicada).toBe("");
    expect(borrador.vigencia).toBe("");
  });

  it("la proyeccion publica nunca expone el numero de interesados", () => {
    const publica: OfertaPublicaApi = {
      id: "OFE-1",
      titulo: "Aceite estandarizado CBD",
      descripcion: "Producto verificado",
      tipoProducto: "Aceite estandarizado CBD",
      tipoActor: "LABORATORIO",
      organizacion: "Laboratorios Fitomed S.A.S.",
      organizacionId: "ORG-0006",
      departamento: "Tolima",
      municipio: "Ibagué",
      estado: "PUBLICADA",
      disponibilidad: "INMEDIATA",
      publicada: "2026-08-01T09:00:00.000Z",
      vigencia: "2026-12-01",
    };
    expect(aOfertaPublica(publica).interesados).toBe(0);
    expect(aOfertaPublica(publica).certificaciones).toEqual([]);
  });
});

describe("decimales que el contrato manda como cadena", () => {
  const lote: LoteApi = {
    id: "LOT-1",
    codigo: "LOT-2026-001",
    cultivoId: "CUL-1",
    organizacionId: "ORG-0006",
    tipo: "FLOR_SECA",
    cantidadInicial: "120.500",
    existencia: "98.250",
    unidad: "kg",
    estado: "EN_BODEGA",
    motivoEstado: "",
    thc: "0.180",
    cbd: "12.400",
    psicoactivo: false,
    bodega: "Bodega central",
    departamento: "Tolima",
    fecha: "2026-07-01",
    vencimiento: "2027-07-01",
    registro: "2026-07-01T10:00:00.000Z",
    registroInvima: "INVIMA-123",
  };

  it("convierte las cantidades a numero sin perder los decimales", () => {
    const convertido = aLote(lote, catalogo);
    expect(convertido.cantidad).toBe(98.25);
    expect(convertido.thc).toBe(0.18);
    expect(convertido.cbd).toBe(12.4);
  });

  it("la existencia manda sobre la cantidad inicial", () => {
    expect(aLote({ ...lote, existencia: "0" }, catalogo).cantidad).toBe(0);
  });

  it("un lote congelado se muestra retenido porque la vista no conoce ese estado", () => {
    expect(aLote({ ...lote, estado: "CONGELADO" }, catalogo).estado).toBe("RETENIDO");
  });

  it("resuelve el nombre de la organizacion con el catalogo y cae al id sin el", () => {
    expect(aLote(lote, catalogo).organizacion).toBe("Laboratorios Fitomed S.A.S.");
    expect(aLote(lote).organizacion).toBe("ORG-0006");
  });
});

describe("cultivo", () => {
  const cultivo: CultivoApi = {
    id: "CUL-1",
    nombre: "Predio La Esperanza",
    organizacionId: "ORG-0006",
    cupoId: "CUP-1",
    variedadId: "VAR-1",
    departamento: "Cauca",
    municipio: "Popayán",
    areaHectareas: "2.5",
    plantas: 800,
    plantasVivas: 780,
    estado: "PLANIFICADO",
    siembra: "2026-03-01",
    cosechaEstimada: "2026-09-01",
    registro: "2026-02-01T10:00:00.000Z",
  };

  it("planificado y siembra son la misma etapa de preparacion para la vista", () => {
    expect(aCultivo(cultivo).estado).toBe("PREPARACION");
    expect(aCultivo({ ...cultivo, estado: "SIEMBRA" }).estado).toBe("PREPARACION");
  });

  it("marca psicoactivo segun la variedad del catalogo, no segun el cultivo", () => {
    expect(aCultivo(cultivo, catalogo).psicoactivo).toBe(true);
    expect(aCultivo(cultivo).psicoactivo).toBe(false);
  });

  it("el area llega como cadena y se muestra como numero", () => {
    expect(aCultivo(cultivo).areaHectareas).toBe(2.5);
  });
});

describe("planta", () => {
  const planta: PlantaApi = {
    id: "PLA-1",
    codigo: "PLA-2026-0001",
    cultivoId: "CUL-1",
    organizacionId: "ORG-0006",
    variedadId: "VAR-1",
    origen: "CLON",
    madreId: "PLA-0000",
    estado: "VIVA",
    siembra: "2026-03-10",
    bloque: "B2",
    aptaDesde: null,
    cosechadaEn: null,
    enCarencia: true,
    labores: [
      {
        id: "LAB-1",
        tipo: "FITOSANITARIA",
        agroinsumoId: "AGR-1",
        dosis: "2 ml/l",
        responsable: "Jairo Peñaloza",
        fecha: "2026-04-01T10:00:00.000Z",
        carenciaHasta: "2026-04-15",
      },
    ],
  };

  it("una planta viva se muestra en etapa vegetativa", () => {
    expect(aPlanta(planta, catalogo).estado).toBe("VEGETATIVO");
  });

  it("cuenta las labores embebidas en vez de pedirlas aparte", () => {
    expect(aPlanta(planta, catalogo).labores).toBe(1);
  });

  it("toma el departamento del cultivo, que la planta no trae", () => {
    expect(aPlanta(planta, catalogo).departamento).toBe("Cauca");
  });

  it("traduce la labor fitosanitaria al termino de la vista", () => {
    const detalle = aDetallePlanta(planta, catalogo);
    expect(detalle.labores[0]?.tipo).toBe("FITOSANITARIO");
    expect(detalle.labores[0]?.aptaDesde).toBe("2026-04-15");
  });
});

describe("beneficio", () => {
  const beneficio: BeneficioApi = {
    id: "BEN-1",
    cultivoId: "CUL-1",
    organizacionId: "ORG-0006",
    estado: "SECADO",
    plantas: 120,
    pesoHumedoKg: "480.5",
    pesoSecoKg: null,
    pesoAcondicionadoKg: null,
    humedad: null,
    merma: null,
    responsable: "Jairo Peñaloza",
    registro: "2026-05-01T10:00:00.000Z",
  };

  it("los pesos que aun no existen valen cero y no rompen el formato", () => {
    const convertido = aBeneficio(beneficio, catalogo);
    expect(convertido.pesoHumedo).toBe(480.5);
    expect(convertido.pesoSeco).toBe(0);
    expect(convertido.humedad).toBe(0);
  });

  it("el estado CERRADO del contrato equivale a acondicionado en la vista", () => {
    expect(aBeneficio({ ...beneficio, estado: "CERRADO" }, catalogo).estado).toBe("ACONDICIONADO");
  });
});

describe("cupo del MICC", () => {
  const cupo: CupoApi = {
    id: "CUP-1",
    organizacionId: "ORG-0006",
    acto: "Resolución 0123 de 2026",
    estado: "ASIGNADO",
    plantasAsignadas: 1000,
    plantasDisponibles: 200,
    plantasUsadas: 800,
    plantasReportadasMicc: 800,
    vigenciaDesde: "2026-01-01",
    vigenciaHasta: "2026-12-31",
  };

  it("las plantas usadas son las sembradas de la vista", () => {
    expect(aCupo(cupo).plantasSembradas).toBe(800);
    expect(aCupo(cupo).plantasAutorizadas).toBe(1000);
  });

  it("un cupo sin plantas disponibles se muestra agotado", () => {
    expect(aCupo({ ...cupo, plantasDisponibles: 0 }).estado).toBe("AGOTADO");
  });

  it("un cupo vencido no admite mas siembra", () => {
    expect(aCupo({ ...cupo, estado: "VENCIDO" }).estado).toBe("SIN_CUPO");
  });
});

describe("atestacion", () => {
  const atestacion: AtestacionApi = {
    id: "ATE-1",
    organizacionId: "ORG-0006",
    tipo: "FABRICACION_DERIVADOS",
    acto: "Resolución 456",
    autoridad: "MinJusticia",
    expedicion: "2026-01-10",
    vencimiento: "2027-01-10",
    estado: "VIGENTE",
    evidencia: "https://evidencia",
    huella: "sha256:abc",
    origen: "DOCUMENTAL_VERIFICADA",
    registrada: "2026-01-11T10:00:00.000Z",
  };

  it("una atestacion revocada se muestra rechazada", () => {
    expect(aAtestacion({ ...atestacion, estado: "REVOCADA" }).estado).toBe("RECHAZADA");
  });

  it("conserva la huella, que es la prueba y no un adorno", () => {
    expect(aAtestacion(atestacion, catalogo).huella).toBe("sha256:abc");
  });
});

describe("roles del backend a roles de la plataforma", () => {
  it("el analista de cumplimiento verifica expedientes", () => {
    expect(aRolPlataforma("ANALISTA_CUMPLIMIENTO")).toBe("ANALISTA_DOCUMENTAL");
  });

  it("el operador es el operario de campo", () => {
    expect(aRolPlataforma("OPERADOR")).toBe("OPERARIO_CAMPO");
  });

  it("auditor, comprador y autoridad competente solo observan", () => {
    expect(aRolPlataforma("AUDITOR")).toBe("OBSERVADOR_INSTITUCIONAL");
    expect(aRolPlataforma("COMPRADOR")).toBe("OBSERVADOR_INSTITUCIONAL");
    expect(aRolPlataforma("AUTORIDAD_COMPETENTE")).toBe("OBSERVADOR_INSTITUCIONAL");
  });

  it("un rol que el frontend no conoce nunca escala privilegios", () => {
    expect(aRolPlataforma("ROL_QUE_NO_EXISTE")).toBe("OBSERVADOR_INSTITUCIONAL");
  });

  it("la cuenta vinculada al proveedor de identidad se marca como OIDC", () => {
    const cuenta: CuentaApi = {
      id: "CTA-1",
      nombre: "Lida Almeciga",
      correo: "lida@sicamed.gov.co",
      organizacionId: "ORG-0006",
      rol: "ANALISTA_CUMPLIMIENTO",
      estado: "ACTIVA",
      creada: "2026-02-01T10:00:00.000Z",
      ultimoAcceso: null,
      vinculadaAlIdp: true,
    };
    expect(aCuenta(cuenta, catalogo).autenticacion).toBe("OIDC");
    expect(aCuenta(cuenta, catalogo).ultimoAcceso).toBeNull();
    expect(aCuenta(cuenta, catalogo).organizacion).toBe("Laboratorios Fitomed S.A.S.");
  });
});

describe("solicitud de registro", () => {
  const solicitud: SolicitudApi = {
    id: "SOL-1",
    nit: "900123456-8",
    organizacion: "Agroindustrias Cannalia S.A.S.",
    tipoActor: "CULTIVADOR",
    departamento: "Cauca",
    municipio: "Popayán",
    representante: "Hernán Cifuentes",
    correo: "hernan@cannalia.co",
    telefono: "+57 300 111 2222",
    estado: "EN_TRAMITE",
    radicada: "2026-06-01T10:00:00.000Z",
    expedienteId: "EXP-1",
  };

  it("una solicitud en tramite ya tiene expediente abierto", () => {
    expect(aSolicitud(solicitud).estado).toBe("EXPEDIENTE_ABIERTO");
    expect(aSolicitud(solicitud).expedienteId).toBe("EXP-1");
  });

  it("una solicitud rechazada se descarta", () => {
    expect(aSolicitud({ ...solicitud, estado: "RECHAZADA" }).estado).toBe("DESCARTADA");
  });

  it("una solicitud recien recibida no tiene expediente", () => {
    expect(aSolicitud({ ...solicitud, estado: "RECIBIDA", expedienteId: null }).expedienteId).toBeNull();
  });
});

describe("rueda de negocio", () => {
  const rueda: RuedaApi = {
    id: "RUE-1",
    nombre: "Rueda del suroccidente",
    fecha: "2026-10-10",
    departamento: "Cauca",
    municipio: "Popayán",
    estado: "INSCRIPCIONES",
    cupos: 40,
    cuposDisponibles: 12,
  };

  it("deduce los inscritos de los cupos disponibles", () => {
    expect(aRueda(rueda).inscritos).toBe(28);
  });

  it("una rueda ya realizada figura cerrada", () => {
    expect(aRueda({ ...rueda, estado: "REALIZADA" }).estado).toBe("CERRADA");
  });
});

describe("transformacion", () => {
  const transformacion: TransformacionApi = {
    id: "TRA-1",
    organizacionId: "ORG-0006",
    loteOrigenId: "LOT-1",
    loteResultanteId: null,
    producto: "Aceite estandarizado CBD",
    formula: "Extracción CO2",
    entradaKg: "50.000",
    salida: "12.500",
    unidadSalida: "l",
    rendimiento: "0.250",
    registroInvima: "INVIMA-999",
    responsable: "Marcela Ospina",
    fecha: "2026-06-15",
    registro: "2026-06-15T10:00:00.000Z",
  };

  it("sin lote resultante la transformacion sigue en proceso", () => {
    expect(aTransformacion(transformacion, catalogo).estado).toBe("EN_PROCESO");
    expect(aTransformacion(transformacion, catalogo).loteResultante).toBeNull();
  });

  it("con lote resultante queda liberada y nombra el lote", () => {
    const liberada = aTransformacion({ ...transformacion, loteResultanteId: "LOT-1" }, catalogo);
    expect(liberada.estado).toBe("LIBERADA");
    expect(liberada.loteResultante).toBe("LOT-2026-001");
  });

  it("nombra el lote de origen con el catalogo", () => {
    expect(aTransformacion(transformacion, catalogo).loteOrigen).toBe("LOT-2026-001");
    expect(aTransformacion(transformacion, catalogo).rendimiento).toBe(0.25);
  });
});
