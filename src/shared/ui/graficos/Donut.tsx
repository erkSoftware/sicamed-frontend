import { numero, porcentaje } from "../../i18n/formato";

export type SegmentoDonut = {
  etiqueta: string;
  valor: number;
  color: string;
};

type Props = {
  segmentos: readonly SegmentoDonut[];
  titulo: string;
  centroEtiqueta?: string;
};

export const Donut = ({ segmentos, titulo, centroEtiqueta }: Props) => {
  const total = segmentos.reduce((suma, segmento) => suma + segmento.valor, 0) || 1;
  const radio = 66;
  const circunferencia = 2 * Math.PI * radio;
  let acumulado = 0;

  return (
    <div className="anillo">
      <svg viewBox="0 0 160 160" className="anillo__lienzo" role="img" aria-label={titulo}>
        <g transform="translate(80 80) rotate(-90)">
          <circle r={radio} fill="none" stroke="var(--borde-suave)" strokeWidth={10} />
          {segmentos.map((segmento) => {
            const longitud = (segmento.valor / total) * circunferencia;
            const desfase = -acumulado;
            acumulado += longitud;
            return (
              <circle
                key={segmento.etiqueta}
                r={radio}
                fill="none"
                stroke={segmento.color}
                strokeWidth={10}
                strokeDasharray={`${Math.max(longitud - 1.5, 0)} ${circunferencia - longitud + 1.5}`}
                strokeDashoffset={desfase}
              />
            );
          })}
        </g>
        <text className="anillo__cifra" x={80} y={78} textAnchor="middle">
          {numero(total)}
        </text>
        {centroEtiqueta ? (
          <text className="anillo__pie" x={80} y={95} textAnchor="middle">
            {centroEtiqueta}
          </text>
        ) : null}
      </svg>
      <ul className="anillo__leyenda">
        {segmentos.map((segmento) => (
          <li key={segmento.etiqueta}>
            <span aria-hidden="true" className="anillo__muestra" style={{ background: segmento.color }} />
            <span className="anillo__etiqueta">{segmento.etiqueta}</span>
            <span className="anillo__valor mono">{numero(segmento.valor)}</span>
            <span className="anillo__parte mono">{porcentaje(segmento.valor / total, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
