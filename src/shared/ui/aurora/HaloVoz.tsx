import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { seguir } from "./voz/nivel";
import { useMovimientoSobrio } from "../movimiento/useMovimientoSobrio";

type Props = {
  nivel: () => number;
  activa: boolean;
};

type Chispa = {
  velocidad: number;
  origen: number;
  escala: number;
  variable: string;
};

const CHISPAS: readonly Chispa[] = [
  { velocidad: 0.055, origen: 0, escala: 1, variable: "--halo-a" },
  { velocidad: -0.041, origen: 0.18, escala: 0.82, variable: "--halo-b" },
  { velocidad: 0.072, origen: 0.37, escala: 0.68, variable: "--halo-c" },
  { velocidad: -0.063, origen: 0.52, escala: 0.9, variable: "--halo-b" },
  { velocidad: 0.038, origen: 0.68, escala: 0.75, variable: "--halo-a" },
  { velocidad: -0.085, origen: 0.83, escala: 0.6, variable: "--halo-c" },
];

const RESPALDO: Record<string, string> = {
  "--halo-a": "30, 158, 82",
  "--halo-b": "111, 215, 154",
  "--halo-c": "169, 233, 196",
};

const GROSOR_POR_DEFECTO = 26;

export const enPerimetro = (
  avance: number,
  ancho: number,
  alto: number,
): { x: number; y: number } => {
  const vuelta = ((avance % 1) + 1) % 1;
  const recorrido = vuelta * 2 * (ancho + alto);
  if (recorrido <= ancho) return { x: recorrido, y: 0 };
  if (recorrido <= ancho + alto) return { x: ancho, y: recorrido - ancho };
  if (recorrido <= 2 * ancho + alto) return { x: 2 * ancho + alto - recorrido, y: alto };
  return { x: 0, y: 2 * (ancho + alto) - recorrido };
};

const leerColores = (elemento: HTMLElement): Record<string, string> => {
  const estilos = getComputedStyle(elemento);
  const salida: Record<string, string> = {};
  Object.entries(RESPALDO).forEach(([clave, respaldo]) => {
    const valor = estilos.getPropertyValue(clave).trim();
    salida[clave] = valor === "" ? respaldo : valor;
  });
  return salida;
};

const leerGrosor = (elemento: HTMLElement): number => {
  const crudo = parseFloat(getComputedStyle(elemento).getPropertyValue("--halo-grosor"));
  return Number.isFinite(crudo) && crudo > 0 ? crudo : GROSOR_POR_DEFECTO;
};

const construirMascara = (
  ancho: number,
  alto: number,
  razon: number,
  grosor: number,
): HTMLCanvasElement => {
  const mascara = document.createElement("canvas");
  mascara.width = Math.max(1, Math.round(ancho * razon));
  mascara.height = Math.max(1, Math.round(alto * razon));
  const pincel = mascara.getContext("2d");
  if (!pincel) return mascara;

  pincel.setTransform(razon, 0, 0, razon, 0, 0);
  pincel.globalCompositeOperation = "lighter";

  const franja = (
    desdeX: number,
    desdeY: number,
    hastaX: number,
    hastaY: number,
    x: number,
    y: number,
    anchoFranja: number,
    altoFranja: number,
  ) => {
    const degradado = pincel.createLinearGradient(desdeX, desdeY, hastaX, hastaY);
    degradado.addColorStop(0, "rgba(0, 0, 0, 1)");
    degradado.addColorStop(0.45, "rgba(0, 0, 0, 0.55)");
    degradado.addColorStop(1, "rgba(0, 0, 0, 0)");
    pincel.fillStyle = degradado;
    pincel.fillRect(x, y, anchoFranja, altoFranja);
  };

  franja(0, 0, 0, grosor, 0, 0, ancho, grosor);
  franja(0, alto, 0, alto - grosor, 0, alto - grosor, ancho, grosor);
  franja(0, 0, grosor, 0, 0, 0, grosor, alto);
  franja(ancho, 0, ancho - grosor, 0, ancho - grosor, 0, grosor, alto);

  return mascara;
};

export const HaloVoz = ({ nivel, activa }: Props) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const viva = useRef(activa);
  const sobrio = useMovimientoSobrio();
  const quieto = useRef(sobrio);
  const [montado, fijarMontado] = useState(false);

  viva.current = activa;
  quieto.current = sobrio;

  useEffect(() => fijarMontado(true), []);

  useEffect(() => {
    const elemento = lienzo.current;
    const pincel = elemento?.getContext("2d");
    if (!elemento || !pincel) return undefined;

    let colores = leerColores(elemento);
    let grosor = leerGrosor(elemento);
    let mascara = construirMascara(1, 1, 1, grosor);
    let ancho = 0;
    let alto = 0;
    let energia = 0;
    let tiempo = 0;
    let anterior = performance.now();
    let cuadro = 0;
    let vueltas = 0;

    const medir = () => {
      const razon = Math.min(window.devicePixelRatio || 1, 2);
      ancho = Math.max(1, window.innerWidth);
      alto = Math.max(1, window.innerHeight);
      elemento.width = Math.round(ancho * razon);
      elemento.height = Math.round(alto * razon);
      pincel.setTransform(razon, 0, 0, razon, 0, 0);
      colores = leerColores(elemento);
      grosor = leerGrosor(elemento);
      mascara = construirMascara(ancho, alto, razon, grosor);
    };

    medir();
    window.addEventListener("resize", medir);

    const pintar = (ahora: number) => {
      const salto = Math.min(0.05, (ahora - anterior) / 1000);
      anterior = ahora;
      vueltas += 1;
      if (vueltas % 90 === 0) colores = leerColores(elemento);
      if (!quieto.current) tiempo += salto;

      const objetivo = viva.current ? Math.min(1, nivel()) : 0;
      energia = seguir(energia, objetivo, 0.3, 0.05);

      pincel.clearRect(0, 0, ancho, alto);

      if (energia > 0.004) {
        const alcance = (ancho + alto) * 0.075;
        const fondo = colores["--halo-a"] ?? RESPALDO["--halo-a"];

        pincel.globalCompositeOperation = "lighter";
        pincel.fillStyle = `rgba(${fondo}, ${0.1 + 0.3 * energia})`;
        pincel.fillRect(0, 0, ancho, alto);

        CHISPAS.forEach((chispa) => {
          const { x, y } = enPerimetro(chispa.origen + tiempo * chispa.velocidad, ancho, alto);
          const radio = alcance * chispa.escala * (0.7 + energia * 0.8);
          const tinta = colores[chispa.variable] ?? RESPALDO[chispa.variable];
          const degradado = pincel.createRadialGradient(x, y, 0, x, y, radio);
          degradado.addColorStop(0, `rgba(${tinta}, ${0.55 * energia + 0.1})`);
          degradado.addColorStop(0.5, `rgba(${tinta}, ${0.24 * energia + 0.04})`);
          degradado.addColorStop(1, `rgba(${tinta}, 0)`);
          pincel.fillStyle = degradado;
          pincel.beginPath();
          pincel.arc(x, y, radio, 0, Math.PI * 2);
          pincel.fill();
        });

        pincel.globalCompositeOperation = "destination-in";
        pincel.drawImage(mascara, 0, 0, ancho, alto);
        pincel.globalCompositeOperation = "source-over";
      }

      cuadro = requestAnimationFrame(pintar);
    };

    cuadro = requestAnimationFrame(pintar);

    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("resize", medir);
    };
  }, [nivel, montado]);

  if (!montado || typeof document === "undefined") return null;

  return createPortal(<canvas ref={lienzo} aria-hidden="true" className="aurora-halo" />, document.body);
};
