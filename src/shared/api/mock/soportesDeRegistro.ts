import { adjuntoDeMuestra, imagenDeMuestra, pdfDeMuestra } from "./archivosDeMuestra";
import { requisitosDeActor } from "./requisitosActor";
import type {
  DescargaDeSoporte,
  SolicitudDetallada,
  SolicitudRegistro,
  SoporteDeclarado,
  SoporteSimulado,
} from "./tipos";

const MIME_WORD =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const dispersion = (texto: string): number => {
  let suma = 0;
  for (let i = 0; i < texto.length; i += 1) suma = (suma * 31 + texto.charCodeAt(i)) % 100_003;
  return suma;
};

const EXTENSIONES = ["pdf", "pdf", "png", "docx"] as const;

const extensionDelSoporte = (soporteId: string): (typeof EXTENSIONES)[number] =>
  EXTENSIONES[dispersion(soporteId) % EXTENSIONES.length] ?? "pdf";

const MIMES = {
  pdf: "application/pdf",
  png: "image/svg+xml",
  docx: MIME_WORD,
} as const;

const enMinuscula = (tipo: string): string => tipo.replace(/_/gu, "-").toLowerCase();

export const nombreDelSoporte = (tipo: string, soporteId: string): string =>
  `${enMinuscula(tipo)}.${extensionDelSoporte(soporteId)}`;

const etiquetaDelTipo = (tipo: string, tipoActor: SolicitudRegistro["tipoActor"]): string =>
  requisitosDeActor(tipoActor).documentos.find((requisito) => requisito.tipo === tipo)?.etiqueta ??
  enMinuscula(tipo).replace(/-/gu, " ");

export const detallarSolicitud = (
  solicitud: SolicitudRegistro,
  soportes: readonly SoporteSimulado[],
): SolicitudDetallada => {
  const declarados: readonly SoporteDeclarado[] = solicitud.documentos.map((documento) => {
    const guardado = soportes.find((uno) => uno.soporteId === documento.soporteId);
    return {
      tipo: documento.tipo,
      nombre: guardado?.nombre ?? nombreDelSoporte(documento.tipo, documento.soporteId),
      soporteId: documento.soporteId,
    };
  });

  return {
    ...solicitud,
    organizacionId: solicitud.expedienteId === null ? null : `ORG-${solicitud.nit.slice(0, 6)}`,
    declarados,
  };
};

const pesoDeLaUrl = (url: string): number => {
  const carga = url.slice(url.indexOf(",") + 1);
  return url.includes(";base64,") ? Math.round((carga.length * 3) / 4) : carga.length;
};

export const descargaDeSoporte = (
  solicitudId: string,
  soporteId: string,
  soportes: readonly SoporteSimulado[],
  solicitudes: readonly SolicitudRegistro[],
): DescargaDeSoporte | null => {
  const solicitud = solicitudes.find((una) => una.id === solicitudId);
  const documento = solicitud?.documentos.find((uno) => uno.soporteId === soporteId);
  if (!solicitud || !documento || soporteId === "") return null;

  const guardado = soportes.find((uno) => uno.soporteId === soporteId);
  const tipo = guardado?.tipo ?? documento.tipo;
  const titulo = etiquetaDelTipo(tipo, solicitud.tipoActor);
  const nombre = guardado?.nombre ?? nombreDelSoporte(tipo, soporteId);
  const mime =
    guardado?.mime && guardado.mime !== "application/octet-stream"
      ? guardado.mime
      : MIMES[extensionDelSoporte(soporteId)];
  const expiraEn = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const publicada = (url: string, tipoReal: string): DescargaDeSoporte => ({
    soporteId,
    url,
    nombre,
    mime: tipoReal,
    bytes: guardado?.bytes || pesoDeLaUrl(url),
    expiraEn,
  });

  if (mime.startsWith("image/")) {
    return publicada(
      imagenDeMuestra(titulo.slice(0, 46), solicitud.nit.slice(0, 9), dispersion(soporteId) % 360),
      "image/svg+xml",
    );
  }

  if (mime === "application/pdf") {
    return publicada(
      pdfDeMuestra(titulo.slice(0, 60), [
        `Organizacion: ${solicitud.organizacion}`,
        `NIT: ${solicitud.nit}`,
        `Representante: ${solicitud.representante}`,
        `Soporte: ${soporteId}`,
        "",
        "Documento de demostracion generado por el simulador de SICAMED.",
        "En el servidor real aqui viaja el archivo que adjunto quien radico.",
      ]),
      mime,
    );
  }

  return publicada(adjuntoDeMuestra(nombreDelSoporte(tipo, soporteId), mime), mime);
};
