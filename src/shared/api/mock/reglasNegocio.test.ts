import { describe, expect, it } from "vitest";
import { servidorMock } from "./servidorMock";
import type { Autor } from "./servidorMock";
import { almacen } from "./almacen";
import { ErrorApi } from "../problemDetails";

const problemaDe = async (accion: Promise<unknown>) => {
  try {
    await accion;
    throw new Error("se esperaba un rechazo y la operación fue aceptada");
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorApi);
    return (error as ErrorApi).problema;
  }
};

const ANALISTA: Autor = {
  usuarioId: "USR-ANALISTA",
  nombre: "Lida Almeciga",
  organizacionId: "ORG-0000",
  rol: "ANALISTA_DOCUMENTAL",
};

const SUPER_ADMIN: Autor = {
  usuarioId: "USR-SUPER",
  nombre: "Diego Fernando Marín",
  organizacionId: "ORG-0000",
  rol: "SUPER_ADMIN",
};

const INSTITUCIONAL: Autor = {
  usuarioId: "USR-ADMIN",
  nombre: "Andrés Beltrán",
  organizacionId: "ORG-0001",
  rol: "ADMIN_INSTITUCIONAL",
};

describe("separacion de funciones en la verificacion documental", () => {
  it("el super administrador no puede verificar expedientes aunque defina la politica", async () => {
    const expediente = almacen.expedientes[0];
    const paso = expediente?.pasos[0];
    const problema = await problemaDe(
      servidorMock.resolverPaso({
        expedienteId: expediente?.id ?? "",
        pasoId: paso?.id ?? "",
        veredicto: "VERIFICADO",
        observacion: "",
        autor: SUPER_ADMIN,
      }),
    );
    expect(problema.status).toBe(403);
    expect(problema.norma).toContain("separación de funciones");
  });

  it("nadie verifica el expediente de su propia organizacion", async () => {
    const expediente = almacen.expedientes[0];
    const problema = await problemaDe(
      servidorMock.decidirDocumento({
        expedienteId: expediente?.id ?? "",
        documentoId: expediente?.documentos[0]?.id ?? "",
        decision: "APROBADO",
        observacion: "",
        autor: { ...ANALISTA, organizacionId: expediente?.organizacionId ?? "" },
      }),
    );
    expect(problema.status).toBe(403);
    expect(problema.title).toContain("su propio expediente");
  });

  it("un rol no puede resolver el paso asignado a otro rol", async () => {
    const expediente = almacen.expedientes.find((registro) =>
      registro.pasos.every((paso) => paso.veredicto === "PENDIENTE"),
    );
    const primero = expediente?.pasos[0];
    const problema = await problemaDe(
      servidorMock.resolverPaso({
        expedienteId: expediente?.id ?? "",
        pasoId: primero?.id ?? "",
        veredicto: "VERIFICADO",
        observacion: "",
        autor: INSTITUCIONAL,
      }),
    );
    expect(problema.status).toBe(403);
    expect(problema.title).toContain("otro rol");
  });

  it("el paso final no se resuelve antes que el primero", async () => {
    const expediente = almacen.expedientes.find((registro) =>
      registro.pasos.every((paso) => paso.veredicto === "PENDIENTE"),
    );
    const segundo = expediente?.pasos[1];
    const problema = await problemaDe(
      servidorMock.resolverPaso({
        expedienteId: expediente?.id ?? "",
        pasoId: segundo?.id ?? "",
        veredicto: "VERIFICADO",
        observacion: "",
        autor: INSTITUCIONAL,
      }),
    );
    expect(problema.status).toBe(409);
    expect(problema.title).toContain("paso anterior sin resolver");
  });

  it("devolver sin observacion es rechazado", async () => {
    const expediente = almacen.expedientes[1];
    const problema = await problemaDe(
      servidorMock.decidirDocumento({
        expedienteId: expediente?.id ?? "",
        documentoId: expediente?.documentos[0]?.id ?? "",
        decision: "DEVUELTO",
        observacion: "   ",
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.title).toContain("observación");
  });

  it("solo el super administrador publica la politica de verificacion", async () => {
    const problema = await problemaDe(
      servidorMock.guardarPolitica({ reglas: [], autor: ANALISTA }),
    );
    expect(problema.status).toBe(403);
  });
});

describe("cupo de plantas del MICC", () => {
  it("rechaza la siembra que excede el cupo autorizado y cita el decreto", async () => {
    const cupo = almacen.cupos[0];
    const problema = await problemaDe(
      servidorMock.registrarCultivo({
        nombre: "Predio de prueba sobre cupo",
        organizacionId: cupo?.organizacionId ?? "",
        departamento: "Cundinamarca",
        municipio: "Bogotá D.C.",
        variedad: "Charlotte's Angel",
        areaHectareas: 2,
        plantas: (cupo?.plantasAutorizadas ?? 0) + 5_000,
        siembra: new Date().toISOString(),
        cosechaEstimada: new Date().toISOString(),
        autor: { ...ANALISTA, organizacionId: cupo?.organizacionId ?? "" },
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.norma).toContain("Dec. 1138/2025 Art. 3");
    expect(problema.accion?.ruta).toBe("/app/cupos");
  });
});

describe("trazabilidad por planta", () => {
  it("un clon exige una planta madre existente", async () => {
    const cultivo = almacen.cultivos[0];
    const variedad = almacen.variedades[0];
    const problema = await problemaDe(
      servidorMock.registrarPlanta({
        cultivoId: cultivo?.id ?? "",
        variedadId: variedad?.id ?? "",
        origen: "CLON",
        madre: "PL-2026-999999",
        bloque: "Bloque Z · Cama 1",
        siembra: new Date().toISOString(),
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.norma).toContain("material de propagación");
  });

  it("la planta madre de un clon debe provenir de semilla", async () => {
    const cultivo = almacen.cultivos[0];
    const variedad = almacen.variedades[0];
    const clonExistente = almacen.plantas.find((planta) => planta.origen === "CLON");
    const problema = await problemaDe(
      servidorMock.registrarPlanta({
        cultivoId: cultivo?.id ?? "",
        variedadId: variedad?.id ?? "",
        origen: "CLON",
        madre: clonExistente?.codigo ?? "",
        bloque: "Bloque Z · Cama 2",
        siembra: new Date().toISOString(),
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.title).toContain("no proviene de semilla");
  });

  it("no se cosecha una planta con periodo de carencia activo", async () => {
    const planta = almacen.plantas.find(
      (registro) =>
        registro.estado !== "COSECHADA" &&
        registro.estado !== "DESTRUIDA" &&
        new Date(registro.aptaDesde).getTime() > Date.now(),
    );
    if (!planta) {
      const enCiclo = almacen.plantas.find(
        (registro) => registro.estado !== "COSECHADA" && registro.estado !== "DESTRUIDA",
      );
      const insumoConCarencia = almacen.agroinsumos.find((insumo) => insumo.carenciaDias > 0);
      await servidorMock.registrarLabor({
        plantaId: enCiclo?.id ?? "",
        tipo: "FITOSANITARIO",
        agroinsumoId: insumoConCarencia?.id ?? null,
        dosis: "2.0 cc/L",
        responsable: "Operario de prueba",
        autor: ANALISTA,
      });
      const problema = await problemaDe(
        servidorMock.cosecharPlanta({ id: enCiclo?.id ?? "", autor: ANALISTA }),
      );
      expect(problema.norma).toContain("BPA");
      return;
    }
    const problema = await problemaDe(
      servidorMock.cosecharPlanta({ id: planta.id, autor: ANALISTA }),
    );
    expect(problema.status).toBe(422);
    expect(problema.norma).toContain("BPA");
  });
});

describe("balance de masa", () => {
  it("el peso seco no puede superar el peso humedo de entrada", async () => {
    const cultivo = almacen.cultivos[0];
    const beneficio = await servidorMock.registrarBeneficio({
      cultivoId: cultivo?.id ?? "",
      plantas: 100,
      pesoHumedo: 500,
      responsable: "Responsable de prueba",
      autor: ANALISTA,
    });
    const problema = await problemaDe(
      servidorMock.avanzarBeneficio({
        id: beneficio.id,
        estado: "CURADO",
        peso: 900,
        humedad: 10,
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.title).toContain("balance de masa");
  });

  it("la transformacion no consume mas de lo que existe en el lote", async () => {
    const lote = almacen.lotes.find((registro) => registro.estado === "EN_BODEGA");
    const problema = await problemaDe(
      servidorMock.registrarTransformacion({
        loteOrigenId: lote?.id ?? "",
        producto: "Aceite estandarizado CBD",
        formula: "Extracción CO₂ supercrítico con winterización posterior",
        entradaKg: (lote?.cantidad ?? 0) + 1_000,
        salida: 10,
        unidadSalida: "L",
        registroInvima: "INVIMA-M-123456",
        responsable: "Director técnico",
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.norma).toContain("Art. 9");
  });

  it("el producto terminado exige registro sanitario del INVIMA", async () => {
    const lote = almacen.lotes.find((registro) => registro.estado === "EN_BODEGA");
    const problema = await problemaDe(
      servidorMock.registrarTransformacion({
        loteOrigenId: lote?.id ?? "",
        producto: "Aceite estandarizado CBD",
        formula: "Extracción CO₂ supercrítico con winterización posterior",
        entradaKg: 1,
        salida: 0.06,
        unidadSalida: "L",
        registroInvima: "  ",
        responsable: "Director técnico",
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.norma).toContain("INVIMA");
  });
});

describe("disposicion final", () => {
  it("el acta de destruccion exige testigo identificado", async () => {
    const lote = almacen.lotes.find((registro) => registro.estado === "EN_BODEGA");
    const problema = await problemaDe(
      servidorMock.registrarDestruccion({
        entidad: "LOTE",
        entidadId: lote?.id ?? "",
        cantidad: 5,
        causal: "VENCIMIENTO",
        metodo: "Incineración en horno autorizado",
        testigo: "",
        cargoTestigo: "",
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.norma).toContain("Art. 11");
  });

  it("un lote destruido no admite movimientos posteriores", async () => {
    const lote = almacen.lotes.find((registro) => registro.estado === "EN_BODEGA");
    await servidorMock.registrarDestruccion({
      entidad: "LOTE",
      entidadId: lote?.id ?? "",
      cantidad: lote?.cantidad ?? 1,
      causal: "VENCIMIENTO",
      metodo: "Incineración en horno autorizado con registro de temperatura",
      testigo: "Ana Lucía Peña",
      cargoTestigo: "Delegada del FNE",
      autor: ANALISTA,
    });
    const problema = await problemaDe(
      servidorMock.moverLote({
        id: lote?.id ?? "",
        estado: "EN_TRANSITO",
        bodega: "Bodega X",
        motivo: "Traslado de prueba posterior a la destrucción",
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(409);
  });
});

describe("gobierno de cuentas", () => {
  it("solo el super administrador crea cuentas", async () => {
    const problema = await problemaDe(
      servidorMock.invitarCuenta({
        nombre: "Persona de prueba",
        correo: "persona.prueba@ejemplo.co",
        rol: "OPERARIO_CAMPO",
        organizacionId: "ORG-0006",
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(403);
    expect(problema.norma).toContain("Art. 24");
  });

  it("no se puede degradar al unico super administrador", async () => {
    const cuenta = almacen.cuentas.find(
      (registro) => registro.correo === "super.admin@sicamed.gov.co",
    );
    const problema = await problemaDe(
      servidorMock.cambiarCuenta({
        id: cuenta?.id ?? "",
        rol: "OPERARIO_CAMPO",
        autor: SUPER_ADMIN,
      }),
    );
    expect(problema.status).toBe(409);
  });
});

describe("fuentes autoritativas", () => {
  it("no se impone el valor local sobre el registro externo autoritativo", async () => {
    const discrepancia = almacen.discrepancias.find(
      (registro) => registro.autoritativo === "EXTERNO" && registro.estado === "ABIERTA",
    );
    const problema = await problemaDe(
      servidorMock.resolverDiscrepancia({
        id: discrepancia?.id ?? "",
        resolucion: "RESUELTA_LOCAL",
        autor: ANALISTA,
      }),
    );
    expect(problema.status).toBe(409);
    expect(problema.norma).toContain("jerarquía probatoria");
  });

  it("una conexion sin interfaz tecnica no se puede sincronizar", async () => {
    const fne = almacen.conexiones.find((conexion) => conexion.sigla === "FNE");
    const problema = await problemaDe(
      servidorMock.sincronizarConexion({ id: fne?.id ?? "", autor: ANALISTA }),
    );
    expect(problema.status).toBe(501);
  });
});

describe("ledger de trazabilidad", () => {
  it("cada escritura encadena su huella con la del evento anterior", async () => {
    const anterior = almacen.eventos[0];
    await servidorMock.registrarLote({
      organizacionId: "ORG-0006",
      cultivoId: almacen.cultivos[0]?.id ?? "",
      tipo: "FLOR_SECA",
      cantidad: 12,
      unidad: "kg",
      thc: 0.5,
      cbd: 11,
      bodega: "Bodega de prueba",
      departamento: "Cundinamarca",
      vencimiento: new Date().toISOString(),
      autor: ANALISTA,
    });
    const nuevo = almacen.eventos[0];
    expect(nuevo?.huellaPrevia).toBe(anterior?.huella);
    expect(nuevo?.secuencia).toBeGreaterThan(anterior?.secuencia ?? 0);
    expect(nuevo?.tipo).toBe("LOTE_CREADO");
  });
});

describe("registro publico de actores", () => {
  it("rechaza un NIT ya registrado", async () => {
    const existente = almacen.organizaciones[0];
    const problema = await problemaDe(
      servidorMock.radicarSolicitud({
        nit: existente?.nit ?? "",
        organizacion: "Otra organización S.A.S.",
        tipoActor: "CULTIVADOR",
        departamento: "Cundinamarca",
        municipio: "Bogotá D.C.",
        representante: "Persona Solicitante",
        correo: "otra@ejemplo.co",
        telefono: "+57 601 234 5678",
      }),
    );
    expect(problema.status).toBe(409);
  });

  it("abrir el expediente crea la organizacion, su checklist y la invitacion", async () => {
    const solicitud = await servidorMock.radicarSolicitud({
      nit: "901999888-1",
      organizacion: "Cultivos de Prueba S.A.S.",
      tipoActor: "CULTIVADOR",
      departamento: "Tolima",
      municipio: "Ibagué",
      representante: "Persona Solicitante",
      correo: "nueva.prueba@ejemplo.co",
      telefono: "+57 608 234 5678",
    });
    const expediente = await servidorMock.abrirExpediente({
      solicitudId: solicitud.id,
      autor: ANALISTA,
    });
    expect(expediente.estado).toBe("RADICADO");
    expect(expediente.documentos.length).toBeGreaterThan(0);
    expect(expediente.pasos).toHaveLength(2);
    expect(expediente.politicaVersion).toBe(almacen.politicaVersion);
    expect(
      almacen.cuentas.some((cuenta) => cuenta.correo === "nueva.prueba@ejemplo.co"),
    ).toBe(true);
    expect(almacen.organizaciones.some((registro) => registro.nit === "901999888-1")).toBe(true);
  });
});
