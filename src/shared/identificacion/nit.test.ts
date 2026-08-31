import { describe, expect, it } from "vitest";

import { digitoDeVerificacion, nitCanonico, nitConDigito, revisarNit } from "./nit";

describe("digito de verificacion de la DIAN", () => {
  it.each([
    ["899999068", 1, "Ecopetrol: el resto es 1, la rama que casi ningun numero al azar toca"],
    ["900000009", 0, "resto 0: el digito es el propio resto, no 11 menos el resto"],
    ["890903938", 8, "Bancolombia"],
    ["800197268", 4, "la DIAN"],
    ["900123456", 8, "el del ejemplo del formulario"],
  ])("%s termina en %i (%s)", (numero, esperado) => {
    expect(digitoDeVerificacion(numero)).toBe(esperado);
  });

  it("no confunde el resto 1 con el resto 0", () => {
    expect(nitConDigito("899999068")).toBe("899999068-1");
    expect(nitConDigito("900000009")).toBe("900000009-0");
  });

  it("rechaza lo que no es un numero de NIT", () => {
    expect(digitoDeVerificacion("")).toBeNull();
    expect(digitoDeVerificacion("90012345a")).toBeNull();
  });
});

describe("revision del NIT escrito", () => {
  it("acepta el NIT completo y correcto", () => {
    expect(revisarNit("899999068-1")).toBeNull();
    expect(revisarNit(" 900123456-8 ")).toBeNull();
  });

  it("acepta las tres formas de escribir el mismo NIT, como hace el servidor", () => {
    expect(revisarNit("900123456-8")).toBeNull();
    expect(revisarNit("900123456 8")).toBeNull();
    expect(revisarNit("9001234568")).toBeNull();
    expect(nitCanonico("9001234568")).toBe("900123456-8");
    expect(nitCanonico("900123456 8")).toBe("900123456-8");
  });

  it("distingue la forma mal escrita del digito equivocado", () => {
    expect(revisarNit("abc-1")?.fallo).toBe("forma");
    expect(revisarNit("900123456-7")).toEqual({ fallo: "digito", esperado: "8" });
  });

  it("exige entre siete y once digitos contando el de verificacion", () => {
    expect(revisarNit("123456")?.fallo).toBe("forma");
    expect(revisarNit("123456789012")?.fallo).toBe("forma");
    expect(revisarNit("1234567")?.fallo).not.toBe("forma");
    expect(revisarNit("12345678901")?.fallo).not.toBe("forma");
  });

  it("le dice al usuario cual era el digito que faltaba", () => {
    expect(revisarNit("899999068-0")).toEqual({ fallo: "digito", esperado: "1" });
  });
});
