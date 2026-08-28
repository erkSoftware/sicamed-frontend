import { Persona } from "./Persona";

const ANCHO = 1600;
const ALTO = 900;

const COLUMNAS = [
  { x: 268, ancho: 118, alto: 322, nivel: 0.42, retardo: 0 },
  { x: 452, ancho: 92, alto: 268, nivel: 0.62, retardo: 1.1 },
  { x: 1064, ancho: 96, alto: 288, nivel: 0.5, retardo: 0.6 },
  { x: 1252, ancho: 124, alto: 340, nivel: 0.34, retardo: 1.7 },
];

const GOTEO = [
  { x: 326, retardo: 0 },
  { x: 498, retardo: 1.4 },
  { x: 1112, retardo: 0.8 },
  { x: 1314, retardo: 2.1 },
];

export const EscenaLaboratorio = () => (
  <div className="cine__laboratorio">
    <div className="cine__cielo" data-luz="laboratorio" />

    <svg
      className="cine__lamina"
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <g className="cine__banco">
        <path d="M 0 664 L 1600 664 L 1600 700 L 0 700 Z" />
        <path className="cine__banco-reflejo" d="M 0 700 L 1600 700 L 1600 900 L 0 900 Z" />
      </g>

      <g className="cine__vidrio">
        {COLUMNAS.map((columna) => (
          <g key={columna.x}>
            <rect
              x={columna.x}
              y={664 - columna.alto}
              width={columna.ancho}
              height={columna.alto}
              rx={columna.ancho / 2.6}
            />
            <rect
              className="cine__liquido"
              x={columna.x + 5}
              y={664 - columna.alto * columna.nivel}
              width={columna.ancho - 10}
              height={columna.alto * columna.nivel - 5}
              rx={columna.ancho / 3}
              style={{ animationDelay: `${-columna.retardo}s` }}
            />
            <path
              className="cine__brillo"
              d={`M ${columna.x + 14} ${664 - columna.alto + 26} L ${columna.x + 14} ${650}`}
            />
          </g>
        ))}

        <path d="M 700 372 L 900 372 M 760 372 L 760 470 L 706 596 q -10 40 32 40 l 124 0 q 42 0 32 -40 L 840 470 L 840 372" />
      </g>

      <g className="cine__molecula">
        {[
          [800, 250],
          [746, 282],
          [854, 282],
          [746, 344],
          [854, 344],
          [800, 376],
        ].map(([x, y], indice) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="7"
            style={{ animationDelay: `${indice * 0.24}s` }}
          />
        ))}
        <path d="M 800 250 L 746 282 L 746 344 L 800 376 L 854 344 L 854 282 Z" />
      </g>

      <g className="cine__gente">
        <Persona x={1442} y={664} escala={1.02} />
      </g>
    </svg>

    <div className="cine__goteo">
      {GOTEO.map((gota) => (
        <span
          key={gota.x}
          style={{ left: `${(gota.x / ANCHO) * 100}%`, animationDelay: `${gota.retardo}s` }}
        />
      ))}
    </div>

    <div className="cine__halo-lab" />
  </div>
);
