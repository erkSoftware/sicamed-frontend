import type { ReactNode } from "react";

export type Columna<T> = {
  clave: string;
  encabezado: string;
  numerica?: boolean;
  ancho?: string;
  render: (fila: T) => ReactNode;
};

type Props<T> = {
  descripcion: string;
  columnas: readonly Columna<T>[];
  filas: readonly T[];
  claveFila: (fila: T) => string;
  vacio?: ReactNode;
  cargando?: boolean;
};

export const Tabla = <T,>({
  descripcion,
  columnas,
  filas,
  claveFila,
  vacio,
  cargando,
}: Props<T>) => {
  if (cargando) {
    return (
      <div className="tabla-envoltura" role="group" tabIndex={0} aria-label={descripcion} aria-busy="true">
        <table className="tabla">
          <caption className="solo-lectores">{descripcion}</caption>
          <thead>
            <tr>
              {columnas.map((columna) => (
                <th key={columna.clave} scope="col">
                  {columna.encabezado}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, indice) => (
              <tr key={indice}>
                {columnas.map((columna) => (
                  <td key={columna.clave}>
                    <span className="esqueleto" style={{ display: "block", height: 14, width: "78%" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (filas.length === 0 && vacio) return <>{vacio}</>;

  return (
    <div className="tabla-envoltura" role="group" tabIndex={0} aria-label={descripcion}>
      <table className="tabla">
        <caption className="solo-lectores">{descripcion}</caption>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th
                key={columna.clave}
                scope="col"
                data-columna={columna.clave}
                className={columna.numerica ? "tabla__numero" : undefined}
                style={columna.ancho ? { width: columna.ancho } : undefined}
              >
                {columna.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={claveFila(fila)} data-fila={claveFila(fila)}>
              {columnas.map((columna) => (
                <td key={columna.clave} data-columna={columna.clave} className={columna.numerica ? "tabla__numero" : undefined}>
                  {columna.render(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
