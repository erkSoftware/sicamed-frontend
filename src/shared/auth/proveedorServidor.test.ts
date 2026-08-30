import { describe, expect, it } from "vitest";
import { aSesionDeAcceso, instanteDeRenovacion } from "./proveedorServidor";
import { permisosDeRolConocido } from "./permisosDeRol";
import type { AccesoApi } from "../api/rest/identidad";

const acceso: AccesoApi = {
  acceso: "eyJ",
  expiraEn: 900,
  tipo: "Bearer",
  cuenta: {
    id: "9381e129",
    nombre: "Ana Ruiz",
    correo: "ana@cultivos.co",
    rol: "PRODUCTOR",
    organizacionId: "28b56bf3",
  },
};

describe("la sesion que abre el servidor", () => {
  it("toma el rol de la cuenta y no de nada que mande el navegador", () => {
    const sesion = aSesionDeAcceso(acceso);
    expect(sesion.usuario.rol).toBe("Productor");
    expect(sesion.usuario.rolPlataforma).toBe("REPRESENTANTE_LEGAL");
    expect(sesion.permisos).toEqual(permisosDeRolConocido("PRODUCTOR"));
  });

  it("una cuenta sin organizacion no queda con la ajena", () => {
    const sesion = aSesionDeAcceso({ ...acceso, cuenta: { ...acceso.cuenta, organizacionId: null } });
    expect(sesion.usuario.organizacionId).toBe("");
  });

  it("expiraEn viene en segundos y la sesion lo guarda en milisegundos", () => {
    const sesion = aSesionDeAcceso(acceso);
    expect(sesion.expiracion - Date.now()).toBeGreaterThan(890_000);
    expect(sesion.expiracion - Date.now()).toBeLessThanOrEqual(900_000);
  });

  it("renueva un minuto antes de caducar y nunca en el pasado", () => {
    expect(instanteDeRenovacion(Date.now() + 900_000)).toBeGreaterThan(830_000);
    expect(instanteDeRenovacion(Date.now() + 900_000)).toBeLessThanOrEqual(840_000);
    expect(instanteDeRenovacion(Date.now() + 10_000)).toBe(0);
    expect(instanteDeRenovacion(Date.now() - 5_000)).toBe(0);
  });
});
