import type { Permiso } from "../auth/tipos";
import type { IdModulo } from "./modulos";

export type ItemNavegacion = {
  ruta: string;
  etiqueta: string;
  permiso: Permiso;
  grupo: "OPERACIÓN" | "GESTIÓN" | "CUMPLIMIENTO" | "PLATAFORMA" | "SALUD";
  modulo: IdModulo;
  icono: string;
  zona: "comercial" | "clinica";
  descripcion: string;
};

export const NAVEGACION: readonly ItemNavegacion[] = [
  { ruta: "/app", etiqueta: "Tablero", permiso: "reportes:tablero:leer", grupo: "OPERACIÓN", modulo: "centro", icono: "tablero", zona: "comercial", descripcion: "Indicadores del ecosistema en tiempo real" },
  { ruta: "/app/reportes", etiqueta: "Reportes", permiso: "reportes:tablero:leer", grupo: "CUMPLIMIENTO", modulo: "centro", icono: "reportes", zona: "comercial", descripcion: "Analítica y reportes institucionales" },
  { ruta: "/app/directorio", etiqueta: "Directorio de actores", permiso: "directorio:actor:leer", grupo: "OPERACIÓN", modulo: "actores", icono: "directorio", zona: "comercial", descripcion: "Todos los actores registrados del ecosistema" },
  { ruta: "/app/organizacion", etiqueta: "Mi organización", permiso: "actores:org:leer", grupo: "GESTIÓN", modulo: "actores", icono: "organizacion", zona: "comercial", descripcion: "Ficha, establecimientos y caracterización" },
  { ruta: "/app/produccion", etiqueta: "Producción", permiso: "produccion:cultivo:leer", grupo: "GESTIÓN", modulo: "cultivo", icono: "produccion", zona: "comercial", descripcion: "Cultivos y lotes de cultivo" },
  { ruta: "/app/plantas", etiqueta: "Plantas y variedades", permiso: "produccion:planta:leer", grupo: "GESTIÓN", modulo: "cultivo", icono: "hoja", zona: "comercial", descripcion: "Trazabilidad por planta individual y genética" },
  { ruta: "/app/beneficio", etiqueta: "Cosecha y beneficio", permiso: "produccion:beneficio:leer", grupo: "GESTIÓN", modulo: "cultivo", icono: "inventario", zona: "comercial", descripcion: "Cosecha, secado y curado con merma registrada" },
  { ruta: "/app/inventario", etiqueta: "Inventario", permiso: "inventario:lote:leer", grupo: "GESTIÓN", modulo: "inventario", icono: "inventario", zona: "comercial", descripcion: "Lotes de producto terminado y existencias" },
  { ruta: "/app/vitrina", etiqueta: "Vitrina", permiso: "vitrina:oferta:leer", grupo: "OPERACIÓN", modulo: "mercado", icono: "vitrina", zona: "comercial", descripcion: "Oferta divulgada de manera informativa" },
  { ruta: "/app/cierre", etiqueta: "Cierre de la operación", permiso: "vitrina:oferta:leer", grupo: "OPERACIÓN", modulo: "mercado", icono: "cadena", zona: "comercial", descripcion: "Contactos habilitados y resultado declarado" },
  { ruta: "/app/ruedas-negocio", etiqueta: "Ruedas de negocio", permiso: "ruedas:convocatoria:leer", grupo: "GESTIÓN", modulo: "mercado", icono: "ruedas", zona: "comercial", descripcion: "Convocatorias de articulación entre actores" },
  { ruta: "/app/licencias", etiqueta: "Licencias", permiso: "cumplimiento:atestacion:leer", grupo: "CUMPLIMIENTO", modulo: "cumplimiento", icono: "licencias", zona: "comercial", descripcion: "Atestaciones vigentes y su origen probatorio" },
  { ruta: "/app/expedientes", etiqueta: "Expedientes de registro", permiso: "cumplimiento:expediente:leer", grupo: "CUMPLIMIENTO", modulo: "cumplimiento", icono: "documento", zona: "comercial", descripcion: "Verificación documental por pasos y roles" },
  { ruta: "/app/trazabilidad", etiqueta: "Trazabilidad", permiso: "trazabilidad:evento:leer", grupo: "CUMPLIMIENTO", modulo: "cumplimiento", icono: "trazabilidad", zona: "comercial", descripcion: "Ledger encadenado por hash, sin reescritura" },
  { ruta: "/app/conexiones", etiqueta: "Conexiones y telemetría", permiso: "interoperabilidad:conexion:leer", grupo: "PLATAFORMA", modulo: "plataforma", icono: "mundo", zona: "comercial", descripcion: "Integración con fuentes autoritativas externas" },
  { ruta: "/app/politicas", etiqueta: "Política de verificación", permiso: "admin:politica:gestionar", grupo: "PLATAFORMA", modulo: "plataforma", icono: "escudo", zona: "comercial", descripcion: "Pasos, roles y SLA del trámite de registro" },
  { ruta: "/app/salud/pacientes", etiqueta: "Pacientes", permiso: "clinico:atencion:leer", grupo: "SALUD", modulo: "salud", icono: "pacientes", zona: "clinica", descripcion: "Zona clínica, frontera dura con la zona comercial" },
  { ruta: "/app/salud/agenda", etiqueta: "Agenda", permiso: "clinico:agenda:gestionar", grupo: "SALUD", modulo: "salud", icono: "agenda", zona: "clinica", descripcion: "Disponibilidad y citas de teleconsulta" },
  { ruta: "/app/salud/teleconsulta", etiqueta: "Teleconsulta", permiso: "clinico:teleconsulta:atender", grupo: "SALUD", modulo: "salud", icono: "teleconsulta", zona: "clinica", descripcion: "Atención remota conforme a Res. 2654 de 2019" },
];
