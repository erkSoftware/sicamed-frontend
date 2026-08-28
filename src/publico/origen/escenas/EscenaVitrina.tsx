const ANCHO = 1600;
const ALTO = 900;

const FICHAS = [
  { x: 240, y: 470 },
  { x: 622, y: 470 },
  { x: 1004, y: 470 },
  { x: 240, y: 646 },
  { x: 622, y: 646 },
  { x: 1004, y: 646 },
];

export const EscenaVitrina = () => (
  <div className="cine__vitrina">
    <div className="cine__cielo" data-luz="vitrina" />

    <svg
      className="cine__lamina"
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <g className="cine__marco">
        <rect x="188" y="196" width="1224" height="672" rx="22" />
        <path d="M 188 268 L 1412 268" />
        <circle cx="228" cy="232" r="7" />
        <circle cx="254" cy="232" r="7" />
        <circle cx="280" cy="232" r="7" />
      </g>

      <g className="cine__campo">
        <rect x="306" y="336" width="988" height="76" rx="38" />
        <circle cx="368" cy="374" r="15" />
        <path d="M 379 385 L 392 398" />
        <rect className="cine__cursor" x="416" y="356" width="2" height="36" />
      </g>

      <g className="cine__fichas">
        {FICHAS.map((ficha, indice) => (
          <g key={`${ficha.x}-${ficha.y}`} style={{ animationDelay: `${0.24 + indice * 0.13}s` }}>
            <rect x={ficha.x} y={ficha.y} width="356" height="146" rx="16" />
            <path d={`M ${ficha.x + 28} ${ficha.y + 44} L ${ficha.x + 210} ${ficha.y + 44}`} />
            <path d={`M ${ficha.x + 28} ${ficha.y + 80} L ${ficha.x + 298} ${ficha.y + 80}`} />
            <path d={`M ${ficha.x + 28} ${ficha.y + 110} L ${ficha.x + 156} ${ficha.y + 110}`} />
          </g>
        ))}
      </g>
    </svg>
  </div>
);
