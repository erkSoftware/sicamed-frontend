import { useEffect, useState } from "react";
import { entornoIntro, motivoCinematica, olvidarIntro, type MotivoIntro } from "../intro/decision";
import { pedirCinematica } from "../intro/diagnostico";
import {
  entornoOrigen,
  motivoPelicula,
  olvidarPelicula,
  pedirPelicula,
  type MotivoOrigen,
} from "../origen/decision";

const HASH_PANEL = "#animaciones";

const EXPLICACION_INTRO: Record<MotivoIntro, string> = {
  corre: "Arranca sola en esta visita.",
  "pedida-por-hash": "La estás pidiendo por la URL, así que corre aunque ya la hayas visto.",
  "ruta-sin-intro": "Solo arranca en la portada (/). Aquí nunca sale sola.",
  "movimiento-reducido":
    "Tu sistema pide movimiento reducido: no arranca sola, pero el botón sí la lanza.",
  "ya-vista": "Ya la viste y quedó marcada en este navegador. Por eso no vuelve a salir.",
};

const EXPLICACION_ORIGEN: Record<MotivoOrigen, string> = {
  corre: "Arranca sola en esta visita.",
  "pedida-por-hash": "La estás pidiendo por la URL, así que corre aunque ya la hayas visto.",
  "ruta-sin-pelicula": "Solo arranca en /vitrina. Aquí nunca sale sola.",
  "movimiento-reducido":
    "Tu sistema pide movimiento reducido: no arranca sola, pero el botón sí la lanza.",
  "ya-vista": "Ya la viste y quedó marcada en este navegador. Por eso no vuelve a salir.",
};

type Fila = {
  rotulo: string;
  valor: string;
  bien: boolean;
};

export const DiagnosticoAnimaciones = () => {
  const [abierto, setAbierto] = useState(false);
  const [pase, setPase] = useState(0);

  useEffect(() => {
    const revisar = () => setAbierto(window.location.hash === HASH_PANEL);
    revisar();
    window.addEventListener("hashchange", revisar);
    return () => window.removeEventListener("hashchange", revisar);
  }, []);

  if (!abierto) return null;

  const intro = entornoIntro();
  const origen = entornoOrigen();
  const raiz = document.documentElement;

  const filasIntro: readonly Fila[] = [
    {
      rotulo: "Ruta admite la intro",
      valor: intro.ruta === "/" ? "sí" : "no",
      bien: intro.ruta === "/",
    },
    { rotulo: "Marca «ya la vi»", valor: intro.vista ? "sí" : "no", bien: !intro.vista },
    { rotulo: "data-cinematica", valor: raiz.getAttribute("data-cinematica") ?? "—", bien: true },
    {
      rotulo: "Capas en el DOM",
      valor: `${document.querySelectorAll(".cinematica").length}`,
      bien: true,
    },
  ];

  const filasOrigen: readonly Fila[] = [
    {
      rotulo: "Ruta admite la película",
      valor: origen.ruta.replace(/\/+$/, "") === "/vitrina" ? "sí" : "no",
      bien: origen.ruta.replace(/\/+$/, "") === "/vitrina",
    },
    { rotulo: "Marca «ya la vi»", valor: origen.vista ? "sí" : "no", bien: !origen.vista },
    { rotulo: "data-pelicula", valor: raiz.getAttribute("data-pelicula") ?? "—", bien: true },
    {
      rotulo: "Capas en el DOM",
      valor: `${document.querySelectorAll(".cine").length}`,
      bien: true,
    },
  ];

  const bloques = [
    {
      clave: "intro",
      titulo: "Introducción de la portada",
      pie: "Ruta /  ·  hash #animation",
      veredicto: EXPLICACION_INTRO[motivoCinematica(intro)],
      filas: filasIntro,
      reproducir: pedirCinematica,
      olvidar: olvidarIntro,
    },
    {
      clave: "origen",
      titulo: "Por qué comprar colombiano",
      pie: "Ruta /vitrina  ·  hash #origen",
      veredicto: EXPLICACION_ORIGEN[motivoPelicula(origen)],
      filas: filasOrigen,
      reproducir: pedirPelicula,
      olvidar: olvidarPelicula,
    },
  ];

  return (
    <aside className="diagnostico-intro" aria-label="Diagnóstico de las animaciones" key={pase}>
      <header className="diagnostico-intro__cabeza">
        <p className="diagnostico-intro__titulo">¿Por qué no se ve la animación?</p>
        <button
          type="button"
          className="diagnostico-intro__cerrar"
          onClick={() => {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search,
            );
            setAbierto(false);
          }}
        >
          Cerrar
        </button>
      </header>

      {bloques.map((bloque) => (
        <section className="diagnostico-intro__bloque" key={bloque.clave}>
          <p className="diagnostico-intro__nombre">{bloque.titulo}</p>
          <p className="diagnostico-intro__pie mono">{bloque.pie}</p>
          <p className="diagnostico-intro__veredicto">{bloque.veredicto}</p>

          <dl className="diagnostico-intro__lista">
            {bloque.filas.map((fila) => (
              <div key={fila.rotulo} data-bien={fila.bien ? "si" : "no"}>
                <dt>{fila.rotulo}</dt>
                <dd className="mono">{fila.valor}</dd>
              </div>
            ))}
          </dl>

          <div className="diagnostico-intro__acciones">
            <button
              type="button"
              className="boton boton--primario boton--sm"
              onClick={bloque.reproducir}
            >
              Reproducir ahora
            </button>
            <button
              type="button"
              className="boton boton--sm"
              onClick={() => {
                bloque.olvidar();
                setPase((anterior) => anterior + 1);
              }}
            >
              Olvidar que la vi
            </button>
          </div>
        </section>
      ))}

      <p className="diagnostico-intro__nota">
        También desde la consola: <code className="mono">sicamedIntro.estado()</code> y{" "}
        <code className="mono">sicamedIntro.registro()</code>.
      </p>
    </aside>
  );
};
