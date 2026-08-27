import { useCallback, useEffect, useRef, useState } from "react";
import { ANILLOS_COLOMBIA, ANILLOS_MUNDO, CENTRO_COLOMBIA } from "../../api/mock/mundo";
import { CONTORNOS } from "../../api/mock/contornos";
import { invertirOrtografica, proyectarOrtografica, puntoEnAnillo, type Camara } from "../../geo/proyecciones";
import { numero } from "../../i18n/formato";

export type MarcaGlobo = {
  codigo: string;
  nombre: string;
  valor: number;
};

type Props = {
  marcas: readonly MarcaGlobo[];
  unidad: string;
  onAbrirFicha?: (codigo: string) => void;
};

type Vista = "mundo" | "colombia";

const RADIO_BASE = 0.46;
const ACERCAMIENTO = 3.6;
const GIRO_GRADOS_SEGUNDO = 11;
const GIRO_SOBRIO = 4;
const DURACION = 1400;
const ARRASTRE_POR_PIXEL = 0.42;
const ROCE_INERCIA = 0.94;

const suavizar = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const anguloCorto = (desde: number, hasta: number): number => {
  const delta = ((hasta - desde + 540) % 360) - 180;
  return desde + delta;
};

const leerColor = (elemento: HTMLElement, variable: string): string =>
  getComputedStyle(elemento).getPropertyValue(variable).trim() || "#0E5C36";

const aCanal = (hex: string): readonly [number, number, number] => {
  const limpio = hex.replace("#", "");
  const ancho = limpio.length === 3 ? 1 : 2;
  const leer = (indice: number) => {
    const trozo = limpio.slice(indice * ancho, indice * ancho + ancho);
    return parseInt(ancho === 1 ? trozo + trozo : trozo, 16);
  };
  return [leer(0), leer(1), leer(2)];
};

const mezclar = (desde: string, hasta: string, t: number): string => {
  const a = aCanal(desde);
  const b = aCanal(hasta);
  const canal = (indice: 0 | 1 | 2) => Math.round(a[indice] + (b[indice] - a[indice]) * t);
  return `rgb(${canal(0)}, ${canal(1)}, ${canal(2)})`;
};

export const GloboColombia = ({ marcas, unidad, onAbrirFicha }: Props) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const [vista, setVista] = useState<Vista>("mundo");
  const [destacado, setDestacado] = useState<MarcaGlobo | null>(null);

  const estado = useRef({
    lon: -58,
    lat: 16,
    acercamiento: 1,
    revelado: 0,
    animando: false,
    inicio: 0,
    desdeLon: -58,
    desdeLat: 16,
    hastaLon: -58,
    hastaLat: 16,
    desdeAcercamiento: 1,
    hastaAcercamiento: 1,
    objetivoRevelado: 0,
    arrastrando: false,
    impulsoLon: 0,
    impulsoLat: 0,
  });

  const maximo = Math.max(...marcas.map((marca) => marca.valor), 1);
  const destacadoRef = useRef<string | null>(null);
  const punteroRef = useRef<((x: number, y: number) => string | null) | null>(null);
  const sobreRef = useRef<string | null>(null);
  const datosRef = useRef({ maximo, porCodigo: new Map(marcas.map((marca) => [marca.codigo, marca])) });
  const marcasRef = useRef(marcas);
  destacadoRef.current = destacado?.codigo ?? null;
  datosRef.current = { maximo, porCodigo: new Map(marcas.map((marca) => [marca.codigo, marca])) };
  marcasRef.current = marcas;

  const alSobrevolar = useCallback((codigo: string | null) => {
    setDestacado(codigo ? (marcasRef.current.find((marca) => marca.codigo === codigo) ?? null) : null);
  }, []);

  const irA = useCallback((siguiente: Vista) => {
    const s = estado.current;
    s.desdeLon = s.lon;
    s.desdeLat = s.lat;
    s.desdeAcercamiento = s.acercamiento;
    s.hastaLon = siguiente === "colombia" ? anguloCorto(s.lon, CENTRO_COLOMBIA.lon) : anguloCorto(s.lon, s.lon + 46);
    s.hastaLat = siguiente === "colombia" ? CENTRO_COLOMBIA.lat : 16;
    s.hastaAcercamiento = siguiente === "colombia" ? ACERCAMIENTO : 1;
    s.objetivoRevelado = siguiente === "colombia" ? 1 : 0;
    s.inicio = performance.now();
    s.animando = true;
    s.impulsoLon = 0;
    s.impulsoLat = 0;
    setVista(siguiente);
    if (siguiente === "mundo") setDestacado(null);
  }, []);

  useEffect(() => {
    const elemento = lienzo.current;
    const raiz = contenedor.current;
    if (!elemento || !raiz) return undefined;

    const contexto = elemento.getContext("2d");
    if (!contexto) return undefined;

    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ancho = 0;
    let alto = 0;
    let cuadro = 0;
    let previo = performance.now();
    let sobrevolando = false;
    let ultimoX = 0;
    let ultimoY = 0;
    let punteroActivo: number | null = null;

    const paleta = {
      oceano: leerColor(raiz, "--globo-oceano"),
      oceanoBorde: leerColor(raiz, "--globo-oceano-borde"),
      tierra: leerColor(raiz, "--globo-tierra"),
      tierraLuz: leerColor(raiz, "--globo-tierra-luz"),
      tierraBorde: leerColor(raiz, "--globo-tierra-borde"),
      malla: leerColor(raiz, "--globo-malla"),
      foco: leerColor(raiz, "--globo-foco"),
      marca: leerColor(raiz, "--globo-marca"),
      halo: leerColor(raiz, "--globo-halo"),
      departamentoBajo: leerColor(raiz, "--globo-departamento-bajo"),
      departamentoAlto: leerColor(raiz, "--globo-departamento-alto"),
    };

    const medir = () => {
      const caja = raiz.getBoundingClientRect();
      const densidad = Math.min(window.devicePixelRatio || 1, 2);
      ancho = Math.max(caja.width, 1);
      alto = Math.max(caja.height, 1);
      elemento.width = Math.round(ancho * densidad);
      elemento.height = Math.round(alto * densidad);
      contexto.setTransform(densidad, 0, 0, densidad, 0, 0);
    };

    const radioVisor = () => Math.min(ancho, alto) * RADIO_BASE;

    const camaraActual = (): Camara => ({
      lon: estado.current.lon,
      lat: estado.current.lat,
      radio: radioVisor() * estado.current.acercamiento,
      centroX: ancho / 2,
      centroY: alto / 2,
    });

    const departamentoEn = (x: number, y: number): string | null => {
      if (estado.current.revelado < 0.6) return null;
      const geografico = invertirOrtografica(x, y, camaraActual());
      if (!geografico) return null;
      for (const contorno of CONTORNOS) {
        if (!datosRef.current.porCodigo.has(contorno.codigo)) continue;
        for (const anillo of contorno.anillos) {
          if (puntoEnAnillo(geografico.lon, geografico.lat, anillo)) return contorno.codigo;
        }
      }
      return null;
    };

    punteroRef.current = departamentoEn;

    const trazarAnillos = (anillos: readonly (readonly number[])[], camara: Camara) => {
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

    const dibujarMalla = (camara: Camara, paso: number) => {
      contexto.strokeStyle = paleta.malla;
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

    const dibujarRelieve = (camara: Camara, visor: number) => {
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

    const dibujar = (ahora: number) => {
      const s = estado.current;
      const transcurrido = Math.min(ahora - previo, 64);
      previo = ahora;

      if (s.animando) {
        const avance = Math.min(1, (ahora - s.inicio) / (reducido ? 1 : DURACION));
        const t = suavizar(avance);
        s.lon = s.desdeLon + (s.hastaLon - s.desdeLon) * t;
        s.lat = s.desdeLat + (s.hastaLat - s.desdeLat) * t;
        s.acercamiento = s.desdeAcercamiento + (s.hastaAcercamiento - s.desdeAcercamiento) * t;
        s.revelado = s.objetivoRevelado === 1 ? t : 1 - t;
        if (avance === 1) s.animando = false;
      } else if (!s.arrastrando) {
        if (Math.abs(s.impulsoLon) > 0.01 || Math.abs(s.impulsoLat) > 0.01) {
          s.lon += s.impulsoLon;
          s.lat = Math.max(-72, Math.min(72, s.lat + s.impulsoLat));
          s.impulsoLon *= ROCE_INERCIA;
          s.impulsoLat *= ROCE_INERCIA;
        } else if (s.objetivoRevelado === 0) {
          const velocidad = reducido ? GIRO_SOBRIO : GIRO_GRADOS_SEGUNDO;
          s.lon -= (velocidad * transcurrido) / 1000;
        }
      }

      const camara = camaraActual();
      const visor = radioVisor();
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

      dibujarMalla(camara, s.revelado > 0.5 ? 5 : 20);

      trazarAnillos(ANILLOS_MUNDO, camara);
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
      contexto.lineWidth = 1 + s.revelado * 0.4;
      contexto.stroke();

      if (s.revelado < 0.98) {
        contexto.globalAlpha = 1 - s.revelado;
        trazarAnillos(ANILLOS_COLOMBIA, camara);
        contexto.fillStyle = paleta.foco;
        contexto.fill();
        contexto.globalAlpha = 1;
      }

      if (s.revelado > 0.02) {
        trazarAnillos(ANILLOS_MUNDO, camara);
        contexto.fillStyle = `rgba(6, 38, 27, ${0.52 * s.revelado})`;
        contexto.fill();

        for (const contorno of CONTORNOS) {
          const marca = datosRef.current.porCodigo.get(contorno.codigo);
          const peso = marca ? Math.sqrt(marca.valor / datosRef.current.maximo) : 0;
          const enfocado = destacadoRef.current === contorno.codigo;
          trazarAnillos(contorno.anillos, camara);
          contexto.globalAlpha = s.revelado;
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

      dibujarRelieve(camara, visor);
      contexto.restore();

      contexto.beginPath();
      contexto.arc(camara.centroX, camara.centroY, visor, 0, Math.PI * 2);
      contexto.strokeStyle = paleta.halo;
      contexto.lineWidth = 1.4;
      contexto.stroke();

      const pulso = reducido || s.revelado > 0.5 ? 0.5 : (Math.sin(ahora / 620) + 1) / 2;

      if (s.revelado > 0.02) {
        contexto.save();
        contexto.beginPath();
        contexto.arc(camara.centroX, camara.centroY, visor, 0, Math.PI * 2);
        contexto.clip();
        for (const contorno of CONTORNOS) {
          const marca = datosRef.current.porCodigo.get(contorno.codigo);
          if (!marca) continue;
          const punto = proyectarOrtografica(contorno.lon, contorno.lat, camara);
          if (!punto.visible) continue;
          const enfocado = destacadoRef.current === marca.codigo;
          const peso = Math.sqrt(marca.valor / datosRef.current.maximo);
          const radio = (2 + peso * 4.4) * s.revelado;
          contexto.fillStyle = paleta.marca;
          contexto.globalAlpha = s.revelado * (enfocado ? 0.42 : 0.18);
          contexto.beginPath();
          contexto.arc(punto.x, punto.y, radio * (enfocado ? 3 + pulso * 1.4 : 2.1 + pulso * 0.5), 0, Math.PI * 2);
          contexto.fill();
          contexto.globalAlpha = s.revelado;
          contexto.beginPath();
          contexto.arc(punto.x, punto.y, enfocado ? radio * 1.5 : radio, 0, Math.PI * 2);
          contexto.fill();
          contexto.globalAlpha = 1;
        }
        contexto.restore();
      } else {
        const punto = proyectarOrtografica(CENTRO_COLOMBIA.lon, CENTRO_COLOMBIA.lat, camara);
        if (punto.visible) {
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
        }
      }

      cuadro = requestAnimationFrame(dibujar);
    };

    medir();
    cuadro = requestAnimationFrame(dibujar);

    const dentroDeLaEsfera = (x: number, y: number): boolean =>
      Math.hypot(x - ancho / 2, y - alto / 2) <= radioVisor();

    const alBajar = (evento: PointerEvent) => {
      if (estado.current.objetivoRevelado === 1) return;
      const caja = raiz.getBoundingClientRect();
      if (!dentroDeLaEsfera(evento.clientX - caja.left, evento.clientY - caja.top)) return;
      punteroActivo = evento.pointerId;
      ultimoX = evento.clientX;
      ultimoY = evento.clientY;
      estado.current.arrastrando = true;
      estado.current.impulsoLon = 0;
      estado.current.impulsoLat = 0;
      raiz.setAttribute("data-arrastre", "si");
    };

    const alMover = (evento: PointerEvent) => {
      const caja = raiz.getBoundingClientRect();
      const x = evento.clientX - caja.left;
      const y = evento.clientY - caja.top;
      sobrevolando = dentroDeLaEsfera(x, y) && estado.current.objetivoRevelado === 0;

      if (punteroActivo === evento.pointerId && estado.current.arrastrando) {
        const s = estado.current;
        const deltaLon = ((ultimoX - evento.clientX) * ARRASTRE_POR_PIXEL) / s.acercamiento;
        const deltaLat = ((evento.clientY - ultimoY) * ARRASTRE_POR_PIXEL) / s.acercamiento;
        ultimoX = evento.clientX;
        ultimoY = evento.clientY;
        s.lon += deltaLon;
        s.lat = Math.max(-72, Math.min(72, s.lat + deltaLat));
        s.impulsoLon = deltaLon;
        s.impulsoLat = deltaLat;
        s.animando = false;
        return;
      }

      const codigo = departamentoEn(x, y);
      raiz.setAttribute("data-sobre", codigo ? "departamento" : sobrevolando ? "esfera" : "fuera");
      if (codigo !== sobreRef.current) {
        sobreRef.current = codigo;
        alSobrevolar(codigo);
      }
    };

    const soltarArrastre = () => {
      punteroActivo = null;
      estado.current.arrastrando = false;
      raiz.removeAttribute("data-arrastre");
    };

    const alSalir = () => {
      sobrevolando = false;
      soltarArrastre();
      raiz.removeAttribute("data-sobre");
      if (sobreRef.current !== null) {
        sobreRef.current = null;
        alSobrevolar(null);
      }
    };

    raiz.addEventListener("pointerdown", alBajar);
    window.addEventListener("pointermove", alMover);
    window.addEventListener("pointerup", soltarArrastre);
    raiz.addEventListener("pointerleave", alSalir);

    const observador = new ResizeObserver(medir);
    observador.observe(raiz);

    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      raiz.removeEventListener("pointerdown", alBajar);
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerup", soltarArrastre);
      raiz.removeEventListener("pointerleave", alSalir);
      punteroRef.current = null;
    };
  }, [alSobrevolar]);

  const total = marcas.reduce((suma, marca) => suma + marca.valor, 0);

  return (
    <div className="globo" data-vista={vista}>
      <p className="globo__lectura rotulo" aria-live="polite">
        {vista === "mundo"
          ? `Colombia · ${numero(total)} ${unidad} registrados`
          : destacado
            ? `${destacado.nombre} · ${numero(destacado.valor)} ${unidad}`
            : `${marcas.length} departamentos con presencia`}
      </p>

      <div className="globo__disco" ref={contenedor}>
        <canvas ref={lienzo} className="globo__lienzo" aria-hidden="true" />
        <button
          type="button"
          className="globo__disparador"
          onClick={(evento) => {
            if (estado.current.impulsoLon !== 0 && Math.abs(estado.current.impulsoLon) > 0.4) return;
            if (vista === "colombia" && onAbrirFicha) {
              const caja = evento.currentTarget.getBoundingClientRect();
              const codigo = punteroRef.current?.(evento.clientX - caja.left, evento.clientY - caja.top);
              if (codigo) {
                onAbrirFicha(codigo);
                return;
              }
            }
            irA(vista === "mundo" ? "colombia" : "mundo");
          }}
        >
          <span className="globo__disparador-texto">
            {vista === "mundo"
              ? "Ver la operación en Colombia"
              : destacado
                ? `Ver ${destacado.nombre}`
                : "Volver al mundo"}
          </span>
        </button>
        <span className="globo__pista rotulo" aria-hidden="true">
          Arrastra para girar
        </span>
      </div>

      <p className="solo-lectores">
        {`Presencia de SICAMED en ${marcas.length} departamentos de Colombia: `}
        {marcas.map((marca) => `${marca.nombre}, ${numero(marca.valor)} ${unidad}`).join("; ")}.
      </p>
    </div>
  );
};
