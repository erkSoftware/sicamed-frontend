import { describe, expect, it } from "vitest";
import { servidorMock } from "./servidorMock";
import type { Autor } from "./servidorMock";
import { ErrorApi } from "../problemDetails";
import { aConfiguracionAsistente } from "../rest/mapeadores";
import {
  CONFIGURACION_ASISTENTE_DE_FABRICA,
  LIMITES_ASISTENTE,
  MODELO_DEL_DESPLIEGUE,
  VOZ_DEL_DESPLIEGUE,
  borradorDeConfiguracion,
  enmascararClave,
  erroresDeConfiguracion,
  minutos,
  sanearTextoDeAsistente,
} from "./configuracionAsistente";
import { situacionDeBloqueo } from "./llamadasAsistente";

const superAdmin: Autor = {
  usuarioId: "USR-0001",
  nombre: "Diego Fernando Marín",
  organizacionId: "ORG-0001",
  rol: "SUPER_ADMIN",
};

const analista: Autor = { ...superAdmin, usuarioId: "USR-0002", rol: "ANALISTA_DOCUMENTAL" };

const deFabrica = borradorDeConfiguracion(CONFIGURACION_ASISTENTE_DE_FABRICA);

describe("saneado del texto del asistente", () => {
  it("quita los caracteres invisibles que la pantalla no muestra", () => {
    expect(sanearTextoDeAsistente("Hola\u200Bmundo\u202E")).toBe("Holamundo");
  });

  it("conserva los saltos de línea y normaliza los retornos de carro", () => {
    expect(sanearTextoDeAsistente("una\r\notra")).toBe("una\notra");
  });
});

describe("validación de la configuración", () => {
  it("los tres campos obligatorios no pueden quedar vacíos", () => {
    const errores = erroresDeConfiguracion({
      ...deFabrica,
      nombre: "",
      saludo: "  ",
      fraseFueraDeAlcance: "",
    });
    expect(Object.keys(errores).sort()).toEqual(["fraseFueraDeAlcance", "nombre", "saludo"]);
  });

  it("las indicaciones de la entidad sí pueden quedar vacías", () => {
    expect(erroresDeConfiguracion({ ...deFabrica, instruccionesExtra: "" })).toEqual({});
  });

  it("marca el campo que se pasa del largo permitido", () => {
    const errores = erroresDeConfiguracion({
      ...deFabrica,
      nombre: "A".repeat(LIMITES_ASISTENTE.nombre.maximo + 1),
    });
    expect(errores.nombre).toContain("40");
  });
});

describe("configuración del asistente en el simulador", () => {
  it("una entidad que nunca guardó nada recibe la de fábrica, no un 404", async () => {
    const configuracion = await servidorMock.configuracionAsistente();
    expect(configuracion.deFabrica).toBe(true);
    expect(configuracion.vozEfectiva).toBe(VOZ_DEL_DESPLIEGUE);
  });

  it("solo el super administrador puede guardarla", async () => {
    await servidorMock
      .guardarConfiguracionAsistente({ borrador: deFabrica, autor: analista })
      .catch((error: unknown) => {
        expect(error).toBeInstanceOf(ErrorApi);
        expect((error as ErrorApi).problema.status).toBe(403);
      });
    expect.assertions(2);
  });

  it("el 422 dice qué campo lo provocó", async () => {
    await servidorMock
      .guardarConfiguracionAsistente({
        borrador: { ...deFabrica, saludo: "" },
        autor: superAdmin,
      })
      .catch((error: unknown) => {
        const problema = (error as ErrorApi).problema;
        expect(problema.status).toBe(422);
        expect(problema.errores?.map((campo) => campo.campo)).toEqual(["saludo"]);
      });
    expect.assertions(2);
  });

  it("guardar sanea el texto y deja de ser de fábrica", async () => {
    const guardada = await servidorMock.guardarConfiguracionAsistente({
      borrador: { ...deFabrica, instruccionesExtra: "Opera en Cauca\u200B", voz: "cedar" },
      autor: superAdmin,
    });
    expect(guardada.instruccionesExtra).toBe("Opera en Cauca");
    expect(guardada.vozEfectiva).toBe("cedar");
    expect(guardada.deFabrica).toBe(false);
    expect(guardada.actualizadoPor).toBe(superAdmin.nombre);
  });

  it("volver a los valores de fábrica sigue contando como configuración propia", async () => {
    const restaurada = await servidorMock.guardarConfiguracionAsistente({
      borrador: deFabrica,
      autor: superAdmin,
    });
    expect(restaurada.saludo).toBe(CONFIGURACION_ASISTENTE_DE_FABRICA.saludo);
    expect(restaurada.deFabrica).toBe(false);
    expect(restaurada.vozEfectiva).toBe(VOZ_DEL_DESPLIEGUE);
  });
});

describe("mapeo de la respuesta del backend", () => {
  it("una voz efectiva vacía cae en la del despliegue", () => {
    const configuracion = aConfiguracionAsistente({
      nombre: "AURORA",
      saludo: "Hola",
      fraseFueraDeAlcance: "Solo SICAMED",
      instruccionesExtra: "",
      voz: "",
      vozEfectiva: "",
      deFabrica: true,
      actualizadoEn: null,
      actualizadoPor: "",
    });
    expect(configuracion.vozEfectiva).toBe(VOZ_DEL_DESPLIEGUE);
    expect(configuracion.actualizadoEn).toBeNull();
  });
});

describe("límites de la llamada", () => {
  it("el aviso tiene que caber dentro de la llamada", () => {
    const errores = erroresDeConfiguracion({
      ...deFabrica,
      limites: { ...deFabrica.limites, duracionMaximaSegundos: 300, avisoPrevioSegundos: 300 },
    });
    expect(errores.avisoPrevioSegundos).toContain("caber dentro");
  });

  it("un aviso en cero no exige frase y no es un hueco", () => {
    const errores = erroresDeConfiguracion({
      ...deFabrica,
      mensajeAviso: "",
      limites: { ...deFabrica.limites, avisoPrevioSegundos: 0 },
    });
    expect(errores).toEqual({});
    expect(minutos(0)).toBe("sin límite");
  });

  it("con aviso configurado hace falta la frase que dirá", () => {
    const errores = erroresDeConfiguracion({ ...deFabrica, mensajeAviso: "" });
    expect(errores.mensajeAviso).toBeDefined();
  });

  it("un límite fuera de rango se marca antes de gastar un viaje", () => {
    const errores = erroresDeConfiguracion({
      ...deFabrica,
      limites: { ...deFabrica.limites, duracionMaximaSegundos: 10 },
    });
    expect(errores.duracionMaximaSegundos).toBeDefined();
  });

  it("un modelo fuera del catálogo se rechaza en el formulario", () => {
    expect(erroresDeConfiguracion({ ...deFabrica, modelo: "gpt-inventado" }).modelo).toBeDefined();
    expect(erroresDeConfiguracion({ ...deFabrica, modelo: MODELO_DEL_DESPLIEGUE })).toEqual({});
  });

  it("una credencial demasiado corta no viaja", () => {
    expect(erroresDeConfiguracion({ ...deFabrica, apiKey: "sk-corta" }).apiKey).toBeDefined();
  });
});

describe("la credencial del proveedor", () => {
  it("solo deja ver sus cuatro últimos caracteres", () => {
    expect(enmascararClave("sk-proj-0123456789abcdef9876")).toBe("••••••••••••9876");
  });

  it("guardar sin escribirla conserva la que había", async () => {
    const conClave = await servidorMock.guardarConfiguracionAsistente({
      borrador: { ...deFabrica, apiKey: "sk-proj-0123456789abcdef9876" },
      autor: superAdmin,
    });
    expect(conClave.apiKey).toEqual({ configurada: true, enmascarada: "••••••••••••9876" });

    const sinTocarla = await servidorMock.guardarConfiguracionAsistente({
      borrador: { ...deFabrica, nombre: "GUÍA" },
      autor: superAdmin,
    });
    expect(sinTocarla.apiKey.configurada).toBe(true);
    expect(sinTocarla.nombre).toBe("GUÍA");
  });

  it("quitarla es un campo aparte", async () => {
    await servidorMock.guardarConfiguracionAsistente({
      borrador: { ...deFabrica, apiKey: "sk-proj-0123456789abcdef9876" },
      autor: superAdmin,
    });
    const quitada = await servidorMock.guardarConfiguracionAsistente({
      borrador: { ...deFabrica, borrarApiKey: true },
      autor: superAdmin,
    });
    expect(quitada.apiKey).toEqual({ configurada: false, enmascarada: "" });
  });

  it("probar conexión sin credencial guardada culpa a la credencial, no a la red", async () => {
    await servidorMock.guardarConfiguracionAsistente({
      borrador: { ...deFabrica, borrarApiKey: true },
      autor: superAdmin,
    });
    await servidorMock.probarConexionAsistente().catch((error: unknown) => {
      expect((error as ErrorApi).problema.status).toBe(502);
    });
    expect.assertions(1);
  });
});

describe("bloqueos de voz", () => {
  it("el listado por defecto trae solo los vigentes", async () => {
    const vigentes = await servidorMock.bloqueosAsistente();
    expect(vigentes.every((bloqueo) => situacionDeBloqueo(bloqueo) === "activo")).toBe(true);
    const todos = await servidorMock.bloqueosAsistente({ soloActivos: false });
    expect(todos.length).toBeGreaterThan(vigentes.length);
  });

  it("un bloqueo levantado no se borra: queda como levantado", async () => {
    const creado = await servidorMock.bloquearAsistente({
      usuario: "USR-9001",
      motivo: "Uso indebido",
      tipo: "temporary",
      dias: 30,
      autor: superAdmin,
    });
    const levantado = await servidorMock.desbloquearAsistente({
      id: creado.id,
      autor: superAdmin,
    });
    expect(situacionDeBloqueo(levantado)).toBe("levantado");
    expect(levantado.desbloqueadoPor).toBe(superAdmin.nombre);
    const todos = await servidorMock.bloqueosAsistente({ soloActivos: false });
    expect(todos.some((bloqueo) => bloqueo.id === creado.id)).toBe(true);
  });

  it("los bloqueos no se apilan sobre la misma persona", async () => {
    await servidorMock.bloquearAsistente({
      usuario: "USR-9002",
      motivo: "Uso indebido",
      tipo: "permanent",
      dias: 0,
      autor: superAdmin,
    });
    await servidorMock
      .bloquearAsistente({
        usuario: "USR-9002",
        motivo: "Otra vez",
        tipo: "temporary",
        dias: 5,
        autor: superAdmin,
      })
      .catch((error: unknown) => {
        expect((error as ErrorApi).problema.status).toBe(422);
      });
    expect.assertions(1);
  });

  it("un permanente no lleva vencimiento", async () => {
    const creado = await servidorMock.bloquearAsistente({
      usuario: "USR-9003",
      motivo: "Uso indebido",
      tipo: "permanent",
      dias: 0,
      autor: superAdmin,
    });
    expect(creado.expiraEn).toBeNull();
  });

  it("desbloquear algo que no existe es un 404 con su propio tipo", async () => {
    await servidorMock
      .desbloquearAsistente({ id: "BLQ-NO-EXISTE", autor: superAdmin })
      .catch((error: unknown) => {
        const problema = (error as ErrorApi).problema;
        expect(problema.status).toBe(404);
        expect(problema.type).toContain("asistente-bloqueo-desconocido");
      });
    expect.assertions(2);
  });
});
