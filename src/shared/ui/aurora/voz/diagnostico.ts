import { ErrorApi } from "../../../api/problemDetails";
import { FalloVoz } from "./sesion";
import type { FalloVozVisible } from "../almacen";

export type Diagnostico = {
  vedar: boolean;
  fallo: FalloVozVisible;
};

export const ESPERA_ENTRE_INTENTOS = 30;

const POR_MEDIOS: Record<string, FalloVozVisible> = {
  "permiso-negado": {
    titulo: "Falta el permiso del micrófono",
    detalle:
      "El navegador bloqueó el micrófono. Habilítalo desde el candado de la barra de direcciones y vuelve a abrir la conversación.",
    reintentable: true,
  },
  "sin-microfono": {
    titulo: "Este navegador no puede abrir el micrófono",
    detalle:
      "Hablar con Aurora necesita un micrófono y una conexión segura. El resto del sistema funciona igual.",
    reintentable: false,
  },
  "microfono-ocupado": {
    titulo: "El micrófono está ocupado",
    detalle: "Otra aplicación lo está usando. Ciérrala y vuelve a intentarlo.",
    reintentable: true,
  },
  proveedor: {
    titulo: "El audio no se pudo establecer",
    detalle:
      "El proveedor de voz rechazó la conexión. No es un problema de permisos, pero abrir otra " +
      "sesión gasta un intento de tu cuenta: espera antes de repetirlo.",
    reintentable: true,
    esperaSegundos: ESPERA_ENTRE_INTENTOS,
  },
  red: {
    titulo: "El audio no llegó a conectarse",
    detalle:
      "La llamada no salió de este equipo. Revisa tu conexión antes de repetirlo: cada apertura " +
      "gasta un intento de tu cuenta.",
    reintentable: true,
    esperaSegundos: ESPERA_ENTRE_INTENTOS,
  },
};

const GENERICO: FalloVozVisible = {
  titulo: "No fue posible abrir la conversación",
  detalle:
    "Algo interrumpió la apertura de la sesión de voz. Cada intento cuenta contra tu cuenta, " +
    "así que espera antes de repetirlo.",
  reintentable: true,
  esperaSegundos: ESPERA_ENTRE_INTENTOS,
};

const apagado = (tipo: string): boolean =>
  tipo.endsWith("asistente-deshabilitado") || tipo.endsWith("asistente-no-configurado");

export const diagnosticar = (motivo: unknown): Diagnostico => {
  if (motivo instanceof FalloVoz) {
    return { vedar: false, fallo: POR_MEDIOS[motivo.clase] ?? GENERICO };
  }

  if (motivo instanceof ErrorApi) {
    const { status, type, title, detail, reintentarEn } = motivo.problema;

    if (status === 403 && type.endsWith("asistente-usuario-bloqueado")) {
      return {
        vedar: false,
        fallo: {
          titulo: "Tu cuenta tiene la voz bloqueada",
          detalle: detail,
          reintentable: false,
        },
      };
    }

    if (status === 403) {
      return {
        vedar: true,
        fallo: {
          titulo: "Tu rol no abre conversaciones con Aurora",
          detalle: detail,
          reintentable: false,
        },
      };
    }

    if (status === 422 && type.endsWith("configuracion-asistente-invalida")) {
      return {
        vedar: false,
        fallo: {
          titulo: "La configuración de Aurora no es válida",
          detalle: `${detail} No se arregla repitiéndolo: avisa a quien administra a Aurora en esta entidad.`,
          reintentable: false,
        },
      };
    }

    if (status === 502 && type.endsWith("asistente-credencial-rechazada")) {
      return {
        vedar: false,
        fallo: {
          titulo: "La credencial de voz de la entidad no vale",
          detalle: `${detail} Es un problema de configuración, no tuyo: avisa a quien administra a Aurora.`,
          reintentable: false,
        },
      };
    }

    if (status === 503 && type.endsWith("asistente-deshabilitado")) {
      return {
        vedar: true,
        fallo: {
          titulo: "Aurora no está habilitada en este despliegue",
          detalle: "No es un error tuyo: la voz se enciende del lado del servidor.",
          reintentable: false,
        },
      };
    }

    if (status === 503 && apagado(type)) {
      return {
        vedar: false,
        fallo: {
          titulo: "Aurora no está disponible ahora",
          detalle: "No es un error tuyo: falta configuración del lado del servidor.",
          reintentable: false,
        },
      };
    }

    if (status === 503) {
      return {
        vedar: false,
        fallo: {
          titulo: "El servicio de voz no respondió",
          detalle: `${detail} Abrir otra sesión gasta un intento de tu cuenta: espera antes de repetirlo.`,
          reintentable: true,
          esperaSegundos: ESPERA_ENTRE_INTENTOS,
        },
      };
    }

    if (status === 429 && type.endsWith("asistente-limite-diario")) {
      return {
        vedar: false,
        fallo: {
          titulo: "Se agotó tu tiempo de voz de hoy",
          detalle: `${detail} Vuelve mañana: el cupo se cuenta por día y no se recupera reintentando.`,
          reintentable: false,
        },
      };
    }

    if (status === 429) {
      return {
        vedar: false,
        fallo: {
          titulo: "Demasiadas peticiones",
          detalle: detail,
          reintentable: true,
          esperaSegundos: Math.max(Math.ceil(reintentarEn ?? 0), ESPERA_ENTRE_INTENTOS),
        },
      };
    }

    return {
      vedar: false,
      fallo: {
        titulo: title,
        detalle: detail,
        reintentable: true,
        esperaSegundos: ESPERA_ENTRE_INTENTOS,
      },
    };
  }

  return { vedar: false, fallo: GENERICO };
};
