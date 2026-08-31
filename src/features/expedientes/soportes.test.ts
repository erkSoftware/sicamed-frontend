import { describe, expect, it } from "vitest";
import {
  claseDeVista,
  etiquetaDeclarada,
  etiquetaDeTipo,
  extensionDe,
  motivoSinVista,
  pesoLegible,
} from "./soportes";

describe("claseDeVista", () => {
  it("reconoce imagen y pdf por el mime que declaró el servidor", () => {
    expect(claseDeVista("x", "image/png")).toBe("imagen");
    expect(claseDeVista("x", "application/pdf")).toBe("pdf");
    expect(claseDeVista("x", "image/webp; charset=binary")).toBe("imagen");
  });

  it("cae al nombre cuando el mime falta o es el genérico del almacenamiento", () => {
    expect(claseDeVista("licencia.PDF")).toBe("pdf");
    expect(claseDeVista("predio.jpeg", "application/octet-stream")).toBe("imagen");
    expect(claseDeVista("sin-extension")).toBe("sin-vista");
  });

  it("no adivina una vista para lo que el navegador no dibuja", () => {
    expect(
      claseDeVista(
        "acta.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("sin-vista");
    expect(claseDeVista("soportes.zip")).toBe("sin-vista");
  });

  it("respeta el mime declarado por encima de la extensión del nombre", () => {
    expect(claseDeVista("informe.pdf", "application/zip")).toBe("sin-vista");
  });
});

describe("motivoSinVista", () => {
  it("dice qué es el archivo en vez de decir que algo falló", () => {
    expect(motivoSinVista("acta.docx")).toContain("Word");
    expect(motivoSinVista("cupos.xlsx")).toContain("hojas de cálculo");
    expect(motivoSinVista("todo.zip")).toContain("comprimido");
    expect(motivoSinVista("raro.bin")).toContain("no se puede mostrar");
  });
});

describe("extensionDe", () => {
  it("ignora la cadena de consulta de una url firmada", () => {
    expect(extensionDe("licencia.pdf?X-Amz-Signature=abc")).toBe("pdf");
    expect(extensionDe(".oculto")).toBe("");
  });
});

describe("pesoLegible", () => {
  it("escala la unidad y calla cuando no hay tamaño", () => {
    expect(pesoLegible(0)).toBe("");
    expect(pesoLegible(900)).toBe("900 B");
    expect(pesoLegible(2048)).toBe("2 kB");
    expect(pesoLegible(3_355_443)).toBe("3,2 MB");
  });
});

describe("etiquetaDeclarada", () => {
  it("prefiere la etiqueta del catálogo del servidor", () => {
    expect(
      etiquetaDeclarada("LICENCIA_CULTIVO", [
        { tipo: "LICENCIA_CULTIVO", etiqueta: "Licencia de cultivo de la autoridad competente" },
      ]),
    ).toBe("Licencia de cultivo de la autoridad competente");
  });

  it("humaniza el tipo desconocido en vez de rotularlo con el de otro documento", () => {
    expect(etiquetaDeclarada("PLAN_MANEJO_AMBIENTAL", [])).toBe("Plan manejo ambiental");
    expect(etiquetaDeTipo("camara-comercio")).toBe("Camara comercio");
    expect(etiquetaDeTipo("")).toBe("Soporte");
  });
});
