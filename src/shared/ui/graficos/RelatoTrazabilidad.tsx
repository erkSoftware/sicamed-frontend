import { useEffect, useId, useRef, useState } from "react";
import { Icono } from "../primitivos/Icono";
import { useRevelado } from "../movimiento/useRevelado";
import {
  EscenaAcopio,
  EscenaBodega,
  EscenaDestinos,
  EscenaFloracion,
  EscenaRegistro,
  EscenaSiembra,
} from "./escenasRelato";

const COMPAS = 6200;

const ESCENAS = [
  {
    clave: "siembra",
    rotulo: "Siembra",
    titulo: "Un campesino siembra un lote con nombre propio",
    texto:
      "El cultivador habilitado abre el surco y georreferencia el predio. Desde ese momento el lote existe en el sistema: variedad, coordenadas, licencia y responsable. Todo lo que venga después se cuelga de ese identificador.",
    actor: "Cultivador habilitado",
    sello: "Lote sembrado y georreferenciado",
    alterno:
      "Ilustración de un campesino con sombrero y ruana sembrando en un surco, junto a una estaca que rotula el lote.",
    dibujo: <EscenaSiembra />,
  },
  {
    clave: "floracion",
    rotulo: "Floración",
    titulo: "La planta florece y alguien responde por la cosecha",
    texto:
      "El viraje del pistilo marca la ventana de corte. Quien inspecciona deja anotada la fecha, la variedad y el estado sanitario antes de cosechar, porque esa anotación es la que sostiene el peso declarado más adelante.",
    actor: "Responsable técnico del cultivo",
    sello: "Cosecha reportada con variedad y fecha",
    alterno:
      "Ilustración de una planta de cannabis florecida en el surco, observada con una lupa junto a la estaca del lote.",
    dibujo: <EscenaFloracion />,
  },
  {
    clave: "acopio",
    rotulo: "Acopio",
    titulo: "La biomasa sale en bultos pesados y sellados",
    texto:
      "Se pesa, se sella y se rotula bulto por bulto. El traslado viaja con su remisión —origen, destino, placa y responsable— para que cualquier autoridad pueda reconstruir el trayecto sin llamar a nadie.",
    actor: "Cultivador y transportador",
    sello: "Traslado registrado con remisión",
    alterno:
      "Ilustración de bultos sellados junto a un camión, con un campesino cargando uno al hombro.",
    dibujo: <EscenaAcopio />,
  },
  {
    clave: "bodega",
    rotulo: "Bodega",
    titulo: "Entra a bodega bajo condiciones controladas",
    texto:
      "Báscula, temperatura, humedad y rotación quedan bajo buenas prácticas de manufactura. Cada movimiento de existencias suma o descuenta sobre el mismo lote, nunca sobre un inventario anónimo.",
    actor: "Operador de almacenamiento",
    sello: "Existencias conciliadas por lote",
    alterno:
      "Ilustración del interior de una bodega con estanterías, un bulto sobre una báscula y un medidor de temperatura y humedad.",
    dibujo: <EscenaBodega />,
  },
  {
    clave: "registro",
    rotulo: "Registro",
    titulo: "El operador lo registra en SICAMED",
    texto:
      "Desde un portátil, y si hace falta con conexión intermitente, el responsable carga el evento. El sistema lo encadena con la huella del anterior, publica lo que es público y reserva lo que es comercial.",
    actor: "Actor habilitado en el sistema",
    sello: "Evento encadenado y publicado",
    alterno:
      "Ilustración de una persona registrando el lote en un portátil, con la cadena de eventos en pantalla y el sello de la huella.",
    dibujo: <EscenaRegistro />,
  },
  {
    clave: "destinos",
    rotulo: "Destinos",
    titulo: "De ahí sale hacia quien lo necesita",
    texto:
      "Droguerías y cadenas de farmacia, IPS y hospitales, laboratorios que transforman o exportan, y el paciente con fórmula al final del recorrido. El paciente es un destino, no el único. La vitrina muestra la oferta disponible; el acuerdo se cierra fuera del sistema, entre actores habilitados.",
    actor: "Red de actores habilitados",
    sello: "Entrega confirmada con firma",
    alterno:
      "Diagrama con SICAMED al centro y cuatro destinos: droguerías y cadenas, IPS y hospitales, laboratorios y exportación, y el paciente.",
    dibujo: <EscenaDestinos />,
  },
] as const;

export const RelatoTrazabilidad = () => {
  const { referencia, visible, enPantalla } = useRevelado<HTMLDivElement>("0px 0px -12% 0px", {
    seguir: true,
  });
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [rondando, setRondando] = useState(false);
  const reducido = useRef(false);
  const titulo = useId();

  useEffect(() => {
    reducido.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!visible || !enPantalla || pausado || rondando) return undefined;
    const compas = reducido.current ? COMPAS + 2600 : COMPAS;
    const reloj = window.setTimeout(() => {
      setIndice((anterior) => (anterior + 1) % ESCENAS.length);
    }, compas);
    return () => window.clearTimeout(reloj);
  }, [visible, enPantalla, pausado, rondando, indice]);

  const escena = ESCENAS[indice] ?? ESCENAS[0];
  const corriendo = visible && enPantalla && !pausado && !rondando;

  return (
    <div
      className="relato"
      ref={referencia}
      data-fuera-de-vista={enPantalla ? "no" : "si"}
      onMouseEnter={() => setRondando(true)}
      onMouseLeave={() => setRondando(false)}
    >
      <ol className="relato__rail">
        {ESCENAS.map((paso, orden) => (
          <li key={paso.clave} className="relato__paso" data-estado={orden === indice ? "activo" : orden < indice ? "hecho" : "espera"}>
            <button
              type="button"
              className="relato__paso-boton"
              aria-pressed={orden === indice}
              onClick={() => {
                setIndice(orden);
                setPausado(true);
              }}
            >
              <span className="relato__paso-numero mono">{String(orden + 1).padStart(2, "0")}</span>
              <span className="relato__paso-nombre">{paso.rotulo}</span>
            </button>
          </li>
        ))}
      </ol>

      <figure className="relato__marco">
        <svg
          viewBox="0 0 720 404"
          className="relato__canva"
          role="img"
          aria-labelledby={titulo}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={titulo}>{escena.alterno}</title>
          {ESCENAS.map((paso, orden) => (
            <g
              key={paso.clave}
              className="relato__escena"
              data-estado={orden === indice ? "activa" : "oculta"}
              aria-hidden={orden === indice ? undefined : "true"}
            >
              {paso.dibujo}
            </g>
          ))}
        </svg>

        <span className="relato__compas" aria-hidden="true">
          <span key={indice} className="relato__compas-avance" data-corriendo={corriendo ? "si" : "no"} />
        </span>

        <figcaption className="relato__glosa">
          <p className="relato__glosa-orden rotulo">
            Escena {String(indice + 1).padStart(2, "0")} de {String(ESCENAS.length).padStart(2, "0")}
            <span aria-hidden="true"> · </span>
            {escena.actor}
          </p>
          <h3 className="relato__glosa-titulo">{escena.titulo}</h3>
          <p className="relato__glosa-texto">{escena.texto}</p>
          <div className="relato__pie">
            <p className="relato__glosa-sello mono">
              <Icono nombre="check" tamano={14} />
              {escena.sello}
            </p>
            <button
              type="button"
              className="relato__mando"
              onClick={() => setPausado((anterior) => !anterior)}
              aria-label={pausado ? "Reanudar el recorrido" : "Pausar el recorrido"}
            >
              <Icono nombre={pausado ? "reproducir" : "pausa"} tamano={16} />
              <span>{pausado ? "Reanudar" : "Pausar"}</span>
            </button>
          </div>
        </figcaption>
      </figure>
    </div>
  );
};
