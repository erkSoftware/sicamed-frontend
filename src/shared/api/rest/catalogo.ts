import type { TipoAtestacion, TipoCannabis } from "../mock/tipos";

export type ResumenCultivo = {
  nombre: string;
  departamento: string;
  variedadId: string;
};

export type ResumenVariedad = {
  nombre: string;
  tipo: TipoCannabis;
};

export type Catalogo = {
  organizaciones?: ReadonlyMap<string, string>;
  cultivos?: ReadonlyMap<string, ResumenCultivo>;
  variedades?: ReadonlyMap<string, ResumenVariedad>;
  agroinsumos?: ReadonlyMap<string, string>;
  lotes?: ReadonlyMap<string, string>;
  ofertas?: ReadonlyMap<string, string>;
  modalidades?: ReadonlyMap<string, TipoAtestacion>;
};

export const CATALOGO_VACIO: Catalogo = {};

export const nombreDe = (mapa: ReadonlyMap<string, string> | undefined, id: string): string =>
  mapa?.get(id) ?? id;

export const cultivoDe = (catalogo: Catalogo, id: string): ResumenCultivo => ({
  nombre: catalogo.cultivos?.get(id)?.nombre ?? id,
  departamento: catalogo.cultivos?.get(id)?.departamento ?? "",
  variedadId: catalogo.cultivos?.get(id)?.variedadId ?? "",
});

export const variedadDe = (catalogo: Catalogo, id: string): ResumenVariedad =>
  catalogo.variedades?.get(id) ?? { nombre: id, tipo: "NO_PSICOACTIVO" };
