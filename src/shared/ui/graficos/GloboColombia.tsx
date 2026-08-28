import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CENTRO_COLOMBIA } from "../../api/mock/mundo";
import { CONTORNOS } from "../../api/mock/contornos";
import { invertirOrtografica, puntoEnAnillo, type Camara } from "../../geo/proyecciones";
import { numero } from "../../i18n/formato";
import { leerPaletaGlobo, pintarGlobo, type MarcaGlobo } from "./pintarGlobo";

export type { MarcaGlobo } from "./pintarGlobo";

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

  const datos = useMemo(
    () => ({
      maximo: Math.max(...marcas.map((marca) => marca.valor), 1),
      porCodigo: new Map(marcas.map((marca) => [marca.codigo, marca])),
    }),
    [marcas],
  );
  const destacadoRef = useRef<string | null>(null);
  const punteroRef = useRef<((x: number, y: number) => string | null) | null>(null);
  const sobreRef = useRef<string | null>(null);
  const datosRef = useRef(datos);
  const marcasRef = useRef(marcas);
  destacadoRef.current = destacado?.codigo ?? null;
  datosRef.current = datos;
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
    let caja = raiz.getBoundingClientRect();
    let cajaVieja = false;
    let enPantalla = true;
    let sucio = true;
    let ultimoDestacado: string | null = null;
    let punteroX = 0;
    let punteroY = 0;
    let punteroSucio = false;

    const paleta = leerPaletaGlobo(raiz);

    const situar = () => {
      caja = raiz.getBoundingClientRect();
      cajaVieja = false;
    };

    const invalidarCaja = () => {
      cajaVieja = true;
    };

    const medir = () => {
      situar();
      const densidad = Math.min(window.devicePixelRatio || 1, 2);
      ancho = Math.max(caja.width, 1);
      alto = Math.max(caja.height, 1);
      elemento.width = Math.round(ancho * densidad);
      elemento.height = Math.round(alto * densidad);
      contexto.setTransform(densidad, 0, 0, densidad, 0, 0);
      sucio = true;
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

    const resolverPuntero = () => {
      if (!punteroSucio) return;
      punteroSucio = false;
      const codigo = departamentoEn(punteroX, punteroY);
      raiz.setAttribute("data-sobre", codigo ? "departamento" : sobrevolando ? "esfera" : "fuera");
      if (codigo !== sobreRef.current) {
        sobreRef.current = codigo;
        alSobrevolar(codigo);
      }
    };

    const dibujar = (ahora: number) => {
      const s = estado.current;
      const transcurrido = Math.min(ahora - previo, 64);
      previo = ahora;

      resolverPuntero();

      if (destacadoRef.current !== ultimoDestacado) {
        ultimoDestacado = destacadoRef.current;
        sucio = true;
      }

      const enMovimiento =
        s.animando ||
        s.arrastrando ||
        Math.abs(s.impulsoLon) > 0.01 ||
        Math.abs(s.impulsoLat) > 0.01 ||
        s.objetivoRevelado === 0;

      if (!enMovimiento && !sucio) {
        cuadro = requestAnimationFrame(dibujar);
        return;
      }
      sucio = false;

      if (s.animando) {
        const avance = Math.min(1, (ahora - s.inicio) / (reducido ? 1 : DURACION));
        const t = suavizar(avance);
        s.lon = s.desdeLon + (s.hastaLon - s.desdeLon) * t;
        s.lat = s.desdeLat + (s.hastaLat - s.desdeLat) * t;
        s.acercamiento = s.desdeAcercamiento + (s.hastaAcercamiento - s.desdeAcercamiento) * t;
        s.revelado = s.objetivoRevelado === 1 ? t : 1 - t;
        if (avance === 1) {
          s.animando = false;
          sucio = true;
        }
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

      const pulso = reducido || s.revelado > 0.5 ? 0.5 : (Math.sin(ahora / 620) + 1) / 2;

      pintarGlobo(contexto, {
        ancho,
        alto,
        camara: camaraActual(),
        visor: radioVisor(),
        revelado: s.revelado,
        pulso,
        paleta,
        porCodigo: datosRef.current.porCodigo,
        maximo: datosRef.current.maximo,
        destacado: destacadoRef.current,
      });

      cuadro = requestAnimationFrame(dibujar);
    };

    medir();
    cuadro = requestAnimationFrame(dibujar);

    const dentroDeLaEsfera = (x: number, y: number): boolean =>
      Math.hypot(x - ancho / 2, y - alto / 2) <= radioVisor();

    const alBajar = (evento: PointerEvent) => {
      if (estado.current.objetivoRevelado === 1) return;
      if (cajaVieja) situar();
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
      if (cajaVieja) situar();
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

      punteroX = x;
      punteroY = y;
      punteroSucio = true;
    };

    const soltarArrastre = () => {
      punteroActivo = null;
      estado.current.arrastrando = false;
      raiz.removeAttribute("data-arrastre");
    };

    const alSalir = () => {
      sobrevolando = false;
      punteroSucio = false;
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
    window.addEventListener("scroll", invalidarCaja, { passive: true });

    const observador = new ResizeObserver(medir);
    observador.observe(raiz);

    const vigia =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entradas) => {
              for (const entrada of entradas) {
                if (entrada.isIntersecting === enPantalla) continue;
                enPantalla = entrada.isIntersecting;
                if (!enPantalla) {
                  cancelAnimationFrame(cuadro);
                  cuadro = 0;
                  continue;
                }
                invalidarCaja();
                previo = performance.now();
                sucio = true;
                cuadro = requestAnimationFrame(dibujar);
              }
            },
            { rootMargin: "120px" },
          );
    vigia?.observe(raiz);

    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      vigia?.disconnect();
      raiz.removeEventListener("pointerdown", alBajar);
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerup", soltarArrastre);
      raiz.removeEventListener("pointerleave", alSalir);
      window.removeEventListener("scroll", invalidarCaja);
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
