import { useId } from "react";

export type FamiliaProducto =
  | "FLOR"
  | "BIOMASA"
  | "EXTRACTO"
  | "ACEITE"
  | "FORMULA"
  | "SEMILLA"
  | "OTRO";

const FAMILIAS: readonly (readonly [RegExp, FamiliaProducto])[] = [
  [/flor/i, "FLOR"],
  [/biomasa/i, "BIOMASA"],
  [/extracto/i, "EXTRACTO"],
  [/aceite/i, "ACEITE"],
  [/f[oó]rmula/i, "FORMULA"],
  [/semilla/i, "SEMILLA"],
];

export const familiaDeProducto = (tipoProducto: string): FamiliaProducto =>
  FAMILIAS.find(([patron]) => patron.test(tipoProducto))?.[1] ?? "OTRO";

const semillaDe = (texto: string): number => {
  let mezcla = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    mezcla ^= texto.charCodeAt(i);
    mezcla = Math.imul(mezcla, 0x01000193) >>> 0;
  }
  return mezcla;
};

const bractea = (x: number, y: number, alto: number, ancho: number): string =>
  `M ${x} ${y} C ${x - ancho} ${y - alto * 0.2} ${x - ancho * 0.72} ${y - alto * 0.72} ${x} ${y - alto} ` +
  `C ${x + ancho * 0.72} ${y - alto * 0.72} ${x + ancho} ${y - alto * 0.2} ${x} ${y} Z`;

const Flor = ({ variacion }: { variacion: number }) => (
  <g>
    <path d="M 160 168 L 160 52" className="visual__tallo" />
    {[0, 1, 2, 3, 4, 5].map((fila) => {
      const y = 164 - fila * 21;
      const escala = 1 - fila * 0.14;
      const apertura = 30 * escala;
      return (
        <g key={fila}>
          <path d={bractea(160, y, 46 * escala, 15 * escala)} className="visual__forma" />
          <path
            d={bractea(160 - apertura, y + 2, 38 * escala, 13 * escala)}
            className="visual__forma visual__forma--tenue"
          />
          <path
            d={bractea(160 + apertura, y + 2, 38 * escala, 13 * escala)}
            className="visual__forma visual__forma--tenue"
          />
          <path
            d={`M ${160 - apertura} ${y + 2} q ${apertura} ${-6} ${apertura * 2} 0`}
            className="visual__pistilo"
          />
        </g>
      );
    })}
    {[0, 1, 2, 3].map((indice) => (
      <path
        key={indice}
        d={`M 160 ${50 + indice * 5} q ${indice % 2 === 0 ? -12 : 12} ${-7 - variacion} ${indice % 2 === 0 ? -20 : 20} ${-3}`}
        className="visual__pistilo"
      />
    ))}
  </g>
);

const Biomasa = ({ variacion }: { variacion: number }) => (
  <g>
    {[0, 1, 2, 3].map((capa) => {
      const y = 60 + capa * 24;
      return (
        <g key={capa}>
          <path
            d={`M 66 ${y} q ${80 + variacion * 4} ${capa % 2 === 0 ? -18 : 18} ${188} 0`}
            className="visual__forma"
          />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((marca) => (
            <path
              key={marca}
              d={`M ${82 + marca * 24} ${y + 3} l 0 12`}
              className="visual__pistilo"
            />
          ))}
        </g>
      );
    })}
    <path d="M 66 152 L 254 152" className="visual__base" />
  </g>
);

const Extracto = ({ variacion }: { variacion: number }) => (
  <g>
    <path d="M 60 148 L 260 148" className="visual__base" />
    <path
      d={`M 60 148 C 104 148 108 ${58 + variacion} 132 ${58 + variacion} C 156 ${58 + variacion} 156 118 178 118 C 200 118 202 ${78 - variacion} 224 ${78 - variacion} C 244 ${78 - variacion} 246 148 260 148`}
      className="visual__curva"
    />
    {[0, 1, 2, 3, 4, 5].map((marca) => (
      <path key={marca} d={`M ${72 + marca * 36} 148 l 0 8`} className="visual__pistilo" />
    ))}
    <path d="M 60 42 L 92 42" className="visual__base" />
  </g>
);

const Aceite = ({ variacion }: { variacion: number }) => (
  <g>
    <path
      d="M 160 44 C 196 88 216 108 216 128 a 56 56 0 0 1 -112 0 C 104 108 124 88 160 44 Z"
      className="visual__forma"
    />
    {[0, 1, 2].map((nivel) => (
      <path
        key={nivel}
        d={`M ${116 + nivel * 6} ${118 + nivel * 10} q ${44 - nivel * 6} ${-10 + variacion} ${88 - nivel * 12} 0`}
        className="visual__pistilo"
      />
    ))}
    <path d="M 60 152 L 260 152" className="visual__base" />
  </g>
);

const Formula = ({ variacion }: { variacion: number }) => (
  <g>
    <path d="M 138 40 L 182 40" className="visual__base" />
    <path
      d={`M 144 40 L 144 78 L 120 ${132 - variacion} a 22 22 0 0 0 20 20 l 40 0 a 22 22 0 0 0 20 -20 L 176 78 L 176 40`}
      className="visual__forma"
    />
    {[0, 1, 2, 3].map((marca) => (
      <path key={marca} d={`M 186 ${72 + marca * 18} l 12 0`} className="visual__pistilo" />
    ))}
    <path d="M 186 66 L 186 148" className="visual__base" />
  </g>
);

const Semilla = ({ variacion }: { variacion: number }) => (
  <g>
    <ellipse cx="160" cy="98" rx="42" ry="54" className="visual__forma" />
    <path d={`M 160 46 C ${142 - variacion} 74 ${142 - variacion} 122 160 150`} className="visual__pistilo" />
    <path d={`M 160 46 C ${178 + variacion} 74 ${178 + variacion} 122 160 150`} className="visual__pistilo" />
    <path d="M 160 150 q 0 18 -22 26" className="visual__tallo" />
    <path d="M 104 160 L 216 160" className="visual__base" />
    <path d="M 104 156 L 104 164 M 216 156 L 216 164" className="visual__base" />
  </g>
);

const Otro = ({ variacion }: { variacion: number }) => (
  <g>
    {[0, 1, 2, 3].map((anillo) => (
      <circle
        key={anillo}
        cx={160}
        cy={98}
        r={18 + anillo * 16 + variacion}
        className="visual__forma visual__forma--tenue"
      />
    ))}
    <path d="M 60 152 L 260 152" className="visual__base" />
  </g>
);

const DIBUJOS: Record<FamiliaProducto, (props: { variacion: number }) => JSX.Element> = {
  FLOR: Flor,
  BIOMASA: Biomasa,
  EXTRACTO: Extracto,
  ACEITE: Aceite,
  FORMULA: Formula,
  SEMILLA: Semilla,
  OTRO: Otro,
};

type Props = {
  clave: string;
  tipoProducto: string;
  rotulo: string;
  pie: string;
  descripcionAlternativa: string;
};

export const VisualCategoria = ({
  clave,
  tipoProducto,
  rotulo,
  pie,
  descripcionAlternativa,
}: Props) => {
  const familia = familiaDeProducto(tipoProducto);
  const Dibujo = DIBUJOS[familia];
  const semilla = semillaDe(clave);
  const variacion = semilla % 7;
  const rotuloTitulo = useId();

  return (
    <div className="visual" data-familia={familia}>
      <svg
        className="visual__arte"
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby={rotuloTitulo}
      >
        <title id={rotuloTitulo}>{descripcionAlternativa}</title>
        <Dibujo variacion={variacion} />
      </svg>
      <span className="visual__rotulo mono">{rotulo}</span>
      <span className="visual__pie mono">{pie}</span>
    </div>
  );
};
