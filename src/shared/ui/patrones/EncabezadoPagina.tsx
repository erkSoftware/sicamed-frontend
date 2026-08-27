import type { ReactNode } from "react";

type Props = {
  titulo: string;
  subtitulo?: string;
  acciones?: ReactNode;
};

export const EncabezadoPagina = ({ titulo, subtitulo, acciones }: Props) => (
  <header className="pagina__encabezado">
    <div>
      <h1 className="pagina__titulo">{titulo}</h1>
      {subtitulo ? <p className="pagina__subtitulo">{subtitulo}</p> : null}
    </div>
    {acciones ? <div className="pagina__acciones">{acciones}</div> : null}
  </header>
);
