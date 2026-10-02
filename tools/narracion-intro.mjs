import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(raiz, "public", "audio", "intro");
const rutaManifiesto = join(destino, "manifiesto.json");
const forzar = process.argv.includes("--forzar");

const entorno = loadEnv("development", raiz, "OPENAI_");
const clave = process.env.OPENAI_API_KEY ?? entorno.OPENAI_API_KEY;
if (!clave) {
  console.error("Falta OPENAI_API_KEY en el entorno o en .env.local");
  process.exit(1);
}

const narracion = JSON.parse(
  readFileSync(join(raiz, "src", "publico", "intro", "narracion.json"), "utf-8"),
);

const catalogo = readFileSync(join(raiz, "src", "shared", "api", "mock", "catalogos.ts"), "utf-8");
const departamentos = [...catalogo.matchAll(/codigo: "(\d+)", nombre: "([^"]+)"/g)].map(
  ([, codigo, nombre]) => ({ codigo, nombre }),
);

const huella = (texto) =>
  createHash("sha256")
    .update(
      JSON.stringify({
        modelo: narracion.modelo,
        voz: narracion.voz,
        instrucciones: narracion.instrucciones,
        texto,
      }),
    )
    .digest("hex")
    .slice(0, 16);

const piezas = [
  ...narracion.lineas.map((linea) => ({ ruta: linea.clave, texto: linea.texto })),
  ...departamentos.map(({ codigo, nombre }) => ({
    ruta: `departamentos/${codigo}`,
    texto: narracion.departamento.plantilla.replace(
      "{nombre}",
      narracion.departamento.pronunciacion[codigo] ?? nombre,
    ),
  })),
];

const manifiesto = existsSync(rutaManifiesto)
  ? JSON.parse(readFileSync(rutaManifiesto, "utf-8"))
  : {};

const sintetizar = async (texto) => {
  const respuesta = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: narracion.modelo,
      voice: narracion.voz,
      input: texto,
      instructions: narracion.instrucciones,
      response_format: "mp3",
    }),
  });
  if (!respuesta.ok) throw new Error(`${respuesta.status} ${await respuesta.text()}`);
  return Buffer.from(await respuesta.arrayBuffer());
};

let generadas = 0;
for (const pieza of piezas) {
  const archivo = join(destino, `${pieza.ruta}.mp3`);
  const firma = huella(pieza.texto);
  if (!forzar && existsSync(archivo) && manifiesto[pieza.ruta]?.huella === firma) continue;
  mkdirSync(dirname(archivo), { recursive: true });
  const audio = await sintetizar(pieza.texto);
  writeFileSync(archivo, audio);
  manifiesto[pieza.ruta] = { huella: firma, texto: pieza.texto };
  generadas += 1;
  console.log(`${pieza.ruta}  ${Math.round(audio.length / 1024)} KB  «${pieza.texto}»`);
}

const ordenado = Object.fromEntries(
  Object.entries(manifiesto)
    .filter(([ruta]) => piezas.some((pieza) => pieza.ruta === ruta))
    .sort(([a], [b]) => a.localeCompare(b)),
);
writeFileSync(rutaManifiesto, `${JSON.stringify(ordenado, null, 2)}\n`);
console.log(`${generadas} pistas nuevas, ${piezas.length} en total`);
