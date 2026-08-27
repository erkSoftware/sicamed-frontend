import { describe, expect, it } from "vitest";
import { decidirCinematica, pedidaPorHash } from "./decision";

const entorno = (parcial: Partial<Parameters<typeof decidirCinematica>[0]>) => ({
  ruta: "/",
  hash: "",
  vista: false,
  reducido: false,
  ...parcial,
});

describe("decision de la introduccion cinematografica", () => {
  it("corre en la portada la primera vez que se entra sin hash", () => {
    expect(decidirCinematica(entorno({}))).toBe(true);
  });

  it("no vuelve a correr sin hash una vez vista", () => {
    expect(decidirCinematica(entorno({ vista: true }))).toBe(false);
  });

  it("corre siempre con el hash de animacion aunque ya se haya visto", () => {
    expect(decidirCinematica(entorno({ hash: "#Animation", vista: true }))).toBe(true);
    expect(decidirCinematica(entorno({ hash: "#animation", vista: true }))).toBe(true);
  });

  it("nunca corre fuera de la portada", () => {
    expect(decidirCinematica(entorno({ ruta: "/vitrina", hash: "#Animation" }))).toBe(false);
  });

  it("no arranca sola con movimiento reducido", () => {
    expect(decidirCinematica(entorno({ reducido: true }))).toBe(false);
  });

  it("obedece la peticion explicita del hash aunque haya movimiento reducido", () => {
    expect(decidirCinematica(entorno({ hash: "#Animation", reducido: true }))).toBe(true);
  });

  it("solo reconoce el hash de animacion", () => {
    expect(pedidaPorHash("#Animation")).toBe(true);
    expect(pedidaPorHash("#animaciones")).toBe(false);
    expect(pedidaPorHash("")).toBe(false);
  });
});
