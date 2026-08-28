import { useId, useState } from "react";
import type { KeyboardEvent } from "react";
import { Boton } from "../primitivos/Boton";
import { Icono } from "../primitivos/Icono";
import { Dialogo } from "../primitivos/Dialogo";
import {
  FLOR_BRACTEAS,
  FLOR_HOJAS,
  FLOR_PISTILOS,
  FLOR_TALLO,
  HOJA_CONTORNOS,
  HOJA_NERVIOS,
  HOJA_PECIOLO,
} from "./laminaCannabis";

type Figura = "hoja" | "flor";

type Marca = {
  numero: number;
  figura: Figura;
  x: number;
  y: number;
  anclaX: number;
  anclaY: number;
  focoX: number;
  focoY: number;
  lupa: number;
  termino: string;
  glosa: string;
};

const MARCAS_HOJA: readonly Marca[] = [
  {
    numero: 1,
    focoX: -6,
    focoY: -222,
    figura: "hoja",
    x: -74,
    y: -286,
    anclaX: -6,
    anclaY: -250,
    lupa: 112,
    termino: "Folíolo central",
    glosa: "Hoja palmada de siete folíolos; el central marca el eje de la lámina.",
  },
  {
    numero: 2,
    focoX: 84,
    focoY: -135,
    figura: "hoja",
    x: 148,
    y: -194,
    anclaX: 84,
    anclaY: -135,
    lupa: 72,
    termino: "Margen aserrado",
    glosa: "Dientes orientados hacia el ápice, rasgo diagnóstico del género.",
  },
  {
    numero: 3,
    focoX: -52,
    focoY: -120,
    figura: "hoja",
    x: -142,
    y: -158,
    anclaX: -58,
    anclaY: -118,
    lupa: 92,
    termino: "Nervadura",
    glosa: "Nervio medio y secundarios; guían el transporte hacia el pecíolo.",
  },
  {
    numero: 4,
    focoX: 2,
    focoY: 8,
    figura: "hoja",
    x: 62,
    y: 44,
    anclaX: 2,
    anclaY: 30,
    lupa: 84,
    termino: "Pecíolo",
    glosa: "Punto de inserción al tallo y de muestreo para análisis foliar.",
  },
];

const MARCAS_FLOR: readonly Marca[] = [
  {
    numero: 5,
    focoX: -25,
    focoY: -282,
    figura: "flor",
    x: -78,
    y: -324,
    anclaX: -10,
    anclaY: -302,
    lupa: 62,
    termino: "Ápice floral",
    glosa: "Extremo de la inflorescencia; concentra la mayor densidad de brácteas.",
  },
  {
    numero: 6,
    focoX: -25,
    focoY: -215,
    figura: "flor",
    x: -118,
    y: -234,
    anclaX: -52,
    anclaY: -212,
    lupa: 55,
    termino: "Pistilo",
    glosa: "Estigma de la flor femenina; su viraje de color orienta la cosecha.",
  },
  {
    numero: 7,
    focoX: 42,
    focoY: -145,
    figura: "flor",
    x: 122,
    y: -164,
    anclaX: 52,
    anclaY: -142,
    lupa: 56,
    termino: "Bráctea",
    glosa: "Envuelve el ovario y aloja los tricomas glandulares con cannabinoides.",
  },
  {
    numero: 8,
    focoX: 45,
    focoY: -68,
    figura: "flor",
    x: 126,
    y: -38,
    anclaX: 66,
    anclaY: -62,
    lupa: 62,
    termino: "Hoja de azúcar",
    glosa: "Folíolo pequeño entre brácteas; se separa en el acondicionamiento.",
  },
];

const TODAS = [...MARCAS_HOJA, ...MARCAS_FLOR] as const;
const RESPALDO = TODAS[0] as Marca;

const TrazoHoja = () => (
  <>
    <path d={HOJA_PECIOLO} className="lamina__tallo" />
    {HOJA_CONTORNOS.map((d, indice) => (
      <path key={d} d={d} className="lamina__contorno" style={{ animationDelay: `${indice * 110}ms` }} />
    ))}
    {HOJA_NERVIOS.map((d) => (
      <path key={d} d={d} className="lamina__nervio" />
    ))}
  </>
);

const TrazoFlor = () => (
  <>
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
  </>
);

type SenalProps = {
  marca: Marca;
  onAmpliar: (marca: Marca) => void;
};

const Senal = ({ marca, onAmpliar }: SenalProps) => {
  const teclear = (evento: KeyboardEvent<SVGGElement>) => {
    if (evento.key !== "Enter" && evento.key !== " ") return;
    evento.preventDefault();
    onAmpliar(marca);
  };

  return (
    <g className="lamina__senal">
      <line className="lamina__guia" x1={marca.x} y1={marca.y} x2={marca.anclaX} y2={marca.anclaY} />
      <circle className="lamina__ancla" cx={marca.anclaX} cy={marca.anclaY} r={2.4} />
      <g
        className="lamina__disparador"
        role="button"
        tabIndex={0}
        aria-label={`Ampliar ${marca.numero}, ${marca.termino}`}
        transform={`translate(${marca.x} ${marca.y})`}
        onClick={() => onAmpliar(marca)}
        onKeyDown={teclear}
      >
        <circle className="lamina__zona" r={30} />
        <g className="lamina__numeral">
          <circle r={13} />
          <text textAnchor="middle" dominantBaseline="central" dy="0.5">
            {marca.numero}
          </text>
        </g>
        <g className="lamina__lupa" transform="translate(11 -11)">
          <circle className="lamina__lupa-fondo" r={8.5} />
          <circle className="lamina__lupa-lente" cx={-0.8} cy={-0.8} r={3.4} />
          <line className="lamina__lupa-mango" x1={1.7} y1={1.7} x2={4.2} y2={4.2} />
        </g>
      </g>
    </g>
  );
};

export const LaminaBotanica = () => {
  const tituloHoja = useId();
  const tituloFlor = useId();
  const tituloLupa = useId();
  const [ampliada, setAmpliada] = useState<Marca | null>(null);

  const mover = (salto: number) => {
    if (!ampliada) return;
    const orden = TODAS.findIndex((marca) => marca.numero === ampliada.numero);
    setAmpliada(TODAS[(orden + salto + TODAS.length) % TODAS.length] ?? RESPALDO);
  };

  const lado = ampliada ? ampliada.lupa * 2 : 0;

  return (
    <div className="lamina">
      <figure className="lamina__pieza">
        <svg
          viewBox="-215 -340 430 420"
          className="lamina__dibujo"
          role="group"
          aria-label="Figura 1, hoja de Cannabis sativa, con cuatro partes señaladas y ampliables"
        >
          <title id={tituloHoja}>
            Lámina botánica de la hoja de cannabis, palmada, con siete folíolos de margen aserrado
          </title>
          <g className="lamina__trazo" role="img" aria-labelledby={tituloHoja}>
            <TrazoHoja />
          </g>
          {MARCAS_HOJA.map((marca) => (
            <Senal key={marca.numero} marca={marca} onAmpliar={setAmpliada} />
          ))}
        </svg>
        <figcaption className="lamina__pie">
          <span className="rotulo">Fig. 1</span> Hoja · <em>Cannabis sativa</em> L.
        </figcaption>
      </figure>

      <figure className="lamina__pieza">
        <svg
          viewBox="-150 -350 300 430"
          className="lamina__dibujo"
          role="group"
          aria-label="Figura 2, inflorescencia femenina de cannabis, con cuatro partes señaladas y ampliables"
        >
          <title id={tituloFlor}>
            Lámina botánica de la inflorescencia femenina de cannabis, con brácteas, pistilos y hojas de azúcar
          </title>
          <g className="lamina__trazo" role="img" aria-labelledby={tituloFlor}>
            <TrazoFlor />
          </g>
          {MARCAS_FLOR.map((marca) => (
            <Senal key={marca.numero} marca={marca} onAmpliar={setAmpliada} />
          ))}
        </svg>
        <figcaption className="lamina__pie">
          <span className="rotulo">Fig. 2</span> Inflorescencia femenina · flor seca
        </figcaption>
      </figure>

      <p className="lamina__pista">
        <Icono nombre="buscar" tamano={15} />
        Toca un número de la lámina para ampliar esa parte.
      </p>

      <dl className="lamina__leyenda">
        {TODAS.map((marca) => (
          <div key={marca.numero}>
            <dt>
              <button type="button" className="lamina__termino" onClick={() => setAmpliada(marca)}>
                <span className="lamina__indice">{marca.numero}</span>
                {marca.termino}
                <span className="lamina__termino-lupa" aria-hidden="true">
                  <Icono nombre="buscar" tamano={14} />
                </span>
                <span className="solo-lectores">Ampliar</span>
              </button>
            </dt>
            <dd>{marca.glosa}</dd>
          </div>
        ))}
      </dl>

      <Dialogo
        abierto={ampliada !== null}
        titulo={ampliada ? `${ampliada.numero} · ${ampliada.termino}` : ""}
        onCerrar={() => setAmpliada(null)}
        pie={
          <div className="lupa__mandos">
            <span className="lupa__conteo mono">{`${ampliada?.numero ?? 0} / ${TODAS.length}`}</span>
            <Boton variante="secundario" tamano="sm" icono="chevron" onClick={() => mover(-1)}>
              Anterior
            </Boton>
            <Boton variante="secundario" tamano="sm" iconoFinal="chevron" onClick={() => mover(1)}>
              Siguiente
            </Boton>
          </div>
        }
      >
        {ampliada ? (
          <div className="lupa">
            <div className="lupa__visor">
              <svg
                viewBox={`${ampliada.focoX - ampliada.lupa} ${ampliada.focoY - ampliada.lupa} ${lado} ${lado}`}
                className="lupa__dibujo"
                role="img"
                aria-labelledby={tituloLupa}
              >
                <title id={tituloLupa}>{`Detalle ampliado de la lámina botánica: ${ampliada.termino}`}</title>
                <g className="lupa__trazo">
                  {ampliada.figura === "hoja" ? <TrazoHoja /> : <TrazoFlor />}
                </g>
                <circle
                  className="lupa__diana"
                  cx={ampliada.anclaX}
                  cy={ampliada.anclaY}
                  r={ampliada.lupa * 0.16}
                />
                <circle className="lamina__ancla" cx={ampliada.anclaX} cy={ampliada.anclaY} r={ampliada.lupa * 0.03} />
              </svg>
              <span className="lupa__marco" aria-hidden="true">
                <span className="rotulo">{ampliada.figura === "hoja" ? "Fig. 1" : "Fig. 2"}</span>
              </span>
            </div>
            <div className="lupa__ficha">
              <p className="lupa__glosa">{ampliada.glosa}</p>
              <p className="lupa__nota">
                {ampliada.figura === "hoja"
                  ? "Hoja · Cannabis sativa L."
                  : "Inflorescencia femenina · flor seca"}
              </p>
            </div>
          </div>
        ) : null}
      </Dialogo>
    </div>
  );
};
