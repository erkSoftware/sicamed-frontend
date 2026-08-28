import { CENTRO_COLOMBIA } from "../../shared/api/mock/mundo";
import { proyectarOrtografica, type Camara } from "../../shared/geo/proyecciones";
import type { PaletaGlobo } from "../../shared/ui/graficos/pintarGlobo";

export type Destino = {
  clave: string;
  lon: number;
  lat: number;
  retardo: number;
};

export const DESTINOS: readonly Destino[] = [
  { clave: "norteamerica", lon: -98, lat: 39, retardo: 0 },
  { clave: "europa", lon: 9, lat: 50, retardo: 0.12 },
  { clave: "britanica", lon: -2, lat: 53, retardo: 0.28 },
  { clave: "iberica", lon: -4, lat: 40, retardo: 0.2 },
  { clave: "brasil", lon: -48, lat: -12, retardo: 0.36 },
  { clave: "cono-sur", lon: -70, lat: -33, retardo: 0.44 },
  { clave: "oceania", lon: 134, lat: -25, retardo: 0.56 },
];

const PASOS = 46;

const acotar = (valor: number) => Math.min(1, Math.max(0, valor));

export const trazarEnlaces = (
  contexto: CanvasRenderingContext2D,
  camara: Camara,
  intensidad: number,
  pulso: number,
  paleta: PaletaGlobo,
): void => {
  if (intensidad <= 0.01) return;

  contexto.save();
  contexto.lineCap = "round";
  contexto.lineJoin = "round";

  for (const destino of DESTINOS) {
    const avance = acotar((intensidad - destino.retardo) / 0.44);
    if (avance <= 0.01) continue;

    const puntos: { x: number; y: number }[] = [];
    for (let paso = 0; paso <= PASOS * avance; paso += 1) {
      const t = paso / PASOS;
      const lon = CENTRO_COLOMBIA.lon + (destino.lon - CENTRO_COLOMBIA.lon) * t;
      const lat = CENTRO_COLOMBIA.lat + (destino.lat - CENTRO_COLOMBIA.lat) * t;
      const punto = proyectarOrtografica(lon, lat, camara);
      if (!punto.visible) {
        if (puntos.length > 1) break;
        puntos.length = 0;
        continue;
      }
      puntos.push(punto);
    }

    if (puntos.length < 2) continue;

    contexto.globalAlpha = 0.34 + 0.34 * avance;
    contexto.strokeStyle = paleta.foco;
    contexto.lineWidth = 1.4;
    contexto.shadowColor = paleta.foco;
    contexto.shadowBlur = 10;
    contexto.beginPath();
    const inicio = puntos[0];
    if (!inicio) continue;
    contexto.moveTo(inicio.x, inicio.y);
    for (const punto of puntos.slice(1)) contexto.lineTo(punto.x, punto.y);
    contexto.stroke();

    const cabeza = puntos.at(-1);
    if (!cabeza) continue;
    contexto.globalAlpha = avance;
    contexto.fillStyle = paleta.marca;
    contexto.beginPath();
    contexto.arc(cabeza.x, cabeza.y, 2.6 + pulso * 1.6, 0, Math.PI * 2);
    contexto.fill();
  }

  const origen = proyectarOrtografica(CENTRO_COLOMBIA.lon, CENTRO_COLOMBIA.lat, camara);
  if (origen.visible) {
    contexto.shadowBlur = 24;
    contexto.shadowColor = paleta.foco;
    contexto.globalAlpha = intensidad;
    contexto.fillStyle = paleta.foco;
    contexto.beginPath();
    contexto.arc(origen.x, origen.y, 4.4, 0, Math.PI * 2);
    contexto.fill();

    contexto.globalAlpha = intensidad * (1 - pulso) * 0.8;
    contexto.strokeStyle = paleta.foco;
    contexto.lineWidth = 1.2;
    contexto.beginPath();
    contexto.arc(origen.x, origen.y, 6 + pulso * 26, 0, Math.PI * 2);
    contexto.stroke();
  }

  contexto.restore();
};
