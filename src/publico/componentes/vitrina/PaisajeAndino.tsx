import type { CSSProperties } from "react";
import { useRevelado } from "../../../shared/ui/movimiento/useRevelado";
import type { MomentoDelDia } from "../../hooks/useMomentoDelDia";
import {
  ABANICO_CANNABIS,
  aperturaCentral,
  cresta,
  foliolo,
} from "../../../shared/ui/graficos/relieve";

const ANCHO = 1600;
const ALTO = 900;
const CENTRO = ANCHO / 2;

type Hoja = {
  x: number;
  y: number;
  giro: number;
  escala: number;
};

const apertura = aperturaCentral(CENTRO, 460, 0.44);

const ladera = (semilla: number, base: number, amplitud: number, dientes: number) =>
  cresta({ semilla, base, amplitud, dientes, ancho: ANCHO, alto: ALTO, apertura });

const recorte = (fraccion: number) =>
  `0 ${ALTO * (1 - fraccion)} ${ANCHO} ${ALTO * fraccion}`;

const CORDILLERA = [
  { plano: "1", trazo: ladera(1.7, 498, 198, 44), caja: recorte(0.72), niebla: null },
  {
    plano: "2",
    trazo: ladera(4.3, 572, 172, 40),
    caja: recorte(0.62),
    niebla: { banda: "alta", duracion: 126, retardo: 0 },
  },
  {
    plano: "3",
    trazo: ladera(9.1, 652, 152, 36),
    caja: recorte(0.5),
    niebla: { banda: "media", duracion: 168, retardo: -42 },
  },
  {
    plano: "4",
    trazo: ladera(15.4, 742, 134, 30),
    caja: recorte(0.38),
    niebla: { banda: "baja", duracion: 208, retardo: -95 },
  },
  { plano: "5", trazo: ladera(23.8, 842, 112, 24), caja: recorte(0.24), niebla: null },
];

const ESTRELLAS = Array.from({ length: 46 }, (_, indice) => ({
  x: `${((indice * 137) % 96) + 2}%`,
  y: `${2 + ((indice * 53) % 46)}%`,
  radio: indice % 6 === 0 ? 2.4 : 1.5,
  retardo: (indice % 9) * 0.7,
}));

const NUBES = [
  { alto: "10%", izquierda: "-30%", ancho: "48%", altura: "9%", duracion: 240, opacidad: 0.46 },
  { alto: "17%", izquierda: "-66%", ancho: "34%", altura: "6%", duracion: 320, opacidad: 0.3 },
  { alto: "5%", izquierda: "-98%", ancho: "54%", altura: "7%", duracion: 410, opacidad: 0.24 },
];

const Abanico = () => (
  <g>
    {ABANICO_CANNABIS.map((hoja) => (
      <g key={hoja.giro} transform={`rotate(${hoja.giro})`}>
        <path className="paisaje__foliolo" d={foliolo(hoja.largo, hoja.ancho)} />
        <path className="paisaje__nervio" d={`M 0 -8 L 0 ${-hoja.largo * 0.86}`} />
      </g>
    ))}
  </g>
);

const Mata = ({ hojas }: { hojas: readonly Hoja[] }) => (
  <g>
    {hojas.map((hoja) => (
      <g key={`${hoja.x}-${hoja.y}`} transform={`translate(${hoja.x} ${hoja.y})`}>
        <g
          className="paisaje__mece"
          style={
            {
              animationDelay: `${-((Math.abs(hoja.x) + hoja.y) % 9)}s`,
              animationDuration: `${9 + ((Math.abs(hoja.giro) + 3) % 7)}s`,
            } as CSSProperties
          }
        >
          <g transform={`rotate(${hoja.giro}) scale(${hoja.escala})`}>
            <path className="paisaje__tallo" d="M 0 0 C -7 40 -3 82 5 126" />
            <Abanico />
          </g>
        </g>
      </g>
    ))}
  </g>
);

const MATAS_FONDO: readonly Hoja[] = [
  { x: 104, y: 792, giro: -13, escala: 0.72 },
  { x: 268, y: 826, giro: 9, escala: 0.58 },
  { x: 1352, y: 820, giro: 15, escala: 0.62 },
  { x: 1512, y: 786, giro: -7, escala: 0.76 },
];

const MATAS_MEDIO: readonly Hoja[] = [
  { x: 18, y: 924, giro: -18, escala: 1.68 },
  { x: 246, y: 972, giro: 12, escala: 1.34 },
  { x: 1372, y: 966, giro: -11, escala: 1.4 },
  { x: 1588, y: 918, giro: 19, escala: 1.74 },
];

const MATAS_FRENTE: readonly Hoja[] = [
  { x: 452, y: 1262, giro: -9, escala: 3.2 },
  { x: 1156, y: 1274, giro: 11, escala: 3.1 },
  { x: -56, y: 1024, giro: -24, escala: 3.1 },
  { x: 186, y: 1082, giro: 14, escala: 2.5 },
  { x: 1436, y: 1076, giro: -16, escala: 2.6 },
  { x: 1664, y: 1016, giro: 22, escala: 3.2 },
];

type Props = {
  momento: MomentoDelDia;
};

export const PaisajeAndino = ({ momento }: Props) => {
  const { referencia, enPantalla } = useRevelado<HTMLDivElement>("200px", {
    seguir: true,
  });

  return (
    <div
      className="paisaje"
      ref={referencia}
      data-hora={momento}
      data-fuera-de-vista={enPantalla ? "no" : "si"}
      aria-hidden="true"
    >
      <div className="paisaje__camara">
        <div className="paisaje__cielo" />
        <div className="paisaje__astro" />
        <div className="paisaje__foto" />

        {momento === "noche" ? (
          <div className="paisaje__estrellas">
            {ESTRELLAS.map((estrella) => (
              <span
                key={`${estrella.x}-${estrella.y}`}
                style={
                  {
                    left: estrella.x,
                    top: estrella.y,
                    width: `${estrella.radio}px`,
                    height: `${estrella.radio}px`,
                    animationDelay: `${estrella.retardo}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        ) : null}

        <div className="paisaje__nubes">
          {NUBES.map((nube) => (
            <span
              key={nube.duracion}
              className="paisaje__nube"
              style={
                {
                  top: nube.alto,
                  left: nube.izquierda,
                  width: nube.ancho,
                  height: nube.altura,
                  opacity: nube.opacidad,
                  animationDuration: `${nube.duracion}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {CORDILLERA.map((sierra) => (
          <div key={sierra.plano} className="paisaje__estrato">
            <svg
              className="paisaje__sierra"
              data-plano={sierra.plano}
              viewBox={sierra.caja}
              preserveAspectRatio="xMidYMax slice"
              focusable="false"
            >
              <defs>
                <linearGradient id={`ladera-${sierra.plano}`} x1="0" y1="0" x2="0.22" y2="1">
                  <stop className="paisaje__cima" offset="0" />
                  <stop className="paisaje__falda" offset="1" />
                </linearGradient>
              </defs>
              <path d={sierra.trazo} fill={`url(#ladera-${sierra.plano})`} />
            </svg>
            {sierra.niebla ? (
              <span
                className="paisaje__niebla"
                data-banda={sierra.niebla.banda}
                style={
                  {
                    animationDuration: `${sierra.niebla.duracion}s`,
                    animationDelay: `${sierra.niebla.retardo}s`,
                  } as CSSProperties
                }
              />
            ) : null}
          </div>
        ))}

        <div className="paisaje__vaho" />

        <svg
          className="paisaje__follaje"
          data-plano="fondo"
          viewBox={recorte(0.35)}
          preserveAspectRatio="xMidYMax slice"
          focusable="false"
        >
          <Mata hojas={MATAS_FONDO} />
        </svg>
        <svg
          className="paisaje__follaje"
          data-plano="medio"
          viewBox={recorte(0.39)}
          preserveAspectRatio="xMidYMax slice"
          focusable="false"
        >
          <Mata hojas={MATAS_MEDIO} />
        </svg>
        <svg
          className="paisaje__follaje"
          data-plano="frente"
          viewBox={recorte(0.55)}
          preserveAspectRatio="xMidYMax slice"
          focusable="false"
        >
          <Mata hojas={MATAS_FRENTE} />
        </svg>
      </div>

      <div className="paisaje__luz" />
      <div className="paisaje__grano" />
      <div className="paisaje__velo" />
    </div>
  );
};
