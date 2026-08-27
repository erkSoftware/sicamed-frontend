import { HOJA_CONTORNOS } from "./laminaCannabis";

const IDENTIFICADOR_SILUETA = "silueta-hoja-sicamed";

export const SimboloHoja = () => (
  <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
    <symbol id={IDENTIFICADOR_SILUETA} viewBox="-200 -320 400 340">
      {HOJA_CONTORNOS.map((d) => (
        <path key={d} d={d} />
      ))}
    </symbol>
  </svg>
);

const DUOS: readonly (readonly [string, string])[] = [
  ["#05231A", "#147343"],
  ["#0A4529", "#357719"],
  ["#073122", "#1E9E52"],
  ["#2A5E12", "#0E5C36"],
];

const semillaDe = (texto: string): number => {
  let mezcla = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    mezcla ^= texto.charCodeAt(i);
    mezcla = Math.imul(mezcla, 0x01000193) >>> 0;
  }
  return mezcla;
};

type Props = {
  clave: string;
  producto: string;
  rotulo: string;
  pie: string;
};

export const PortadaOferta = ({ clave, producto, rotulo, pie }: Props) => {
  const semilla = semillaDe(clave);
  const [oscuro, claro] = DUOS[semilla % DUOS.length] ?? DUOS[0]!;
  const giro = ((semilla >>> 3) % 40) - 20;
  const desplazamiento = ((semilla >>> 7) % 30) + 58;
  const gradiente = `portada-${clave}`;

  return (
    <div className="portada">
      <svg className="portada__arte" viewBox="0 0 640 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={gradiente} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={oscuro} />
            <stop offset="1" stopColor={claro} />
          </linearGradient>
        </defs>
        <rect width="640" height="260" fill={`url(#${gradiente})`} />
        <g className="portada__orbitas">
          {[86, 132, 178, 224, 270].map((radio) => (
            <circle key={radio} cx={desplazamiento * 6.4} cy={230} r={radio} />
          ))}
        </g>
        <use
          href={`#${IDENTIFICADOR_SILUETA}`}
          className="portada__hoja"
          x="0"
          y="0"
          width="300"
          height="255"
          transform={`translate(${340 + (semilla % 60)} 12) rotate(${giro} 150 128)`}
        />
      </svg>

      <div className="portada__lienzo">
        <p className="portada__rotulo mono">{rotulo}</p>
        <p className="portada__producto">{producto}</p>
        <p className="portada__pie mono">{pie}</p>
      </div>
    </div>
  );
};
