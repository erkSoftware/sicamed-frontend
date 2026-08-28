import type { ComponentType } from "react";
import { ABANICO_CANNABIS, foliolo } from "../../shared/ui/graficos/relieve";

export type Motivo = "semilla" | "brote" | "arraigo" | "pliego" | "abanico" | "sello";

const Abanico = ({ escala, opacidad = 1 }: { escala: number; opacidad?: number }) => (
  <g transform={`scale(${escala})`} opacity={opacidad}>
    {ABANICO_CANNABIS.map((hoja) => (
      <g key={hoja.giro} transform={`rotate(${hoja.giro})`}>
        <path className="lamina__hoja" d={foliolo(hoja.largo, hoja.ancho)} />
        <path className="lamina__nervio" d={`M 0 -6 L 0 ${-hoja.largo * 0.84}`} />
      </g>
    ))}
  </g>
);

const Semilla = () => (
  <g>
    <ellipse className="lamina__cuerpo" cx="0" cy="34" rx="21" ry="27" />
    <path className="lamina__nervio" d="M 0 12 C -6 -6 -3 -26 4 -44" />
    <g transform="translate(4 -44) scale(0.42)">
      <path className="lamina__hoja" d={foliolo(96, 22)} />
    </g>
    <path className="lamina__veta" d="M -9 30 C -3 20 3 20 9 30" />
  </g>
);

const Brote = () => (
  <g>
    <path className="lamina__nervio" d="M 0 62 C -4 26 -2 -6 0 -34" />
    <g transform="translate(0 -34) scale(0.5)">
      <path className="lamina__hoja" d={foliolo(112, 24)} />
    </g>
    <g transform="translate(-2 4) rotate(-56) scale(0.4)">
      <path className="lamina__hoja" d={foliolo(104, 23)} />
    </g>
    <g transform="translate(2 4) rotate(56) scale(0.4)">
      <path className="lamina__hoja" d={foliolo(104, 23)} />
    </g>
  </g>
);

const Arraigo = () => (
  <g>
    <path className="lamina__nervio" d="M 0 22 C -3 -4 -1 -22 0 -40" />
    <g transform="translate(0 -40) scale(0.46)">
      <path className="lamina__hoja" d={foliolo(108, 24)} />
    </g>
    <g transform="translate(0 -10) rotate(-62) scale(0.34)">
      <path className="lamina__hoja" d={foliolo(100, 22)} />
    </g>
    <g transform="translate(0 -10) rotate(62) scale(0.34)">
      <path className="lamina__hoja" d={foliolo(100, 22)} />
    </g>
    <path className="lamina__veta" d="M 0 22 C -14 38 -26 46 -38 60" />
    <path className="lamina__veta" d="M 0 22 C 14 38 26 46 38 60" />
    <path className="lamina__veta" d="M 0 22 C -4 42 -3 54 -6 70" />
    <path className="lamina__veta" d="M 0 22 C 5 42 4 54 8 70" />
  </g>
);

const Pliego = () => (
  <g>
    <g transform="translate(-26 10) rotate(-9)">
      <rect className="lamina__pliego" x="-30" y="-42" width="60" height="84" rx="4" />
    </g>
    <g transform="translate(-4 4) rotate(-3)">
      <rect className="lamina__pliego" x="-30" y="-42" width="60" height="84" rx="4" />
    </g>
    <g transform="translate(20 0) rotate(5)">
      <rect className="lamina__pliego lamina__pliego--frente" x="-30" y="-42" width="60" height="84" rx="4" />
      <path className="lamina__veta" d="M -16 -20 h 32 M -16 -6 h 32 M -16 8 h 20" />
      <g transform="translate(0 34) scale(0.2)">
        <path className="lamina__hoja" d={foliolo(110, 24)} />
      </g>
    </g>
  </g>
);

const AbanicoPleno = () => (
  <g transform="translate(0 46)">
    <path className="lamina__nervio" d="M 0 32 C -2 16 -1 8 0 0" />
    <Abanico escala={0.62} />
  </g>
);

const Sello = () => (
  <g>
    <circle className="lamina__aro" cx="0" cy="0" r="70" />
    <circle className="lamina__aro lamina__aro--fino" cx="0" cy="0" r="60" />
    <g transform="translate(0 34)">
      <Abanico escala={0.42} />
    </g>
    <path className="lamina__check" d="M -22 2 L -7 17 L 24 -18" />
  </g>
);

const MOTIVOS: Record<Motivo, ComponentType> = {
  semilla: Semilla,
  brote: Brote,
  arraigo: Arraigo,
  pliego: Pliego,
  abanico: AbanicoPleno,
  sello: Sello,
};

export const Lamina = ({ motivo }: { motivo: Motivo }) => {
  const Dibujo = MOTIVOS[motivo];
  return (
    <svg
      className="lamina"
      viewBox="-100 -100 200 200"
      role="presentation"
      focusable="false"
      aria-hidden="true"
    >
      <Dibujo />
    </svg>
  );
};
