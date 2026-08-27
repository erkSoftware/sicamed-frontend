import type { EstadoOferta, Oferta } from "../../../shared/api/mock/tipos";
import type { TonoInsignia } from "../../../shared/ui/primitivos/Insignia";

export type OfertaVista = {
  id: string;
  titulo: string;
  organizacion: string;
  ubicacion: string;
  tipoProducto: string;
  estado: EstadoOferta;
  etiquetaEstado: string;
  tonoEstado: TonoInsignia;
  publicada: string;
  vigencia: string;
  interesados: number;
  certificaciones: readonly string[];
  descripcion: string;
};

const ETIQUETAS: Record<EstadoOferta, { texto: string; tono: TonoInsignia }> = {
  PUBLICADA: { texto: "Publicada", tono: "exito" },
  BORRADOR: { texto: "Borrador", tono: "neutro" },
  RECHAZADA: { texto: "Rechazada", tono: "peligro" },
  CERRADA: { texto: "Cerrada", tono: "neutro" },
  SUSPENDIDA: { texto: "Suspendida", tono: "alerta" },
};

export const aOfertaVista = (oferta: Oferta): OfertaVista => ({
  id: oferta.id,
  titulo: oferta.titulo,
  organizacion: oferta.organizacion,
  ubicacion: `${oferta.municipio}, ${oferta.departamento}`,
  tipoProducto: oferta.tipoProducto,
  estado: oferta.estado,
  etiquetaEstado: ETIQUETAS[oferta.estado].texto,
  tonoEstado: ETIQUETAS[oferta.estado].tono,
  publicada: oferta.publicada,
  vigencia: oferta.vigencia,
  interesados: oferta.interesados,
  certificaciones: oferta.certificaciones,
  descripcion: oferta.descripcion,
});
