import { cresta } from "../../../shared/ui/graficos/relieve";

const ANCHO = 1600;
const ALTO = 900;

const ladera = (semilla: number, base: number, amplitud: number, dientes: number) =>
  cresta({ semilla, base, amplitud, dientes, ancho: ANCHO, alto: ALTO });

const SIERRAS = [
  { plano: "1", trazo: ladera(2.9, 392, 168, 40) },
  { plano: "2", trazo: ladera(6.1, 470, 156, 34) },
  { plano: "3", trazo: ladera(11.3, 556, 148, 30) },
  { plano: "4", trazo: ladera(18.7, 654, 138, 26) },
  { plano: "5", trazo: ladera(27.2, 764, 124, 20) },
];

const PARCELAS = Array.from({ length: 34 }, (_, indice) => ({
  x: 30 + ((indice * 149) % 1540),
  y: 690 + ((indice * 71) % 196),
  ancho: 52 + ((indice * 29) % 68),
  alto: 16 + ((indice * 17) % 20),
  giro: -12 + ((indice * 23) % 23),
  tono: indice % 3,
}));

const FALDA = SIERRAS.at(-1);

const NIEBLAS = [
  { y: "38%", alto: "5%", duracion: 116, retardo: 0 },
  { y: "51%", alto: "6%", duracion: 152, retardo: -44 },
  { y: "64%", alto: "7%", duracion: 194, retardo: -88 },
];

export const EscenaTierra = () => (
  <div className="cine__tierra">
    <div className="cine__cielo" />
    <div className="cine__sol" />

    <svg
      className="cine__lamina"
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      {SIERRAS.map((sierra) => (
        <g key={sierra.plano} className="cine__estrato" data-plano={sierra.plano}>
          <defs>
            <linearGradient id={`cine-ladera-${sierra.plano}`} x1="0" y1="0" x2="0.24" y2="1">
              <stop className="cine__cima" offset="0" />
              <stop className="cine__falda" offset="1" />
            </linearGradient>
          </defs>
          <path d={sierra.trazo} fill={`url(#cine-ladera-${sierra.plano})`} />
        </g>
      ))}

      <defs>
        <clipPath id="cine-falda">
          <path d={FALDA?.trazo ?? ""} />
        </clipPath>
      </defs>

      <g className="cine__parcelas" clipPath="url(#cine-falda)">
        {PARCELAS.map((parcela) => (
          <rect
            key={`${parcela.x}-${parcela.y}`}
            data-tono={parcela.tono}
            x={parcela.x}
            y={parcela.y}
            width={parcela.ancho}
            height={parcela.alto}
            rx="6"
            transform={`rotate(${parcela.giro} ${parcela.x + parcela.ancho / 2} ${parcela.y + parcela.alto / 2})`}
          />
        ))}
      </g>
    </svg>

    {NIEBLAS.map((niebla) => (
      <span
        key={niebla.duracion}
        className="cine__niebla"
        style={{
          top: niebla.y,
          height: niebla.alto,
          animationDuration: `${niebla.duracion}s`,
          animationDelay: `${niebla.retardo}s`,
        }}
      />
    ))}

    <div className="cine__luz-lateral" />
  </div>
);
