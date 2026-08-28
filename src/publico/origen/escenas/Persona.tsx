type Props = {
  x: number;
  y: number;
  escala: number;
  sombrero?: boolean;
};

export const Persona = ({ x, y, escala, sombrero = false }: Props) => (
  <g className="cine__persona" transform={`translate(${x} ${y}) scale(${escala})`}>
    <path className="cine__persona-cuerpo" d="M -10 0 L -8 -46 L -2 -46 L -1 0 Z" />
    <path className="cine__persona-cuerpo" d="M 1 0 L 2 -46 L 8 -46 L 10 0 Z" />
    <path
      className="cine__persona-cuerpo"
      d="M -13 -44 q -4 -30 3 -44 q 4 -5 10 -5 q 6 0 10 5 q 7 14 3 44 z"
    />
    <path className="cine__persona-brazo" d="M -12 -84 q -11 13 -13 29" />
    <path className="cine__persona-brazo" d="M 12 -84 q 11 11 14 25" />
    <circle className="cine__persona-cuerpo" cx="0" cy="-101" r="8.5" />
    {sombrero ? (
      <ellipse className="cine__persona-cuerpo" cx="0" cy="-107" rx="17" ry="4.2" />
    ) : null}
  </g>
);
