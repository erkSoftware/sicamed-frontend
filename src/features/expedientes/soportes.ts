export type ClaseDeVista = "imagen" | "pdf" | "sin-vista";

const IMAGENES: readonly string[] = ["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "svg"];

const MOTIVOS: Readonly<Record<string, string>> = {
  doc: "Los documentos de Word no se dibujan dentro del navegador.",
  docx: "Los documentos de Word no se dibujan dentro del navegador.",
  odt: "Los documentos de OpenDocument no se dibujan dentro del navegador.",
  rtf: "Los documentos con formato enriquecido no se dibujan dentro del navegador.",
  xls: "Las hojas de cálculo no se dibujan dentro del navegador.",
  xlsx: "Las hojas de cálculo no se dibujan dentro del navegador.",
  ods: "Las hojas de cálculo no se dibujan dentro del navegador.",
  ppt: "Las presentaciones no se dibujan dentro del navegador.",
  pptx: "Las presentaciones no se dibujan dentro del navegador.",
  zip: "Es un archivo comprimido: hay que abrirlo fuera para ver qué trae.",
  rar: "Es un archivo comprimido: hay que abrirlo fuera para ver qué trae.",
  "7z": "Es un archivo comprimido: hay que abrirlo fuera para ver qué trae.",
};

export const extensionDe = (nombre: string): string => {
  const limpio = (nombre.split(/[?#]/u)[0] ?? "").trim();
  const punto = limpio.lastIndexOf(".");
  return punto <= 0 ? "" : limpio.slice(punto + 1).toLowerCase();
};

export const claseDeVista = (nombre: string, mime = ""): ClaseDeVista => {
  const declarado = mime.trim().toLowerCase().split(";")[0] ?? "";
  if (declarado.startsWith("image/")) return "imagen";
  if (declarado === "application/pdf") return "pdf";
  if (declarado !== "" && declarado !== "application/octet-stream") return "sin-vista";

  const extension = extensionDe(nombre);
  if (IMAGENES.includes(extension)) return "imagen";
  return extension === "pdf" ? "pdf" : "sin-vista";
};

export const motivoSinVista = (nombre: string, mime = ""): string => {
  const porExtension = MOTIVOS[extensionDe(nombre)];
  if (porExtension) return porExtension;
  const declarado = mime.trim().toLowerCase();
  if (declarado.startsWith("video/")) return "El vídeo no se reproduce desde la ficha.";
  if (declarado.startsWith("audio/")) return "El audio no se reproduce desde la ficha.";
  return "Este formato no se puede mostrar dentro del navegador.";
};

export const pesoLegible = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / 1_048_576).toFixed(1).replace(".", ",")} MB`;
};

export const etiquetaDeTipo = (tipo: string): string => {
  const palabras = tipo.replace(/[-_]+/gu, " ").trim().toLowerCase();
  return palabras === "" ? "Soporte" : palabras.charAt(0).toUpperCase() + palabras.slice(1);
};

export const etiquetaDeclarada = (
  tipo: string,
  catalogo: readonly { tipo: string; etiqueta: string }[],
): string =>
  catalogo.find((requisito) => requisito.tipo === tipo)?.etiqueta ?? etiquetaDeTipo(tipo);
