import type { CSSProperties } from "react";

type EstiloDemora = CSSProperties & { "--demora"?: string };

export const demora = (ms: number): EstiloDemora => ({ "--demora": `${ms}ms` });

type FiguraProps = {
  x: number;
  y: number;
  escala?: number;
  sombrero?: boolean;
  bata?: boolean;
};

export const Figura = ({ x, y, escala = 1, sombrero, bata }: FiguraProps) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`}>
    <g className="telemed__figura">
      <path className="telemed__trazo" d="M-9 0 L-7 -40 L-1 -40 L-1 0 Z" />
      <path className="telemed__trazo" d="M1 0 L1 -40 L7 -40 L9 0 Z" />
      <path
        className={bata ? "telemed__trazo telemed__trazo--relleno" : "telemed__trazo"}
        d="M-12 -38 q-4 -27 3 -39 q4 -4 9 -4 q5 0 9 4 q7 12 3 39 z"
      />
      <path className="telemed__trazo" d="M-11 -74 q-10 11 -12 26" />
      <path className="telemed__trazo" d="M11 -74 q10 10 13 22" />
      <circle className="telemed__trazo" cx="0" cy="-89" r="7.5" />
      {sombrero ? <ellipse className="telemed__trazo" cx="0" cy="-95" rx="15" ry="3.8" /> : null}
    </g>
  </g>
);

const LEAFLET = "M0 0 C-3.4 -8 -3.4 -19 0 -27 C3.4 -19 3.4 -8 0 0 Z";

const ANGULOS = [-58, -30, 0, 30, 58] as const;
const LARGOS = [0.62, 0.86, 1, 0.86, 0.62] as const;

type PlantaProps = {
  x: number;
  y: number;
  escala?: number;
  retardo?: number;
};

export const Planta = ({ x, y, escala = 1, retardo = 0 }: PlantaProps) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`}>
    <g className="telemed__planta" style={demora(retardo)}>
      <path className="telemed__tallo" d="M0 0 C-2 -16 2 -30 0 -44" />
      {[0, 1, 2].map((nivel) => (
        <g key={nivel} transform={`translate(0 ${-16 - nivel * 13}) scale(${1 - nivel * 0.16})`}>
          {ANGULOS.map((angulo, indice) => (
            <path
              key={angulo}
              className="telemed__hoja"
              d={LEAFLET}
              transform={`rotate(${angulo}) scale(1 ${LARGOS[indice] ?? 1})`}
            />
          ))}
        </g>
      ))}
    </g>
  </g>
);

type PulsoProps = {
  x: number;
  y: number;
  radio: number;
  retardo?: number;
};

export const Pulso = ({ x, y, radio, retardo = 0 }: PulsoProps) => (
  <circle className="telemed__pulso" cx={x} cy={y} r={radio} style={demora(retardo)} />
);
