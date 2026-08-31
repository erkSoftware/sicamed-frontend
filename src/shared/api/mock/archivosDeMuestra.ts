const sinAcentos = (texto: string): string =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").replace(/[^\u0020-\u007e]/gu, "");

const escaparPdf = (texto: string): string =>
  sinAcentos(texto).replace(/([\\()])/gu, "\\$1");

const objetosDelPdf = (titulo: string, lineas: readonly string[]): readonly string[] => {
  const contenido = [
    "BT /F1 20 Tf 60 770 Td (" + escaparPdf(titulo) + ") Tj ET",
    ...lineas.map(
      (linea, i) => "BT /F1 11 Tf 60 " + (720 - i * 24) + " Td (" + escaparPdf(linea) + ") Tj ET",
    ),
    "1 w 60 745 m 535 745 l S",
  ].join("\n");

  return [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>",
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
    "<</Length " + contenido.length + ">>\nstream\n" + contenido + "\nendstream",
  ];
};

export const pdfDeMuestra = (titulo: string, lineas: readonly string[]): string => {
  const objetos = objetosDelPdf(titulo, lineas);
  let documento = "%PDF-1.4\n";
  const posiciones: number[] = [];

  objetos.forEach((cuerpo, i) => {
    posiciones.push(documento.length);
    documento += `${i + 1} 0 obj\n${cuerpo}\nendobj\n`;
  });

  const inicioTabla = documento.length;
  documento += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const posicion of posiciones) {
    documento += `${String(posicion).padStart(10, "0")} 00000 n \n`;
  }
  documento += `trailer\n<</Size ${objetos.length + 1}/Root 1 0 R>>\nstartxref\n${inicioTabla}\n%%EOF`;

  return `data:application/pdf;base64,${btoa(documento)}`;
};

export const imagenDeMuestra = (titulo: string, sello: string, matiz: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1160" width="900" height="1160">
  <rect width="900" height="1160" fill="#f4f2ec"/>
  <rect x="40" y="40" width="820" height="1080" fill="#ffffff" stroke="#d9d5c9"/>
  <rect x="40" y="40" width="820" height="86" fill="hsl(${matiz} 34% 27%)"/>
  <text x="76" y="94" font-family="Georgia, serif" font-size="30" fill="#ffffff">${titulo}</text>
  ${Array.from({ length: 16 }, (_, i) => {
    const ancho = 300 + ((i * 137) % 420);
    return `<rect x="76" y="${190 + i * 44}" width="${ancho}" height="12" rx="6" fill="#e4e0d6"/>`;
  }).join("\n  ")}
  <circle cx="700" cy="930" r="92" fill="none" stroke="hsl(${matiz} 40% 35%)" stroke-width="5"/>
  <circle cx="700" cy="930" r="76" fill="none" stroke="hsl(${matiz} 40% 35%)" stroke-width="2"/>
  <text x="700" y="925" text-anchor="middle" font-family="Georgia, serif" font-size="21" fill="hsl(${matiz} 40% 35%)">${sello}</text>
  <text x="700" y="952" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="hsl(${matiz} 40% 35%)">SICAMED</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const adjuntoDeMuestra = (nombre: string, mime: string): string =>
  `data:${mime};base64,${btoa(sinAcentos(`Archivo de demostracion: ${nombre}`))}`;
