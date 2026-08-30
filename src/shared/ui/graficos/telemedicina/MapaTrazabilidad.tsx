import { useId } from "react";
import type { CSSProperties } from "react";
import { CADENA, ENCUADRE, FORMAS, NODOS, RAZON, arco, formaDe } from "./mapa";
import type { FormaDepartamento } from "./mapa";
import { ENCUADRES } from "./guion";
import type { FaseRecorrido } from "./guion";

type Props = {
  fase: FaseRecorrido;
  region: FormaDepartamento | null;
  etiquetaRegion: string;
};

type EstiloCamara = CSSProperties & {
  "--escala"?: string;
  "--fx"?: string;
  "--fy"?: string;
  "--rx"?: string;
  "--ry"?: string;
  "--razon"?: string;
};

const CENTRO_PAIS: readonly [number, number] = [ENCUADRE.ancho * 0.46, ENCUADRE.alto * 0.42];

const ANILLOS = [0, 1, 2] as const;

const ALCANCES = [0.34, 0.58, 0.8, 1] as const;

export const MapaTrazabilidad = ({ fase, region, etiquetaRegion }: Props) => {
  const titulo = useId();
  const encuadre = ENCUADRES[fase];
  const centrado = encuadre.centrado && region !== null;
  const foco = centrado && region ? ([region.x, region.y] as const) : CENTRO_PAIS;
  const desvio = (punto: readonly [number, number]): readonly [string, string] => [
    `${((punto[0] / ENCUADRE.ancho - 0.5) * 100).toFixed(3)}%`,
    `${((punto[1] / ENCUADRE.alto - 0.5) * 100).toFixed(3)}%`,
  ];
  const [fx, fy] = centrado ? desvio(foco) : (["0%", "0%"] as const);
  const [rx, ry] = desvio(foco);

  const estilo: EstiloCamara = {
    "--escala": `${encuadre.escala}`,
    "--fx": fx,
    "--fy": fy,
    "--rx": rx,
    "--ry": ry,
    "--razon": `${RAZON.toFixed(4)}`,
  };

  const cadena = CADENA.map((codigo) => formaDe(codigo)).filter(
    (forma): forma is FormaDepartamento => forma !== null,
  );
  const remate = region ?? formaDe("76");
  const puntos = remate ? [...cadena, remate] : cadena;

  return (
    <div className="telemed__visor" style={estilo}>
      <div className="telemed__camara">
        <svg
          viewBox={`0 0 ${ENCUADRE.ancho} ${ENCUADRE.alto}`}
          className="telemed__mapa"
          role="img"
          aria-labelledby={titulo}
        >
          <title id={titulo}>
            {region
              ? `Mapa de Colombia con ${etiquetaRegion} resaltado dentro de la red de trazabilidad`
              : "Mapa de Colombia con la red nacional de trazabilidad del cannabis medicinal"}
          </title>

          <g className="telemed__territorio">
            {FORMAS.map((forma) => (
              <path
                key={forma.codigo}
                d={forma.d}
                className="telemed__depto"
                data-region={region?.codigo === forma.codigo ? "si" : undefined}
              />
            ))}
          </g>

          <g className="telemed__enlaces" data-visible={fase === "cierre" ? "si" : undefined}>
            {puntos.slice(0, -1).map((origen, indice) => {
              const destino = puntos[indice + 1];
              if (!destino) return null;
              return (
                <path
                  key={`${origen.codigo}-${destino.codigo}`}
                  className="telemed__enlace"
                  d={arco([origen.x, origen.y], [destino.x, destino.y])}
                  style={{ animationDelay: `${indice * 260}ms` }}
                />
              );
            })}
          </g>

          <g className="telemed__nodos">
            {NODOS.map((nodo) => (
              <g key={`${nodo.papel}-${nodo.codigo}`}>
                <circle
                  className="telemed__halo"
                  data-papel={nodo.papel}
                  cx={nodo.x}
                  cy={nodo.y}
                  r={17}
                  style={{ animationDelay: `${nodo.demora}ms` }}
                />
                <circle
                  className="telemed__nodo"
                  data-papel={nodo.papel}
                  cx={nodo.x}
                  cy={nodo.y}
                  r={5.5}
                  style={{ animationDelay: `${nodo.demora}ms` }}
                />
              </g>
            ))}
            {puntos.map((punto, indice) => (
              <circle
                key={`hito-${punto.codigo}-${indice}`}
                className="telemed__hito"
                cx={punto.x}
                cy={punto.y}
                r={11}
                data-visible={fase === "cierre" ? "si" : undefined}
                style={{ animationDelay: `${indice * 260}ms` }}
              />
            ))}
          </g>

          {region ? (
            <g className="telemed__region">
              <path d={region.d} className="telemed__region-forma" />
            </g>
          ) : null}
        </svg>

        <div className="telemed__ancla" aria-hidden="true">
          <div className="telemed__radar" data-encendido={encuadre.radar ? "si" : undefined}>
            {ALCANCES.map((alcance) => (
              <span
                key={alcance}
                className="telemed__alcance"
                style={{ transform: `scale(${alcance})` }}
              />
            ))}
            <span className="telemed__barrido" />
            {ANILLOS.map((anillo) => (
              <span
                key={anillo}
                className="telemed__anillo"
                style={{ animationDelay: `${anillo * 1050}ms` }}
              />
            ))}
            <span className="telemed__centro" />
          </div>
        </div>
      </div>
      <span className="telemed__vineta" aria-hidden="true" />
    </div>
  );
};
