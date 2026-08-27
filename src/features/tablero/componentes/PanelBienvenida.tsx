import { Link } from "react-router-dom";
import { Icono } from "../../../shared/ui/primitivos/Icono";

type Props = {
  titulo: string;
  etiqueta: string;
  texto: string;
  acciones: readonly { etiqueta: string; ruta: string; icono: "vitrina" | "licencias" | "trazabilidad"; activa?: boolean }[];
};

export const PanelBienvenida = ({ titulo, etiqueta, texto, acciones }: Props) => (
  <section className="heroe-panel">
    <p className="heroe-panel__etiqueta">{etiqueta}</p>
    <h1 className="heroe-panel__titulo" aria-label={titulo}>
      {titulo.split(" ").map((palabra, orden) => (
        <span key={`${palabra}-${orden}`} aria-hidden="true" className="heroe-panel__palabra">
          {palabra.split("").map((letra, indice) => (
            <span key={`${letra}-${indice}`} className="heroe-panel__letra">
              {letra}
            </span>
          ))}
        </span>
      ))}
    </h1>
    <p className="heroe-panel__texto">{texto}</p>
    <div className="heroe-panel__acciones">
      {acciones.map((accion) => (
        <Link
          key={accion.ruta}
          to={accion.ruta}
          className={accion.activa ? "heroe-panel__boton heroe-panel__boton--activo" : "heroe-panel__boton"}
        >
          <Icono nombre={accion.icono} tamano={16} />
          {accion.etiqueta}
        </Link>
      ))}
    </div>
  </section>
);
