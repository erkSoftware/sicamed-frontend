import { useState } from "react";
import { Aurora } from "../../../shared/ui/aurora/Aurora";
import type { Vista } from "../../../shared/ui/aurora/escena";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";

const VISTAS: readonly { clave: Vista; etiqueta: string }[] = [
  { clave: "frente", etiqueta: "Frente" },
  { clave: "tresCuartos", etiqueta: "Tres cuartos" },
  { clave: "perfilIzq", etiqueta: "Perfil izquierdo" },
  { clave: "perfilDer", etiqueta: "Perfil derecho" },
  { clave: "tresCuartosTrasero", etiqueta: "Tres cuartos trasero" },
  { clave: "espalda", etiqueta: "Espalda" },
];

export const HojaAurora = () => {
  const [origen, setOrigen] = useState<"procedural" | "modelo">("procedural");
  const [detalle, setDetalle] = useState(false);

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Hoja de personaje"
        subtitulo="El mismo modelo desde seis ángulos, en pose de reposo, con fondo de estudio y luz neutra. Sirve para revisar proporciones y para comparar contra la referencia antes de reemplazar la figura por el mesh definitivo."
        acciones={
          <Boton
            variante="secundario"
            icono={detalle ? "buscar" : "capas"}
            onClick={() => setDetalle((valor) => !valor)}
          >
            {detalle ? "Ver cuerpo" : "Ver cabeza"}
          </Boton>
        }
      />

      <p className="aurora-origen">
        <Insignia tono={origen === "modelo" ? "exito" : "neutro"}>
          {origen === "modelo" ? "Mesh cargado" : "Figura procedural"}
        </Insignia>
        {origen === "modelo"
          ? "La escena está usando el archivo de public/modelos/aurora.glb."
          : "No hay aurora.glb en public/modelos, así que se dibuja la figura de respaldo."}
      </p>

      <div className="aurora-hoja">
        {VISTAS.map((vista, indice) => (
          <figure key={vista.clave} className="aurora-hoja__vista">
            <Aurora
              accion="reposo"
              encuadre={detalle ? "rostro" : "completo"}
              vista={vista.clave}
              fondoEstudio
              interactiva={false}
              onOrigen={indice === 0 ? setOrigen : undefined}
            />
            <figcaption>{vista.etiqueta}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
};
