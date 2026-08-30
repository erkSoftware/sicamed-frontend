import { afterEach, describe, expect, it } from "vitest";
import { almacen, fijarAlmacenPropio, reiniciarAlmacen, usaAlmacenPropio } from "./almacen";
import { servidorMock } from "./servidorMock";
import { aProblema, esCuentaSinOrganizacion } from "../problemDetails";

const LECTURAS: readonly (keyof typeof servidorMock)[] = [
  "indicadoresNacionales",
  "organizaciones",
  "atestaciones",
  "cultivos",
  "lotes",
  "ofertas",
  "eventos",
  "ruedas",
  "plantas",
  "variedades",
  "beneficios",
  "expedientes",
  "cierres",
  "conexiones",
  "cuentas",
  "cupos",
  "transformaciones",
  "destrucciones",
  "solicitudes",
  "medicos",
];

afterEach(() => {
  fijarAlmacenPropio(false);
  reiniciarAlmacen();
});

describe("la cuenta propia no hereda los datos de demostracion", () => {
  it("el almacen sembrado trae el ecosistema completo", () => {
    expect(almacen.organizaciones.length).toBeGreaterThan(0);
    expect(almacen.lotes.length).toBeGreaterThan(0);
    expect(usaAlmacenPropio()).toBe(false);
  });

  it("una sesion real arranca con todas las colecciones vacias", () => {
    fijarAlmacenPropio(true);
    expect(almacen.organizaciones).toEqual([]);
    expect(almacen.lotes).toEqual([]);
    expect(almacen.cultivos).toEqual([]);
    expect(almacen.expedientes).toEqual([]);
    expect(almacen.eventos).toEqual([]);
  });

  it("el listado del simulador tambien sale vacio, no a medias", async () => {
    fijarAlmacenPropio(true);
    const pagina = await servidorMock.organizaciones({});
    expect(pagina.total).toBe(0);
    expect(pagina.datos).toEqual([]);
  });

  it("lo que escribe la cuenta propia no contamina la demostracion ni al reves", () => {
    const sembradas = almacen.organizaciones.length;
    fijarAlmacenPropio(true);
    almacen.cultivos.push({ id: "CUL-PROPIO" } as (typeof almacen.cultivos)[number]);
    expect(almacen.cultivos).toHaveLength(1);
    fijarAlmacenPropio(false);
    expect(almacen.cultivos.some((cultivo) => cultivo.id === "CUL-PROPIO")).toBe(false);
    expect(almacen.organizaciones).toHaveLength(sembradas);
  });

  it("ninguna consulta del simulador revienta con las colecciones vacias", async () => {
    fijarAlmacenPropio(true);
    const respuestas = await Promise.all(
      LECTURAS.map((nombre) => (servidorMock[nombre] as () => Promise<unknown>)()),
    );
    for (const [indice, respuesta] of respuestas.entries())
      expect(respuesta, LECTURAS[indice]).toBeDefined();
  });

  it("una cuenta sin organizacion recibe el problema del contrato, no una ficha ajena", async () => {
    fijarAlmacenPropio(true);
    const error = await servidorMock.organizacionActual().catch((fallo: unknown) => fallo);
    expect(esCuentaSinOrganizacion(aProblema(error))).toBe(true);
  });
});
