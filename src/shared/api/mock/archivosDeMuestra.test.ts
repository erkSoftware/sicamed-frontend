import { describe, expect, it } from "vitest";
import { adjuntoDeMuestra, imagenDeMuestra, pdfDeMuestra } from "./archivosDeMuestra";

const decodificar = (url: string): string => atob(url.slice(url.indexOf(",") + 1));

describe("pdfDeMuestra", () => {
  it("arma un documento con la tabla de referencias apuntando a donde está", () => {
    const documento = decodificar(pdfDeMuestra("Licencia de cultivo", ["NIT: 900123456-8"]));

    expect(documento.startsWith("%PDF-1.4")).toBe(true);
    expect(documento.trimEnd().endsWith("%%EOF")).toBe(true);

    const lineas = documento.split("\n");
    const inicio = Number(documento.slice(documento.lastIndexOf("startxref") + 10).split("\n")[0]);
    expect(documento.slice(inicio, inicio + 4)).toBe("xref");

    const primera = Number(lineas[lineas.indexOf("xref") + 3]?.slice(0, 10));
    expect(documento.slice(primera, primera + 7)).toBe("1 0 obj");
  });

  it("saca los acentos que la fuente Helvetica del PDF no dibuja", () => {
    const documento = decodificar(pdfDeMuestra("Autorización sanitaria", []));
    expect(documento).toContain("Autorizacion sanitaria");
    expect(documento).not.toContain("ó");
  });

  it("escapa los paréntesis que cerrarían la cadena antes de tiempo", () => {
    const documento = decodificar(pdfDeMuestra("Predio (lote 4)", []));
    expect(documento).toContain("Predio \\(lote 4\\)");
  });
});

describe("imagenDeMuestra", () => {
  it("entrega un svg legible sin pasar por base64", () => {
    const url = imagenDeMuestra("Plano del predio", "900123456", 140);
    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(decodeURIComponent(url.slice(url.indexOf(",") + 1))).toContain("Plano del predio");
  });
});

describe("adjuntoDeMuestra", () => {
  it("conserva el mime que se le pide para que el visor sepa que no lo puede dibujar", () => {
    const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    expect(adjuntoDeMuestra("acta.docx", mime).startsWith(`data:${mime};base64,`)).toBe(true);
  });
});
