import { describe, expect, it } from "vitest";
import { aSesion, etiquetaDeRol, permisosReconocidos } from "./sesion";
import type { SesionApi } from "./contrato";

const sesionDelServidor: SesionApi = {
  correo: "lida.almeciga@sicamed.gov.co",
  nombre: "Lida Almeciga",
  organizacionId: "ORG-0000",
  permisos: [
    "cumplimiento:expediente:leer",
    "cumplimiento:expediente:verificar",
    "produccion:cultivo:escribir",
    "permiso:que:el:frontend:no:conoce",
  ],
  roles: ["ANALISTA_CUMPLIMIENTO"],
  sujeto: "auth0|123",
  tenantId: "sicamed-co",
  zonaClinica: false,
};

describe("permisos que manda el servidor", () => {
  it("acepta los permisos que la interfaz sabe pintar", () => {
    expect(permisosReconocidos(sesionDelServidor.permisos)).toEqual([
      "cumplimiento:expediente:leer",
      "cumplimiento:expediente:verificar",
      "produccion:cultivo:escribir",
    ]);
  });

  it("descarta el permiso desconocido en vez de romper el menu", () => {
    expect(permisosReconocidos(["nada:de:esto"])).toEqual([]);
  });

  it("una sesion sin permisos no inventa ninguno", () => {
    expect(aSesion({ ...sesionDelServidor, permisos: [] }, 0).permisos).toEqual([]);
  });
});

describe("identidad segun el servidor", () => {
  it("toma el sujeto del token como identificador y no el correo", () => {
    expect(aSesion(sesionDelServidor, 1).usuario.id).toBe("auth0|123");
  });

  it("traduce el rol del backend al rol de la plataforma", () => {
    expect(aSesion(sesionDelServidor, 1).usuario.rolPlataforma).toBe("ANALISTA_DOCUMENTAL");
    expect(aSesion(sesionDelServidor, 1).usuario.rol).toBe("Analista de cumplimiento");
  });

  it("una cuenta sin organizacion no arrastra null a la vista", () => {
    expect(aSesion({ ...sesionDelServidor, organizacionId: null }, 1).usuario.organizacionId).toBe("");
  });

  it("un token sin rol no escala privilegios", () => {
    const sinRol = aSesion({ ...sesionDelServidor, roles: [] }, 1);
    expect(sinRol.usuario.rolPlataforma).toBe("OBSERVADOR_INSTITUCIONAL");
    expect(etiquetaDeRol("")).toBe("Usuario autenticado");
  });

  it("conserva la expiracion que fijo el proveedor de identidad", () => {
    expect(aSesion(sesionDelServidor, 1_800_000).expiracion).toBe(1_800_000);
  });
});
