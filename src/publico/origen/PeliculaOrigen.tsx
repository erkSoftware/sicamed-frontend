import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CONTORNOS } from "../../shared/api/mock/contornos";
import { DEPARTAMENTOS } from "../../shared/api/mock/catalogos";
import { useTraduccion } from "../../shared/i18n/ProveedorIdioma";
import type { Camara } from "../../shared/geo/proyecciones";
import {
  leerPaletaGlobo,
  pintarGlobo,
  type MarcaGlobo,
} from "../../shared/ui/graficos/pintarGlobo";
import { anotar } from "../intro/diagnostico";
import {
  CANAL_ORIGEN,
  limpiarHashOrigen,
  marcarPeliculaVista,
  pedidaPorHash,
  peliculaActiva,
} from "./decision";
import { trazarEnlaces } from "./globo";
import { EscenaTierra } from "./escenas/EscenaTierra";
import { EscenaCultivo } from "./escenas/EscenaCultivo";
import { EscenaHoja } from "./escenas/EscenaHoja";
import { EscenaLaboratorio } from "./escenas/EscenaLaboratorio";
import { EscenaProducto } from "./escenas/EscenaProducto";
import { EscenaVitrina } from "./escenas/EscenaVitrina";
import { EscenaCierre } from "./escenas/EscenaCierre";
import {
  DURACION_TOTAL,
  FIN_INVITACION,
  PLANOS,
  encuadreEn,
  momentoEn,
  rotuloDe,
  tomaEn,
  type Escena,
  type FaseOrigen,
} from "./guion";

const RADIO_BASE = 0.42;

const MARCAS: readonly MarcaGlobo[] = DEPARTAMENTOS.map((departamento) => ({
  codigo: departamento.codigo,
  nombre: departamento.nombre,
  valor: departamento.proveedores,
}));

const POR_CODIGO = new Map(MARCAS.map((marca) => [marca.codigo, marca]));
const MAXIMO = Math.max(...MARCAS.map((marca) => marca.valor), 1);
const DEPARTAMENTOS_CON_CONTORNO = CONTORNOS.filter((contorno) =>
  POR_CODIGO.has(contorno.codigo),
).length;

const CON_GLOBO: readonly FaseOrigen[] = ["producto", "colombia", "mundo", "sicamed"];

const ELEMENTOS = ["producto", "actor", "territorio", "mercado"] as const;
const RAZONES = ["oferta", "consulta", "territorio", "mundo"] as const;
const MERCADOS = ["oferta", "compradores", "mercados"] as const;

export const PeliculaOrigen = () => {
  const { t } = useTraduccion();
  const [corriendo, setCorriendo] = useState(false);
  const [pase, setPase] = useState(0);
  const [fase, setFase] = useState<FaseOrigen>("invitacion");
  const lienzo = useRef<HTMLCanvasElement>(null);
  const barra = useRef<HTMLSpanElement>(null);
  const capas = useRef(new Map<Escena, HTMLDivElement | null>());
  const entregado = useRef(false);
  const desplazar = useRef(0);

  const iniciar = () => {
    anotar("origen-iniciar");
    entregado.current = false;
    desplazar.current = 0;
    document.documentElement.setAttribute("data-pelicula", "corriendo");
    document.documentElement.setAttribute("data-origen", "corriendo");
    window.scrollTo({ top: 0, behavior: "instant" });
    setFase("invitacion");
    setPase((anterior) => anterior + 1);
    setCorriendo(true);
  };

  const cerrar = () => {
    anotar("origen-cerrar");
    entregado.current = true;
    document.documentElement.removeAttribute("data-pelicula");
    document.documentElement.setAttribute("data-origen", "listo");
    marcarPeliculaVista();
    setCorriendo(false);
  };

  const adelantar = () => {
    desplazar.current = Math.max(desplazar.current, FIN_INVITACION);
    anotar("origen-adelantar", { a: FIN_INVITACION });
  };

  useEffect(() => {
    const activa = peliculaActiva();
    anotar("origen-capa-montada", { activa });
    if (activa) {
      limpiarHashOrigen();
      iniciar();
      return;
    }
    document.documentElement.removeAttribute("data-pelicula");
    document.documentElement.setAttribute("data-origen", "listo");
  }, []);

  useEffect(() => {
    const alPedir = () => iniciar();
    window.addEventListener(CANAL_ORIGEN, alPedir);
    return () => window.removeEventListener(CANAL_ORIGEN, alPedir);
  }, []);

  useEffect(() => {
    const alCambiarHash = () => {
      if (!pedidaPorHash(window.location.hash)) return;
      limpiarHashOrigen();
      iniciar();
    };
    window.addEventListener("hashchange", alCambiarHash);
    return () => window.removeEventListener("hashchange", alCambiarHash);
  }, []);

  useEffect(() => {
    if (!corriendo) return undefined;
    const elemento = lienzo.current;
    const contexto = elemento ? elemento.getContext("2d") : null;
    anotar("origen-bucle", { pase, lienzo: Boolean(elemento), contexto: Boolean(contexto) });
    if (!elemento || !contexto) return undefined;

    const raiz = document.documentElement;
    const paleta = leerPaletaGlobo(raiz);
    let ancho = 0;
    let alto = 0;
    let cuadro = 0;
    let inicio = 0;
    let cuadros = 0;
    let previa: FaseOrigen | null = null;
    let globoPrevio = -1;
    const escrito = new Map<
      Escena,
      { opacidad: string; transform: string; filter: string; visibility: string }
    >();

    const medir = () => {
      const densidad = Math.min(window.devicePixelRatio || 1, 2);
      ancho = Math.max(window.innerWidth, 1);
      alto = Math.max(window.innerHeight, 1);
      elemento.width = Math.round(ancho * densidad);
      elemento.height = Math.round(alto * densidad);
      contexto.setTransform(densidad, 0, 0, densidad, 0, 0);
    };

    const entregar = () => {
      if (entregado.current) return;
      anotar("origen-entregar");
      entregado.current = true;
      raiz.removeAttribute("data-pelicula");
      raiz.setAttribute("data-origen", "listo");
    };

    const dibujar = (ahora: number) => {
      cuadros += 1;
      if (cuadros === 1) {
        inicio = ahora;
        anotar("origen-primer-cuadro", { ancho, alto });
      }

      const tiempo = ahora - inicio + desplazar.current;

      if (tiempo >= DURACION_TOTAL) {
        anotar("origen-fin", { cuadros });
        entregar();
        marcarPeliculaVista();
        setCorriendo(false);
        return;
      }

      const momento = momentoEn(tiempo);
      if (momento.fase !== previa) {
        previa = momento.fase;
        anotar("origen-fase", { fase: momento.fase, ms: Math.round(tiempo) });
        setFase(momento.fase);
        if (momento.fase === "salida") entregar();
      }

      if (barra.current) barra.current.style.transform = `scaleX(${tiempo / DURACION_TOTAL})`;

      let globo = 0;
      for (const plano of PLANOS) {
        const toma = tomaEn(plano, tiempo);
        if (plano.escena === "globo") globo = toma.opacidad;
        const nodo = capas.current.get(plano.escena);
        if (!nodo) continue;
        const visibility = toma.opacidad <= 0.005 ? "hidden" : "visible";
        const anterior = escrito.get(plano.escena);
        if (visibility === "hidden" && anterior?.visibility === "hidden") continue;
        const opacidad = toma.opacidad.toFixed(3);
        const transform = `scale(${toma.escala.toFixed(4)})`;
        const filter = toma.desenfoque > 0.2 ? `blur(${toma.desenfoque.toFixed(1)}px)` : "none";
        if (!anterior) {
          nodo.style.opacity = opacidad;
          nodo.style.transform = transform;
          nodo.style.filter = filter;
          nodo.style.visibility = visibility;
          nodo.setAttribute("data-fuera-de-vista", visibility === "hidden" ? "si" : "no");
          escrito.set(plano.escena, { opacidad, transform, filter, visibility });
          continue;
        }
        if (anterior.opacidad !== opacidad) {
          nodo.style.opacity = opacidad;
          anterior.opacidad = opacidad;
        }
        if (anterior.transform !== transform) {
          nodo.style.transform = transform;
          anterior.transform = transform;
        }
        if (anterior.filter !== filter) {
          nodo.style.filter = filter;
          anterior.filter = filter;
        }
        if (anterior.visibility !== visibility) {
          nodo.style.visibility = visibility;
          nodo.setAttribute("data-fuera-de-vista", visibility === "hidden" ? "si" : "no");
          anterior.visibility = visibility;
        }
      }

      contexto.globalAlpha = 1;
      contexto.clearRect(0, 0, ancho, alto);
      if (globo !== globoPrevio) {
        globoPrevio = globo;
        elemento.style.opacity = `${globo}`;
      }

      if (globo > 0.01 && CON_GLOBO.includes(momento.fase)) {
        const encuadre = encuadreEn(momento);
        const visor = Math.min(ancho, alto) * RADIO_BASE * encuadre.acercamiento;
        const camara: Camara = {
          lon: encuadre.lon,
          lat: encuadre.lat,
          radio: visor,
          centroX: ancho / 2,
          centroY: alto / 2,
        };
        const pulso = (Math.sin(ahora / 420) + 1) / 2;

        contexto.save();
        contexto.globalAlpha = globo;
        pintarGlobo(contexto, {
          ancho,
          alto,
          camara,
          visor,
          revelado: encuadre.revelado,
          pulso: 0.5,
          paleta,
          porCodigo: POR_CODIGO,
          maximo: MAXIMO,
          destacado: null,
        });
        trazarEnlaces(contexto, camara, encuadre.enlaces, pulso, paleta);
        contexto.restore();
      }

      cuadro = requestAnimationFrame(dibujar);
    };

    medir();
    cuadro = requestAnimationFrame(dibujar);
    window.addEventListener("resize", medir);

    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("resize", medir);
    };
  }, [corriendo, pase]);

  useEffect(() => {
    const raiz = document.documentElement;
    return () => {
      raiz.removeAttribute("data-pelicula");
      raiz.setAttribute("data-origen", "listo");
    };
  }, []);

  useEffect(() => {
    if (!corriendo) return undefined;
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [corriendo]);

  if (!corriendo) return null;

  const rotulo = rotuloDe(fase);

  const guardar = (escena: Escena) => (nodo: HTMLDivElement | null) => {
    capas.current.set(escena, nodo);
  };

  return (
    <div
      className="cine"
      data-fase={fase}
      key={pase}
      style={{ "--cine-total": `${DURACION_TOTAL}ms` } as CSSProperties}
    >
      <div className="cine__escenario" aria-hidden="true">
        <div className="cine__capa" ref={guardar("tierra")}>
          <EscenaTierra />
        </div>
        <div className="cine__capa" ref={guardar("cultivo")}>
          <EscenaCultivo />
        </div>
        <div className="cine__capa" ref={guardar("hoja")}>
          <EscenaHoja />
        </div>
        <div className="cine__capa" ref={guardar("laboratorio")}>
          <EscenaLaboratorio />
        </div>
        <div className="cine__capa" ref={guardar("producto")}>
          <EscenaProducto />
        </div>
        <canvas ref={lienzo} className="cine__globo" />
        <div className="cine__capa" ref={guardar("vitrina")}>
          <EscenaVitrina />
        </div>
        <div className="cine__capa" ref={guardar("cierre")}>
          <EscenaCierre />
        </div>

        <span className="cine__banda cine__banda--alta" />
        <span className="cine__banda cine__banda--baja" />
        <span className="cine__grano" />
        <span className="cine__vineta" />

        <div className="cine__letrero" data-visible={rotulo ? "si" : "no"}>
          <p className="cine__frase">{rotulo ? t(rotulo) : ""}</p>
          {fase === "origen" ? (
            <p className="cine__pie mono">{DEPARTAMENTOS_CON_CONTORNO} departamentos</p>
          ) : null}
        </div>

        <div className="cine__mercados" data-visible={fase === "mundo" ? "si" : "no"}>
          {MERCADOS.map((mercado, indice) => (
            <span key={mercado} style={{ animationDelay: `${indice * 0.9}s` }}>
              {t(`origen.mercado.${mercado}`)}
            </span>
          ))}
        </div>

        <div className="cine__elementos" data-visible={fase === "sicamed" ? "si" : "no"}>
          {ELEMENTOS.map((elemento, indice) => (
            <span key={elemento} style={{ animationDelay: `${0.6 + indice * 0.5}s` }}>
              {t(`origen.elemento.${elemento}`)}
            </span>
          ))}
        </div>

        <div className="cine__razones" data-visible={fase === "razones" ? "si" : "no"}>
          <p className="cine__rotulo">{t("origen.razones.titulo")}</p>
          <ul>
            {RAZONES.map((razon, indice) => (
              <li key={razon} style={{ animationDelay: `${indice * 0.42}s` }}>
                <span className="cine__razon-titulo">{t(`origen.razones.${razon}.titulo`)}</span>
                <span className="cine__razon-glosa">{t(`origen.razones.${razon}.glosa`)}</span>
              </li>
            ))}
          </ul>
          <p className="cine__pie">{t("origen.razones.pie")}</p>
        </div>

        <div
          className="cine__final"
          data-visible={fase === "cierre" || fase === "salida" ? "si" : "no"}
        >
          <p className="cine__marca">SICAMED</p>
          <span className="cine__regla" />
          <p className="cine__linea">{t("origen.cierre.linea")}</p>
          <p className="cine__lema">{t("origen.cierre.lema")}</p>
          <p className="cine__glosa">{t("origen.cierre.glosa")}</p>
        </div>

        <span className="cine__progreso" ref={barra} />
      </div>

      <div className="cine__portada" data-visible={fase === "invitacion" ? "si" : "no"}>
        <p className="cine__portada-titulo">{t("origen.invitacion.titulo")}</p>
        <div className="cine__portada-acciones">
          <button type="button" className="cine__ver" onClick={adelantar}>
            {t("origen.invitacion.ver")}
          </button>
          <button type="button" className="cine__omitir" onClick={cerrar}>
            {t("origen.invitacion.omitir")}
          </button>
        </div>
      </div>

      <button type="button" className="cine__salto" onClick={cerrar}>
        {t("origen.salto")}
      </button>
    </div>
  );
};
