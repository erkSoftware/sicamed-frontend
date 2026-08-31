import type { ProblemDetail } from "./problemDetails";

const SALIDAS: Readonly<Record<string, string>> = {
  "separacion-de-funciones":
    "El super administrador define la política de verificación y por eso no la aplica. El trámite lo resuelve una cuenta de analista de cumplimiento.",
  "expediente-propio":
    "Nadie verifica la organización a la que pertenece. Este expediente lo tiene que tomar otra persona.",
  "paso-de-otro-rol":
    "Cada paso es del rol al que la política se lo asignó. El responsable aparece rotulado en el paso.",
  "doble-control":
    "Este paso exige doble control: lo cierra un segundo analista que no haya resuelto ningún otro paso del expediente.",
  "rol-sin-verificacion":
    "Tu rol no participa en la verificación documental. Si estás viendo estos botones, es la pantalla la que está de más, no tu cuenta.",
  "paso-fuera-de-orden":
    "La política es secuencial. Resuelve primero el paso pendiente que quedó por encima de este.",
  "paso-ya-resuelto": "Alguien resolvió ese paso antes. Vuelve a leer el expediente y sigue por el que quedó en turno.",
  "devolucion-sin-motivo":
    "Escribe la observación antes de enviar: es exactamente lo que el solicitante va a leer como motivo.",
  "solicitud-ya-tramitada":
    "La solicitud ya tiene expediente abierto. Recarga la bandeja y entra por el expediente que ya existe.",
  "organizacion-de-la-solicitud-ausente":
    "El registro de la organización todavía no cuajó del lado del servidor. Reintenta en unos segundos: la solicitud está bien.",
};

export const salidaDelProblema = (problema: ProblemDetail): string | null =>
  SALIDAS[problema.type.split("/").pop() ?? ""] ?? null;
