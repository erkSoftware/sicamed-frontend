import { useId, useMemo, useState } from "react";
import { numero } from "../../i18n/formato";
import { CONTORNOS } from "../../api/mock/contornos";
import { encuadrarMercator, proyectarMercator, trazoMercator } from "../../geo/proyecciones";

export type PuntoMapa = {
  codigo: string;
  nombre: string;
  valor: number;
};

type Props = {
  puntos: readonly PuntoMapa[];
  unidad: string;
  seleccionado?: string;
  onSeleccionar?: (codigo: string) => void;
  onAbrirFicha?: (codigo: string) => void;
  sinRanking?: boolean;
};

const ESCALONES = 5;

const tramo = (valor: number, maximo: number): number => {
  if (valor <= 0) return -1;
  const proporcion = Math.sqrt(valor / maximo);
  return Math.min(ESCALONES - 1, Math.floor(proporcion * ESCALONES));
};

export const MapaColombia = ({
  puntos,
  unidad,
  seleccionado,
  onSeleccionar,
  onAbrirFicha,
  sinRanking,
}: Props) => {
  const [activo, setActivo] = useState<string | null>(null);
  const titulo = useId();

  const geometria = useMemo(() => {
    const encuadre = encuadrarMercator(CONTORNOS.flatMap((contorno) => contorno.anillos), 1000);
    return {
      encuadre,
      formas: CONTORNOS.map((contorno) => {
        const [cx, cy] = proyectarMercator(contorno.lon, contorno.lat, encuadre);
        return { codigo: contorno.codigo, d: trazoMercator(contorno.anillos, encuadre), cx, cy };
      }),
    };
  }, []);

  const porCodigo = useMemo(() => new Map(puntos.map((punto) => [punto.codigo, punto])), [puntos]);
  const maximo = useMemo(() => Math.max(...puntos.map((punto) => punto.valor), 1), [puntos]);
  const ranking = useMemo(() => [...puntos].sort((a, b) => b.valor - a.valor), [puntos]);

  const resaltado = activo ?? seleccionado ?? null;
  const punteroActivo = resaltado ? porCodigo.get(resaltado) : undefined;

  return (
    <div className="mapa">
      <figure className="mapa__lienzo">
        <svg
          viewBox={`0 0 ${geometria.encuadre.ancho} ${geometria.encuadre.alto}`}
          role="img"
          aria-labelledby={titulo}
          className="mapa__svg"
        >
          <title id={titulo}>{`Mapa de Colombia con la distribución de ${unidad} por departamento`}</title>
          {geometria.formas.map((contorno) => {
            const punto = porCodigo.get(contorno.codigo);
            const nivel = punto ? tramo(punto.valor, maximo) : -1;
            return (
              <path
                key={contorno.codigo}
                d={contorno.d}
                className="mapa__departamento"
                data-nivel={nivel}
                data-activo={resaltado === contorno.codigo ? "si" : undefined}
                data-pulsable={onAbrirFicha && punto ? "si" : undefined}
                aria-hidden="true"
                onMouseEnter={punto ? () => setActivo(contorno.codigo) : undefined}
                onMouseLeave={punto ? () => setActivo(null) : undefined}
                onClick={onAbrirFicha && punto ? () => onAbrirFicha(contorno.codigo) : undefined}
              />
            );
          })}
          {resaltado
            ? geometria.formas.filter((contorno) => contorno.codigo === resaltado).map((contorno) => (
                <circle
                  key={`marca-${contorno.codigo}`}
                  cx={contorno.cx}
                  cy={contorno.cy}
                  r={14}
                  className="mapa__pulso"
                  aria-hidden="true"
                />
              ))
            : null}
        </svg>

        <figcaption className="mapa__pie">
          {punteroActivo ? (
            <span className="mapa__lectura">
              <strong>{punteroActivo.nombre}</strong>
              <span className="mono">{`${numero(punteroActivo.valor)} ${unidad}`}</span>
            </span>
          ) : (
            <span className="mapa__escala">
              <span className="rotulo">Menos</span>
              {Array.from({ length: ESCALONES }, (_, indice) => (
                <span key={indice} className="mapa__muestra" data-nivel={indice} />
              ))}
              <span className="rotulo">Más</span>
            </span>
          )}
        </figcaption>
      </figure>

      {sinRanking ? null : (
      <ol className="mapa__ranking">
        {ranking.map((punto, indice) => {
          const contenido = (
            <>
              <span className="mapa__orden mono">{String(indice + 1).padStart(2, "0")}</span>
              <span className="mapa__nombre">{punto.nombre}</span>
              <span className="mapa__barra" aria-hidden="true">
                <span style={{ width: `${Math.round((punto.valor / maximo) * 100)}%` }} />
              </span>
              <span className="mapa__valor mono">{numero(punto.valor)}</span>
            </>
          );
          return (
            <li key={punto.codigo} data-activo={resaltado === punto.codigo ? "si" : undefined}>
              {onAbrirFicha || onSeleccionar ? (
                <button
                  type="button"
                  className="mapa__fila"
                  aria-pressed={onSeleccionar && !onAbrirFicha ? seleccionado === punto.codigo : undefined}
                  onClick={() => {
                    if (onAbrirFicha) onAbrirFicha(punto.codigo);
                    else onSeleccionar?.(punto.codigo);
                  }}
                  onMouseEnter={() => setActivo(punto.codigo)}
                  onMouseLeave={() => setActivo(null)}
                  onFocus={() => setActivo(punto.codigo)}
                  onBlur={() => setActivo(null)}
                >
                  {contenido}
                  <span className="solo-lectores">
                    {onAbrirFicha ? `${unidad}. Ver detalle de ${punto.nombre}` : unidad}
                  </span>
                </button>
              ) : (
                <span
                  className="mapa__fila"
                  onMouseEnter={() => setActivo(punto.codigo)}
                  onMouseLeave={() => setActivo(null)}
                >
                  {contenido}
                  <span className="solo-lectores">{unidad}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      )}
    </div>
  );
};
