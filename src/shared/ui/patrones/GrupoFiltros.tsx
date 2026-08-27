type Opcion = { valor: string; etiqueta: string };

type Props = {
  etiqueta: string;
  opciones: readonly Opcion[];
  valor: string;
  onCambiar: (valor: string) => void;
};

export const GrupoFiltros = ({ etiqueta, opciones, valor, onCambiar }: Props) => (
  <div className="grupo-filtros" role="group" aria-label={etiqueta}>
    {opciones.map((opcion) => (
      <button
        key={opcion.valor}
        type="button"
        aria-pressed={valor === opcion.valor}
        onClick={() => onCambiar(opcion.valor)}
      >
        {opcion.etiqueta}
      </button>
    ))}
  </div>
);
