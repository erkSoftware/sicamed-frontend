const LETRAS = ["S", "I", "C", "A", "M", "E", "D"];

export const TitularMarca = () => (
  <h1
    className="heroe__marca"
    aria-label="SICAMED, sistema de información del cannabis medicinal en Colombia"
  >
    <span className="heroe__palabra" aria-hidden="true">
      {LETRAS.map((letra, indice) => (
        <span
          key={`${letra}-${indice}`}
          className="heroe__letra"
          data-vivo={indice >= 4 ? "si" : undefined}
        >
          <span style={{ animationDelay: `${indice * 70}ms`, ["--onda" as string]: `${indice * 130}ms` }}>
            {letra}
          </span>
        </span>
      ))}
    </span>
    <span className="heroe__marca-regla" aria-hidden="true" />
    <span className="heroe__marca-lema rotulo" aria-hidden="true">
      Sistema de información del cannabis medicinal · Colombia
    </span>
  </h1>
);
