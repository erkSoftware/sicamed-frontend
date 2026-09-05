import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorApi } from "../../../api/problemDetails";
import { cuerpoDeHerramienta, ejecutarHerramientaAsistente } from "../../../api/clienteAsistente";
import type { HerramientaAsistente } from "../../../api/clienteAsistente";
import { publicarPantalla, vaciarPantalla } from "../pantalla/bus";
import { leerArgumentos, validarArgumentos } from "./esquema";
import { FUERA_DE_LA_ZONA_CLINICA, SIN_CONCESION, despachar } from "./despacho";
import type { EntornoDeDespacho } from "./despacho";
import { useBitacora, vaciarBitacora } from "./bitacora";
import { firmar, rechazarFirma, useFirma } from "./confirmacion";

vi.mock("../../../api/clienteAsistente", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  ejecutarHerramientaAsistente: vi.fn(),
}));

const enElServidor = vi.mocked(ejecutarHerramientaAsistente);

const CONSULTA: HerramientaAsistente = {
  nombre: "consultar_lotes_por_vencer",
  clase: "consulta",
  descripcion: "Consulta qué lotes vencen",
  confirmacionPrevia: false,
  parametros: {
    type: "object",
    properties: { dias: { type: "integer", minimum: 1, maximum: 365 } },
    required: ["dias"],
    additionalProperties: false,
  },
};

const NEGOCIO: HerramientaAsistente = {
  nombre: "registrar_acta",
  clase: "negocio",
  descripcion: "Levanta un acta de transformación",
  confirmacionPrevia: true,
  parametros: {
    type: "object",
    properties: { lote: { type: "string", description: "Código del lote." } },
    required: ["lote"],
    additionalProperties: false,
  },
};

const NAVEGAR: HerramientaAsistente = {
  nombre: "navigate_to",
  clase: "ui",
  descripcion: "Lleva al usuario a otra pantalla",
  confirmacionPrevia: false,
};

const ABRIR_LOTE: HerramientaAsistente = {
  nombre: "open_lot_form",
  clase: "ui",
  descripcion: "Abre el formulario de creación de un lote",
  confirmacionPrevia: false,
};

const SENALAR: HerramientaAsistente = {
  nombre: "highlight_field",
  clase: "ui",
  descripcion: "Señala un campo de la pantalla",
  confirmacionPrevia: false,
};

let ruta = "/app/inventario";
const navegado: string[] = [];
const terminada = vi.fn();

const entorno = (herramientas: readonly HerramientaAsistente[]): EntornoDeDespacho => ({
  herramientas: () => herramientas,
  permisos: () => ["inventario:lote:leer", "produccion:cupo:leer", "clinico:atencion:leer"],
  ruta: () => ruta,
  llamadaId: () => "llamada-1",
  navegar: (destino) => {
    navegado.push(destino);
    ruta = destino;
  },
  alFinDeConversacion: terminada,
});

beforeEach(() => {
  ruta = "/app/inventario";
  navegado.length = 0;
  terminada.mockClear();
  enElServidor.mockReset();
  vaciarBitacora();
  rechazarFirma();
});

afterEach(() => vaciarPantalla());

describe("despachar", () => {
  it("no ejecuta lo que el catálogo no concedió", async () => {
    const resultado = await despachar(entorno([]), "borrar_todo", "call_1", "{}");
    expect(resultado).toEqual({ ok: false, motivo: SIN_CONCESION });
    expect(enElServidor).not.toHaveBeenCalled();
  });

  it("devuelve los campos señalados en vez de gastar el viaje", async () => {
    const resultado = await despachar(
      entorno([CONSULTA]),
      "consultar_lotes_por_vencer",
      "call_1",
      '{"dias": 9000}',
    );
    expect(resultado.ok).toBe(false);
    expect(resultado.errores).toEqual([{ campo: "dias", motivo: "No puede ser mayor que 365." }]);
    expect(enElServidor).not.toHaveBeenCalled();
  });

  it("le devuelve al modelo el resumen y nunca los datos", async () => {
    enElServidor.mockResolvedValue({
      ok: true,
      resumen: "Cuatro lotes vencen en los próximos 30 días.",
      datos: { total: 4, lotes: [{ codigo: "LT-0091" }], eventoId: "evt-9" },
    });

    const resultado = await despachar(
      entorno([CONSULTA]),
      "consultar_lotes_por_vencer",
      "call_9xKq2",
      '{"dias": 30}',
    );

    expect(resultado).toEqual({
      ok: true,
      resumen: "Cuatro lotes vencen en los próximos 30 días.",
    });
    expect(enElServidor).toHaveBeenCalledWith("consultar_lotes_por_vencer", {
      llamadaId: "llamada-1",
      argumentos: { dias: 30 },
      callId: "call_9xKq2",
    });
    expect(useBitacora.getState().asientos[0]?.traza).toBe("evt-9");
  });

  it("reenvía los errores del 422 para que el modelo se corrija", async () => {
    enElServidor.mockRejectedValue(
      new ErrorApi({
        type: "https://sicamed.co/problemas/asistente-argumentos-invalidos",
        title: "Los argumentos no son válidos",
        detail: "Revise estos argumentos: dias",
        status: 422,
        errores: [{ campo: "dias", motivo: "No puede ser mayor que 365." }],
      }),
    );

    const resultado = await despachar(
      entorno([CONSULTA]),
      "consultar_lotes_por_vencer",
      "",
      '{"dias": 30}',
    );
    expect(resultado.ok).toBe(false);
    expect(resultado.errores).toHaveLength(1);
    expect(terminada).not.toHaveBeenCalled();
  });

  it("da por terminada la conversación cuando la llamada ya no existe", async () => {
    enElServidor.mockRejectedValue(
      new ErrorApi({
        type: "https://sicamed.co/problemas/asistente-llamada-desconocida",
        title: "La llamada no existe",
        detail: "La conversación terminó",
        status: 404,
      }),
    );

    await despachar(entorno([CONSULTA]), "consultar_lotes_por_vencer", "", '{"dias": 30}');
    expect(terminada).toHaveBeenCalledTimes(1);
  });

  it("exige firma antes de escribir y respeta el «no autorizo»", async () => {
    const pendiente = despachar(entorno([NEGOCIO]), "registrar_acta", "", '{"lote": "LT-0091"}');
    await vi.waitFor(() => expect(useFirma.getState().pendiente).not.toBeNull());
    expect(useFirma.getState().pendiente?.campos).toEqual([
      { etiqueta: "Código del lote", valor: "LT-0091" },
    ]);

    rechazarFirma();
    expect(await pendiente).toEqual({ ok: false, motivo: "el usuario no confirmó" });
    expect(enElServidor).not.toHaveBeenCalled();
    expect(useBitacora.getState().asientos[0]?.estado).toBe("rechazado");
  });

  it("escribe cuando la firma se otorga", async () => {
    enElServidor.mockResolvedValue({ ok: true, resumen: "Acta levantada" });
    const pendiente = despachar(entorno([NEGOCIO]), "registrar_acta", "", '{"lote": "LT-0091"}');
    await vi.waitFor(() => expect(useFirma.getState().pendiente).not.toBeNull());
    firmar();
    expect(await pendiente).toEqual({ ok: true, resumen: "Acta levantada" });
    expect(enElServidor).toHaveBeenCalledTimes(1);
  });

  it("navega y deja el paso atrás en la bitácora", async () => {
    const resultado = await despachar(
      entorno([NAVEGAR]),
      "navigate_to",
      "",
      '{"destino": "cupos asignados"}',
    );
    expect(resultado.ok).toBe(true);
    expect(navegado).toEqual(["/app/cupos"]);

    const asiento = useBitacora.getState().asientos[0];
    expect(asiento?.deshacer).toBeTypeOf("function");
    asiento?.deshacer?.();
    expect(navegado).toEqual(["/app/cupos", "/app/inventario"]);
  });

  it("resuelve contra la pantalla montada y no contra una ruta escrita a mano", async () => {
    const senalada = vi.fn(() => ({ ok: true, detalle: "Señalé Cupo asignado" }));
    publicarPantalla({
      ruta: "/app/inventario",
      estado: { pantalla: "Inventario" },
      acciones: [
        {
          verbo: "senalar-campo",
          objetivo: "cupo",
          etiqueta: "Cupo asignado",
          ejecutar: senalada,
        },
      ],
    });

    const resultado = await despachar(
      entorno([SENALAR]),
      "highlight_field",
      "",
      '{"campo": "cupo"}',
    );
    expect(resultado).toEqual({ ok: true, resumen: "Señalé Cupo asignado" });
    expect(senalada).toHaveBeenCalledTimes(1);
  });

  it("dice qué hay en la pantalla cuando no encuentra el objetivo", async () => {
    publicarPantalla({
      ruta: "/app/inventario",
      estado: { pantalla: "Inventario" },
      acciones: [
        {
          verbo: "senalar-campo",
          objetivo: "bodega",
          etiqueta: "Bodega",
          ejecutar: () => ({ ok: true }),
        },
      ],
    });

    const resultado = await despachar(
      entorno([SENALAR]),
      "highlight_field",
      "",
      '{"campo": "cupo"}',
    );
    expect(resultado.ok).toBe(false);
    expect(resultado.disponibles).toEqual(["Bodega"]);
  });

  it("abre el formulario de lote en la pantalla montada y, si no está, lleva hasta él", async () => {
    ruta = "/app/produccion";
    const negado = await despachar(
      { ...entorno([ABRIR_LOTE]), permisos: () => [] },
      "open_lot_form",
      "",
      "{}",
    );
    expect(negado.ok).toBe(false);
    expect(navegado).toHaveLength(0);

    const llevado = await despachar(
      { ...entorno([ABRIR_LOTE]), permisos: () => ["inventario:lote:escribir"] },
      "open_lot_form",
      "",
      "{}",
    );
    expect(llevado.ok).toBe(true);
    expect(navegado).toEqual(["/app/inventario?crear=lote"]);

    ruta = "/app/inventario";
    const abierto = vi.fn(() => ({ ok: true, detalle: "Abrí Crear lote" }));
    publicarPantalla({
      ruta: "/app/inventario",
      estado: { pantalla: "Inventario" },
      acciones: [
        {
          verbo: "abrir-formulario",
          objetivo: "lote",
          etiqueta: "Crear lote",
          ejecutar: abierto,
        },
      ],
    });

    const enSitio = await despachar(entorno([ABRIR_LOTE]), "open_lot_form", "", "{}");
    expect(enSitio).toEqual({ ok: true, resumen: "Abrí Crear lote" });
    expect(abierto).toHaveBeenCalledTimes(1);
    expect(navegado).toHaveLength(1);
  });

  it("en la zona clínica solo navega", async () => {
    ruta = "/app/salud/pacientes";
    publicarPantalla({
      ruta: "/app/salud/pacientes",
      estado: { pantalla: "Pacientes" },
      acciones: [
        {
          verbo: "senalar-campo",
          objetivo: "diagnostico",
          etiqueta: "Diagnóstico",
          ejecutar: () => ({ ok: true }),
        },
      ],
    });

    expect(
      await despachar(entorno([SENALAR]), "highlight_field", "", '{"campo":"diagnostico"}'),
    ).toEqual({ ok: false, motivo: FUERA_DE_LA_ZONA_CLINICA });
    expect(
      await despachar(entorno([CONSULTA]), "consultar_lotes_por_vencer", "", '{"dias": 30}'),
    ).toEqual({ ok: false, motivo: FUERA_DE_LA_ZONA_CLINICA });
    expect(enElServidor).not.toHaveBeenCalled();

    const salida = await despachar(
      entorno([NAVEGAR]),
      "navigate_to",
      "",
      '{"destino":"inventario"}',
    );
    expect(salida.ok).toBe(true);
  });
});

describe("validarArgumentos", () => {
  it("deja pasar lo que el esquema admite y normaliza el número dictado", () => {
    const revisado = validarArgumentos(CONSULTA.parametros, { dias: "30" });
    expect(revisado).toEqual({ ok: true, argumentos: { dias: 30 } });
  });

  it("exige lo obligatorio y rechaza lo que el esquema no declara", () => {
    expect(validarArgumentos(CONSULTA.parametros, {})).toEqual({
      ok: false,
      errores: [{ campo: "dias", motivo: "Es obligatorio." }],
    });
    expect(validarArgumentos(CONSULTA.parametros, { dias: 30, extra: 1 })).toEqual({
      ok: false,
      errores: [{ campo: "extra", motivo: "No es un argumento de esta herramienta." }],
    });
  });

  it("no inventa reglas cuando la herramienta no trae esquema", () => {
    expect(validarArgumentos(undefined, { lo: "que sea" })).toEqual({
      ok: true,
      argumentos: { lo: "que sea" },
    });
  });

  it("corta el objeto gigante de un modelo confundido", () => {
    const enorme = Object.fromEntries(
      Array.from({ length: 21 }, (_, indice) => [`campo${indice}`, indice]),
    );
    expect(validarArgumentos(undefined, enorme).ok).toBe(false);
  });

  it("lee los argumentos crudos sin confiar en ellos", () => {
    expect(leerArgumentos(undefined)).toEqual({});
    expect(leerArgumentos("{")).toEqual({});
    expect(leerArgumentos("[1,2]")).toEqual({});
    expect(leerArgumentos('{"dias":30}')).toEqual({ dias: 30 });
  });
});

describe("cuerpoDeHerramienta", () => {
  it("omite el callId vacío en vez de mandarlo en blanco", () => {
    expect(cuerpoDeHerramienta("llamada-1", { dias: 30 }, "")).toEqual({
      llamadaId: "llamada-1",
      argumentos: { dias: 30 },
    });
    expect(cuerpoDeHerramienta("llamada-1", {}, "call_9")).toEqual({
      llamadaId: "llamada-1",
      callId: "call_9",
    });
  });
});
