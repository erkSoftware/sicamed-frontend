import { NAVEGACION } from "../../rbac/navegacion";
import type { Permiso } from "../../auth/tipos";

export type ContextoDeSeccion = {
  ruta: string;
  etiqueta: string;
  frase: string;
};

const AYUDA: Readonly<Record<string, string>> = {
  "/app": "Aquí ves el estado del ecosistema y lo que pide atención hoy.",
  "/app/produccion": "Aquí puedo ayudarte a consultar o registrar tus cultivos.",
  "/app/plantas": "Aquí seguimos cada planta y su genética, una por una.",
  "/app/beneficio": "Aquí registramos cosecha, secado y curado con su merma.",
  "/app/cupos": "Aquí ves el cupo de plantas asignado y cuánto llevas ocupado.",
  "/app/inventario": "Aquí puedo ayudarte a consultar existencias y movimientos.",
  "/app/transformacion": "Aquí pasamos biomasa a producto terminado.",
  "/app/destruccion": "Aquí levantamos las actas de disposición final.",
  "/app/vitrina": "Aquí se divulga tu oferta y se habilitan contactos.",
  "/app/cierre": "Aquí queda el resultado declarado de cada contacto.",
  "/app/ruedas-negocio": "Aquí están las convocatorias abiertas para inscribirte.",
  "/app/licencias": "Aquí puedo ayudarte a revisar requisitos y documentación pendiente.",
  "/app/expedientes": "Aquí se verifica documento por documento cada registro.",
  "/app/solicitudes": "Aquí llegan las altas del formulario público, esperando trámite.",
  "/app/trazabilidad": "Aquí está la cadena de eventos, que no se reescribe.",
  "/app/directorio": "Aquí buscamos a cualquier actor del ecosistema.",
  "/app/organizacion": "Aquí está la ficha de tu organización y sus establecimientos.",
  "/app/reportes": "Aquí puedo ayudarte a leer los indicadores del ecosistema.",
  "/app/conexiones": "Aquí vigilamos las fuentes externas y sus discrepancias.",
  "/app/politicas": "Aquí se definen los pasos y los plazos del trámite de registro.",
  "/app/usuarios": "Aquí decides quién entra, con qué rol y bajo qué organización.",
  "/app/salud/pacientes": "Aquí entro contigo, pero los datos de salud no cruzan a la zona comercial.",
  "/app/salud/agenda": "Aquí está la disponibilidad y las citas de teleconsulta.",
  "/app/salud/teleconsulta": "Aquí se atiende de forma remota, conforme a la Res. 2654 de 2019.",
};

const alcanzables = (permisos: readonly Permiso[]) =>
  NAVEGACION.filter((item) => permisos.includes(item.permiso));

export const contextoDeRuta = (
  ruta: string,
  permisos: readonly Permiso[],
): ContextoDeSeccion | null => {
  const candidatos = alcanzables(permisos);
  const exacto = candidatos.find((item) => item.ruta === ruta);
  const item =
    exacto ??
    candidatos
      .filter((opcion) => opcion.ruta !== "/app" && ruta.startsWith(`${opcion.ruta}/`))
      .sort((uno, otro) => otro.ruta.length - uno.ruta.length)[0];

  if (!item) return null;

  return {
    ruta: item.ruta,
    etiqueta: item.etiqueta,
    frase: `Estás en ${item.etiqueta}. ${AYUDA[item.ruta] ?? `${item.descripcion}.`}`,
  };
};
