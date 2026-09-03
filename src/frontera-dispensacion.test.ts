import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = process.cwd();

const ZONA_DE_MOSTRADOR: readonly string[] = [
  join("src", "features", "dispensacion"),
  join("src", "shared", "dispensacion", "metodos.ts"),
  join("src", "shared", "api", "mock", "datosDispensacion.ts"),
  join("src", "shared", "api", "clienteDispensacion.ts"),
];

const IDENTIFICADORES_DE_PACIENTE = [
  "pacienteId",
  "nombrePaciente",
  "documentoPaciente",
  "historiaClinica",
  "diagnostico",
  "codigoDiagnostico",
];

const MODULOS_CLINICOS = ["datosClinicos", "clienteClinico", "features-salud"];

const EXTENSIONES = new Set([".ts", ".tsx"]);

const archivos = (ruta: string): readonly string[] => {
  const absoluta = join(RAIZ, ruta);
  if (!statSync(absoluta).isDirectory()) return EXTENSIONES.has(extname(absoluta)) ? [absoluta] : [];
  return readdirSync(absoluta).flatMap((entrada) => archivos(join(ruta, entrada)));
};

const FUENTES = ZONA_DE_MOSTRADOR.flatMap(archivos);

describe("frontera de identidad de la zona de dispensación", () => {
  it("cubre los archivos del mostrador", () => {
    expect(FUENTES.length).toBeGreaterThan(3);
  });

  it("ningún archivo del mostrador nombra un identificador de paciente", () => {
    const hallazgos: string[] = [];
    for (const ruta of FUENTES) {
      const contenido = readFileSync(ruta, "utf-8");
      for (const identificador of IDENTIFICADORES_DE_PACIENTE) {
        if (contenido.includes(identificador)) hallazgos.push(`${ruta}: ${identificador}`);
      }
    }
    expect(hallazgos).toEqual([]);
  });

  it("ningún archivo del mostrador importa un módulo de la zona clínica", () => {
    const hallazgos: string[] = [];
    for (const ruta of FUENTES) {
      const contenido = readFileSync(ruta, "utf-8");
      for (const modulo of MODULOS_CLINICOS) {
        if (contenido.includes(`from "`) && contenido.includes(modulo))
          hallazgos.push(`${ruta}: ${modulo}`);
      }
    }
    expect(hallazgos).toEqual([]);
  });
});
