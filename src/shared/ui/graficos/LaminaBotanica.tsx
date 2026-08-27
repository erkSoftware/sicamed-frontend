import { useId } from "react";
import {
  FLOR_BRACTEAS,
  FLOR_HOJAS,
  FLOR_PISTILOS,
  FLOR_TALLO,
  HOJA_CONTORNOS,
  HOJA_NERVIOS,
  HOJA_PECIOLO,
} from "./laminaCannabis";

type Marca = {
  numero: number;
  x: number;
  y: number;
  anclaX: number;
  anclaY: number;
  termino: string;
  glosa: string;
};

const MARCAS_HOJA: readonly Marca[] = [
  {
    numero: 1,
    x: -74,
    y: -286,
    anclaX: -6,
    anclaY: -250,
    termino: "Folíolo central",
    glosa: "Hoja palmada de siete folíolos; el central marca el eje de la lámina.",
  },
  {
    numero: 2,
    x: 148,
    y: -194,
    anclaX: 84,
    anclaY: -135,
    termino: "Margen aserrado",
    glosa: "Dientes orientados hacia el ápice, rasgo diagnóstico del género.",
  },
  {
    numero: 3,
    x: -142,
    y: -158,
    anclaX: -58,
    anclaY: -118,
    termino: "Nervadura",
    glosa: "Nervio medio y secundarios; guían el transporte hacia el pecíolo.",
  },
  {
    numero: 4,
    x: 62,
    y: 44,
    anclaX: 2,
    anclaY: 30,
    termino: "Pecíolo",
    glosa: "Punto de inserción al tallo y de muestreo para análisis foliar.",
  },
];

const MARCAS_FLOR: readonly Marca[] = [
  {
    numero: 5,
    x: -78,
    y: -324,
    anclaX: -10,
    anclaY: -302,
    termino: "Ápice floral",
    glosa: "Extremo de la inflorescencia; concentra la mayor densidad de brácteas.",
  },
  {
    numero: 6,
    x: -118,
    y: -234,
    anclaX: -52,
    anclaY: -212,
    termino: "Pistilo",
    glosa: "Estigma de la flor femenina; su viraje de color orienta la cosecha.",
  },
  {
    numero: 7,
    x: 122,
    y: -164,
    anclaX: 52,
    anclaY: -142,
    termino: "Bráctea",
    glosa: "Envuelve el ovario y aloja los tricomas glandulares con cannabinoides.",
  },
  {
    numero: 8,
    x: 126,
    y: -38,
    anclaX: 66,
    anclaY: -62,
    termino: "Hoja de azúcar",
    glosa: "Folíolo pequeño entre brácteas; se separa en el acondicionamiento.",
  },
];

const Senal = ({ marca }: { marca: Marca }) => (
  <g className="lamina__senal">
    <line className="lamina__guia" x1={marca.x} y1={marca.y} x2={marca.anclaX} y2={marca.anclaY} />
    <circle className="lamina__ancla" cx={marca.anclaX} cy={marca.anclaY} r={2.4} />
    <g className="lamina__numeral" transform={`translate(${marca.x} ${marca.y})`}>
      <circle r={13} />
      <text textAnchor="middle" dominantBaseline="central" dy="0.5">
        {marca.numero}
      </text>
    </g>
  </g>
);

export const LaminaBotanica = () => {
  const tituloHoja = useId();
  const tituloFlor = useId();

  return (
    <div className="lamina">
      <figure className="lamina__pieza">
        <svg viewBox="-215 -340 430 420" className="lamina__dibujo" role="img" aria-labelledby={tituloHoja}>
          <title id={tituloHoja}>
            Lámina botánica de la hoja de cannabis, palmada, con siete folíolos de margen aserrado
          </title>
          <g className="lamina__trazo">
            <path d={HOJA_PECIOLO} className="lamina__tallo" />
            {HOJA_CONTORNOS.map((d, indice) => (
              <path key={d} d={d} className="lamina__contorno" style={{ animationDelay: `${indice * 110}ms` }} />
            ))}
            {HOJA_NERVIOS.map((d) => (
              <path key={d} d={d} className="lamina__nervio" />
            ))}
          </g>
          {MARCAS_HOJA.map((marca) => (
            <Senal key={marca.numero} marca={marca} />
          ))}
        </svg>
        <figcaption className="lamina__pie">
          <span className="rotulo">Fig. 1</span> Hoja · <em>Cannabis sativa</em> L.
        </figcaption>
      </figure>

      <figure className="lamina__pieza">
        <svg viewBox="-150 -350 300 430" className="lamina__dibujo" role="img" aria-labelledby={tituloFlor}>
          <title id={tituloFlor}>
            Lámina botánica de la inflorescencia femenina de cannabis, con brácteas, pistilos y hojas de azúcar
          </title>
          <g className="lamina__trazo">
            <path d={FLOR_TALLO} className="lamina__tallo" />
            {FLOR_HOJAS.map((d) => (
              <path key={d} d={d} className="lamina__hoja-azucar" />
            ))}
            {FLOR_PISTILOS.map((d, indice) => (
              <path key={d} d={d} className="lamina__pistilo" style={{ animationDelay: `${520 + indice * 4}ms` }} />
            ))}
            {FLOR_BRACTEAS.map((d, indice) => (
              <path key={d} d={d} className="lamina__bractea" style={{ animationDelay: `${indice * 7}ms` }} />
            ))}
          </g>
          {MARCAS_FLOR.map((marca) => (
            <Senal key={marca.numero} marca={marca} />
          ))}
        </svg>
        <figcaption className="lamina__pie">
          <span className="rotulo">Fig. 2</span> Inflorescencia femenina · flor seca
        </figcaption>
      </figure>

      <dl className="lamina__leyenda">
        {[...MARCAS_HOJA, ...MARCAS_FLOR].map((marca) => (
          <div key={marca.numero}>
            <dt>
              <span className="lamina__indice">{marca.numero}</span>
              {marca.termino}
            </dt>
            <dd>{marca.glosa}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
