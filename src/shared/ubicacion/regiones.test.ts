import { describe, expect, it } from "vitest";
import { interpretarUbicacion } from "./porIp";
import { departamentoEnPunto, departamentoPorNombre, normalizarRegion } from "./regiones";

describe("resolucion de la region", () => {
  it("quita tildes y palabras de relleno del nombre que devuelve el servicio", () => {
    expect(normalizarRegion("Departamento del Valle del Cauca")).toBe("valle cauca");
    expect(normalizarRegion("Valle del Cauca Department")).toBe("valle cauca");
    expect(normalizarRegion("Nariño")).toBe("narino");
  });

  it("ubica el departamento por coordenada", () => {
    expect(departamentoEnPunto(-76.52, 3.43)?.nombre).toBe("Valle del Cauca");
    expect(departamentoEnPunto(-74.08, 4.65)?.nombre).toBe("Bogotá D.C.");
    expect(departamentoEnPunto(-3.7, 40.4)).toBeNull();
  });

  it("ubica el departamento por nombre cuando no hay coordenada util", () => {
    expect(departamentoPorNombre("Departamento del Valle del Cauca")?.codigo).toBe("76");
    expect(departamentoPorNombre("Antioquia")?.codigo).toBe("05");
    expect(departamentoPorNombre("Provincia de Buenos Aires")).toBeNull();
  });

  it("interpreta la respuesta del servicio y marca si esta en Colombia", () => {
    const dentro = interpretarUbicacion({
      success: true,
      city: "Cali",
      region: "Departamento del Valle del Cauca",
      country: "Colombia",
      country_code: "CO",
      latitude: 3.43,
      longitude: -76.52,
    });
    expect(dentro?.ciudad).toBe("Cali");
    expect(dentro?.enColombia).toBe(true);
    expect(dentro?.departamento?.nombre).toBe("Valle del Cauca");

    const fuera = interpretarUbicacion({
      success: true,
      city: "Madrid",
      region: "Comunidad de Madrid",
      country: "España",
      country_code: "ES",
      latitude: 40.4,
      longitude: -3.7,
    });
    expect(fuera?.enColombia).toBe(false);
    expect(fuera?.departamento).toBeNull();
  });

  it("descarta una respuesta fallida o vacia", () => {
    expect(interpretarUbicacion({ success: false })).toBeNull();
    expect(interpretarUbicacion({ success: true, country_code: "CO" })).toBeNull();
  });
});
