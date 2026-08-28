import { ABANICO_CANNABIS, cresta, foliolo } from "../../../shared/ui/graficos/relieve";
import { Persona } from "./Persona";

const ANCHO = 1600;
const ALTO = 900;

const LEJANIA = [
  {
    plano: "a",
    trazo: cresta({
      semilla: 5.6,
      base: 372,
      amplitud: 118,
      dientes: 26,
      ancho: ANCHO,
      alto: ALTO,
    }),
  },
  {
    plano: "b",
    trazo: cresta({
      semilla: 13.9,
      base: 448,
      amplitud: 96,
      dientes: 20,
      ancho: ANCHO,
      alto: ALTO,
    }),
  },
];

const Abanico = () => (
  <g>
    {ABANICO_CANNABIS.map((hoja) => (
      <g key={hoja.giro} transform={`rotate(${hoja.giro})`}>
        <path className="cine__foliolo" d={foliolo(hoja.largo, hoja.ancho)} />
        <path className="cine__nervio" d={`M 0 -8 L 0 ${-hoja.largo * 0.86}`} />
      </g>
    ))}
  </g>
);

const surco = (base: number, escala: number, cantidad: number, semilla: number) =>
  Array.from({ length: cantidad }, (_, indice) => {
    const paso = ANCHO / (cantidad - 1);
    return {
      x: indice * paso - paso / 2 + ((semilla * (indice + 3)) % 44),
      y: base + ((semilla * (indice + 1)) % 18),
      giro: -12 + ((semilla * (indice + 5)) % 25),
      escala,
    };
  });

const SURCOS = [
  { plano: "hondo", matas: surco(520, 0.5, 13, 7), retardo: 0 },
  { plano: "medio", matas: surco(618, 0.86, 10, 11), retardo: 1.4 },
  { plano: "cercano", matas: surco(766, 1.42, 8, 17), retardo: 2.6 },
  { plano: "frente", matas: surco(1010, 2.4, 6, 23), retardo: 0.7 },
];

const GOTAS = Array.from({ length: 22 }, (_, indice) => ({
  x: `${4 + ((indice * 173) % 92)}%`,
  y: `${48 + ((indice * 47) % 44)}%`,
  radio: 2 + (indice % 4),
  retardo: (indice % 11) * 0.6,
}));

const RAYOS = [
  { x: "12%", giro: -13, ancho: "16%", opacidad: 0.5 },
  { x: "34%", giro: -9, ancho: "9%", opacidad: 0.34 },
  { x: "63%", giro: -11, ancho: "13%", opacidad: 0.42 },
  { x: "84%", giro: -7, ancho: "8%", opacidad: 0.26 },
];

export const EscenaCultivo = () => (
  <div className="cine__cultivo">
    <div className="cine__cielo" data-luz="cultivo" />

    <svg
      className="cine__lamina"
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <g className="cine__lejania">
        {LEJANIA.map((sierra) => (
          <path key={sierra.plano} data-plano={sierra.plano} d={sierra.trazo} />
        ))}
      </g>

      <g className="cine__invernadero">
        {[0, 1, 2, 3, 4].map((indice) => (
          <path
            key={indice}
            d={`M ${120 + indice * 320} 470 Q ${240 + indice * 320} 336 ${360 + indice * 320} 470`}
          />
        ))}
        <path d="M 0 470 L 1600 470" />
      </g>

      <g className="cine__gente">
        <Persona x={1092} y={606} escala={0.62} sombrero />
        <Persona x={1216} y={620} escala={0.5} sombrero />
      </g>

      {SURCOS.map((fila) => (
        <g key={fila.plano} className="cine__surco" data-plano={fila.plano}>
          {fila.matas.map((mata) => (
            <g key={`${mata.x}-${mata.y}`} transform={`translate(${mata.x} ${mata.y})`}>
              <g
                className="cine__mece"
                style={{
                  animationDelay: `${-((Math.abs(mata.x) + mata.y) % 8) - fila.retardo}s`,
                  animationDuration: `${7 + ((Math.abs(mata.giro) + 2) % 6)}s`,
                }}
              >
                <g transform={`rotate(${mata.giro}) scale(${mata.escala})`}>
                  <path className="cine__tallo" d="M 0 0 C -7 40 -3 82 5 126" />
                  <Abanico />
                </g>
              </g>
            </g>
          ))}
        </g>
      ))}
    </svg>

    <div className="cine__rayos">
      {RAYOS.map((rayo) => (
        <span
          key={rayo.x}
          style={{
            left: rayo.x,
            width: rayo.ancho,
            opacity: rayo.opacidad,
            transform: `rotate(${rayo.giro}deg)`,
          }}
        />
      ))}
    </div>

    <div className="cine__gotas">
      {GOTAS.map((gota) => (
        <span
          key={`${gota.x}-${gota.y}`}
          style={{
            left: gota.x,
            top: gota.y,
            width: `${gota.radio}px`,
            height: `${gota.radio}px`,
            animationDelay: `${gota.retardo}s`,
          }}
        />
      ))}
    </div>
  </div>
);
