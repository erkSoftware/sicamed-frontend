import { describe, expect, it } from "vitest";
import { servidorMock } from "./servidorMock";
import { ErrorApi } from "../problemDetails";

describe("publicarOferta", () => {
  const borrador = {
    organizacionId: "ORG-0046",
    tipoProducto: "Aceite estandarizado CBD",
    titulo: "Aceite estandarizado CBD — prueba",
    departamento: "Cundinamarca",
    municipio: "Bogotá D.C.",
    disponibilidad: "INMEDIATA",
    descripcion: "Descripción de prueba con longitud suficiente para validar el formulario.",
  };

  it("rechaza la publicacion cuando la organizacion no tiene atestacion vigente", async () => {
    await expect(servidorMock.publicarOferta(borrador)).rejects.toBeInstanceOf(ErrorApi);
  });

  it("el rechazo cita la norma que lo fundamenta", async () => {
    await servidorMock.publicarOferta(borrador).catch((error: unknown) => {
      expect(error).toBeInstanceOf(ErrorApi);
      const problema = (error as ErrorApi).problema;
      expect(problema.status).toBe(422);
      expect(problema.norma).toBe("Res. 1241/2026 Art. 13b");
      expect(problema.title).toContain("falta de habilitación vigente");
      expect(problema.accion?.ruta).toBe("/app/licencias");
    });
  });

  it("acepta la publicacion de una organizacion con atestacion vigente", async () => {
    const resultado = await servidorMock.publicarOferta({
      ...borrador,
      organizacionId: "ORG-0006",
      tipoProducto: "Flor seca no psicoactiva",
    });
    expect(resultado.estado).toBe("PUBLICADA");
  });
});

describe("separacion de zonas", () => {
  it("el directorio comercial nunca devuelve pacientes, solo su total agregado", async () => {
    const directorio = await servidorMock.directorio("");
    expect(directorio).not.toHaveProperty("pacientes");
    expect(directorio.totales.pacientes).toBeGreaterThan(0);
  });
});
