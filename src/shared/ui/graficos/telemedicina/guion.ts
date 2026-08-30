export type FaseRecorrido =
  "reposo" | "colombia" | "region" | "cultivo" | "laboratorio" | "ips" | "paciente" | "cierre";

export type Tramo = {
  fase: FaseRecorrido;
  duracion: number;
};

export type Rotulo = {
  indicador: string;
  titulo: string;
  subtitulo: string;
};

export const TRAMOS: readonly Tramo[] = [
  { fase: "colombia", duracion: 2600 },
  { fase: "region", duracion: 2200 },
  { fase: "cultivo", duracion: 3200 },
  { fase: "laboratorio", duracion: 3200 },
  { fase: "ips", duracion: 3200 },
  { fase: "paciente", duracion: 3000 },
  { fase: "cierre", duracion: 3800 },
];

export const DURACION_TOTAL = TRAMOS.reduce((suma, tramo) => suma + tramo.duracion, 0);

export const inicioDe = (fase: FaseRecorrido): number => {
  let suma = 0;
  for (const tramo of TRAMOS) {
    if (tramo.fase === fase) return suma;
    suma += tramo.duracion;
  }
  return 0;
};

export const faseEn = (transcurrido: number): FaseRecorrido => {
  let suma = 0;
  for (const tramo of TRAMOS) {
    suma += tramo.duracion;
    if (transcurrido < suma) return tramo.fase;
  }
  return "cierre";
};

export const avanceEn = (transcurrido: number, fase: FaseRecorrido): number => {
  const tramo = TRAMOS.find((candidato) => candidato.fase === fase);
  if (!tramo) return 0;
  const dentro = (transcurrido - inicioDe(fase)) / tramo.duracion;
  return Math.min(1, Math.max(0, dentro));
};

export const ROTULOS: Record<FaseRecorrido, Rotulo> = {
  reposo: {
    indicador: "Trazabilidad nacional",
    titulo: "Cannabis medicinal en Colombia",
    subtitulo: "Un recorrido desde el territorio hasta el paciente.",
  },
  colombia: {
    indicador: "Colombia",
    titulo: "Cannabis medicinal en Colombia",
    subtitulo: "Un recorrido desde el territorio hasta el paciente.",
  },
  region: {
    indicador: "Tu región",
    titulo: "El recorrido empieza donde estás",
    subtitulo: "Cada departamento reporta al mismo sistema de trazabilidad.",
  },
  cultivo: {
    indicador: "Cultivo",
    titulo: "Del cultivo nace la materia prima.",
    subtitulo: "Siembra, control agronómico y recolección con licencia vigente.",
  },
  laboratorio: {
    indicador: "Laboratorio",
    titulo: "Ciencia y precisión transforman cada componente.",
    subtitulo: "Extracción, análisis y control de calidad sobre cada lote.",
  },
  ips: {
    indicador: "IPS",
    titulo: "Del laboratorio a la atención médica.",
    subtitulo: "Consulta, valoración clínica y formulación por profesional habilitado.",
  },
  paciente: {
    indicador: "Paciente",
    titulo: "Una cadena trazable hasta el paciente.",
    subtitulo: "Entrega, seguimiento y farmacovigilancia con historia verificable.",
  },
  cierre: {
    indicador: "SICAMED",
    titulo: "Cannabis medicinal. Trazabilidad de principio a fin.",
    subtitulo: "Cultivo, laboratorio, IPS y paciente en un solo histórico.",
  },
};

export type Eslabon = {
  fase: FaseRecorrido;
  nombre: string;
};

export const ESLABONES: readonly Eslabon[] = [
  { fase: "cultivo", nombre: "Cultivo" },
  { fase: "laboratorio", nombre: "Laboratorio" },
  { fase: "ips", nombre: "IPS" },
  { fase: "paciente", nombre: "Paciente" },
];

export type Encuadre = {
  escala: number;
  centrado: boolean;
  radar: boolean;
};

export const ENCUADRES: Record<FaseRecorrido, Encuadre> = {
  reposo: { escala: 1.02, centrado: false, radar: true },
  colombia: { escala: 1.06, centrado: false, radar: true },
  region: { escala: 2.3, centrado: true, radar: true },
  cultivo: { escala: 5.2, centrado: true, radar: false },
  laboratorio: { escala: 6.4, centrado: true, radar: false },
  ips: { escala: 6.4, centrado: true, radar: false },
  paciente: { escala: 5.6, centrado: true, radar: false },
  cierre: { escala: 1.06, centrado: false, radar: true },
};
