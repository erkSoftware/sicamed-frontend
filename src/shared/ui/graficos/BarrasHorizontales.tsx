import { numero } from "../../i18n/formato";

export type BarraDato = {
  etiqueta: string;
  valor: number;
  destacada?: boolean;
};

type Props = {
  datos: readonly BarraDato[];
  unidad?: string;
  titulo: string;
  encabezado?: string;
};

export const BarrasHorizontales = ({ datos, unidad = "", titulo, encabezado = "Departamento" }: Props) => {
  const maximo = Math.max(...datos.map((dato) => dato.valor), 1);
  return (
    <table className="tabla tabla--barras">
      <caption className="solo-lectores">{titulo}</caption>
      <thead>
        <tr>
          <th scope="col">{encabezado}</th>
          <th scope="col" className="tabla__numero">
            {unidad || "Valor"}
          </th>
        </tr>
      </thead>
      <tbody>
        {datos.map((dato, indice) => (
          <tr key={dato.etiqueta}>
            <th scope="row">
              <span className="barra-fila">
                <span className="barra-fila__orden mono">{String(indice + 1).padStart(2, "0")}</span>
                <span className="barra-fila__cuerpo">
                  <span className="barra-fila__nombre">{dato.etiqueta}</span>
                  <span
                    aria-hidden="true"
                    className="barra-fila__pista"
                    data-destacada={dato.destacada ? "si" : undefined}
                  >
                    <span
                      style={{
                        width: `${(dato.valor / maximo) * 100}%`,
                        animationDelay: `${Math.min(indice, 22) * 32}ms`,
                      }}
                    />
                  </span>
                </span>
              </span>
            </th>
            <td className="tabla__numero mono">{numero(dato.valor)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
