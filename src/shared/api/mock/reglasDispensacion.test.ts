import { beforeEach, describe, expect, it } from "vitest";
import { servidorDispensacion, servidorLiquidacion, servidorPrescripciones } from "./servidorSensible";
import { almacenSensible, reiniciarAlmacenSensible } from "./almacenSensible";
import { almacen } from "./almacen";
import { ErrorApi } from "../problemDetails";
import type { Autor } from "./protocolo";

const MOSTRADOR: Autor = {
  usuarioId: "USR-MOSTRADOR",
  nombre: "Marcela Ruiz",
  organizacionId: "ORG-0004",
  rol: "OPERARIO_CAMPO",
};

const MEDICO: Autor = {
  usuarioId: "USR-MEDICO",
  nombre: "Dra. Claudia Pardo",
  organizacionId: "ORG-0001",
  rol: "EQUIPO_CLINICO",
};

const PUNTO = "PDD-0001";

const problemaDe = async (accion: Promise<unknown>) => {
  try {
    await accion;
    throw new Error("se esperaba un rechazo y la operación fue aceptada");
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorApi);
    return (error as ErrorApi).problema;
  }
};

const credencialDispensable = () => {
  const credencial = almacenSensible.credenciales.find((item) => item.estado === "ACTIVA");
  if (!credencial) throw new Error("la semilla no trae credenciales activas");
  const indice = almacenSensible.prescripciones.findIndex(
    (prescripcion) => prescripcion.seudonimo === credencial.seudonimo,
  );
  const prescripcion = almacenSensible.prescripciones[indice];
  if (!prescripcion) throw new Error("la semilla no trae una fórmula para esa credencial");
  almacenSensible.prescripciones[indice] = {
    ...prescripcion,
    estado: "VIGENTE",
    entregadas: 0,
    cantidadTotal: 3,
    cantidadEnLetras: "tres",
    ultimaEntrega: null,
    vigenciaHasta: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  };
  return { credencial, prescripcion: almacenSensible.prescripciones[indice] };
};

beforeEach(() => {
  reiniciarAlmacenSensible();
});

describe("frontera de identidad en el punto de dispensación", () => {
  it("la verificación devuelve el seudónimo y nunca el nombre ni el documento", async () => {
    const { credencial } = credencialDispensable();
    const respuesta = await servidorDispensacion.verificar({
      codigo: credencial.codigoRotatorio,
      metodo: "CODIGO_ROTATORIO",
      puntoId: PUNTO,
      autor: MOSTRADOR,
    });
    const texto = JSON.stringify(respuesta);
    expect(respuesta.seudonimo).toBe(credencial.seudonimo);
    expect(texto).not.toContain(credencial.paciente);
    expect(texto).not.toContain("documento");
    expect(texto).not.toContain("diagnostico");
  });

  it("el ledger sella el acto contra el seudónimo, no contra la persona", async () => {
    const { credencial, prescripcion } = credencialDispensable();
    await servidorDispensacion.verificar({
      codigo: credencial.codigoRotatorio,
      metodo: "DOCUMENTO",
      puntoId: PUNTO,
      autor: MOSTRADOR,
    });
    await servidorDispensacion.registrarEntrega({
      puntoId: PUNTO,
      seudonimo: credencial.seudonimo,
      prescripcionCodigo: prescripcion.codigo,
      unidades: 1,
      metodo: "DOCUMENTO",
      operador: "Marcela Ruiz · regente",
      autor: MOSTRADOR,
    });
    const evento = almacen.eventos.find((item) => item.tipo === "DISPENSACION_REGISTRADA");
    expect(evento?.entidadId).toBe(credencial.seudonimo);
    expect(JSON.stringify(evento)).not.toContain(credencial.paciente);
  });
});

describe("reglas de la entrega presencial", () => {
  it("descuenta el saldo y deja la fórmula en entrega parcial", async () => {
    const { credencial, prescripcion } = credencialDispensable();
    const resultado = await servidorDispensacion.registrarEntrega({
      puntoId: PUNTO,
      seudonimo: credencial.seudonimo,
      prescripcionCodigo: prescripcion.codigo,
      unidades: 1,
      metodo: "CODIGO_ROTATORIO",
      operador: "Marcela Ruiz · regente",
      autor: MOSTRADOR,
    });
    const guardada = almacenSensible.prescripciones.find((item) => item.codigo === prescripcion.codigo);
    expect(resultado.acto.unidades).toBe(1);
    expect(guardada?.entregadas).toBe(1);
    expect(guardada?.estado).toBe("DISPENSADA_PARCIAL");
  });

  it("bloquea la recompra anticipada y deja el bloqueo en el ledger", async () => {
    const { credencial, prescripcion } = credencialDispensable();
    await servidorDispensacion.registrarEntrega({
      puntoId: PUNTO,
      seudonimo: credencial.seudonimo,
      prescripcionCodigo: prescripcion.codigo,
      unidades: 1,
      metodo: "CODIGO_ROTATORIO",
      operador: "Marcela Ruiz · regente",
      autor: MOSTRADOR,
    });
    const problema = await problemaDe(
      servidorDispensacion.registrarEntrega({
        puntoId: PUNTO,
        seudonimo: credencial.seudonimo,
        prescripcionCodigo: prescripcion.codigo,
        unidades: 1,
        metodo: "CODIGO_ROTATORIO",
        operador: "Marcela Ruiz · regente",
        autor: MOSTRADOR,
      }),
    );
    expect(problema.status).toBe(409);
    expect(problema.type).toContain("ventana-de-recompra");
    expect(almacen.eventos.some((evento) => evento.tipo === "RECOMPRA_BLOQUEADA")).toBe(true);
  });

  it("rechaza la verificación de una credencial que no está activa", async () => {
    const credencial = almacenSensible.credenciales.find((item) => item.estado === "SUSPENDIDA");
    expect(credencial).toBeDefined();
    const problema = await problemaDe(
      servidorDispensacion.verificar({
        codigo: credencial?.codigoRotatorio ?? "",
        metodo: "CODIGO_ROTATORIO",
        puntoId: PUNTO,
        autor: MOSTRADOR,
      }),
    );
    expect(problema.status).toBe(409);
    expect(almacen.eventos.some((evento) => evento.tipo === "VERIFICACION_FALLIDA")).toBe(true);
  });

  it("no entrega más unidades de las que quedan en la fórmula", async () => {
    const { credencial, prescripcion } = credencialDispensable();
    const problema = await problemaDe(
      servidorDispensacion.registrarEntrega({
        puntoId: PUNTO,
        seudonimo: credencial.seudonimo,
        prescripcionCodigo: prescripcion.codigo,
        unidades: prescripcion.cantidadTotal + 1,
        metodo: "CODIGO_ROTATORIO",
        operador: "Marcela Ruiz · regente",
        autor: MOSTRADOR,
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.errores?.[0]?.campo).toBe("unidades");
  });
});

describe("los catorce campos del Decreto 2200 de 2005", () => {
  it("rechaza la fórmula incompleta y nombra el numeral que falta", async () => {
    const problema = await problemaDe(
      servidorPrescripciones.emitirPrescripcion({
        pacienteId: "PAC-0001",
        paciente: "Paciente de prueba",
        documento: "",
        historiaClinica: "",
        tipoUsuario: "CONTRIBUTIVO",
        prestador: "IPS de prueba",
        prestadorDireccion: "",
        prestadorContacto: "",
        lugar: "Cali",
        denominacionComun: "Cannabidiol",
        presentacion: "Aceite",
        concentracion: "CBD 30 mg/mL",
        formaFarmaceutica: "Solución oral",
        viaAdministracion: "Oral",
        posologia: "5 gotas cada 12 horas",
        duracionDias: 30,
        cantidadTotal: 0,
        unidadFarmaceutica: "frascos de 30 mL",
        indicaciones: "Administrar con alimentos",
        vigenciaHasta: new Date().toISOString(),
        profesional: "Dra. Pardo",
        registroProfesional: "",
        fiscalizado: false,
        autor: MEDICO,
      }),
    );
    expect(problema.status).toBe(422);
    expect(problema.norma).toContain("2200");
    expect(problema.errores?.map((error) => error.campo)).toEqual(
      expect.arrayContaining(["documento", "historiaClinica", "cantidadTotal", "registroProfesional"]),
    );
  });

  it("escribe la cantidad total en letras al emitir", async () => {
    const credencial = almacenSensible.credenciales.find((item) => item.estado === "ACTIVA");
    const emitida = await servidorPrescripciones.emitirPrescripcion({
      pacienteId: credencial?.pacienteId ?? "PAC-0001",
      paciente: "Paciente de prueba",
      documento: "CC ••••4471",
      historiaClinica: "HC-0001-2024",
      tipoUsuario: "CONTRIBUTIVO",
      prestador: "IPS de prueba",
      prestadorDireccion: "Calle 5 # 38-25, Cali",
      prestadorContacto: "(602) 558 4400",
      lugar: "Cali",
      denominacionComun: "Cannabidiol",
      presentacion: "Aceite",
      concentracion: "CBD 30 mg/mL",
      formaFarmaceutica: "Solución oral",
      viaAdministracion: "Oral",
      posologia: "5 gotas cada 12 horas",
      duracionDias: 30,
      cantidadTotal: 24,
      unidadFarmaceutica: "frascos de 30 mL",
      indicaciones: "Administrar con alimentos",
      vigenciaHasta: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      profesional: "Dra. Pardo",
      registroProfesional: "RM 44120",
      fiscalizado: false,
      autor: MEDICO,
    });
    expect(emitida.cantidadEnLetras).toBe("veinticuatro");
    expect(emitida.estado).toBe("VIGENTE");
  });
});

describe("liquidación del servicio", () => {
  it("cada cargo B2B nace de un acto de dispensación sellado", async () => {
    const { credencial, prescripcion } = credencialDispensable();
    const resultado = await servidorDispensacion.registrarEntrega({
      puntoId: PUNTO,
      seudonimo: credencial.seudonimo,
      prescripcionCodigo: prescripcion.codigo,
      unidades: 1,
      metodo: "CODIGO_ROTATORIO",
      operador: "Marcela Ruiz · regente",
      autor: MOSTRADOR,
    });
    expect(resultado.cargo.flujo).toBe("B2B_VERIFICACION");
    expect(resultado.cargo.origen).toBe("ACTO_DISPENSACION");
    expect(resultado.cargo.eventoId).toBe(resultado.acto.eventoId);
  });

  it("ningún cargo B2B se origina en una teleconsulta ni en una cita", () => {
    const b2b = almacenSensible.cargos.filter((cargo) => cargo.flujo === "B2B_VERIFICACION");
    expect(b2b.length).toBeGreaterThan(0);
    expect(b2b.every((cargo) => cargo.origen === "ACTO_DISPENSACION")).toBe(true);
    expect(b2b.every((cargo) => cargo.eventoId !== null)).toBe(true);
  });

  it("separa los dos flujos de cobro en el corte", async () => {
    const corte = await servidorLiquidacion.corte();
    expect(corte.b2b.cargos).toBeGreaterThan(0);
    expect(corte.b2c.cargos).toBeGreaterThan(0);
    expect(corte.sinEventoOrigen).toBe(0);
  });
});
