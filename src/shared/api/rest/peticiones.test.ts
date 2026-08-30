import { describe, expect, it } from "vitest";
import {
  aRolApi,
  aTipoProducto,
  cuerpoAvanzarBeneficio,
  cuerpoDecidirDocumento,
  cuerpoGuardarPolitica,
  cuerpoInvitarCuenta,
  cuerpoLevantarActa,
  cuerpoModificarCuenta,
  cuerpoMoverLote,
  cuerpoPublicarOferta,
  cuerpoRegistrarCultivo,
  cuerpoRegistrarLabor,
  cuerpoRegistrarPlanta,
  cuerpoResolverDiscrepancia,
  cuerpoResolverPaso,
  sinContrato,
} from "./peticiones";
import { ErrorApi } from "../problemDetails";

const autor = {
  usuarioId: "USR-1",
  nombre: "Marcela Ospina",
  organizacionId: "ORG-0006",
  rol: "REPRESENTANTE_LEGAL" as const,
};

describe("la identidad la pone el token, no el cliente", () => {
  it("ningun cuerpo lleva el autor que usa el modo de demostracion", () => {
    const cuerpos = [
      cuerpoRegistrarCultivo({
        ...autor,
        nombre: "Predio La Esperanza",
        organizacionId: "ORG-0006",
        departamento: "Cauca",
        municipio: "Popayán",
        variedad: "VAR-1",
        areaHectareas: 2.5,
        plantas: 800,
        siembra: "2026-03-01",
        cosechaEstimada: "2026-09-01",
      }),
      cuerpoMoverLote({ estado: "EN_TRANSITO", bodega: "Bodega 2", motivo: "Traslado" }),
      cuerpoResolverPaso({
        expedienteId: "EXP-1",
        pasoId: "PAS-1",
        veredicto: "VERIFICADO",
        observacion: "",
      }),
    ];
    for (const cuerpo of cuerpos) expect(cuerpo).not.toHaveProperty("autor");
  });
});

describe("traduccion de enums de la vista al contrato", () => {
  it("el destino del movimiento se llama destino, no estado", () => {
    expect(cuerpoMoverLote({ estado: "RETENIDO", bodega: "B1", motivo: "Orden" })).toEqual({
      destino: "RETENIDO",
      bodega: "B1",
      motivo: "Orden",
    });
  });

  it("la labor fitosanitaria de la vista es FITOSANITARIA en el contrato", () => {
    expect(
      cuerpoRegistrarLabor({
        tipo: "FITOSANITARIO",
        agroinsumoId: "AGR-1",
        dosis: "2 ml/l",
        responsable: "Jairo",
      }).tipo,
    ).toBe("FITOSANITARIA");
  });

  it("aprobar un documento es aceptarlo en el contrato", () => {
    expect(
      cuerpoDecidirDocumento({
        expedienteId: "EXP-1",
        documentoId: "DOC-1",
        decision: "APROBADO",
        observacion: "Legible",
      }).decision,
    ).toBe("ACEPTADO");
  });

  it("verificar un paso es aprobarlo en el contrato", () => {
    expect(
      cuerpoResolverPaso({
        expedienteId: "EXP-1",
        pasoId: "PAS-1",
        veredicto: "VERIFICADO",
        observacion: "",
      }).veredicto,
    ).toBe("APROBADO");
  });

  it("rechazar un beneficio lo cierra en el contrato", () => {
    expect(cuerpoAvanzarBeneficio({ estado: "RECHAZADO", peso: 100, humedad: 12 })).toEqual({
      estado: "CERRADO",
      pesoKg: 100,
      humedad: 12,
    });
  });

  it("aceptar el dato externo y subsanar el local son resoluciones distintas", () => {
    expect(cuerpoResolverDiscrepancia({ id: "DIS-1", resolucion: "RESUELTA_EXTERNO" }).resolucion).toBe(
      "ACEPTA_EXTERNO",
    );
    expect(cuerpoResolverDiscrepancia({ id: "DIS-1", resolucion: "RESUELTA_LOCAL" }).resolucion).toBe(
      "SUBSANADA",
    );
  });

  it("una regla automatica corre en paralelo y una manual en secuencia", () => {
    const cuerpo = cuerpoGuardarPolitica({
      reglas: [
        { id: "REG-1", obligatorio: true, modo: "AUTOMATICO" },
        { id: "REG-2", obligatorio: false, modo: "MANUAL" },
      ],
    });
    expect(cuerpo.reglas.map((regla) => regla.modo)).toEqual(["PARALELO", "SECUENCIAL"]);
  });
});

describe("roles al invitar y modificar cuentas", () => {
  it("el analista documental se invita como analista de cumplimiento", () => {
    expect(aRolApi("ANALISTA_DOCUMENTAL")).toBe("ANALISTA_CUMPLIMIENTO");
    expect(
      cuerpoInvitarCuenta({
        nombre: "Lida",
        correo: "lida@sicamed.gov.co",
        rol: "ANALISTA_DOCUMENTAL",
        organizacionId: "ORG-0000",
      }).rol,
    ).toBe("ANALISTA_CUMPLIMIENTO");
  });

  it("modificar solo el estado no manda un rol vacio", () => {
    expect(cuerpoModificarCuenta({ id: "CTA-1", estado: "SUSPENDIDA" }).rol).toBeUndefined();
  });
});

describe("tipo de producto de la oferta", () => {
  it("traduce la etiqueta del formulario al enum del contrato", () => {
    expect(aTipoProducto("Flor seca no psicoactiva")).toBe("FLOR_SECA_NO_PSICOACTIVA");
    expect(aTipoProducto("Aceite estandarizado THC:CBD")).toBe("ACEITE");
  });

  it("acepta el enum tal cual cuando ya viene del contrato", () => {
    expect(aTipoProducto("BIOMASA")).toBe("BIOMASA");
  });

  it("un producto fuera del catalogo se rechaza citando el campo del formulario", () => {
    const error = (() => {
      try {
        aTipoProducto("Semilla certificada");
        return null;
      } catch (fallo) {
        return fallo as ErrorApi;
      }
    })();
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error?.problema.status).toBe(422);
    expect(error?.problema.errores?.[0]?.campo).toBe("tipoProducto");
  });

  it("el borrador se traduce sin arrastrar campos que calcula el servidor", () => {
    const cuerpo = cuerpoPublicarOferta({
      organizacionId: "ORG-0006",
      tipoProducto: "Biomasa vegetal",
      titulo: "Biomasa del Cauca",
      departamento: "Cauca",
      municipio: "Popayán",
      disponibilidad: "INMEDIATA",
      descripcion: "Biomasa con trazabilidad completa",
    });
    expect(cuerpo).not.toHaveProperty("estado");
    expect(cuerpo).not.toHaveProperty("publicada");
    expect(cuerpo.tipoProducto).toBe("BIOMASA");
  });
});

describe("fechas de calendario", () => {
  it("el acta recorta el instante a la fecha que exige el contrato", () => {
    const cuerpo = cuerpoLevantarActa({
      entidad: "PLANTA",
      entidadId: "PLA-1",
      cantidad: 12,
      causal: "PLAGA_NO_CONTROLABLE",
      metodo: "Incineración",
      testigo: "Ana Ruiz",
      cargoTestigo: "Inspectora",
      fecha: "2026-08-29T18:59:21.634225Z",
    });
    expect(cuerpo.fecha).toBe("2026-08-29");
    expect(cuerpo.unidad).toBe("planta");
  });

  it("la siembra de la planta viaja como fecha, no como instante", () => {
    expect(
      cuerpoRegistrarPlanta({
        variedadId: "VAR-1",
        origen: "CLON",
        madre: "PLA-0000",
        bloque: "B2",
        siembra: "2026-03-10T05:00:00.000Z",
        codigo: "PLA-2026-0001",
      }).siembra,
    ).toBe("2026-03-10");
  });

  it("el clon conserva la madre que exige el Art. 12", () => {
    expect(
      cuerpoRegistrarPlanta({
        variedadId: "VAR-1",
        origen: "CLON",
        madre: "PLA-0000",
        bloque: "B2",
        siembra: "2026-03-10",
      }).madreId,
    ).toBe("PLA-0000");
  });
});

describe("operaciones que el contrato todavia no publica", () => {
  it("fallan con un problema legible en vez de pegarle a una ruta inexistente", async () => {
    const error = (await sinContrato("cambiar la etapa del cultivo").catch(
      (fallo: unknown) => fallo,
    )) as ErrorApi;
    expect(error.problema.status).toBe(501);
    expect(error.problema.detail).toContain("cambiar la etapa del cultivo");
  });
});
