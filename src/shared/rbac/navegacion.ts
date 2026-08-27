import type { Permiso } from "../auth/tipos";

export type ItemNavegacion = {
  ruta: string;
  etiqueta: string;
  permiso: Permiso;
  grupo: "OPERACIÓN" | "GESTIÓN" | "CUMPLIMIENTO" | "SALUD";
  icono: string;
  zona: "comercial" | "clinica";
};

export const NAVEGACION: readonly ItemNavegacion[] = [
  { ruta: "/app", etiqueta: "Tablero", permiso: "reportes:tablero:leer", grupo: "OPERACIÓN", icono: "tablero", zona: "comercial" },
  { ruta: "/app/directorio", etiqueta: "Directorio de actores", permiso: "directorio:actor:leer", grupo: "OPERACIÓN", icono: "directorio", zona: "comercial" },
  { ruta: "/app/vitrina", etiqueta: "Vitrina", permiso: "vitrina:oferta:leer", grupo: "OPERACIÓN", icono: "vitrina", zona: "comercial" },
  { ruta: "/app/organizacion", etiqueta: "Mi organización", permiso: "actores:org:leer", grupo: "GESTIÓN", icono: "organizacion", zona: "comercial" },
  { ruta: "/app/produccion", etiqueta: "Producción", permiso: "produccion:cultivo:leer", grupo: "GESTIÓN", icono: "produccion", zona: "comercial" },
  { ruta: "/app/inventario", etiqueta: "Inventario", permiso: "inventario:lote:leer", grupo: "GESTIÓN", icono: "inventario", zona: "comercial" },
  { ruta: "/app/ruedas-negocio", etiqueta: "Ruedas de negocio", permiso: "ruedas:convocatoria:leer", grupo: "GESTIÓN", icono: "ruedas", zona: "comercial" },
  { ruta: "/app/licencias", etiqueta: "Licencias", permiso: "cumplimiento:atestacion:leer", grupo: "CUMPLIMIENTO", icono: "licencias", zona: "comercial" },
  { ruta: "/app/trazabilidad", etiqueta: "Trazabilidad", permiso: "trazabilidad:evento:leer", grupo: "CUMPLIMIENTO", icono: "trazabilidad", zona: "comercial" },
  { ruta: "/app/reportes", etiqueta: "Reportes", permiso: "reportes:tablero:leer", grupo: "CUMPLIMIENTO", icono: "reportes", zona: "comercial" },
  { ruta: "/app/salud/pacientes", etiqueta: "Pacientes", permiso: "clinico:atencion:leer", grupo: "SALUD", icono: "pacientes", zona: "clinica" },
  { ruta: "/app/salud/agenda", etiqueta: "Agenda", permiso: "clinico:agenda:gestionar", grupo: "SALUD", icono: "agenda", zona: "clinica" },
  { ruta: "/app/salud/teleconsulta", etiqueta: "Teleconsulta", permiso: "clinico:teleconsulta:atender", grupo: "SALUD", icono: "teleconsulta", zona: "clinica" },
];
