import { useId } from "react";
import { numero } from "../../i18n/formato";

export type PuntoSerie = {
  etiqueta: string;
  valor: number;
  rechazos: number;
};

type Props = {
  serie: readonly PuntoSerie[];
  titulo: string;
};

const GUIAS = [0, 25, 50, 75, 100] as const;
const CORTES = [1, 0.5, 0] as const;

export const LineaTendencia = ({ serie, titulo }: Props) => {
  const corte = `corte-${useId().replace(/:/g, "")}`;
  const maximo = Math.max(...serie.map((punto) => Math.max(punto.valor, punto.rechazos)), 1);
  const paso = 100 / Math.max(serie.length - 1, 1);
  const coordenadas = serie.map((punto, indice) => ({
    x: indice * paso,
    y: 100 - (punto.valor / maximo) * 100,
    yRechazo: 100 - (punto.rechazos / maximo) * 100,
    punto,
  }));

  const trazo = (clave: "y" | "yRechazo") =>
    coordenadas.map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${c[clave]}`).join(" ");

  const linea = trazo("y");
  const area = `${linea} L100 100 L0 100 Z`;

  return (
    <figure className="tendencia">
      <div className="tendencia__cuerpo">
        <ul className="tendencia__escala" aria-hidden="true">
          {CORTES.map((corte) => (
            <li key={corte} className="mono">
              {numero(Math.round(maximo * corte))}
            </li>
          ))}
        </ul>

        <div className="tendencia__marco">
          {GUIAS.map((guia) => (
            <span
              key={guia}
              className="tendencia__guia"
              data-base={guia === 100 ? "si" : undefined}
              style={{ top: `${guia}%` }}
              aria-hidden="true"
            />
          ))}
          <svg
            className="tendencia__lienzo"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            aria-label={titulo}
          >
            <defs>
              <clipPath id={corte} clipPathUnits="userSpaceOnUse">
                <rect className="tendencia__cortina" x="0" y="-2" width="100" height="104" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${corte})`}>
              <path className="tendencia__area" d={area} />
              <path className="tendencia__linea" d={linea} vectorEffect="non-scaling-stroke" />
              <path
                className="tendencia__linea tendencia__linea--rechazo"
                d={trazo("yRechazo")}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          </svg>
          {coordenadas.map((c, indice) => (
            <span
              key={c.punto.etiqueta}
              className="tendencia__nodo"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                animationDelay: `${140 + indice * 90}ms`,
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <ol className="tendencia__meses" aria-hidden="true">
        {serie.map((punto) => (
          <li key={punto.etiqueta} className="mono">
            {punto.etiqueta}
          </li>
        ))}
      </ol>

      <figcaption className="tendencia__leyenda">
        <span>
          <span aria-hidden="true" className="tendencia__muestra" /> Ofertas publicadas
        </span>
        <span>
          <span aria-hidden="true" className="tendencia__muestra tendencia__muestra--rechazo" /> Rechazos
          por norma
        </span>
      </figcaption>

      <table className="solo-lectores">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Ofertas publicadas</th>
            <th scope="col">Rechazos por norma</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((punto) => (
            <tr key={punto.etiqueta}>
              <th scope="row">{punto.etiqueta}</th>
              <td>{numero(punto.valor)}</td>
              <td>{numero(punto.rechazos)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};
