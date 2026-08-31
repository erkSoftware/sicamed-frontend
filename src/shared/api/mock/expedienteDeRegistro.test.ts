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

const analista = (nombre: string): Autor => ({
  usuarioId: `USR-${nombre}`,
  nombre,
  organizacionId: "ORG-0000",
  rol: "ANALISTA_DOCUMENTAL",
});

const PRIMERA = analista("Lida Almeciga");
const SEGUNDA = analista("Claudia Liliana Pardo");

let secuencia = 0;

const radicar = () => {
  secuencia += 1;
  return servidorMock.radicarSolicitud({
    nit: `901${String(100000 + secuencia)}-${secuencia % 9}`,
    organizacion: `Cultivos del Ciclo ${secuencia} S.A.S.`,
    tipoActor: "CULTIVADOR",
    departamento: "Tolima",
    municipio: "Ibagué",
    representante: `Representante ${secuencia}`,
    correo: `ciclo${secuencia}@ejemplo.co`,
    telefono: "+57 608 234 5678",
    clave: "una-clave-de-al-menos-12",
  });
};

const admitir = async () => {
  const solicitud = await radicar();
  const expediente = await servidorMock.abrirExpediente({
    solicitudId: solicitud.id,
    autor: PRIMERA,
  });
  return { solicitudId: solicitud.id, expediente };
};

describe("el ciclo del expediente de registro", () => {
  it("admitir a tramite deja la solicitud en tramite y no crea la cuenta del representante", async () => {
    const { solicitudId, expediente } = await admitir();
    const solicitud = almacen.solicitudes.find((registro) => registro.id === solicitudId);

    expect(solicitud?.estado).toBe("EN_TRAMITE");
    expect(solicitud?.expedienteId).toBe(expediente.id);
    expect(almacen.cuentas.some((cuenta) => cuenta.correo === solicitud?.correo)).toBe(false);
  });

  it("readmitir una solicitud ya tramitada responde 409 y no abre un segundo expediente", async () => {
    const { solicitudId } = await admitir();
    const problema = await problemaDe(
      servidorMock.abrirExpediente({ solicitudId, autor: PRIMERA }),
    );

    expect(problema.status).toBe(409);
    expect(problema.type).toContain("solicitud-ya-tramitada");
  });

  it("el ultimo paso exige un segundo analista y no lo cierra quien resolvio los anteriores", async () => {
    const { expediente } = await admitir();
    for (const paso of expediente.pasos.slice(0, 3)) {
      await servidorMock.resolverPaso({
        expedienteId: expediente.id,
        pasoId: paso.id,
        veredicto: "VERIFICADO",
        observacion: "",
        autor: PRIMERA,
      });
    }
    const ultimo = expediente.pasos[3];
    const problema = await problemaDe(
      servidorMock.resolverPaso({
        expedienteId: expediente.id,
        pasoId: ultimo?.id ?? "",
        veredicto: "VERIFICADO",
        observacion: "",
        autor: PRIMERA,
      }),
    );

    expect(problema.status).toBe(403);
    expect(problema.type).toContain("doble-control");
  });

  it("resolver el ultimo paso aprueba la solicitud, habilita la organizacion y crea la cuenta", async () => {
    const { solicitudId, expediente } = await admitir();
    for (const paso of expediente.pasos.slice(0, 3)) {
      await servidorMock.resolverPaso({
        expedienteId: expediente.id,
        pasoId: paso.id,
        veredicto: "VERIFICADO",
        observacion: "",
        autor: PRIMERA,
      });
    }
    const cerrado = await servidorMock.resolverPaso({
      expedienteId: expediente.id,
      pasoId: expediente.pasos[3]?.id ?? "",
      veredicto: "VERIFICADO",
      observacion: "",
      autor: SEGUNDA,
    });

    const solicitud = almacen.solicitudes.find((registro) => registro.id === solicitudId);
    const organizacion = almacen.organizaciones.find(
      (registro) => registro.id === expediente.organizacionId,
    );

    expect(cerrado.estado).toBe("APROBADO");
    expect(solicitud?.estado).toBe("APROBADA");
    expect(solicitud?.motivoRechazo).toBeNull();
    expect(organizacion?.estado).toBe("HABILITADA");
    expect(
      almacen.cuentas.find((cuenta) => cuenta.correo === solicitud?.correo)?.estado,
    ).toBe("ACTIVA");
  });

  it("rechazar un paso cierra el expediente y su observacion viaja como motivo a la solicitud", async () => {
    const { solicitudId, expediente } = await admitir();
    const motivo = "La licencia adjunta corresponde a otra modalidad y no ampara este cultivo.";
    const cerrado = await servidorMock.resolverPaso({
      expedienteId: expediente.id,
      pasoId: expediente.pasos[0]?.id ?? "",
      veredicto: "RECHAZADO",
      observacion: motivo,
      autor: PRIMERA,
    });

    const solicitud = almacen.solicitudes.find((registro) => registro.id === solicitudId);
    const organizacion = almacen.organizaciones.find(
      (registro) => registro.id === expediente.organizacionId,
    );

    expect(cerrado.estado).toBe("RECHAZADO");
    expect(solicitud?.estado).toBe("RECHAZADA");
    expect(solicitud?.motivoRechazo).toBe(motivo);
    expect(organizacion?.estado).toBe("EN_TRAMITE");
    expect(almacen.cuentas.some((cuenta) => cuenta.correo === solicitud?.correo)).toBe(false);
  });

  it("rechazar sin observacion no cierra nada: el solicitante quedaria sin motivo", async () => {
    const { expediente } = await admitir();
    const problema = await problemaDe(
      servidorMock.resolverPaso({
        expedienteId: expediente.id,
        pasoId: expediente.pasos[0]?.id ?? "",
        veredicto: "RECHAZADO",
        observacion: "   ",
        autor: PRIMERA,
      }),
    );

    expect(problema.status).toBe(422);
    expect(problema.type).toContain("devolucion-sin-motivo");
  });

  it("un paso resuelto no se reabre", async () => {
    const { expediente } = await admitir();
    await servidorMock.resolverPaso({
      expedienteId: expediente.id,
      pasoId: expediente.pasos[0]?.id ?? "",
      veredicto: "VERIFICADO",
      observacion: "",
      autor: PRIMERA,
    });
    const problema = await problemaDe(
      servidorMock.resolverPaso({
        expedienteId: expediente.id,
        pasoId: expediente.pasos[0]?.id ?? "",
        veredicto: "DEVUELTO",
        observacion: "Me arrepentí",
        autor: SEGUNDA,
      }),
    );

    expect(problema.status).toBe(409);
    expect(problema.type).toContain("paso-ya-resuelto");
  });

  it("decidir un soporte no aprueba el expediente: eso lo deciden los pasos", async () => {
    const { expediente } = await admitir();
    const decidido = await servidorMock.decidirDocumento({
      expedienteId: expediente.id,
      documentoId: expediente.documentos[0]?.id ?? "",
      decision: "APROBADO",
      observacion: "",
      autor: PRIMERA,
    });

    expect(decidido.estado).toBe("EN_VERIFICACION");
    expect(decidido.pasos.every((paso) => paso.veredicto === "PENDIENTE")).toBe(true);
  });

  it("rechazar un soporte exige observacion y deja el expediente devuelto", async () => {
    const { expediente } = await admitir();
    const problema = await problemaDe(
      servidorMock.decidirDocumento({
        expedienteId: expediente.id,
        documentoId: expediente.documentos[0]?.id ?? "",
        decision: "RECHAZADO",
        observacion: "",
        autor: PRIMERA,
      }),
    );
    expect(problema.status).toBe(422);

    const decidido = await servidorMock.decidirDocumento({
      expedienteId: expediente.id,
      documentoId: expediente.documentos[0]?.id ?? "",
      decision: "RECHAZADO",
      observacion: "El acto administrativo cargado pertenece a otra organización.",
      autor: PRIMERA,
    });
    expect(decidido.documentos[0]?.estado).toBe("RECHAZADO");
    expect(decidido.estado).toBe("DEVUELTO");
  });
});
