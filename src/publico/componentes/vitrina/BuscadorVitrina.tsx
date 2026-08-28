import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";
import { useMovimientoSobrio } from "../../../shared/ui/movimiento/useMovimientoSobrio";
import {
  sugerenciasVitrinaMock,
  type SugerenciaVitrina,
} from "../../../shared/api/mock/servidorMock";

const RETARDO_BUSQUEDA = 240;
const PASO_ESCRITURA = 62;
const PASO_BORRADO = 28;
const ESPERA_LLENO = 1700;
const ESPERA_VACIO = 380;

const ICONOS: Record<SugerenciaVitrina["tipo"], "hoja" | "organizacion" | "mapa"> = {
  PRODUCTO: "hoja",
  ACTOR: "organizacion",
  TERRITORIO: "mapa",
};

const GRUPOS: Record<SugerenciaVitrina["tipo"], string> = {
  PRODUCTO: "vitrina.buscador.grupo.producto",
  ACTOR: "vitrina.buscador.grupo.actor",
  TERRITORIO: "vitrina.buscador.grupo.territorio",
};

type Props = {
  valor: string;
  onBuscar: (texto: string) => void;
  onElegirSugerencia: (sugerencia: SugerenciaVitrina) => void;
  ejemplos?: readonly string[];
  referencia?: RefObject<HTMLInputElement>;
};

export const BuscadorVitrina = ({
  valor,
  onBuscar,
  onElegirSugerencia,
  ejemplos = [],
  referencia,
}: Props) => {
  const { t } = useTraduccion();
  const sobrio = useMovimientoSobrio();
  const [texto, setTexto] = useState(valor);
  const [abierto, setAbierto] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const [activa, setActiva] = useState(-1);
  const [fragmento, setFragmento] = useState("");
  const [ejemploActual, setEjemploActual] = useState(0);
  const [borrando, setBorrando] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const propio = useRef<HTMLInputElement>(null);
  const campo = referencia ?? propio;
  const identificador = useId();

  const tecleando = !sobrio && !enfocado && texto === "" && ejemplos.length > 0;

  useEffect(() => {
    setTexto(valor);
  }, [valor]);

  useEffect(() => {
    if (texto === valor) return undefined;
    const temporizador = window.setTimeout(() => onBuscar(texto), RETARDO_BUSQUEDA);
    return () => window.clearTimeout(temporizador);
  }, [texto, valor, onBuscar]);

  useEffect(() => {
    if (!tecleando) {
      setFragmento("");
      setBorrando(false);
      return undefined;
    }
    const ejemplo = ejemplos[ejemploActual % ejemplos.length] ?? "";
    if (!borrando && fragmento === ejemplo) {
      const espera = window.setTimeout(() => setBorrando(true), ESPERA_LLENO);
      return () => window.clearTimeout(espera);
    }
    if (borrando && fragmento === "") {
      const espera = window.setTimeout(() => {
        setBorrando(false);
        setEjemploActual((indice) => indice + 1);
      }, ESPERA_VACIO);
      return () => window.clearTimeout(espera);
    }
    const paso = window.setTimeout(
      () =>
        setFragmento((actual) =>
          borrando ? actual.slice(0, -1) : ejemplo.slice(0, actual.length + 1),
        ),
      borrando ? PASO_BORRADO : PASO_ESCRITURA,
    );
    return () => window.clearTimeout(paso);
  }, [tecleando, ejemplos, ejemploActual, fragmento, borrando]);

  useEffect(() => {
    const alPulsarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", alPulsarFuera);
    return () => document.removeEventListener("mousedown", alPulsarFuera);
  }, []);

  const sugerencias = abierto ? sugerenciasVitrinaMock(texto) : [];

  const elegir = (sugerencia: SugerenciaVitrina) => {
    setAbierto(false);
    setActiva(-1);
    setTexto("");
    onElegirSugerencia(sugerencia);
  };

  const alTeclear = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === "Escape") {
      setAbierto(false);
      setActiva(-1);
      return;
    }
    if (sugerencias.length === 0) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setActiva((indice) => (indice + 1) % sugerencias.length);
    }
    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setActiva((indice) => (indice <= 0 ? sugerencias.length - 1 : indice - 1));
    }
    if (evento.key === "Enter" && activa >= 0) {
      evento.preventDefault();
      const elegida = sugerencias[activa];
      if (elegida) elegir(elegida);
    }
  };

  const limpiar = () => {
    setTexto("");
    onBuscar("");
    setAbierto(false);
    campo.current?.focus();
  };

  const marcador =
    tecleando && fragmento
      ? t("vitrina.buscador.probando", { valor: fragmento })
      : t("vitrina.buscador.marcador");

  return (
    <div className="buscador-mercado" ref={contenedor} data-enfocado={enfocado ? "si" : undefined}>
      <span className="buscador-mercado__anillo" aria-hidden="true" />
      <label className="solo-lectores" htmlFor={`${identificador}-campo`}>
        {t("vitrina.buscador.etiqueta")}
      </label>
      <span className="buscador-mercado__icono" aria-hidden="true">
        <Icono nombre="buscar" tamano={20} />
      </span>
      <input
        ref={campo}
        id={`${identificador}-campo`}
        className="buscador-mercado__campo"
        type="text"
        role="combobox"
        autoComplete="off"
        placeholder={marcador}
        value={texto}
        aria-expanded={abierto && sugerencias.length > 0}
        aria-controls={`${identificador}-lista`}
        aria-activedescendant={activa >= 0 ? `${identificador}-opcion-${activa}` : undefined}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setAbierto(true);
          setActiva(-1);
        }}
        onFocus={() => {
          setEnfocado(true);
          setAbierto(true);
        }}
        onBlur={(evento) => {
          setEnfocado(false);
          if (!contenedor.current?.contains(evento.relatedTarget as Node)) setAbierto(false);
        }}
        onKeyDown={alTeclear}
      />
      {texto ? (
        <button
          type="button"
          className="buscador-mercado__limpiar"
          onClick={limpiar}
          aria-label={t("vitrina.buscador.limpiar")}
        >
          <Icono nombre="cerrar" tamano={14} />
        </button>
      ) : null}

      {abierto && texto.trim().length >= 2 ? (
        <div className="sugerencias">
          <p className="sugerencias__titulo rotulo">
            {sugerencias.length > 0
              ? t("vitrina.buscador.sugerencias")
              : t("vitrina.buscador.sinSugerencias")}
          </p>
          <ul className="sugerencias__lista" id={`${identificador}-lista`} role="listbox">
            {sugerencias.map((sugerencia, indice) => (
              <li
                key={`${sugerencia.tipo}-${sugerencia.valor}`}
                style={{ "--indice": indice } as React.CSSProperties}
              >
                <button
                  type="button"
                  id={`${identificador}-opcion-${indice}`}
                  role="option"
                  aria-selected={activa === indice}
                  className="sugerencias__opcion"
                  data-activa={activa === indice ? "si" : undefined}
                  onMouseEnter={() => setActiva(indice)}
                  onClick={() => elegir(sugerencia)}
                >
                  <span className="sugerencias__icono" aria-hidden="true">
                    <Icono nombre={ICONOS[sugerencia.tipo]} tamano={14} />
                  </span>
                  <span className="sugerencias__valor">{sugerencia.valor}</span>
                  <span className="sugerencias__grupo rotulo">{t(GRUPOS[sugerencia.tipo])}</span>
                  <span className="sugerencias__conteo mono">{sugerencia.conteo}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
