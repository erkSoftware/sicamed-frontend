import { describe, expect, it } from "vitest";
import {
  DEPARTAMENTOS,
  TOTAL_MUNICIPIOS,
  esMunicipioDe,
  municipio,
  municipiosDe,
  nombreDeMunicipio,
} from "./divipola";

const CUENTA_OFICIAL: Readonly<Record<string, number>> = {
  "05": 125,
  "08": 23,
  "11": 1,
  "13": 46,
  "15": 123,
  "17": 27,
  "18": 16,
  "19": 42,
  "20": 25,
  "23": 30,
  "25": 116,
  "27": 30,
  "41": 37,
  "44": 15,
  "47": 30,
  "50": 29,
  "52": 64,
  "54": 40,
  "63": 12,
  "66": 14,
  "68": 87,
  "70": 26,
  "73": 47,
  "76": 42,
  "81": 7,
  "85": 19,
  "86": 13,
  "88": 2,
  "91": 11,
  "94": 9,
  "95": 4,
  "97": 6,
  "99": 4,
};

describe("catalogo DIVIPOLA", () => {
  it("trae los 33 departamentos con codigo de dos digitos", () => {
    expect(DEPARTAMENTOS).toHaveLength(33);
    for (const entrada of DEPARTAMENTOS) expect(entrada.codigo).toMatch(/^\d{2}$/);
  });

  it("cuenta por departamento lo que cuenta el DANE", () => {
    for (const [codigo, cuenta] of Object.entries(CUENTA_OFICIAL)) {
      expect(municipiosDe(codigo)).toHaveLength(cuenta);
    }
    expect(TOTAL_MUNICIPIOS).toBe(1122);
  });

  it("cada municipio lleva cinco digitos y empieza por su departamento", () => {
    for (const entrada of DEPARTAMENTOS) {
      for (const localidad of municipiosDe(entrada.codigo)) {
        expect(localidad.codigo).toMatch(/^\d{5}$/);
        expect(localidad.codigo.startsWith(entrada.codigo)).toBe(true);
        expect(localidad.nombre.length).toBeGreaterThan(2);
      }
    }
  });

  it("no repite codigos entre departamentos", () => {
    const vistos = DEPARTAMENTOS.flatMap((entrada) =>
      municipiosDe(entrada.codigo).map((localidad) => localidad.codigo),
    );
    expect(new Set(vistos).size).toBe(vistos.length);
  });

  it("resuelve las capitales que el portal usa como ejemplo", () => {
    expect(nombreDeMunicipio("19001")).toBe("Popayán");
    expect(nombreDeMunicipio("76001")).toBe("Cali");
    expect(nombreDeMunicipio("05001")).toBe("Medellín");
    expect(nombreDeMunicipio("11001")).toBe("Bogotá D.C.");
  });

  it("un codigo que no existe se devuelve tal cual y no se inventa un nombre", () => {
    expect(municipio("19999")).toBeNull();
    expect(nombreDeMunicipio("19999")).toBe("19999");
  });

  it("sabe si un municipio pertenece al departamento elegido", () => {
    expect(esMunicipioDe("19001", "19")).toBe(true);
    expect(esMunicipioDe("19001", "76")).toBe(false);
    expect(esMunicipioDe("00000", "19")).toBe(false);
  });
});
