import { solicitar } from "./transporte";

export type ClaseHerramienta = "ui" | "consulta" | "negocio";

export type HerramientaAsistente = {
  nombre: string;
  clase: ClaseHerramienta;
  descripcion: string;
  confirmacionPrevia: boolean;
};

export type SesionAsistente = {
  id: string;
  clientSecret: string;
  expiraEn: string;
  modelo: string;
  urlWebrtc: string;
  herramientas: readonly HerramientaAsistente[];
  demostracion?: boolean;
};

export type ContextoAsistente = {
  ruta?: string;
  pantalla?: string;
};

export const abrirSesionAsistente = async (
  contexto: ContextoAsistente = {},
): Promise<SesionAsistente> =>
  solicitar<SesionAsistente>("comercial", "/asistente/sesiones", {
    metodo: "POST",
    cuerpo: { contexto },
  });
