import { useEffect, useState } from "react";
import { useRevelado } from "../../movimiento/useRevelado";
import type { CSSProperties } from "react";
import { Bulto, Caja, Camion, Contenedor, Frasco, Mata, Persona } from "./piezas";
import {
  ANDANDO,
  BODEGA_RANURAS,
  CAMION_EN_BODEGA,
  CUPO,
  DURACION,
  OPCIONES,
  ORDEN,
  PILA,
  POSICION_CAMPESINO,
  RELATO,
  RELATO_RAMA,
  SELLOS,
  camaraDe,
  ritmo,
} from "./guion";
import type { ClaveSello, Fase, Rama } from "./guion";

const MATAS = [
  { x: 44, y: 402, e: 0.9 },
  { x: 96, y: 414, e: 1.1 },
  { x: 152, y: 398, e: 0.8 },
  { x: 214, y: 410, e: 1 },
  { x: 268, y: 396, e: 0.85 },
  { x: 322, y: 412, e: 1.05 },
  { x: 384, y: 398, e: 0.9 },
  { x: 442, y: 408, e: 0.95 },
  { x: 502, y: 396, e: 0.8 },
  { x: 566, y: 410, e: 1 },
  { x: 628, y: 400, e: 0.9 },
  { x: 676, y: 412, e: 0.85 },
  { x: 1078, y: 404, e: 0.9 },
  { x: 1136, y: 414, e: 1 },
  { x: 1200, y: 400, e: 0.85 },
  { x: 1262, y: 412, e: 0.95 },
  { x: 1466, y: 408, e: 0.9 },
  { x: 1636, y: 404, e: 0.85 },
];

const LUCES = [
  { x: 86, y: 172, r: 1.8, d: 0 },
  { x: 168, y: 202, r: 1.3, d: 900 },
  { x: 262, y: 168, r: 1.6, d: 1800 },
  { x: 344, y: 214, r: 1.2, d: 600 },
  { x: 428, y: 176, r: 1.7, d: 2400 },
  { x: 546, y: 196, r: 1.4, d: 1200 },
  { x: 596, y: 158, r: 1.5, d: 2000 },
];

const cresta = (puntos: readonly (readonly [number, number])[]): string =>
  `M${puntos.map(([x, y]) => `${x} ${y}`).join("L")}V540H-260Z`;

const CRESTA_LEJOS = cresta([
  [-260, 344],
  [-140, 288],
  [-40, 320],
  [60, 252],
  [160, 314],
  [250, 270],
  [340, 324],
  [430, 264],
  [520, 310],
  [610, 268],
  [700, 318],
  [790, 274],
  [880, 320],
  [980, 260],
  [1070, 308],
  [1160, 276],
  [1250, 322],
  [1340, 272],
  [1440, 306],
]);

const CRESTA_CERCA = cresta([
  [-260, 356],
  [-120, 310],
  [-10, 340],
  [90, 304],
  [190, 346],
  [290, 306],
  [390, 350],
  [480, 314],
  [570, 350],
  [660, 318],
  [750, 352],
  [850, 312],
  [940, 348],
  [1040, 316],
  [1130, 350],
  [1230, 310],
  [1330, 346],
  [1440, 318],
]);

const FOCO: Record<Rama, number> = { laboratorio: 1376, ips: 1576, exportacion: 2010 };

const indiceDe = (fase: Fase): number => ORDEN.indexOf(fase);

type Modo = "interactivo" | "automatico";

type Props = {
  modo?: Modo;
  onFinal?: () => void;
};

const VELOCIDAD: Record<Modo, number> = { interactivo: 1, automatico: 0.3 };
const CARGA_INICIAL: Record<Modo, number> = { interactivo: 0, automatico: CUPO - 1 };
const ESPERA_FINCA = 700;
const ESPERA_SALIDAS = 1000;
const RETENCION_CIERRE = 900;

export const EscenaCadena = ({ modo = "interactivo", onFinal }: Props) => {
  const [fase, setFase] = useState<Fase>("finca-reposo");
  const [cargados, setCargados] = useState(CARGA_INICIAL[modo]);
  const [llevando, setLlevando] = useState(false);
  const [rama, setRama] = useState<Rama | null>(null);
  const [sellos, setSellos] = useState<readonly ClaveSello[]>([]);
  const [sobrio, setSobrio] = useState(false);
  const { referencia, visible } = useRevelado<HTMLDivElement>();

  useEffect(() => {
    setSobrio(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const agregar = (clave: ClaveSello) =>
    setSellos((previos) => (previos.includes(clave) ? previos : [...previos, clave]));

  useEffect(() => {
    if (modo !== "automatico") return undefined;
    if (fase === "finca-reposo" && cargados < CUPO && visible) {
      const arranque = window.setTimeout(
        () => setFase("finca-hacia-bulto"),
        ritmo(ESPERA_FINCA, sobrio),
      );
      return () => window.clearTimeout(arranque);
    }
    if (fase === "salidas-reposo") {
      const sorteo = window.setTimeout(() => {
        const elegida = OPCIONES[Math.floor(Math.random() * OPCIONES.length)];
        if (!elegida) return;
        setRama(elegida.clave);
        setFase("rama-transito");
      }, ritmo(ESPERA_SALIDAS, sobrio));
      return () => window.clearTimeout(sorteo);
    }
    return undefined;
  }, [cargados, fase, modo, sobrio, visible]);

  useEffect(() => {
    if (!onFinal || fase !== "cierre") return undefined;
    const remate = window.setTimeout(onFinal, ritmo(RETENCION_CIERRE, sobrio));
    return () => window.clearTimeout(remate);
  }, [fase, onFinal, sobrio]);

  useEffect(() => {
    if (DURACION[fase] === 0) return undefined;
    const reloj = window.setTimeout(() => {
      if (fase === "finca-hacia-bulto") {
        setLlevando(true);
        setFase("finca-agarrar");
      } else if (fase === "finca-agarrar") {
        setFase("finca-hacia-camion");
      } else if (fase === "finca-hacia-camion") {
        setFase("finca-montar");
      } else if (fase === "finca-montar") {
        setLlevando(false);
        setCargados((valor) => valor + 1);
        setFase("finca-regreso");
      } else if (fase === "finca-regreso") {
        if (cargados >= CUPO) {
          agregar("origen");
          setFase("viaje-bodega");
        } else {
          setFase("finca-reposo");
        }
      } else if (fase === "viaje-bodega") {
        agregar("custodia");
        setFase("bodega-llegada");
      } else if (fase === "bodega-llegada") {
        setFase("bodega-escaneo");
      } else if (fase === "bodega-escaneo") {
        setFase("bodega-registro");
      } else if (fase === "bodega-registro") {
        agregar("acopio");
        setFase("bodega-descarga");
      } else if (fase === "bodega-descarga") {
        setCargados(0);
        setFase("viaje-muelle");
      } else if (fase === "viaje-muelle") {
        setFase("salidas-reposo");
      } else if (fase === "rama-transito") {
        setFase("rama-obra");
      } else if (fase === "rama-obra") {
        if (rama) agregar(rama);
        setFase("rama-sello");
      } else {
        agregar("cierre");
        setFase("cierre");
      }
    }, ritmo(DURACION[fase] * VELOCIDAD[modo], sobrio));
    return () => window.clearTimeout(reloj);
  }, [cargados, fase, modo, rama, sobrio]);

  const orden = indiceDe(fase);
  const pendientes = CUPO - cargados - (llevando ? 1 : 0);
  const destino = BODEGA_RANURAS[Math.min(cargados, CUPO - 1)] ?? BODEGA_RANURAS[0]!;
  const camara = camaraDe(fase, rama);
  const enBodega = orden >= indiceDe("viaje-bodega");
  const barcoDentro = rama === "exportacion" && orden >= indiceDe("rama-obra");
  const acto = fase.startsWith("finca")
    ? "finca"
    : fase.startsWith("bodega")
      ? "bodega"
      : fase.startsWith("salidas")
        ? "salidas"
        : fase.startsWith("rama")
          ? "rama"
          : fase === "cierre"
            ? "cierre"
            : "viaje";
  const guia = `SICAMED-${4100 + (cargados + sellos.length) * 37}`;

  const estilo = {
    "--paso": `${ritmo((DURACION[fase] || 620) * VELOCIDAD[modo], sobrio)}ms`,
    "--campesino": `${POSICION_CAMPESINO[fase]}px`,
    "--camara": `${camara}px`,
    "--camion": enBodega ? `${CAMION_EN_BODEGA}px` : "0px",
    "--barco": barcoDentro ? "0px" : "460px",
    "--dx": `${destino.x - 338}px`,
    "--dy": `${destino.y - 388}px`,
  } as CSSProperties;

  const punto = (x: number, y: number) => ({
    left: `${((x - camara) / 640) * 100}%`,
    top: `${((y - 130) / 380) * 100}%`,
  });

  const cargar = () => {
    if (fase !== "finca-reposo" || pendientes <= 0) return;
    setFase("finca-hacia-bulto");
  };

  const elegir = (clave: Rama) => {
    if (fase !== "salidas-reposo") return;
    setRama(clave);
    setFase("rama-transito");
  };

  const reiniciar = () => {
    setRama(null);
    setSellos([]);
    setCargados(CARGA_INICIAL[modo]);
    setLlevando(false);
    setFase("finca-reposo");
  };

  const frase =
    modo === "automatico" && fase === "finca-reposo"
      ? "La remesa se completa en la finca y sale hacia el acopio"
      : ((rama && RELATO_RAMA[rama][fase]) ?? RELATO[fase]);

  return (
    <div className="escena" ref={referencia}>
      <div className="escena__lienzo" style={estilo} data-modo={modo} data-fase={fase} data-acto={acto} data-obra={orden >= indiceDe("rama-obra") ? "si" : "no"} data-rama={rama ?? "ninguna"} data-andando={ANDANDO.includes(fase) ? "si" : "no"} data-llevando={llevando ? "si" : "no"}>
        <svg viewBox="0 130 640 380" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="escena-cielo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#031913" />
              <stop offset="0.55" stopColor="#062E20" />
              <stop offset="1" stopColor="#0C4A2E" />
            </linearGradient>
            <radialGradient id="escena-alba" cx="0.72" cy="0.66" r="0.5">
              <stop offset="0" stopColor="#7ED957" stopOpacity="0.32" />
              <stop offset="1" stopColor="#7ED957" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="escena-fulgor" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#D9F7A8" stopOpacity="0.95" />
              <stop offset="0.45" stopColor="#7ED957" stopOpacity="0.45" />
              <stop offset="1" stopColor="#7ED957" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="escena-haz" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7ED957" stopOpacity="0" />
              <stop offset="0.5" stopColor="#D9F7A8" stopOpacity="0.75" />
              <stop offset="1" stopColor="#7ED957" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="640" height="540" fill="url(#escena-cielo)" />
          <rect x="0" y="0" width="640" height="540" fill="url(#escena-alba)" />
          <circle cx="470" cy="316" r="30" fill="#CFF0A6" opacity="0.42" />
          <g className="escena__luces">
            {LUCES.map((luz) => (
              <circle key={`${luz.x}-${luz.y}`} cx={luz.x} cy={luz.y} r={luz.r} fill="#D6F5E3" style={{ animationDelay: `${luz.d}ms` }} />
            ))}
          </g>

          <g className="escena__lejos">
            <path d={CRESTA_LEJOS} fill="#062A1E" />
            <path d={CRESTA_CERCA} fill="#083926" />
          </g>

          <g className="escena__cerca">
            <rect x="-260" y="372" width="2060" height="170" fill="#0C4E31" />
            <rect x="-260" y="434" width="1920" height="110" fill="#0A3E27" />
            <rect x="1660" y="432" width="140" height="112" fill="#39463E" />
            <rect x="1660" y="432" width="140" height="4" fill="#5B685F" />
            <rect x="1800" y="428" width="880" height="122" fill="#072F29" />
            <rect x="1800" y="428" width="880" height="3" fill="#0E4A40" />

            <g>
              <path d="M56 374 135 292 214 374z" fill="#8A3B22" />
              <path d="M70 374v-46h130v46z" fill="#E7EFE8" />
              <path d="M70 328h130v6H70z" fill="#C9D6CB" />
              <rect x="124" y="346" width="22" height="28" fill="#3A2A1C" />
              <rect x="86" y="342" width="18" height="15" rx="1" fill="#F3D68B" className="escena__ventana" />
              <rect x="166" y="342" width="18" height="15" rx="1" fill="#F3D68B" className="escena__ventana" />
              <path d="M135 292v-16" stroke="#8A3B22" strokeWidth="3" />
            </g>

            <g>
              <path d="M640 336 676 292h278l36 44z" fill="#C9D6CB" />
              <rect x="640" y="332" width="350" height="8" fill="#A9B5AC" />
              <rect x="650" y="340" width="330" height="106" fill="#DDE5DE" />
              <rect x="650" y="340" width="330" height="7" fill="#147343" />
              {[686, 726, 766, 806, 846].map((x) => (
                <rect key={x} x={x} y="347" width="2" height="99" fill="#C2CDC4" />
              ))}
              <rect x="876" y="356" width="104" height="10" fill="#147343" />
              <rect x="880" y="366" width="96" height="80" fill="#06251B" />
              <rect x="880" y="366" width="96" height="6" fill="#0A3A26" />
              <g className="escena__tablero" data-listo={orden >= indiceDe("bodega-descarga") ? "si" : "no"}>
                <rect x="668" y="360" width="170" height="66" rx="3" fill="#06251B" stroke="#147343" strokeWidth="1.5" />
                <rect x="668" y="360" width="170" height="12" rx="3" fill="#0E5C36" />
                <image href="/marca/isotipo.svg" x="672" y="361" width="10" height="10" />
                {[0, 1, 2].map((n) => (
                  <rect key={n} className="escena__linea" x="678" y={382 + n * 13} width={150 - n * 28} height="7" rx="3" fill="#7ED957" style={{ animationDelay: `${Math.round(n * 780 * VELOCIDAD[modo])}ms` }} />
                ))}
              </g>
            </g>

            <g>
              <rect x="1282" y="286" width="186" height="10" fill="#C9D6CB" />
              <rect x="1290" y="296" width="170" height="150" fill="#E7EFE8" />
              <rect x="1290" y="306" width="170" height="8" fill="#1E9E52" />
              {[1300, 1340, 1380].map((x) => (
                <rect key={x} className="escena__ventana-lab" x={x} y="326" width="32" height="28" rx="2" fill="#B9E8CB" />
              ))}
              {[1300, 1340, 1380].map((x) => (
                <rect key={`${x}-b`} className="escena__ventana-lab" x={x} y="366" width="32" height="28" rx="2" fill="#B9E8CB" />
              ))}
              <rect x="1422" y="396" width="32" height="50" fill="#06251B" />
              <circle cx="1438" cy="336" r="16" fill="#0E5C36" />
              <g transform="translate(1438 346) scale(0.66)">
                <Frasco />
              </g>
            </g>

            <g>
              <rect x="1492" y="296" width="166" height="10" fill="#C9D6CB" />
              <rect x="1500" y="306" width="150" height="140" fill="#E7EFE8" />
              <rect x="1500" y="316" width="150" height="8" fill="#1B6FA8" />
              <rect x="1568" y="336" width="16" height="42" fill="#1B6FA8" />
              <rect x="1555" y="349" width="42" height="16" fill="#1B6FA8" />
              {[1510, 1550, 1590].map((x) => (
                <rect key={x} x={x} y="386" width="30" height="26" rx="2" fill="#B9E8CB" />
              ))}
              <rect x="1616" y="400" width="30" height="46" fill="#06251B" />
            </g>

            <rect x="1756" y="424" width="14" height="22" rx="4" fill="#39463E" />
            <ellipse cx="1763" cy="424" rx="10" ry="4" fill="#5B685F" />

            <g className="escena__barco">
              <path d="M1870 452 1892 504h296l22-52z" fill="#EFF4EE" />
              <rect x="1874" y="452" width="332" height="11" fill="#147343" />
              <rect x="2130" y="412" width="74" height="40" fill="#EFF4EE" />
              <rect x="2140" y="420" width="54" height="14" fill="#2C4A3C" />
              <rect x="2152" y="390" width="18" height="22" rx="2" fill="#147343" />
              {[1940, 2006, 2072].map((x, orden2) => (
                <g key={x} className="escena__contenedor" style={{ animationDelay: `${orden2 * 300}ms` }}>
                  <g transform={`translate(${x} 452)`}>
                    <Contenedor tono={["#147343", "#1E9E52", "#0E5C36"][orden2] ?? "#147343"} />
                  </g>
                </g>
              ))}
            </g>

            <rect x="1800" y="480" width="880" height="70" fill="#052622" />
            <g className="escena__olas">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <rect key={n} x={1820 + n * 136} y={492 + (n % 3) * 15} width="66" height="3" rx="1.5" fill="#12564A" style={{ animationDelay: `${n * 420}ms` }} />
              ))}
            </g>

            <g opacity="0.85">
              {MATAS.map((mata) => (
                <Mata key={`${mata.x}-${mata.y}`} x={mata.x} y={mata.y} e={mata.e} />
              ))}
            </g>

            <ellipse cx="154" cy="448" rx="72" ry="9" fill="#05231A" opacity="0.35" />
            <g className="escena__pila">
              {PILA.slice(CUPO - Math.max(0, pendientes)).map((sitio) => (
                <g key={`${sitio.x}-${sitio.y}`} transform={`translate(${sitio.x} ${sitio.y})`}>
                  <Bulto />
                </g>
              ))}
            </g>

            <g className="escena__actores" data-elegida={rama ?? "ninguna"}>
              {OPCIONES.map((opcion) => (
                <g
                  key={opcion.clave}
                  className="escena__actor"
                  data-estado={rama === opcion.clave ? "elegido" : rama ? "otro" : "espera"}
                  transform={`translate(${opcion.x} 446) scale(0.86)`}
                >
                  {opcion.clave === "laboratorio" ? (
                    <Persona cuerpo="#EDF3EE" detalle="#C9D6CB" piel="#C99A6E" pelo="#2A211A" />
                  ) : null}
                  {opcion.clave === "ips" ? (
                    <Persona cuerpo="#14507A" detalle="#1B6FA8" piel="#8E6742" pelo="#1A1410" />
                  ) : null}
                  {opcion.clave === "exportacion" ? (
                    <Persona cuerpo="#1E2721" detalle="#35403A" piel="#C99A6E" pelo="#2A211A">
                      <path d="M-3-90h6l-3 16z" fill="#7ED957" />
                    </Persona>
                  ) : null}
                  <g className="escena__caja-rama">
                    <g transform="translate(-26 -6)">
                      <Caja />
                    </g>
                  </g>
                  <g className="escena__fulgor">
                    <circle cx="26" cy="-72" r="24" fill="url(#escena-fulgor)" />
                    <circle cx="26" cy="-72" r="12" fill="none" stroke="#D9F7A8" strokeWidth="1.3" opacity="0.8" />
                    <circle cx="26" cy="-72" r="5" fill="#EFFAF3" />
                  </g>
                </g>
              ))}
            </g>

            <g className="escena__cosecha-lab">
              {[1302, 1330, 1358].map((x, orden2) => (
                <g key={x} transform={`translate(${x} 444) scale(1.3)`} style={{ animationDelay: `${orden2 * 220}ms` }} className="escena__frasco">
                  <Frasco />
                </g>
              ))}
            </g>

            <g className="escena__formula">
              <rect x="1594" y="376" width="34" height="44" rx="2" fill="#F7F6F2" />
              <rect x="1600" y="386" width="22" height="3" rx="1.5" fill="#8B958E" />
              <rect x="1600" y="394" width="22" height="3" rx="1.5" fill="#8B958E" />
              <rect x="1600" y="402" width="14" height="3" rx="1.5" fill="#1B6FA8" />
            </g>

            <Camion cargados={cargados} ranuras={BODEGA_RANURAS} />

            <rect className="escena__haz" x="996" y="336" width="34" height="118" fill="url(#escena-haz)" />

            <g className="escena__campesino">
              <ellipse cx="0" cy="448" rx="22" ry="6" fill="#05231A" opacity="0.4" />
              <g transform="translate(0 446)">
                <g className="escena__piernas escena__piernas--quieto">
                  <path d="M-11-48h9l2 42h4v6h-19v-6h4z" fill="#303D35" />
                  <path d="M2-48h9l3 42h4v6h-19v-6h4z" fill="#26332B" />
                </g>
                <g className="escena__piernas escena__piernas--paso-a">
                  <path d="M-11-48h9l-6 40 3 4-5 5-12-9 9-6z" fill="#303D35" />
                  <path d="M2-48h9l9 40 5 2-2 7-16-4-7-38z" fill="#26332B" />
                </g>
                <g className="escena__piernas escena__piernas--paso-b">
                  <path d="M-11-48h9l8 40 5 2-2 7-15-4z" fill="#303D35" />
                  <path d="M2-48h9l-5 40 3 4-5 5-12-9 8-6z" fill="#26332B" />
                </g>

                <g className="escena__cuerpo">
                  <path className="escena__brazo escena__brazo--abajo" d="M12-86 26-62l-3 8-9-3 2-8-10-16z" fill="#B4552A" />
                  <path d="M-17-88h34l7 42h-48z" fill="#B4552A" />
                  <path d="M-24-58h48l2 12h-52z" fill="#D07E45" />
                  <path d="M-17-88h34l2 10h-38z" fill="#8E3E1C" />

                  {llevando ? (
                    <g transform="translate(0 -58)">
                      <g className="escena__bulto-carga">
                        <Bulto />
                      </g>
                    </g>
                  ) : null}

                  <g className="escena__brazo escena__brazo--carga">
                    <path d="M-17-86-24-64l10 3 6-23zM17-86l7 22-10 3-6-23z" fill="#9C4520" />
                    <rect x="-21" y="-73" width="13" height="11" rx="4" fill="#C99A6E" />
                    <rect x="8" y="-73" width="13" height="11" rx="4" fill="#C99A6E" />
                  </g>

                  <path d="M-6-92h12v10h-12z" fill="#EDF3EE" />
                  <circle cx="0" cy="-101" r="11.5" fill="#C99A6E" />
                  <path d="M-2-97h9v3h-9z" fill="#8E6742" opacity="0.5" />
                  <path d="M-9-108q9-9 18 0z" fill="#5C4426" />
                  <ellipse cx="0" cy="-108" rx="25" ry="6.5" fill="#D9C089" />
                  <path d="M-11-109q11-16 22 0z" fill="#E4CE9B" />
                  <path d="M-11-112h22v3h-22z" fill="#8A5A00" opacity="0.75" />

                  <path className="escena__brazo escena__brazo--saludo" d="M13-86 34-77l4-1 3 8-8 4-4-3-16-3z" fill="#B4552A" />

                  <g className="escena__fulgor">
                    <circle cx="38" cy="-76" r="26" fill="url(#escena-fulgor)" />
                    <circle cx="38" cy="-76" r="13" fill="none" stroke="#D9F7A8" strokeWidth="1.4" opacity="0.8" />
                    <circle cx="38" cy="-76" r="5" fill="#EFFAF3" />
                  </g>
                </g>
              </g>
            </g>

            {rama ? (
              <g className="escena__sello" transform={`translate(${FOCO[rama]} 300)`}>
                <circle r="26" fill="#0A4529" stroke="#7ED957" strokeWidth="2" />
                <path d="M-11 1 -3 9 11-7" fill="none" stroke="#D9F7A8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ) : null}
          </g>

          <g className="escena__cierre">
            <rect x="0" y="0" width="640" height="540" fill="#04211A" opacity="0.72" />
            <g transform="translate(320 318)">
              <rect x="-122" y="-44" width="244" height="88" rx="10" fill="#06301F" stroke="#7ED957" strokeWidth="1.5" />
              <image href="/marca/isotipo.svg" x="-100" y="-26" width="52" height="52" />
              <g transform="translate(0 0)">
                <rect x="-16" y="-9" width="20" height="18" rx="9" fill="none" stroke="#7ED957" strokeWidth="3" />
                <rect x="-4" y="-9" width="20" height="18" rx="9" fill="none" stroke="#D9F7A8" strokeWidth="3" />
              </g>
              <g transform="translate(74 0)">
                <path d="M0-27 22-18v18q0 17-22 25-22-8-22-25v-18z" fill="#EFFAF3" />
                <path d="M0-27 22-18v6h-44v-6z" fill="#7ED957" />
                <path d="M-9 2 -3 8 9-6" fill="none" stroke="#0A4529" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          </g>
        </svg>

        {modo === "interactivo" && fase === "finca-reposo" && pendientes > 0 ? (
          <button type="button" className="escena__punto" style={punto(288, 370)} onClick={cargar} aria-label="Cargar un bulto en el camión de transporte">
            <span className="escena__punto-eco" aria-hidden="true" />
          </button>
        ) : null}

        {modo === "interactivo" && fase === "salidas-reposo"
          ? OPCIONES.map((opcion) => (
              <button key={opcion.clave} type="button" className="escena__punto escena__punto--rotulado" style={punto(opcion.x + 8, 390)} onClick={() => elegir(opcion.clave)} aria-label={opcion.ayuda}>
                <span className="escena__punto-eco" aria-hidden="true" />
                <span className="escena__punto-nombre">{opcion.etiqueta}</span>
              </button>
            ))
          : null}

        {fase === "cierre" ? (
          <button type="button" className="escena__reiniciar" onClick={reiniciar}>
            Recorrer la cadena otra vez
          </button>
        ) : null}

        <span className="escena__pista mono" aria-hidden="true">
          {modo === "interactivo" && fase === "finca-reposo" ? "Toca la mano" : ""}
        </span>
      </div>

      <p className="escena__relato" aria-live="polite">
        <span className="escena__evento mono">
          {fase === "finca-reposo" && sellos.length === 0
            ? "En espera"
            : `Evento ${String(Math.max(1, sellos.length + 1)).padStart(2, "0")} · ${guia}`}
        </span>
        <span className="escena__frase">{frase}</span>
      </p>

      {sellos.length > 0 ? (
        <ol className="escena__cadena">
          {sellos.map((clave) => (
            <li key={clave} className="escena__eslabon">
              <span className="escena__eslabon-titulo">{SELLOS[clave].titulo}</span>
              <span className="escena__eslabon-detalle">{SELLOS[clave].detalle}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="escena__medidor mono">
          <span>Bultos en el camión</span>
          <span className="escena__marcas" aria-hidden="true">
            {BODEGA_RANURAS.map((sitio, indice) => (
              <span key={`${sitio.x}-${sitio.y}`} data-lleno={indice < cargados ? "si" : "no"} />
            ))}
          </span>
          <span>
            {cargados} de {CUPO}
          </span>
        </p>
      )}
    </div>
  );
};
