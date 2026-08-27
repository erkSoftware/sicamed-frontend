import { describe, expect, it } from "vitest";
import { aOfertaVista } from "./mapeo";
import type { Oferta } from "../../../shared/api/mock/tipos";

const base: Oferta = {
  id: "OFE-0001",
  titulo: "Aceite estandarizado CBD — Tolima",
  tipoProducto: "Aceite estandarizado CBD",
  organizacionId: "ORG-0006",
  organizacion: "Laboratorios Fitomed S.A.S.",
  tipoActor: "LABORATORIO",
  departamento: "Tolima",
  municipio: "Ibagué",
  estado: "PUBLICADA",
  disponibilidad: "INMEDIATA",
  publicada: "2026-08-01T09:00:00.000Z",
  vigencia: "2026-12-01T09:00:00.000Z",
  descripcion: "Oferta de prueba",
  certificaciones: ["BPA"],
  interesados: 4,
};

describe("aOfertaVista", () => {
  it("compone la ubicacion legible a partir de municipio y departamento", () => {
    expect(aOfertaVista(base).ubicacion).toBe("Ibagué, Tolima");
  });

  it("traduce el estado del contrato a etiqueta y tono de la vista", () => {
    expect(aOfertaVista(base).etiquetaEstado).toBe("Publicada");
    expect(aOfertaVista(base).tonoEstado).toBe("exito");
  });

  it("marca las ofertas rechazadas con tono de peligro", () => {
    const rechazada = aOfertaVista({ ...base, estado: "RECHAZADA" });
    expect(rechazada.etiquetaEstado).toBe("Rechazada");
    expect(rechazada.tonoEstado).toBe("peligro");
  });

  it("no expone campos economicos del contrato", () => {
    const vista = aOfertaVista(base);
    const claves = Object.keys(vista).join(" ").toLowerCase();
    for (const prohibido of ["precio", "pago", "carrito", "orden", "checkout"]) {
      expect(claves).not.toContain(prohibido);
    }
  });
});
