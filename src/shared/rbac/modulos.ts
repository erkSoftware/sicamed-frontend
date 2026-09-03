import type { NombreIcono } from "../ui/primitivos/Icono";

export type IdModulo =
  | "centro"
  | "actores"
  | "cultivo"
  | "inventario"
  | "mercado"
  | "cumplimiento"
  | "plataforma"
  | "salud"
  | "dispensacion";

export type Modulo = {
  id: IdModulo;
  etiqueta: string;
  rotulo: string;
  descripcion: string;
  icono: NombreIcono;
  zona: "comercial" | "clinica" | "dispensacion";
};

export const MODULOS: readonly Modulo[] = [
  {
    id: "centro",
    etiqueta: "Centro",
    rotulo: "Centro de operación",
    descripcion: "Estado del ecosistema e indicadores consolidados",
    icono: "tablero",
    zona: "comercial",
  },
  {
    id: "actores",
    etiqueta: "Actores",
    rotulo: "Actores y organizaciones",
    descripcion: "Directorio del ecosistema y ficha de la organización",
    icono: "organizacion",
    zona: "comercial",
  },
  {
    id: "cultivo",
    etiqueta: "Cultivo",
    rotulo: "Producción y origen",
    descripcion: "Cultivos, plantas, variedades y beneficio",
    icono: "hoja",
    zona: "comercial",
  },
  {
    id: "inventario",
    etiqueta: "Inventario",
    rotulo: "Producto e inventario",
    descripcion: "Lotes de producto terminado y movimientos",
    icono: "inventario",
    zona: "comercial",
  },
  {
    id: "mercado",
    etiqueta: "Mercado",
    rotulo: "Vitrina y encadenamiento",
    descripcion: "Oferta divulgada, contactos habilitados y ruedas",
    icono: "vitrina",
    zona: "comercial",
  },
  {
    id: "cumplimiento",
    etiqueta: "Cumplimiento",
    rotulo: "Atestaciones y evidencia",
    descripcion: "Licencias, expedientes y ledger de trazabilidad",
    icono: "escudo",
    zona: "comercial",
  },
  {
    id: "plataforma",
    etiqueta: "Plataforma",
    rotulo: "Interoperabilidad y gobierno",
    descripcion: "Conexiones externas y políticas de verificación",
    icono: "mundo",
    zona: "comercial",
  },
  {
    id: "dispensacion",
    etiqueta: "Dispensación",
    rotulo: "Punto de dispensación",
    descripcion: "Verificación de credencial y entrega presencial en farmacia",
    icono: "candado",
    zona: "dispensacion",
  },
  {
    id: "salud",
    etiqueta: "Telemedicina",
    rotulo: "Zona clínica",
    descripcion: "Pacientes, agenda y teleconsulta",
    icono: "medico",
    zona: "clinica",
  },
];

export const MODULO_INICIAL: IdModulo = "centro";

export const moduloDe = (id: string | undefined): Modulo | undefined =>
  MODULOS.find((modulo) => modulo.id === id);
