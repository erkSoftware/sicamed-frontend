export const CLAVE_RECORRIDO = "SICAMED_recorrido_panel";

export type Parada = {
  clave: string;
  seleccion: string;
  titulo: string;
  detalle: string;
};

export const PARADAS: readonly Parada[] = [
  {
    clave: "menu",
    seleccion: ".lateral-boton",
    titulo: "Los módulos",
    detalle: "Abre el menú para moverte entre actores, cultivo, inventario y lo demás.",
  },
  {
    clave: "ruta",
    seleccion: ".barra__migas-corta",
    titulo: "Dónde estás",
    detalle: "Aquí se lee siempre la pantalla que tienes abierta.",
  },
  {
    clave: "buscar",
    seleccion: ".barra__comandos",
    titulo: "Buscar y saltar",
    detalle: "Escribe el nombre de un módulo o un actor y salta directo, sin navegar por el menú.",
  },
  {
    clave: "perfil",
    seleccion: ".selector-perfil__disparador",
    titulo: "Tu cuenta y tu rol",
    detalle: "Tus iniciales. Toca aquí para ver con qué perfil estás viendo el panel y cambiarlo.",
  },
  {
    clave: "avisos",
    seleccion: '.barra [aria-label="Notificaciones"]',
    titulo: "Avisos",
    detalle: "Lo que el sistema necesita que revises: vencimientos, radicados y respuestas.",
  },
  {
    clave: "aurora",
    seleccion: ".aurora-lanzador",
    titulo: "Aurora",
    detalle: "La guía por voz. Ábrela y pregúntale; ciérrala y la conversación termina.",
  },
];

export const recorridoVisto = (): boolean => {
  try {
    return window.localStorage.getItem(CLAVE_RECORRIDO) === "true";
  } catch (error) {
    void error;
    return true;
  }
};

export const marcarRecorridoVisto = (): void => {
  try {
    window.localStorage.setItem(CLAVE_RECORRIDO, "true");
  } catch (error) {
    void error;
  }
};

export const olvidarRecorrido = (): void => {
  try {
    window.localStorage.removeItem(CLAVE_RECORRIDO);
  } catch (error) {
    void error;
  }
};

export type Foco = { arriba: number; izquierda: number; ancho: number; alto: number };

export const HOLGURA = 8;

export const recuadroDe = (elemento: Element): Foco => {
  const caja = elemento.getBoundingClientRect();
  return {
    arriba: caja.top - HOLGURA,
    izquierda: caja.left - HOLGURA,
    ancho: caja.width + HOLGURA * 2,
    alto: caja.height + HOLGURA * 2,
  };
};

export const ubicarTarjeta = (
  foco: Foco,
  altoVentana: number,
): { lado: "abajo" | "arriba"; desplazamiento: number } =>
  foco.arriba + foco.alto > altoVentana * 0.6
    ? { lado: "arriba", desplazamiento: altoVentana - foco.arriba + HOLGURA }
    : { lado: "abajo", desplazamiento: foco.arriba + foco.alto + HOLGURA };
