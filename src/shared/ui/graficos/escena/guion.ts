export type Rama = "laboratorio" | "ips" | "exportacion";

export type Fase =
  | "finca-reposo"
  | "finca-hacia-bulto"
  | "finca-agarrar"
  | "finca-hacia-camion"
  | "finca-montar"
  | "finca-regreso"
  | "viaje-bodega"
  | "bodega-llegada"
  | "bodega-escaneo"
  | "bodega-registro"
  | "bodega-descarga"
  | "viaje-muelle"
  | "salidas-reposo"
  | "rama-transito"
  | "rama-obra"
  | "rama-sello"
  | "cierre";

export const CUPO = 4;

export const ORDEN: readonly Fase[] = [
  "finca-reposo",
  "finca-hacia-bulto",
  "finca-agarrar",
  "finca-hacia-camion",
  "finca-montar",
  "finca-regreso",
  "viaje-bodega",
  "bodega-llegada",
  "bodega-escaneo",
  "bodega-registro",
  "bodega-descarga",
  "viaje-muelle",
  "salidas-reposo",
  "rama-transito",
  "rama-obra",
  "rama-sello",
  "cierre",
];

export const DURACION: Record<Fase, number> = {
  "finca-reposo": 0,
  "finca-hacia-bulto": 620,
  "finca-agarrar": 520,
  "finca-hacia-camion": 1150,
  "finca-montar": 640,
  "finca-regreso": 880,
  "viaje-bodega": 2600,
  "bodega-llegada": 1100,
  "bodega-escaneo": 2400,
  "bodega-registro": 3000,
  "bodega-descarga": 2100,
  "viaje-muelle": 2200,
  "salidas-reposo": 0,
  "rama-transito": 1400,
  "rama-obra": 2200,
  "rama-sello": 1300,
  cierre: 0,
};

const CAMARA_BASE: Record<Fase, number> = {
  "finca-reposo": 0,
  "finca-hacia-bulto": 0,
  "finca-agarrar": 0,
  "finca-hacia-camion": 0,
  "finca-montar": 0,
  "finca-regreso": 0,
  "viaje-bodega": 640,
  "bodega-llegada": 640,
  "bodega-escaneo": 640,
  "bodega-registro": 640,
  "bodega-descarga": 640,
  "viaje-muelle": 1250,
  "salidas-reposo": 1250,
  "rama-transito": 1250,
  "rama-obra": 1250,
  "rama-sello": 1250,
  cierre: 1250,
};

const CAMARA_RAMA: Record<Rama, number> = {
  laboratorio: 1220,
  ips: 1290,
  exportacion: 1600,
};

export const camaraDe = (fase: Fase, rama: Rama | null): number => {
  if (rama && (fase === "rama-obra" || fase === "rama-sello" || fase === "cierre"))
    return CAMARA_RAMA[rama];
  return CAMARA_BASE[fase];
};

export const CAMION_EN_BODEGA = 640;

export const PILA = [
  { x: 154, y: 412 },
  { x: 190, y: 446 },
  { x: 154, y: 446 },
  { x: 118, y: 446 },
];

export const BODEGA_RANURAS = [
  { x: 388, y: 400 },
  { x: 422, y: 400 },
  { x: 456, y: 400 },
  { x: 490, y: 400 },
];

export const POSICION_CAMPESINO: Record<Fase, number> = {
  "finca-reposo": 250,
  "finca-hacia-bulto": 206,
  "finca-agarrar": 206,
  "finca-hacia-camion": 338,
  "finca-montar": 338,
  "finca-regreso": 250,
  "viaje-bodega": 250,
  "bodega-llegada": 250,
  "bodega-escaneo": 250,
  "bodega-registro": 250,
  "bodega-descarga": 250,
  "viaje-muelle": 250,
  "salidas-reposo": 250,
  "rama-transito": 250,
  "rama-obra": 250,
  "rama-sello": 250,
  cierre: 250,
};

export const ANDANDO: readonly Fase[] = ["finca-hacia-bulto", "finca-hacia-camion", "finca-regreso"];

export type ClaveSello =
  | "origen"
  | "custodia"
  | "acopio"
  | "laboratorio"
  | "ips"
  | "exportacion"
  | "cierre";

export const SELLOS: Record<ClaveSello, { titulo: string; detalle: string }> = {
  origen: {
    titulo: "Origen declarado",
    detalle: "Finca con licencia vigente · cuatro bultos pesados y sellados",
  },
  custodia: {
    titulo: "Custodia transferida",
    detalle: "Transportador habilitado · guía asociada al lote",
  },
  acopio: {
    titulo: "Lote registrado en SICAMED",
    detalle: "Centro de acopio · huella encadenada al evento anterior",
  },
  laboratorio: {
    titulo: "Transformación bajo licencia",
    detalle: "Laboratorio autorizado · producto terminado con lote propio",
  },
  ips: {
    titulo: "Fórmula asociada al paciente",
    detalle: "IPS habilitada · entrega confirmada con firma en destino",
  },
  exportacion: {
    titulo: "Salida internacional",
    detalle: "Contenedor precintado · certificado de origen y guía",
  },
  cierre: {
    titulo: "Cadena completa",
    detalle: "El MinCIT y SICAMED leen el mismo histórico, evento por evento",
  },
};

export const RELATO: Record<Fase, string> = {
  "finca-reposo": "Toca la mano del campesino para registrar un bulto",
  "finca-hacia-bulto": "Bulto identificado en el patio de la finca",
  "finca-agarrar": "Biomasa pesada y sellada · lote con origen declarado",
  "finca-hacia-camion": "Custodia asignada al transportador habilitado",
  "finca-montar": "Bulto montado · el evento queda en la cadena",
  "finca-regreso": "Evento sellado · nadie puede reescribir lo anterior",
  "viaje-bodega": "La remesa sale de la finca hacia el centro de acopio",
  "bodega-llegada": "Llegada a la bodega registrada ante el INVIMA",
  "bodega-escaneo": "Lectura del precinto · se compara con lo declarado en origen",
  "bodega-registro": "SICAMED sella el lote y lo encadena al evento anterior",
  "bodega-descarga": "Descargue verificado · el lote queda disponible",
  "viaje-muelle": "El lote sale hacia quien lo va a recibir",
  "salidas-reposo": "Elige quién recibe el lote: laboratorio, IPS o exportación",
  "rama-transito": "Entrega en curso · la custodia cambia de manos",
  "rama-obra": "Recepción confirmada por el actor habilitado",
  "rama-sello": "Evento sellado con la huella del anterior",
  cierre: "Toda la ruta quedó registrada. Toca para verla otra vez.",
};

export const RELATO_RAMA: Record<Rama, Partial<Record<Fase, string>>> = {
  laboratorio: {
    "rama-transito": "El lote entra al laboratorio autorizado",
    "rama-obra": "Transformación bajo licencia · nace un producto terminado",
    "rama-sello": "Nuevo lote encadenado al origen en la finca",
  },
  ips: {
    "rama-transito": "El lote entra a la IPS habilitada",
    "rama-obra": "Fórmula asociada al paciente en tratamiento",
    "rama-sello": "Entrega confirmada con firma en destino",
  },
  exportacion: {
    "rama-transito": "El lote llega al muelle de exportación",
    "rama-obra": "Contenedor precintado con la trazabilidad completa",
    "rama-sello": "Salida internacional con certificado de origen",
  },
};

export const OPCIONES: readonly { clave: Rama; x: number; etiqueta: string; ayuda: string }[] = [
  { clave: "laboratorio", x: 1400, etiqueta: "Laboratorio", ayuda: "Transformar el lote en producto terminado" },
  { clave: "ips", x: 1560, etiqueta: "IPS", ayuda: "Entregar el lote a una institución prestadora de salud" },
  { clave: "exportacion", x: 1720, etiqueta: "Exportación", ayuda: "Enviar el lote a un comprador internacional" },
];

export const ritmo = (valor: number, sobrio: boolean): number =>
  sobrio ? Math.max(180, Math.round(valor / 3)) : valor;
