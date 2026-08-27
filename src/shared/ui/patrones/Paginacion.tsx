import { Boton } from "../primitivos/Boton";
import { numero } from "../../i18n/formato";

type Props = {
  pagina: number;
  porPagina: number;
  total: number;
  onCambiar: (pagina: number) => void;
  etiqueta: string;
};

export const Paginacion = ({ pagina, porPagina, total, onCambiar, etiqueta }: Props) => {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <nav className="paginacion" aria-label={`Paginación de ${etiqueta}`}>
      <p>
        {numero(desde)}–{numero(hasta)} de {numero(total)} {etiqueta}
      </p>
      <div className="paginacion__controles">
        <Boton
          variante="secundario"
          tamano="sm"
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
        >
          Anterior
        </Boton>
        <span aria-current="page">
          Página {pagina} de {paginas}
        </span>
        <Boton
          variante="secundario"
          tamano="sm"
          disabled={pagina >= paginas}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente
        </Boton>
      </div>
    </nav>
  );
};
