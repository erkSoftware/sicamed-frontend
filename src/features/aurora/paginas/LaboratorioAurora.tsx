import { useState } from "react";
import { Aurora } from "../../../shared/ui/aurora/Aurora";
import { ACCIONES, fichaDeAccion } from "../../../shared/ui/aurora/acciones";
import type { AccionAurora } from "../../../shared/ui/aurora/acciones";
import type { Encuadre } from "../../../shared/ui/aurora/escena";
import { useAurora } from "../../../shared/ui/aurora/almacen";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { Boton } from "../../../shared/ui/primitivos/Boton";

const ENCUADRES: readonly { clave: Encuadre; etiqueta: string }[] = [
  { clave: "rostro", etiqueta: "Rostro" },
  { clave: "busto", etiqueta: "Busto" },
  { clave: "completo", etiqueta: "Cuerpo" },
];

export const LaboratorioAurora = () => {
  const [accion, setAccion] = useState<AccionAurora>("saludo");
  const [encuadre, setEncuadre] = useState<Encuadre>("busto");
  const mostrarAsistente = useAurora((estado) => estado.mostrar);
  const decir = useAurora((estado) => estado.decir);
  const ficha = fichaDeAccion(accion);

  const llevarAlPanel = () => {
    mostrarAsistente();
    decir(ficha.frase, accion);
  };

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Aurora"
        subtitulo="La guía del sistema en tres dimensiones. Cada acción de esta lista es una animación que después se dispara sola: al entrar al tablero, al abrir un formulario, al cerrar un registro o cuando el cumplimiento necesita atención. Arrastra sobre la escena para girarla."
        acciones={
          <Boton variante="secundario" icono="usuario" onClick={llevarAlPanel}>
            Probar en el panel flotante
          </Boton>
        }
      />

      <div className="aurora-laboratorio">
        <div className="aurora-laboratorio__escenario">
          <Aurora accion={accion} encuadre={encuadre} />
          <div
            className="aurora-laboratorio__encuadres"
            role="group"
            aria-label="Encuadre de cámara"
          >
            {ENCUADRES.map((opcion) => (
              <button
                key={opcion.clave}
                type="button"
                aria-pressed={opcion.clave === encuadre}
                onClick={() => setEncuadre(opcion.clave)}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
          <p className="aurora-laboratorio__pie">{ACCIONES.length} animaciones</p>
        </div>

        <div>
          <ul className="aurora-acciones">
            {ACCIONES.map((opcion) => (
              <li key={opcion.clave}>
                <button
                  type="button"
                  aria-pressed={opcion.clave === accion}
                  onClick={() => setAccion(opcion.clave)}
                >
                  <span className="aurora-acciones__etiqueta">{opcion.etiqueta}</span>
                  <span className="aurora-acciones__proposito">{opcion.proposito}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="aurora-frase">{ficha.frase}</p>
        </div>
      </div>
    </div>
  );
};
