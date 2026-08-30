import { ErrorApi } from "../../../api/problemDetails";
import { FalloVoz } from "./sesion";
import type { FalloVozVisible } from "../almacen";

export type Diagnostico = {
  vedar: boolean;
  fallo: FalloVozVisible;
};

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
      "El proveedor de voz rechazó la conexión. No es un problema de permisos: reintenta en unos segundos.",
    reintentable: true,
  },
  red: {
    titulo: "El audio no llegó a conectarse",
    detalle: "La llamada no salió de este equipo. Revisa tu conexión e intenta de nuevo.",
    reintentable: true,
  },
};

const GENERICO: FalloVozVisible = {
  titulo: "No fue posible abrir la conversación",
  detalle: "Algo interrumpió la apertura de la sesión de voz. Intenta de nuevo en unos segundos.",
  reintentable: true,
};

const apagado = (tipo: string): boolean =>
  tipo.endsWith("asistente-deshabilitado") || tipo.endsWith("asistente-no-configurado");

export const diagnosticar = (motivo: unknown): Diagnostico => {
  if (motivo instanceof FalloVoz) {
    return { vedar: false, fallo: POR_MEDIOS[motivo.clase] ?? GENERICO };
  }

  if (motivo instanceof ErrorApi) {
    const { status, type, title, detail, reintentarEn } = motivo.problema;

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
        fallo: { titulo: "El servicio de voz no respondió", detalle: detail, reintentable: true },
      };
    }

    if (status === 429) {
      const espera = reintentarEn ? ` Reintenta en ${Math.ceil(reintentarEn)} segundos.` : "";
      return {
        vedar: false,
        fallo: { titulo: "Demasiadas peticiones", detalle: `${detail}${espera}`, reintentable: true },
      };
    }

    return { vedar: false, fallo: { titulo: title, detalle: detail, reintentable: true } };
  }

  return { vedar: false, fallo: GENERICO };
};
