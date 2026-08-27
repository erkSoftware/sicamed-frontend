import { ANILLOS_COLOMBIA, ANILLOS_MUNDO, CENTRO_COLOMBIA } from "../../api/mock/mundo";
import { CONTORNOS } from "../../api/mock/contornos";
import { proyectarOrtografica, type Camara } from "../../geo/proyecciones";

export type MarcaGlobo = {
  codigo: string;
  nombre: string;
  valor: number;
};

export type PaletaGlobo = {
  oceano: string;
  oceanoBorde: string;
  tierra: string;
  tierraLuz: string;
  tierraBorde: string;
  malla: string;
  foco: string;
  marca: string;
  halo: string;
  departamentoBajo: string;
  departamentoAlto: string;
};

export type PinturaGlobo = {
  ancho: number;
  alto: number;
  camara: Camara;
  visor: number;
  revelado: number;
  pulso: number;
  paleta: PaletaGlobo;
  porCodigo: ReadonlyMap<string, MarcaGlobo>;
  maximo: number;
  destacado: string | null;
};

const leerColor = (elemento: HTMLElement, variable: string): string =>
  getComputedStyle(elemento).getPropertyValue(variable).trim() || "#0E5C36";

export const leerPaletaGlobo = (elemento: HTMLElement): PaletaGlobo => ({
  oceano: leerColor(elemento, "--globo-oceano"),
  oceanoBorde: leerColor(elemento, "--globo-oceano-borde"),
  tierra: leerColor(elemento, "--globo-tierra"),
  tierraLuz: leerColor(elemento, "--globo-tierra-luz"),
  tierraBorde: leerColor(elemento, "--globo-tierra-borde"),
  malla: leerColor(elemento, "--globo-malla"),
  foco: leerColor(elemento, "--globo-foco"),
  marca: leerColor(elemento, "--globo-marca"),
  halo: leerColor(elemento, "--globo-halo"),
  departamentoBajo: leerColor(elemento, "--globo-departamento-bajo"),
  departamentoAlto: leerColor(elemento, "--globo-departamento-alto"),
});

const aCanal = (hex: string): readonly [number, number, number] => {
  const limpio = hex.replace("#", "");
  const ancho = limpio.length === 3 ? 1 : 2;
  const leer = (indice: number) => {
    const trozo = limpio.slice(indice * ancho, indice * ancho + ancho);
    return parseInt(ancho === 1 ? trozo + trozo : trozo, 16);
  };
  return [leer(0), leer(1), leer(2)];
};

export const mezclar = (desde: string, hasta: string, t: number): string => {
  const a = aCanal(desde);
  const b = aCanal(hasta);
  const canal = (indice: 0 | 1 | 2) => Math.round(a[indice] + (b[indice] - a[indice]) * t);
  return `rgb(${canal(0)}, ${canal(1)}, ${canal(2)})`;
};

export const trazarAnillos = (
  contexto: CanvasRenderingContext2D,
  anillos: readonly (readonly number[])[],
  camara: Camara,
): void => {
  contexto.beginPath();
  for (const anillo of anillos) {
    let dibujando = false;
    for (let i = 0; i < anillo.length; i += 2) {
      const punto = proyectarOrtografica(anillo[i] as number, anillo[i + 1] as number, camara);
      if (!punto.visible) {
        dibujando = false;
        continue;
      }
      if (dibujando) contexto.lineTo(punto.x, punto.y);
      else {
        contexto.moveTo(punto.x, punto.y);
        dibujando = true;
      }
    }
    contexto.closePath();
  }
};

const dibujarMalla = (contexto: CanvasRenderingContext2D, camara: Camara, paso: number, color: string) => {
  contexto.strokeStyle = color;
  contexto.lineWidth = 1;
  contexto.beginPath();
  for (let lat = -80; lat <= 80; lat += paso) {
    let dibujando = false;
    for (let lon = -180; lon <= 180; lon += 2) {
      const punto = proyectarOrtografica(lon, lat, camara);
      if (!punto.visible) {
        dibujando = false;
        continue;
      }
      if (dibujando) contexto.lineTo(punto.x, punto.y);
      else {
        contexto.moveTo(punto.x, punto.y);
        dibujando = true;
      }
    }
  }
  for (let lon = -180; lon < 180; lon += paso) {
    let dibujando = false;
    for (let lat = -90; lat <= 90; lat += 2) {
      const punto = proyectarOrtografica(lon, lat, camara);
      if (!punto.visible) {
        dibujando = false;
        continue;
      }
      if (dibujando) contexto.lineTo(punto.x, punto.y);
      else {
        contexto.moveTo(punto.x, punto.y);
        dibujando = true;
      }
    }
  }
  contexto.stroke();
};

const dibujarRelieve = (contexto: CanvasRenderingContext2D, camara: Camara, visor: number) => {
  const sombra = contexto.createRadialGradient(
    camara.centroX - visor * 0.42,
    camara.centroY - visor * 0.46,
    visor * 0.12,
    camara.centroX - visor * 0.16,
    camara.centroY - visor * 0.18,
    visor * 1.45,
  );
  sombra.addColorStop(0, "rgba(255, 255, 255, 0.16)");
  sombra.addColorStop(0.42, "rgba(255, 255, 255, 0)");
  sombra.addColorStop(0.72, "rgba(2, 14, 9, 0.34)");
  sombra.addColorStop(1, "rgba(2, 14, 9, 0.78)");
  contexto.fillStyle = sombra;
  contexto.beginPath();
  contexto.arc(camara.centroX, camara.centroY, visor, 0, Math.PI * 2);
  contexto.fill();
};

export const pintarGlobo = (contexto: CanvasRenderingContext2D, pintura: PinturaGlobo): void => {
  const { ancho, alto, camara, visor, revelado, pulso, paleta, porCodigo, maximo, destacado } = pintura;

  contexto.clearRect(0, 0, ancho, alto);

  const agua = contexto.createRadialGradient(
    camara.centroX - visor * 0.36,
    camara.centroY - visor * 0.4,
    visor * 0.06,
    camara.centroX,
    camara.centroY,
    visor * 1.08,
  );
  agua.addColorStop(0, paleta.oceanoBorde);
  agua.addColorStop(1, paleta.oceano);

  contexto.save();
  contexto.beginPath();
  contexto.arc(camara.centroX, camara.centroY, visor, 0, Math.PI * 2);
  contexto.fillStyle = agua;
  contexto.fill();
  contexto.clip();

  dibujarMalla(contexto, camara, revelado > 0.5 ? 5 : 20, paleta.malla);

  trazarAnillos(contexto, ANILLOS_MUNDO, camara);
  const tierra = contexto.createLinearGradient(
    camara.centroX - visor,
    camara.centroY - visor,
    camara.centroX + visor,
    camara.centroY + visor,
  );
  tierra.addColorStop(0, paleta.tierraLuz);
  tierra.addColorStop(1, paleta.tierra);
  contexto.fillStyle = tierra;
  contexto.fill();
  contexto.strokeStyle = paleta.tierraBorde;
  contexto.lineWidth = 1 + revelado * 0.4;
  contexto.stroke();

  if (revelado < 0.98) {
    contexto.globalAlpha = 1 - revelado;
    trazarAnillos(contexto, ANILLOS_COLOMBIA, camara);
    contexto.fillStyle = paleta.foco;
    contexto.fill();
    contexto.globalAlpha = 1;
  }

  if (revelado > 0.02) {
    trazarAnillos(contexto, ANILLOS_MUNDO, camara);
    contexto.fillStyle = `rgba(6, 38, 27, ${0.52 * revelado})`;
    contexto.fill();

    for (const contorno of CONTORNOS) {
      const marca = porCodigo.get(contorno.codigo);
      const peso = marca ? Math.sqrt(marca.valor / maximo) : 0;
      const enfocado = destacado === contorno.codigo;
      trazarAnillos(contexto, contorno.anillos, camara);
      contexto.globalAlpha = revelado;
      contexto.fillStyle = enfocado
        ? paleta.foco
        : mezclar(paleta.departamentoBajo, paleta.departamentoAlto, marca ? 0.12 + peso * 0.88 : 0);
      contexto.fill();
      contexto.strokeStyle = paleta.tierraBorde;
      contexto.lineWidth = enfocado ? 2 : 0.7;
      contexto.stroke();
    }
    contexto.globalAlpha = 1;
  }

  dibujarRelieve(contexto, camara, visor);
  contexto.restore();

  contexto.beginPath();
  contexto.arc(camara.centroX, camara.centroY, visor, 0, Math.PI * 2);
  contexto.strokeStyle = paleta.halo;
  contexto.lineWidth = 1.4;
  contexto.stroke();

  if (revelado > 0.02) {
    contexto.save();
    contexto.beginPath();
    contexto.arc(camara.centroX, camara.centroY, visor, 0, Math.PI * 2);
    contexto.clip();
    for (const contorno of CONTORNOS) {
      const marca = porCodigo.get(contorno.codigo);
      if (!marca) continue;
      const punto = proyectarOrtografica(contorno.lon, contorno.lat, camara);
      if (!punto.visible) continue;
      const enfocado = destacado === marca.codigo;
      const peso = Math.sqrt(marca.valor / maximo);
      const radio = (2 + peso * 4.4) * revelado;
      contexto.fillStyle = paleta.marca;
      contexto.globalAlpha = revelado * (enfocado ? 0.42 : 0.18);
      contexto.beginPath();
      contexto.arc(punto.x, punto.y, radio * (enfocado ? 3 + pulso * 1.4 : 2.1 + pulso * 0.5), 0, Math.PI * 2);
      contexto.fill();
      contexto.globalAlpha = revelado;
      contexto.beginPath();
      contexto.arc(punto.x, punto.y, enfocado ? radio * 1.5 : radio, 0, Math.PI * 2);
      contexto.fill();
      contexto.globalAlpha = 1;
    }
    contexto.restore();
    return;
  }

  const punto = proyectarOrtografica(CENTRO_COLOMBIA.lon, CENTRO_COLOMBIA.lat, camara);
  if (!punto.visible) return;
  const radio = 7 + pulso * 6;
  contexto.globalAlpha = 0.26;
  contexto.beginPath();
  contexto.arc(punto.x, punto.y, radio * 2.6, 0, Math.PI * 2);
  contexto.fillStyle = paleta.marca;
  contexto.fill();
  contexto.globalAlpha = 0.9;
  contexto.beginPath();
  contexto.arc(punto.x, punto.y, 5.5, 0, Math.PI * 2);
  contexto.fill();
  contexto.globalAlpha = 1;
};
