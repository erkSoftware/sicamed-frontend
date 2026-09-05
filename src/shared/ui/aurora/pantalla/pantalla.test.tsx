import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { usePantallaDeAurora } from "./usePantallaDeAurora";
import {
  accionesDePantalla,
  buscarAccion,
  ejecutarAccionDePantalla,
  escucharPantalla,
  publicarPantalla,
  vaciarPantalla,
} from "./bus";
import { esRutaClinica, fundirEstados, instantaneaViva, TOPE_DE_CONTEXTO } from "./contextoVivo";
import {
  clasificarHerramientaUi,
  destinoDeArgumentos,
  objetivoDeArgumentos,
  valorDeArgumentos,
} from "./verbos";
import type { AccionDePantalla } from "./tipos";

const PERMISOS = ["inventario:lote:leer", "clinico:atencion:leer"] as const;

const accion = (parcial: Partial<AccionDePantalla> = {}): AccionDePantalla => ({
  verbo: "senalar-campo",
  objetivo: "cupo",
  etiqueta: "Cupo asignado",
  ejecutar: () => ({ ok: true }),
  ...parcial,
});

afterEach(() => vaciarPantalla());

describe("bus de acciones de pantalla", () => {
  it("publica al montar y retira al desmontar", () => {
    const suscripcion = publicarPantalla({
      ruta: "/app/cupos",
      estado: { pantalla: "Cupos asignados" },
      acciones: [accion()],
    });
    expect(accionesDePantalla("/app/cupos")).toHaveLength(1);
    suscripcion.retirar();
    expect(accionesDePantalla("/app/cupos")).toHaveLength(0);
  });

  it("no deja que una pantalla conteste por otra ruta", () => {
    publicarPantalla({
      ruta: "/app/cupos",
      estado: { pantalla: "Cupos asignados" },
      acciones: [accion()],
    });
    expect(buscarAccion("/app/inventario", "senalar-campo", "cupo")).toBeUndefined();
  });

  it("encuentra por etiqueta, por sinónimo y por aproximación", () => {
    publicarPantalla({
      ruta: "/app/cupos",
      estado: { pantalla: "Cupos asignados" },
      acciones: [accion({ sinonimos: ["cuota de plantas"] })],
    });
    expect(buscarAccion("/app/cupos", "senalar-campo", "Cupo asignado")?.objetivo).toBe("cupo");
    expect(buscarAccion("/app/cupos", "senalar-campo", "cuota de plantas")?.objetivo).toBe("cupo");
    expect(buscarAccion("/app/cupos", "senalar-campo", "asignado")?.objetivo).toBe("cupo");
    expect(buscarAccion("/app/cupos", "senalar-campo", "bodega")).toBeUndefined();
  });

  it("avisa a quien escucha cuando cambia lo publicado", () => {
    const oyente = vi.fn();
    const dejar = escucharPantalla(oyente);
    const suscripcion = publicarPantalla({
      ruta: "/app/cupos",
      estado: { pantalla: "Cupos asignados" },
      acciones: [],
    });
    expect(oyente).toHaveBeenCalledTimes(1);
    suscripcion.actualizar({
      ruta: "/app/cupos",
      estado: { pantalla: "Cupos asignados", total: 4 },
      acciones: [],
    });
    expect(oyente).toHaveBeenCalledTimes(2);
    dejar();
    suscripcion.retirar();
    expect(oyente).toHaveBeenCalledTimes(2);
  });

  it("guarda la última acción aunque la huella no cambie", async () => {
    const oyente = vi.fn();
    const dejar = escucharPantalla(oyente);
    const suscripcion = publicarPantalla({
      ruta: "/app/inventario",
      estado: { pantalla: "Inventario" },
      acciones: [accion({ ejecutar: () => ({ ok: true, detalle: "vieja" }) })],
    });
    suscripcion.actualizar({
      ruta: "/app/inventario",
      estado: { pantalla: "Inventario" },
      acciones: [accion({ ejecutar: () => ({ ok: true, detalle: "nueva" }) })],
    });

    const encontrada = buscarAccion("/app/inventario", "senalar-campo", "cupo");
    const resultado = await ejecutarAccionDePantalla(encontrada ?? accion(), {
      objetivo: "cupo",
      valor: "",
      argumentos: {},
    });
    expect(resultado.detalle).toBe("nueva");
    expect(oyente).toHaveBeenCalledTimes(1);
    dejar();
  });

  it("convierte en fallo la acción que revienta", async () => {
    const rota = accion({
      ejecutar: () => {
        throw new Error("la pantalla se cayó");
      },
    });
    const resultado = await ejecutarAccionDePantalla(rota, {
      objetivo: "cupo",
      valor: "",
      argumentos: {},
    });
    expect(resultado.ok).toBe(false);
  });
});

describe("contexto vivo", () => {
  it("cuenta filtros, formulario y acciones de la pantalla", () => {
    publicarPantalla({
      ruta: "/app/inventario",
      estado: {
        pantalla: "Inventario",
        filtros: [{ etiqueta: "Estado", valor: "En bodega" }],
        total: 12,
      },
      acciones: [accion({ verbo: "aplicar-filtro", objetivo: "estado", etiqueta: "Estado" })],
    });
    publicarPantalla({
      ruta: "/app/inventario",
      estado: {
        pantalla: "Inventario",
        formulario: {
          etiqueta: "Crear lote",
          campos: [
            { etiqueta: "Bodega", diligenciado: false },
            { etiqueta: "Cantidad", diligenciado: true, error: "debe ser mayor que cero" },
          ],
        },
      },
      acciones: [],
    });

    const { texto, clinica } = instantaneaViva("/app/inventario", PERMISOS);
    expect(clinica).toBe(false);
    expect(texto).toContain("Pantalla: Inventario (/app/inventario).");
    expect(texto.match(/Pantalla:/gu)).toHaveLength(1);
    expect(texto).toContain("Estado = En bodega");
    expect(texto).toContain("Filas visibles: 12");
    expect(texto).toContain("Sin diligenciar: Bodega");
    expect(texto).toContain("Con error: Cantidad (debe ser mayor que cero)");
    expect(texto).toContain("aplicar el filtro «Estado»");
    expect(texto.length).toBeLessThanOrEqual(TOPE_DE_CONTEXTO);
  });

  it("cambia de huella cuando cambia el estado y no antes", () => {
    const suscripcion = publicarPantalla({
      ruta: "/app/inventario",
      estado: { pantalla: "Inventario", total: 1 },
      acciones: [],
    });
    const primera = instantaneaViva("/app/inventario", PERMISOS).huella;
    expect(instantaneaViva("/app/inventario", PERMISOS).huella).toBe(primera);
    suscripcion.actualizar({
      ruta: "/app/inventario",
      estado: { pantalla: "Inventario", total: 2 },
      acciones: [],
    });
    expect(instantaneaViva("/app/inventario", PERMISOS).huella).not.toBe(primera);
  });

  it("en la zona clínica no publica nada de la pantalla", () => {
    publicarPantalla({
      ruta: "/app/salud/pacientes",
      estado: {
        pantalla: "Pacientes",
        filtros: [{ etiqueta: "Diagnóstico", valor: "epilepsia" }],
        seleccion: "Paciente 4",
      },
      acciones: [accion()],
    });

    const { texto, clinica } = instantaneaViva("/app/salud/pacientes", PERMISOS);
    expect(clinica).toBe(true);
    expect(texto).not.toContain("epilepsia");
    expect(texto).not.toContain("Paciente 4");
    expect(texto).toContain("No tienes herramientas en esta zona");
  });

  it("reconoce las rutas clínicas por su zona declarada", () => {
    expect(esRutaClinica("/app/salud/agenda")).toBe(true);
    expect(esRutaClinica("/app/salud/pacientes/17")).toBe(true);
    expect(esRutaClinica("/app/inventario")).toBe(false);
    expect(esRutaClinica("/app/dispensacion")).toBe(false);
  });

  it("funde varias publicaciones en un solo estado", () => {
    expect(fundirEstados([])).toBeNull();
    const fundido = fundirEstados([
      { pantalla: "Inventario", filtros: [{ etiqueta: "Estado", valor: "En bodega" }] },
      { pantalla: "", formulario: { etiqueta: "Crear lote", campos: [] } },
    ]);
    expect(fundido?.pantalla).toBe("Inventario");
    expect(fundido?.formulario?.etiqueta).toBe("Crear lote");
  });
});

describe("usePantallaDeAurora", () => {
  it("no publica nada mientras la ruta es clínica", () => {
    const { unmount } = renderHook(
      () => usePantallaDeAurora({ pantalla: "Pacientes" }, [accion()]),
      {
        wrapper: ({ children }) =>
          MemoryRouter({ initialEntries: ["/app/salud/pacientes"], children }),
      },
    );
    expect(accionesDePantalla("/app/salud/pacientes")).toHaveLength(0);
    unmount();
  });

  it("publica y retira con el ciclo de vida de la pantalla comercial", () => {
    const { unmount } = renderHook(
      () => usePantallaDeAurora({ pantalla: "Inventario" }, [accion()]),
      {
        wrapper: ({ children }) => MemoryRouter({ initialEntries: ["/app/inventario"], children }),
      },
    );
    expect(accionesDePantalla("/app/inventario")).toHaveLength(1);
    unmount();
    expect(accionesDePantalla("/app/inventario")).toHaveLength(0);
  });
});

describe("clasificarHerramientaUi", () => {
  it("despacha por sufijo y no por lista escrita a mano", () => {
    expect(clasificarHerramientaUi("navigate_to")).toEqual({ clase: "navegar" });
    expect(clasificarHerramientaUi("ui_navigate_to")).toEqual({ clase: "navegar" });
    expect(clasificarHerramientaUi("highlight_field")).toEqual({
      clase: "pantalla",
      verbo: "senalar-campo",
    });
    expect(clasificarHerramientaUi("open_lot_form")).toEqual({
      clase: "pantalla",
      verbo: "abrir-formulario",
      objetivo: "lote",
      respaldo: { ruta: "/app/inventario?crear=lote", permiso: "inventario:lote:escribir" },
    });
    expect(clasificarHerramientaUi("consultar_cupo_de_plantas")).toEqual({ clase: "desconocida" });
    expect(clasificarHerramientaUi("")).toEqual({ clase: "desconocida" });
  });

  it("lee el objetivo, el valor y el destino con cualquiera de sus nombres", () => {
    expect(objetivoDeArgumentos({ field: "cupo" })).toBe("cupo");
    expect(objetivoDeArgumentos({ campo: " bodega " })).toBe("bodega");
    expect(objetivoDeArgumentos({ otro: "x" })).toBe("");
    expect(valorDeArgumentos({ value: "En bodega" })).toBe("En bodega");
    expect(valorDeArgumentos({ valor: 30 })).toBe("30");
    expect(destinoDeArgumentos({ destination: "vitrina" })).toBe("vitrina");
  });
});
