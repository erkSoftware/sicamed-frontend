import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Aurora } from "../../../shared/ui/aurora/Aurora";
import { ACCIONES, fichaDeAccion } from "../../../shared/ui/aurora/acciones";
import type { AccionAurora } from "../../../shared/ui/aurora/acciones";
import type { Encuadre } from "../../../shared/ui/aurora/escena";
import { useAurora } from "../../../shared/ui/aurora/almacen";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { olvidarPresentacion } from "../../../shared/ui/aurora/PresentacionAurora";
import { resultadoDeNavegacion } from "../../../shared/ui/aurora/destinos";
import type { ResultadoNavegacion } from "../../../shared/ui/aurora/destinos";
import { useAuth } from "../../../shared/auth/useAuth";

const ENCUADRES: readonly { clave: Encuadre; etiqueta: string }[] = [
  { clave: "rostro", etiqueta: "Rostro" },
  { clave: "busto", etiqueta: "Busto" },
  { clave: "completo", etiqueta: "Cuerpo" },
];

const DICHOS: readonly string[] = [
  "llévame a cumplimiento",
  "el cultivo",
  "quiero ir a la vitrina",
  "trazabilidad",
  "/app/inventario",
  "la bandeja de solicitudes",
];

export const LaboratorioAurora = () => {
  const [accion, setAccion] = useState<AccionAurora>("saludo");
  const [encuadre, setEncuadre] = useState<Encuadre>("busto");
  const [dicho, setDicho] = useState("");
  const [resultado, setResultado] = useState<ResultadoNavegacion | null>(null);
  const { permisos } = useAuth();
  const navegar = useNavigate();
  const mostrarAsistente = useAurora((estado) => estado.mostrar);
  const presentar = useAurora((estado) => estado.presentar);
  const decir = useAurora((estado) => estado.decir);
  const ficha = fichaDeAccion(accion);

  const repetirPresentacion = () => {
    olvidarPresentacion();
    presentar();
  };

  const llevarAlPanel = () => {
    mostrarAsistente();
    decir(ficha.frase, accion);
  };

  const resolver = (texto: string) => {
    setDicho(texto);
    setResultado(texto.trim() === "" ? null : resultadoDeNavegacion(texto, permisos));
  };

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Aurora"
        subtitulo="La guía del sistema en tres dimensiones. Cada acción de esta lista es una animación que después se dispara sola: al entrar al tablero, al abrir un formulario, al cerrar un registro o cuando el cumplimiento necesita atención. Arrastra sobre la escena para girarla."
        acciones={
          <div className="fila" style={{ gap: "var(--e3)" }}>
            <Boton variante="secundario" icono="reproducir" onClick={repetirPresentacion}>
              Repetir la presentación de Aurora
            </Boton>
            <Boton variante="secundario" icono="usuario" onClick={llevarAlPanel}>
              Probar en el panel flotante
            </Boton>
          </div>
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

      <Tarjeta
        titulo="Banco de pruebas de navigate_to"
        descripcion="La herramienta que el backend declara y la pantalla resuelve. El destino llega tal como lo dijo la persona, sin traducir: quien lo convierte en ruta es el menú real, recortado por tus permisos. Esto ejecuta el mismo resolutor que corre durante una conversación."
        acciones={<Insignia tono="neutro">clase ui · sin confirmación previa</Insignia>}
        pie={
          <p className="pie-region">
            La herramienta devuelve resultado siempre, también cuando no navega: la diferencia entre
            «esa pantalla no existe» y «tu cuenta no la alcanza» es la diferencia entre que el usuario
            corrija y que se quede esperando.
          </p>
        }
      >
        <div className="pila" style={{ gap: "var(--e4)" }}>
          <CampoTexto
            etiqueta="Lo que dice la persona"
            value={dicho}
            placeholder="llévame al cultivo"
            ayuda="Escríbelo como se diría en voz alta. No hace falta que sea una ruta."
            onChange={(evento) => resolver(evento.target.value)}
          />

          <div className="fila" style={{ gap: "var(--e2)", flexWrap: "wrap" }}>
            {DICHOS.map((frase) => (
              <Boton key={frase} variante="fantasma" tamano="sm" onClick={() => resolver(frase)}>
                {frase}
              </Boton>
            ))}
          </div>

          {resultado ? (
            <div className="pila" style={{ gap: "var(--e3)" }}>
              <Insignia tono={resultado.ok ? "exito" : "alerta"}>
                {resultado.ok ? "Navega" : "No navega, y lo dice"}
              </Insignia>
              <pre className="mono vista-previa">{JSON.stringify(resultado, null, 2)}</pre>
              {resultado.ok && resultado.ruta ? (
                <Boton
                  variante="secundario"
                  icono="flecha"
                  onClick={() => navegar(resultado.ruta ?? "/app")}
                >
                  Ir a {resultado.destino}
                </Boton>
              ) : null}
            </div>
          ) : null}
        </div>
      </Tarjeta>
    </div>
  );
};
