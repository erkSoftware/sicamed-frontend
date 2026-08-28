import { ABANICO_CANNABIS, foliolo } from "../../../shared/ui/graficos/relieve";

const ANCHO = 1600;
const ALTO = 900;

const NERVIOS_SECUNDARIOS = [0.28, 0.44, 0.6, 0.74, 0.86];

export const EscenaHoja = () => (
  <div className="cine__hoja">
    <div className="cine__cielo" data-luz="hoja" />

    <svg
      className="cine__lamina"
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <defs>
        <radialGradient id="cine-savia" cx="0.5" cy="0.86" r="0.72">
          <stop className="cine__savia-centro" offset="0" />
          <stop className="cine__savia-borde" offset="1" />
        </radialGradient>
      </defs>

      <g transform="translate(800 806) scale(3.35)">
        {ABANICO_CANNABIS.map((hoja) => (
          <g key={hoja.giro} transform={`rotate(${hoja.giro})`}>
            <path
              className="cine__lamina-hoja"
              d={foliolo(hoja.largo, hoja.ancho)}
              fill="url(#cine-savia)"
            />
            <path className="cine__vena" d={`M 0 -6 L 0 ${-hoja.largo * 0.9}`} />
            {NERVIOS_SECUNDARIOS.map((tramo) => (
              <g key={tramo}>
                <path
                  className="cine__vena cine__vena--fina"
                  d={`M 0 ${-hoja.largo * tramo} L ${hoja.ancho * 0.62} ${-hoja.largo * (tramo + 0.09)}`}
                />
                <path
                  className="cine__vena cine__vena--fina"
                  d={`M 0 ${-hoja.largo * tramo} L ${-hoja.ancho * 0.62} ${-hoja.largo * (tramo + 0.09)}`}
                />
              </g>
            ))}
          </g>
        ))}
      </g>

      <g className="cine__conductos">
        {[188, 372, 556, 1044, 1228, 1412].map((x) => (
          <path key={x} d={`M ${x} 900 L ${x} 372 q 0 -58 58 -58 L 800 314`} />
        ))}
      </g>
    </svg>

    <div className="cine__rocio">
      {Array.from({ length: 16 }, (_, indice) => (
        <span
          key={indice}
          style={{
            left: `${8 + ((indice * 191) % 84)}%`,
            top: `${34 + ((indice * 59) % 52)}%`,
            width: `${3 + (indice % 5)}px`,
            height: `${3 + (indice % 5)}px`,
            animationDelay: `${(indice % 8) * 0.42}s`,
          }}
        />
      ))}
    </div>
  </div>
);
