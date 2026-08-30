import { describe, expect, it } from "vitest";
import { PERFILES_DEMO, sesionDesdePerfil } from "./perfiles";
import { PERMISOS_POR_ROL, normalizarPermiso, permisosDeRolConocido } from "./permisosDeRol";
import { PERMISOS } from "./tipos";
import { aSesion } from "../api/rest/sesion";
import { aRolApi } from "../api/rest/peticiones";
import type { RolApi, SesionApi } from "../api/rest/contrato";

const ROLES: readonly RolApi[] = [
  "SUPER_ADMIN",
  "ADMIN_INSTITUCIONAL",
  "ANALISTA_CUMPLIMIENTO",
  "REPRESENTANTE_LEGAL",
  "PRODUCTOR",
  "COMPRADOR",
  "OPERADOR",
  "AUDITOR",
  "AUTORIDAD_COMPETENTE",
  "PROFESIONAL_SALUD",
  "INTEGRACION",
  "SERVICIO_INTERNO",
];

const sesionDe = (rol: string, permisos: readonly string[]): SesionApi => ({
  sujeto: "9381",
  nombre: "Ana Ruiz",
  correo: "ana@cultivos.co",
  tenantId: "018e",
  organizacionId: "28b5",
  roles: [rol],
  permisos,
  zonaClinica: false,
});

describe("cada cargo ve solo lo que le corresponde", () => {
  it("los doce roles del contrato tienen tabla y ninguno inventa un permiso", () => {
    const conocidos = new Set<string>(PERMISOS);
    for (const rol of ROLES) {
      const permisos = PERMISOS_POR_ROL[rol];
      expect(permisos, rol).toBeDefined();
      for (const permiso of permisos) expect(conocidos.has(permiso), `${rol}: ${permiso}`).toBe(true);
    }
  });

  it("las cuentas de maquina no entran al panel", () => {
    expect(permisosDeRolConocido("INTEGRACION")).toEqual([]);
    expect(permisosDeRolConocido("SERVICIO_INTERNO")).toEqual([]);
  });

  it("el operario de campo no publica en la vitrina ni administra cuentas", () => {
    const campo = permisosDeRolConocido("OPERADOR");
    expect(campo).not.toContain("vitrina:oferta:publicar");
    expect(campo).not.toContain("admin:usuario:gestionar");
    expect(campo).toContain("produccion:planta:escribir");
  });

  it("quien administra la plataforma no verifica expedientes: separacion de funciones", () => {
    expect(permisosDeRolConocido("SUPER_ADMIN")).not.toContain("cumplimiento:expediente:verificar");
    expect(permisosDeRolConocido("SUPER_ADMIN")).toContain("admin:politica:gestionar");
  });

  it("el profesional de la salud no cruza a la zona comercial", () => {
    const clinico = permisosDeRolConocido("PROFESIONAL_SALUD");
    expect(clinico).toContain("clinico:atencion:leer");
    expect(clinico).not.toContain("inventario:lote:leer");
  });

  it("solo los siete cargos del contrato pueden abrir el asistente de voz", () => {
    const abren = ROLES.filter((rol) => permisosDeRolConocido(rol).includes("asistente:sesion:abrir"));
    expect([...abren].sort()).toEqual(
      [
        "ADMIN_INSTITUCIONAL",
        "ANALISTA_CUMPLIMIENTO",
        "COMPRADOR",
        "OPERADOR",
        "PRODUCTOR",
        "REPRESENTANTE_LEGAL",
        "SUPER_ADMIN",
      ].sort(),
    );
  });

  it("traduce el vocabulario largo del servidor al del panel", () => {
    expect(normalizarPermiso("actores:organizacion:leer")).toBe("actores:org:leer");
    expect(normalizarPermiso("inventario:lote:leer")).toBe("inventario:lote:leer");
  });

  it("un rol cuyo vocabulario de permisos no se reconoce cae a su tabla, no a la nada", () => {
    const sesion = aSesion(sesionDe("OPERADOR", ["cosecha:mundial:bailar"]), 0);
    expect(sesion.permisos).toEqual(permisosDeRolConocido("OPERADOR"));
  });

  it("pero un servidor que no concede nada se respeta tal cual", () => {
    expect(aSesion(sesionDe("SUPER_ADMIN", []), 0).permisos).toEqual([]);
  });
});

describe("perfiles de demostración", () => {
  it("entrega la voz de Aurora a los perfiles cuyo cargo la tiene concedida", () => {
    PERFILES_DEMO.forEach((perfil) => {
      const concedida = permisosDeRolConocido(aRolApi(perfil.rolPlataforma)).includes(
        "asistente:sesion:abrir",
      );
      expect(sesionDesdePerfil(perfil).permisos.includes("asistente:sesion:abrir")).toBe(concedida);
    });
  });

  it("al menos un perfil de demostración puede conversar con Aurora", () => {
    const hablan = PERFILES_DEMO.filter((perfil) =>
      sesionDesdePerfil(perfil).permisos.includes("asistente:sesion:abrir"),
    );
    expect(hablan.length).toBeGreaterThan(0);
  });
});
