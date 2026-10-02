import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argumentos = process.argv.slice(2);
const forzar = argumentos.includes("--forzar");
const pedidos = argumentos.filter((argumento) => !argumento.startsWith("--"));

const GUIONES = [
  { nombre: "intro", guion: "src/publico/intro/narracion.json", destino: "public/audio/intro" },
  {
    nombre: "telemedicina",
    guion: "src/shared/ui/graficos/telemedicina/narracion.json",
    destino: "public/audio/telemedicina",
  },
  {
    nombre: "cadena",
    guion: "src/shared/ui/graficos/escena/narracion.json",
    destino: "public/audio/cadena",
  },
  { nombre: "origen", guion: "src/publico/origen/narracion.json", destino: "public/audio/origen" },
  {
    nombre: "origen-en",
    guion: "src/publico/origen/narracion.en.json",
    destino: "public/audio/origen/en",
  },
];

const entorno = loadEnv("development", raiz, "OPENAI_");
const clave = process.env.OPENAI_API_KEY ?? entorno.OPENAI_API_KEY;
if (!clave) {
  console.error("Falta OPENAI_API_KEY en el entorno o en .env.local");
  process.exit(1);
}

const catalogo = readFileSync(join(raiz, "src", "shared", "api", "mock", "catalogos.ts"), "utf-8");
const departamentos = [...catalogo.matchAll(/codigo: "(\d+)", nombre: "([^"]+)"/g)].map(
  ([, codigo, nombre]) => ({ codigo, nombre }),
);

const huella = (narracion, texto) =>
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

const piezasDe = (narracion) => [
  ...narracion.lineas.map((linea) => ({ ruta: linea.clave, texto: linea.texto })),
  ...(narracion.departamento
    ? departamentos.map(({ codigo, nombre }) => ({
        ruta: `departamentos/${codigo}`,
        texto: narracion.departamento.plantilla.replace(
          "{nombre}",
          narracion.departamento.pronunciacion?.[codigo] ?? nombre,
        ),
      }))
    : []),
];

const sintetizar = async (narracion, texto) => {
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

const generar = async ({ nombre, guion, destino: carpeta }) => {
  const narracion = JSON.parse(readFileSync(join(raiz, guion), "utf-8"));
  const destino = join(raiz, carpeta);
  const rutaManifiesto = join(destino, "manifiesto.json");
  const piezas = piezasDe(narracion);
  const manifiesto = existsSync(rutaManifiesto)
    ? JSON.parse(readFileSync(rutaManifiesto, "utf-8"))
    : {};

  let generadas = 0;
  for (const pieza of piezas) {
    const archivo = join(destino, `${pieza.ruta}.mp3`);
    const firma = huella(narracion, pieza.texto);
    if (!forzar && existsSync(archivo) && manifiesto[pieza.ruta]?.huella === firma) continue;
    mkdirSync(dirname(archivo), { recursive: true });
    const audio = await sintetizar(narracion, pieza.texto);
    writeFileSync(archivo, audio);
    manifiesto[pieza.ruta] = { huella: firma, texto: pieza.texto };
    generadas += 1;
    console.log(`${nombre}/${pieza.ruta}  ${Math.round(audio.length / 1024)} KB  «${pieza.texto}»`);
  }

  const ordenado = Object.fromEntries(
    Object.entries(manifiesto)
      .filter(([ruta]) => piezas.some((pieza) => pieza.ruta === ruta))
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  mkdirSync(destino, { recursive: true });
  writeFileSync(rutaManifiesto, `${JSON.stringify(ordenado, null, 2)}\n`);
  console.log(`${nombre}: ${generadas} pistas nuevas, ${piezas.length} en total`);
};

const elegidos = pedidos.length
  ? GUIONES.filter((entrada) => pedidos.includes(entrada.nombre))
  : GUIONES.filter((entrada) => existsSync(join(raiz, entrada.guion)));

for (const entrada of elegidos) await generar(entrada);
