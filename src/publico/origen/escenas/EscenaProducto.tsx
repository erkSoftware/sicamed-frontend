const ANCHO = 1600;
const ALTO = 900;

const NODOS = [
  { x: 214, y: 236 },
  { x: 386, y: 158 },
  { x: 548, y: 288 },
  { x: 268, y: 402 },
  { x: 1062, y: 202 },
  { x: 1246, y: 306 },
  { x: 1408, y: 176 },
  { x: 1332, y: 448 },
  { x: 128, y: 560 },
  { x: 1490, y: 592 },
];

const ENLACES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [5, 7],
  [3, 8],
  [7, 9],
  [2, 4],
];

export const EscenaProducto = () => (
  <div className="cine__producto">
    <div className="cine__cielo" data-luz="producto" />

    <svg
      className="cine__lamina"
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <defs>
        <linearGradient id="cine-frasco" x1="0" y1="0" x2="0.4" y2="1">
          <stop className="cine__frasco-alto" offset="0" />
          <stop className="cine__frasco-bajo" offset="1" />
        </linearGradient>
      </defs>

      <g className="cine__red">
        {ENLACES.map(([desde, hasta], indice) => {
          const a = NODOS[desde as number];
          const b = NODOS[hasta as number];
          if (!a || !b) return null;
          return (
            <line
              key={`${desde}-${hasta}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              style={{ animationDelay: `${indice * 0.18}s` }}
            />
          );
        })}
        {NODOS.map((nodo, indice) => (
          <circle
            key={`${nodo.x}-${nodo.y}`}
            cx={nodo.x}
            cy={nodo.y}
            r="5"
            style={{ animationDelay: `${indice * 0.22}s` }}
          />
        ))}
      </g>

      <g className="cine__mesa">
        <path d="M 0 690 L 1600 690 L 1600 900 L 0 900 Z" />
        <ellipse className="cine__foco-mesa" cx="800" cy="694" rx="430" ry="58" />
      </g>

      <g className="cine__objeto">
        <path
          d="M 742 690 L 742 452 q 0 -22 18 -30 l 0 -34 l 80 0 l 0 34 q 18 8 18 30 l 0 238 z"
          fill="url(#cine-frasco)"
        />
        <path className="cine__objeto-brillo" d="M 762 468 L 762 664" />
        <rect className="cine__objeto-tapa" x="752" y="368" width="96" height="26" rx="8" />
        <path className="cine__objeto-caja" d="M 902 690 L 902 512 L 1044 512 L 1044 690 Z" />
        <path className="cine__objeto-canto" d="M 1044 512 L 1082 486 L 1082 664 L 1044 690" />
        <path className="cine__objeto-tapa-caja" d="M 902 512 L 940 486 L 1082 486 L 1044 512 Z" />
        <path className="cine__objeto-caja" d="M 556 690 L 556 566 L 686 566 L 686 690 Z" />
        <path className="cine__objeto-canto" d="M 686 566 L 718 544 L 718 668 L 686 690" />
        <path className="cine__objeto-tapa-caja" d="M 556 566 L 588 544 L 718 544 L 686 566 Z" />
      </g>

      <ellipse className="cine__sombra" cx="800" cy="700" rx="300" ry="24" />
    </svg>

    <div className="cine__contraluz" />
  </div>
);
