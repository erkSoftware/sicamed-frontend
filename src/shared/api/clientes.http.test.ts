import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { ErrorApi } from "./problemDetails";
import type { apiComercial as ComercialTipo } from "./clienteComercial";
import type { apiPublica as PublicaTipo } from "./clientePublico";
import type { apiClinica as ClinicaTipo } from "./clienteClinico";

let apiComercial: typeof ComercialTipo;
let apiPublica: typeof PublicaTipo;
let apiClinica: typeof ClinicaTipo;

const json = (cuerpo: unknown, estado = 200): Response =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json" },
  });

const responder = (cuerpo: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(json(cuerpo));

const urlLlamada = (peticion: ReturnType<typeof responder>): URL =>
  new URL(String(peticion.mock.calls[0]?.[0]));

beforeAll(async () => {
  vi.stubEnv("VITE_MODO_API", "http");
  vi.resetModules();
  apiComercial = (await import("./clienteComercial")).apiComercial;
  apiPublica = (await import("./clientePublico")).apiPublica;
  apiClinica = (await import("./clienteClinico")).apiClinica;
});

afterAll(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("zona publica", () => {
  it("pide la vitrina por cursor y no por numero de pagina", async () => {
    const peticion = responder({ ofertas: [], cursorSiguiente: "abc", desde: 0, hasta: 0 });
    await apiPublica.ofertas({ departamento: "Cauca" }, "cursor-previo", 12);
    const url = urlLlamada(peticion);
    expect(url.pathname).toBe("/api/v1/publico/ofertas");
    expect(url.searchParams.get("cursor")).toBe("cursor-previo");
    expect(url.searchParams.get("porPagina")).toBe("12");
    expect(url.searchParams.get("departamento")).toBe("Cauca");
    expect(url.searchParams.get("pagina")).toBeNull();
  });

  it("lee el arreglo bajo la clave ofertas y no bajo datos", async () => {
    responder({
      ofertas: [
        {
          id: "OFE-1",
          titulo: "Biomasa del Cauca",
          descripcion: "Con trazabilidad",
          tipoProducto: "Biomasa vegetal",
          tipoActor: "CULTIVADOR",
          organizacion: "Cannalia",
          organizacionId: "ORG-1",
          departamento: "Cauca",
          municipio: "Popayán",
          estado: "PUBLICADA",
          disponibilidad: "INMEDIATA",
          publicada: "2026-08-01T09:00:00.000Z",
          vigencia: "2026-12-01",
        },
      ],
      cursorSiguiente: "siguiente",
      cursorAnterior: null,
      desde: 0,
      hasta: 1,
    });
    const pagina = await apiPublica.ofertas({}, null, 10);
    expect(pagina.ofertas).toHaveLength(1);
    expect(pagina.ofertas[0]?.titulo).toBe("Biomasa del Cauca");
    expect(pagina.cursorSiguiente).toBe("siguiente");
    expect(pagina.cursorAnterior).toBeNull();
  });

  it("las estadisticas no piden tamano de pagina", async () => {
    const peticion = responder({
      actores: 10,
      departamentos: 4,
      ofertas: 25,
      actualizacion: null,
      facetas: { departamento: {}, disponibilidad: {}, tipoActor: {}, tipoProducto: {} },
      totales: { actores: 10, departamentos: 4, ofertas: 25 },
    });
    const estadisticas = await apiPublica.estadisticas({});
    expect(urlLlamada(peticion).searchParams.get("porPagina")).toBeNull();
    expect(estadisticas.actualizacion).toBe("");
  });
});

describe("zona comercial", () => {
  it("los listados cuelgan de /api/v1/comercial y acotan el tamano de pagina", async () => {
    const peticion = responder({ datos: [], total: 0, pagina: 1, porPagina: 100 });
    await apiComercial.lotes({ porPagina: 500, pagina: 2, estado: "EN_BODEGA" });
    const url = urlLlamada(peticion);
    expect(url.pathname).toBe("/api/v1/comercial/lotes");
    expect(url.searchParams.get("porPagina")).toBe("100");
    expect(url.searchParams.get("pagina")).toBe("2");
    expect(url.searchParams.get("estado")).toBe("EN_BODEGA");
  });

  it("las plantas cuelgan de su cultivo, que es su padre en el contrato", async () => {
    const peticion = responder({ datos: [], total: 0, pagina: 1, porPagina: 10 });
    await apiComercial.plantas({ cultivoId: "CUL-1" });
    expect(urlLlamada(peticion).pathname).toBe("/api/v1/comercial/cultivos/CUL-1/plantas");
  });

  it("los beneficios y las transformaciones cuelgan del cultivo y del lote", async () => {
    const beneficios = responder({ datos: [], total: 0, pagina: 1, porPagina: 10 });
    await apiComercial.beneficios({ cultivoId: "CUL-1" });
    expect(urlLlamada(beneficios).pathname).toBe("/api/v1/comercial/cultivos/CUL-1/beneficios");

    const transformaciones = responder({ datos: [], total: 0, pagina: 1, porPagina: 10 });
    await apiComercial.transformaciones({ loteId: "LOT-1" });
    expect(urlLlamada(transformaciones).pathname).toBe(
      "/api/v1/comercial/lotes/LOT-1/transformaciones",
    );
  });

  it("los listados que el contrato no ofrece por organización fallan antes de salir", async () => {
    const peticion = responder({ datos: [] });
    for (const consulta of [
      () => apiComercial.plantas({}),
      () => apiComercial.beneficios({}),
      () => apiComercial.transformaciones({}),
      () => apiComercial.destrucciones({}),
    ]) {
      const error = (await consulta().catch((fallo: unknown) => fallo)) as ErrorApi;
      expect(error.problema.status).toBe(501);
    }
    expect(peticion).not.toHaveBeenCalled();
  });

  it("las actas de destrucción exigen la entidad y su identificador", async () => {
    const peticion = responder({ datos: [], total: 0, pagina: 1, porPagina: 10 });
    await apiComercial.destrucciones({ entidad: "LOTE", entidadId: "LOT-1" });
    const url = urlLlamada(peticion);
    expect(url.pathname).toBe("/api/v1/comercial/actas-destruccion");
    expect(url.searchParams.get("entidad")).toBe("LOTE");
    expect(url.searchParams.get("entidadId")).toBe("LOT-1");
  });

  it("mover un lote es un evento sobre el lote, con su id en la ruta", async () => {
    const peticion = responder({
      id: "LOT-1",
      codigo: "LOT-2026-001",
      cultivoId: null,
      organizacionId: "ORG-1",
      tipo: "FLOR_SECA",
      cantidadInicial: "10",
      existencia: "10",
      unidad: "kg",
      estado: "EN_TRANSITO",
      motivoEstado: "Traslado",
      thc: "0.1",
      cbd: "5",
      psicoactivo: false,
      bodega: "B2",
      departamento: "Tolima",
      fecha: "2026-07-01",
      vencimiento: "2027-07-01",
      registro: "2026-07-01T10:00:00.000Z",
      registroInvima: "",
    });
    const lote = await apiComercial.moverLote({
      id: "LOT-1",
      estado: "EN_TRANSITO",
      bodega: "B2",
      motivo: "Traslado",
      autor: {
        usuarioId: "USR-1",
        nombre: "Marcela",
        organizacionId: "ORG-1",
        rol: "REPRESENTANTE_LEGAL",
      },
    });
    const opciones = peticion.mock.calls[0]?.[1];
    expect(urlLlamada(peticion).pathname).toBe("/api/v1/comercial/lotes/LOT-1/movimientos");
    expect(opciones?.method).toBe("POST");
    expect(JSON.parse(String(opciones?.body))).toEqual({
      destino: "EN_TRANSITO",
      bodega: "B2",
      motivo: "Traslado",
    });
    expect(lote.estado).toBe("EN_TRANSITO");
  });

  it("el sobre paginado se traduce a la forma que consumen las tablas", async () => {
    responder({
      datos: [
        {
          id: "ORG-1",
          nit: "900-1",
          nombre: "Cannalia",
          tipo: "CULTIVADOR",
          departamento: "Cauca",
          municipio: "Popayán",
          estado: "HABILITADA",
          registro: "2026-01-01T10:00:00.000Z",
        },
      ],
      total: 51,
      pagina: 1,
      porPagina: 10,
    });
    const pagina = await apiComercial.organizaciones({});
    expect(pagina.total).toBe(51);
    expect(pagina.datos[0]?.nombre).toBe("Cannalia");
    expect(pagina.datos[0]?.correo).toBe("");
  });

  it("el directorio comercial nunca devuelve pacientes, solo su total", async () => {
    responder({
      proveedores: [],
      dispensadores: [],
      prestadores: [],
      medicos: [],
      totales: { proveedores: 5, dispensadores: 2, ips: 1, medicos: 9, pacientes: 1500 },
    });
    const directorio = await apiComercial.directorio("cauca");
    expect(directorio).not.toHaveProperty("pacientes");
    expect(directorio.totales.pacientes).toBe(1500);
  });

  it("pide los requisitos al servidor en vez de llevar la lista escrita a mano", async () => {
    const peticion = responder({ tipoActor: "CULTIVADOR", documentos: [] });
    await apiComercial.requisitosDeActor("CULTIVADOR");
    expect(urlLlamada(peticion).pathname).toBe("/api/v1/comercial/actores/requisitos/CULTIVADOR");
  });

  it("prepara y confirma el soporte en las rutas con dos puntos del contrato", async () => {
    const preparar = responder({
      soporteId: "7de6cbf3",
      subida: { url: "https://almacen", metodo: "POST", expira: "", campos: {} },
      mimesAdmitidos: ["application/pdf"],
      bytesMaximos: 10485760,
    });
    await apiComercial.prepararSoporte({
      tipo: "LICENCIA_CULTIVO",
      nombre: "licencia.pdf",
      mime: "application/pdf",
      bytes: 4111,
      captcha: "comprobante",
    });
    expect(urlLlamada(preparar).pathname).toBe("/api/v1/comercial/actores/soportes:preparar");
    const cabeceras = preparar.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(cabeceras["CF-Turnstile-Response"]).toBe("comprobante");
    expect(JSON.parse(String(preparar.mock.calls[0]?.[1]?.body))).not.toHaveProperty("captcha");
    vi.restoreAllMocks();

    const confirmar = responder({ soporteId: "7de6cbf3", estado: "DISPONIBLE" });
    await apiComercial.confirmarSoporte({ soporteId: "7de6cbf3", captcha: "otro" });
    expect(urlLlamada(confirmar).pathname).toBe(
      "/api/v1/comercial/actores/soportes/7de6cbf3:confirmar",
    );
    expect(confirmar.mock.calls[0]?.[1]?.body).toBeUndefined();
  });

  it("la radicacion manda soporteId y clave, y nunca el nombre ni el peso del archivo", async () => {
    const peticion = responder({ id: "SOL-1", estado: "RECIBIDA", radicada: "", mensaje: "" });
    await apiComercial.radicarSolicitud({
      nit: "901234567-7",
      organizacion: "Cultivos de Prueba SAS",
      tipoActor: "CULTIVADOR",
      departamento: "19",
      municipio: "19001",
      representante: "Ana Ruiz",
      correo: "ana@cultivos.co",
      telefono: "+573001112233",
      clave: "una-clave-de-al-menos-12",
      documentos: [{ tipo: "LICENCIA_CULTIVO", soporteId: "7de6cbf3" }],
    });
    const cuerpo = JSON.parse(String(peticion.mock.calls[0]?.[1]?.body)) as {
      clave: string;
      departamento: string;
      documentos: readonly Record<string, unknown>[];
    };
    expect(cuerpo.clave).toBe("una-clave-de-al-menos-12");
    expect(cuerpo.departamento).toBe("19");
    expect(cuerpo.documentos[0]).toEqual({ tipo: "LICENCIA_CULTIVO", soporteId: "7de6cbf3" });
    expect(cuerpo.documentos[0]).not.toHaveProperty("nombre");
    expect(cuerpo.documentos[0]).not.toHaveProperty("peso");
    const cabeceras = peticion.mock.calls[0]?.[1]?.headers as Record<string, string>;
    const idempotencia = cabeceras["Idempotency-Key"] ?? "";
    expect(idempotencia.length).toBeGreaterThanOrEqual(8);
    expect(idempotencia.length).toBeLessThanOrEqual(128);
  });

  it("la verificacion del correo manda solo el token en el cuerpo", async () => {
    const peticion = responder({ id: "SOL-1", correoVerificado: true, mensaje: "" });
    await apiComercial.verificarCorreo({ solicitudId: "SOL-1", token: "c9f2fd6a" });
    expect(urlLlamada(peticion).pathname).toBe(
      "/api/v1/comercial/actores/solicitudes/SOL-1/verificacion",
    );
    expect(JSON.parse(String(peticion.mock.calls[0]?.[1]?.body))).toEqual({ token: "c9f2fd6a" });
  });

  it("la radicacion lleva el comprobante de humanidad en su cabecera, no en el cuerpo", async () => {
    const peticion = responder({ id: "SOL-1", radicado: "SOL-2026-001", estado: "RECIBIDA" });
    await apiComercial.radicarSolicitud({
      nit: "900123456-8",
      organizacion: "Cannalia",
      tipoActor: "CULTIVADOR",
      departamento: "19",
      municipio: "19001",
      representante: "Marcela Ospina",
      correo: "marcela@cannalia.co",
      telefono: "3001234567",
      clave: "una-clave-de-al-menos-12",
      documentos: [],
      captcha: "comprobante-de-turnstile",
    });
    const opciones = peticion.mock.calls[0]?.[1];
    const cabeceras = opciones?.headers as Record<string, string>;
    expect(cabeceras["CF-Turnstile-Response"]).toBe("comprobante-de-turnstile");
    expect(JSON.parse(String(opciones?.body))).not.toHaveProperty("captcha");
  });

  it("sin comprobante no se inventa la cabecera", async () => {
    const peticion = responder({ id: "SOL-1", radicado: "SOL-2026-001", estado: "RECIBIDA" });
    await apiComercial.radicarSolicitud({
      nit: "900123456-8",
      organizacion: "Cannalia",
      tipoActor: "CULTIVADOR",
      departamento: "19",
      municipio: "19001",
      representante: "Marcela Ospina",
      correo: "marcela@cannalia.co",
      telefono: "3001234567",
      clave: "una-clave-de-al-menos-12",
      documentos: [],
    });
    const cabeceras = peticion.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(cabeceras["CF-Turnstile-Response"]).toBeUndefined();
  });

  it("una operacion ausente del contrato falla sin tocar la red", async () => {
    const peticion = responder({});
    await expect(apiComercial.variedades()).rejects.toMatchObject({ problema: { status: 501 } });
    expect(peticion).not.toHaveBeenCalled();
  });
});

describe("zona clinica", () => {
  it("los pacientes cuelgan de /api/v1/clinica y viajan sin cache", async () => {
    const peticion = responder({ datos: [], total: 0, pagina: 1, porPagina: 10 });
    await apiClinica.pacientes({ busqueda: "ana" });
    expect(urlLlamada(peticion).pathname).toBe("/api/v1/clinica/pacientes");
    expect(peticion.mock.calls[0]?.[1]?.cache).toBe("no-store");
  });

  it("el listado no expone documento porque su proyeccion no lo trae", async () => {
    responder({
      datos: [
        {
          id: "PAC-1",
          nombre: "Ana Ruiz",
          edad: 54,
          departamento: "Cauca",
          municipio: "Popayán",
          estado: "ACTIVO",
          autorizacionesVigentes: ["ATENCION_ASISTENCIAL"],
        },
      ],
      total: 1,
      pagina: 1,
      porPagina: 10,
    });
    const pagina = await apiClinica.pacientes({});
    expect(pagina.datos[0]?.documento).toBe("");
    expect(pagina.datos[0]?.sexo).toBe("SIN_DATO");
  });

  it("leer un paciente declara la finalidad del tratamiento", async () => {
    const peticion = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((entrada: RequestInfo | URL) =>
        Promise.resolve(
          String(entrada).includes("/agenda")
            ? json([])
            : json({
                id: "PAC-1",
                nombre: "Ana Ruiz",
                edad: 54,
                departamento: "Cauca",
                municipio: "Popayán",
                estado: "ACTIVO",
                autorizacionesVigentes: [],
                documento: "CC 1.234.567",
                fechaNacimiento: "1972-04-01",
                registrado: "2026-01-05T10:00:00.000Z",
                autorizaciones: [],
              }),
        ),
      );
    const detalle = await apiClinica.paciente("PAC-1");
    const url = new URL(String(peticion.mock.calls[0]?.[0]));
    expect(url.searchParams.get("finalidad")).toBe("ATENCION_ASISTENCIAL");
    expect(detalle.paciente.documento).toBe("CC 1.234.567");
  });
});
