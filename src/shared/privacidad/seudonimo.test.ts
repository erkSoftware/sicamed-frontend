import { describe, expect, it } from "vitest";
import { esSeudonimo, seudonimoDe } from "./seudonimo";

describe("seudónimo de credencial", () => {
  it("es estable para el mismo identificador clínico", () => {
    expect(seudonimoDe("PAC-0007")).toBe(seudonimoDe("PAC-0007"));
  });

  it("separa identificadores vecinos", () => {
    expect(seudonimoDe("PAC-0007")).not.toBe(seudonimoDe("PAC-0008"));
  });

  it("tiene la forma que el mostrador sabe leer", () => {
    expect(esSeudonimo(seudonimoDe("PAC-0001"))).toBe(true);
    expect(esSeudonimo("PAC-0001")).toBe(false);
  });

  it("no deja rastro del identificador de origen", () => {
    expect(seudonimoDe("PAC-0042")).not.toContain("0042");
  });
});
