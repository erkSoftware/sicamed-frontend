import { describe, expect, it } from "vitest";
import { anclarEnCampos, validarPaso } from "./AsistenteRegistro";
import type { Formulario } from "./AsistenteRegistro";
import { ErrorApi } from "../../shared/api/problemDetails";

const invalido = (errores: readonly { campo: string; motivo: string }[]) =>
  new ErrorApi({
    type: "https://sicamed.co/problemas/contenido-invalido",
    title: "La petición no cumple el contrato",
    detail: "Revise estos campos",
    status: 422,
    errores,
  });

describe("rechazos del 422 en el asistente de registro", () => {
  it("ancla cada motivo en su campo del formulario", () => {
    const anclados = anclarEnCampos(
      invalido([
        { campo: "nit", motivo: "Es más corto de lo admitido." },
        { campo: "correo", motivo: "No tiene forma de correo." },
      ]),
    );
    expect(anclados.errores.nit).toBe("Es más corto de lo admitido.");
    expect(anclados.errores.correo).toBe("No tiene forma de correo.");
  });

  it("devuelve al primer paso que contiene un campo rechazado", () => {
    expect(anclarEnCampos(invalido([{ campo: "correo", motivo: "x" }])).paso).toBe(2);
    expect(
      anclarEnCampos(
        invalido([
          { campo: "correo", motivo: "x" },
          { campo: "nit", motivo: "y" },
        ]),
      ).paso,
    ).toBe(0);
  });

  it("ignora los campos que el formulario no pinta y no mueve al usuario", () => {
    const anclados = anclarEnCampos(invalido([{ campo: "organizacionId", motivo: "x" }]));
    expect(anclados.errores).toEqual({});
    expect(anclados.paso).toBeNull();
  });

  it("un error que no es un 422 no ancla nada", () => {
    expect(anclarEnCampos(new Error("Failed to fetch")).paso).toBeNull();
  });
});

const BASE: Formulario = {
  nit: "900123456-8",
  organizacion: "Cultivos de Prueba SAS",
  tipoActor: "CULTIVADOR",
  departamento: "19",
  municipio: "19001",
  representante: "Ana Ruiz",
  correo: "ana@cultivos.co",
  telefono: "+573001112233",
  clave: "una-clave-de-al-menos-12",
  claveRepetida: "una-clave-de-al-menos-12",
};

describe("validaciones que evitan un 422 previsible", () => {
  it("acepta las tres formas del NIT que acepta el servidor", () => {
    expect(validarPaso(0, BASE).nit).toBeUndefined();
    expect(validarPaso(0, { ...BASE, nit: "900123456 8" }).nit).toBeUndefined();
    expect(validarPaso(0, { ...BASE, nit: "9001234568" }).nit).toBeUndefined();
  });

  it("rechaza el NIT con menos de siete o mas de once digitos", () => {
    expect(validarPaso(0, { ...BASE, nit: "123456" }).nit).toBeDefined();
    expect(validarPaso(0, { ...BASE, nit: "123456789012" }).nit).toBeDefined();
  });

  it("rechaza el digito de verificacion que no cuadra y dice cual era", () => {
    expect(validarPaso(0, { ...BASE, nit: "900123456-7" }).nit).toContain("es 8");
    expect(validarPaso(0, { ...BASE, nit: "900123456-8" }).nit).toBeUndefined();
  });

  it("acepta el NIT cuyo digito es el propio resto, que es donde suele fallar la regla", () => {
    expect(validarPaso(0, { ...BASE, nit: "899999068-1" }).nit).toBeUndefined();
    expect(validarPaso(0, { ...BASE, nit: "900000009-0" }).nit).toBeUndefined();
    expect(validarPaso(0, { ...BASE, nit: "899999068-0" }).nit).toContain("es 1");
  });

  it("no deja pasar un municipio de otro departamento", () => {
    expect(validarPaso(2, BASE).municipio).toBeUndefined();
    expect(validarPaso(2, { ...BASE, departamento: "76" }).municipio).toContain("no pertenece");
  });

  it("exige los doce caracteres de la clave que pide identidad", () => {
    expect(validarPaso(3, BASE).clave).toBeUndefined();
    expect(validarPaso(3, { ...BASE, clave: "corta", claveRepetida: "corta" }).clave).toContain(
      "12 caracteres",
    );
  });

  it("no radica con dos claves distintas", () => {
    expect(validarPaso(3, { ...BASE, claveRepetida: "otra-clave-larga" }).claveRepetida).toBeDefined();
  });

  it("la clave rechazada por el servidor devuelve al paso del acceso", () => {
    expect(
      anclarEnCampos(
        new ErrorApi({
          type: "https://sicamed.co/problemas/credencial-rechazada",
          title: "La contraseña no cumple la política",
          detail: "Debe incluir un número",
          status: 422,
          errores: [{ campo: "clave", motivo: "Debe incluir un número" }],
        }),
      ).paso,
    ).toBe(3);
  });
});

describe("limites que el servidor aplica al cuerpo de la solicitud", () => {
  it("admite una razon social de tres caracteres y corta en doscientos", () => {
    expect(validarPaso(0, { ...BASE, organizacion: "Uva" }).organizacion).toBeUndefined();
    expect(validarPaso(0, { ...BASE, organizacion: "Uv" }).organizacion).toBeDefined();
    expect(validarPaso(0, { ...BASE, organizacion: "a".repeat(200) }).organizacion).toBeUndefined();
    expect(validarPaso(0, { ...BASE, organizacion: "a".repeat(201) }).organizacion).toBeDefined();
  });

  it("admite un representante de tres caracteres y corta en ciento sesenta", () => {
    expect(validarPaso(2, { ...BASE, representante: "Ana" }).representante).toBeUndefined();
    expect(validarPaso(2, { ...BASE, representante: "An" }).representante).toBeDefined();
    expect(validarPaso(2, { ...BASE, representante: "  " }).representante).toBeDefined();
    expect(validarPaso(2, { ...BASE, representante: "a".repeat(161) }).representante).toBeDefined();
  });

  it("exige del correo el mismo patron del servidor: dominio con al menos dos letras", () => {
    expect(validarPaso(2, { ...BASE, correo: "ana@cultivos.co" }).correo).toBeUndefined();
    expect(validarPaso(2, { ...BASE, correo: "ana@cultivos.c" }).correo).toBeDefined();
    expect(validarPaso(2, { ...BASE, correo: "ana@cultivos.12" }).correo).toBeDefined();
    expect(validarPaso(2, { ...BASE, correo: "ana@@cultivos.co" }).correo).toBeDefined();
    expect(validarPaso(2, { ...BASE, correo: "ana cultivos.co" }).correo).toBeDefined();
    expect(validarPaso(2, { ...BASE, correo: `${"a".repeat(200)}@x.co` }).correo).toBeDefined();
  });

  it("admite del telefono solo lo que admite el patron del servidor", () => {
    expect(validarPaso(2, { ...BASE, telefono: "+57 315 555 4433" }).telefono).toBeUndefined();
    expect(validarPaso(2, { ...BASE, telefono: "(031) 555-4433" }).telefono).toBeUndefined();
    expect(validarPaso(2, { ...BASE, telefono: "315.555.4433" }).telefono).toBeDefined();
    expect(validarPaso(2, { ...BASE, telefono: "315 555 ext. 12" }).telefono).toBeDefined();
    expect(validarPaso(2, { ...BASE, telefono: "123456" }).telefono).toBeDefined();
  });

  it("no deja elegir un departamento que no este en la DIVIPOLA", () => {
    expect(validarPaso(2, { ...BASE, departamento: "" }).departamento).toBeDefined();
    expect(validarPaso(2, { ...BASE, departamento: "5", municipio: "" }).departamento).toBeDefined();
    expect(validarPaso(2, BASE).departamento).toBeUndefined();
  });

  it("corta la clave en ciento veintiocho caracteres, el maximo de la API", () => {
    const larga = "a".repeat(129);
    expect(validarPaso(3, { ...BASE, clave: larga, claveRepetida: larga }).clave).toBeDefined();
    const justa = "a".repeat(128);
    expect(validarPaso(3, { ...BASE, clave: justa, claveRepetida: justa }).clave).toBeUndefined();
  });

  it("el NIT ya registrado muestra el mensaje del servidor en su propio campo", () => {
    const anclado = anclarEnCampos(
      new ErrorApi({
        type: "https://sicamed.co/problemas/nit-ya-registrado",
        title: "El NIT ya está registrado en el sistema",
        detail: "Ese NIT ya tiene una solicitud en trámite.",
        status: 409,
      }),
    );
    expect(anclado.errores.nit).toBe("Ese NIT ya tiene una solicitud en trámite.");
    expect(anclado.paso).toBe(0);
  });
});
