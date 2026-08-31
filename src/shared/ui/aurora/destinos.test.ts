import { describe, expect, it } from "vitest";
import { resolverDestino } from "./destinos";
import { PERMISOS_PLATAFORMA, PERMISOS_CAMPO } from "../../auth/permisosDeRol";

describe("resolverDestino", () => {
  it("lleva a cumplimiento cuando se nombra el módulo", () => {
    const resultado = resolverDestino("cumplimiento", PERMISOS_PLATAFORMA);
    expect(resultado.ok && resultado.ruta).toBe("/app/licencias");
  });

  it("lleva al cultivo cuando se nombra la actividad", () => {
    const resultado = resolverDestino("el cultivo", PERMISOS_PLATAFORMA);
    expect(resultado.ok && resultado.ruta).toBe("/app/produccion");
  });

  it("entiende la frase completa con la que habla una persona", () => {
    const resultado = resolverDestino("llévame a la vitrina", PERMISOS_PLATAFORMA);
    expect(resultado.ok && resultado.ruta).toBe("/app/vitrina");
  });

  it("entiende la frase sin artículo, que es donde antes se atascaba", () => {
    expect(resolverDestino("llévame a cumplimiento", PERMISOS_PLATAFORMA)).toMatchObject({
      ok: true,
      ruta: "/app/licencias",
    });
    expect(resolverDestino("quiero ir a trazabilidad", PERMISOS_PLATAFORMA)).toMatchObject({
      ok: true,
      ruta: "/app/trazabilidad",
    });
    expect(resolverDestino("muéstrame los reportes", PERMISOS_PLATAFORMA)).toMatchObject({
      ok: true,
      ruta: "/app/reportes",
    });
  });

  it("una particula suelta no se queda sin destino", () => {
    expect(resolverDestino("a", PERMISOS_PLATAFORMA).ok).toBe(false);
  });

  it("acepta la ruta literal si el modelo la manda", () => {
    const resultado = resolverDestino("/app/trazabilidad", PERMISOS_PLATAFORMA);
    expect(resultado.ok && resultado.ruta).toBe("/app/trazabilidad");
  });

  it("no lleva a donde el rol no entra, y lo dice", () => {
    const resultado = resolverDestino("cuentas y roles", PERMISOS_CAMPO);
    expect(resultado.ok).toBe(false);
    expect(!resultado.ok && resultado.motivo).toContain("tu rol no entra");
  });

  it("un destino inventado devuelve las pantallas que sí existen", () => {
    const resultado = resolverDestino("la nave espacial", PERMISOS_PLATAFORMA);
    expect(resultado.ok).toBe(false);
    expect(!resultado.ok && resultado.disponibles?.length).toBeGreaterThan(0);
  });

  it("sin destino no adivina", () => {
    expect(resolverDestino("   ", PERMISOS_PLATAFORMA).ok).toBe(false);
  });
});
