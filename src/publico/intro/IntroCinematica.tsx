import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ANILLOS_COLOMBIA } from "../../shared/api/mock/mundo";
import { CONTORNOS, type ContornoDepartamento } from "../../shared/api/mock/contornos";
import { DEPARTAMENTOS } from "../../shared/api/mock/catalogos";
import { proyectarOrtografica, type Camara } from "../../shared/geo/proyecciones";
import { numero } from "../../shared/i18n/formato";
import { EscenaCadena } from "../../shared/ui/graficos/escena/EscenaCadena";
import {
  leerPaletaGlobo,
  pintarGlobo,
  trazarAnillos,
  type MarcaGlobo,
  type PaletaGlobo,
} from "../../shared/ui/graficos/pintarGlobo";
import { cinematicaActiva, limpiarHashIntro, marcarIntroVista, pedidaPorHash } from "./decision";
import { anotar, CANAL_INTRO } from "./diagnostico";
import { DURACION_TOTAL, INICIO_SALIDA, encuadreEn, momentoEn, type Momento } from "./guion";

const RADIO_BASE = 0.42;

const MARCAS: readonly MarcaGlobo[] = DEPARTAMENTOS.map((departamento) => ({
  codigo: departamento.codigo,
  nombre: departamento.nombre,
  valor: departamento.proveedores,
}));

const POR_CODIGO = new Map(MARCAS.map((marca) => [marca.codigo, marca]));
const MAXIMO = Math.max(...MARCAS.map((marca) => marca.valor), 1);
const ELEGIBLES = CONTORNOS.filter((contorno) => POR_CODIGO.has(contorno.codigo));

const elegirDepartamento = (): ContornoDepartamento =>
  ELEGIBLES[Math.floor(Math.random() * ELEGIBLES.length)] ?? (CONTORNOS[0] as ContornoDepartamento);

const resaltarColombia = (
  contexto: CanvasRenderingContext2D,
  camara: Camara,
  intensidad: number,
  paleta: PaletaGlobo,
) => {
  if (intensidad <= 0.01) return;
  contexto.save();
  contexto.globalAlpha = intensidad;
  contexto.shadowColor = paleta.foco;
  contexto.shadowBlur = 28 * intensidad;
  contexto.strokeStyle = paleta.foco;
  contexto.lineWidth = 2.4;
  trazarAnillos(contexto, ANILLOS_COLOMBIA, camara);
  contexto.stroke();
  contexto.restore();
};

const medirContorno = (contorno: ContornoDepartamento, camara: Camara) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let visibles = 0;
  for (const anillo of contorno.anillos) {
    for (let i = 0; i < anillo.length; i += 2) {
      const punto = proyectarOrtografica(anillo[i] as number, anillo[i + 1] as number, camara);
      if (!punto.visible) continue;
      visibles += 1;
      if (punto.x < minX) minX = punto.x;
      if (punto.x > maxX) maxX = punto.x;
      if (punto.y < minY) minY = punto.y;
      if (punto.y > maxY) maxY = punto.y;
    }
  }
  if (visibles === 0) return null;
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    radio: Math.max(Math.hypot(maxX - minX, maxY - minY) / 2, 34),
  };
};

const senalarDepartamento = (
  contexto: CanvasRenderingContext2D,
  camara: Camara,
  contorno: ContornoDepartamento,
  intensidad: number,
  pulso: number,
  paleta: PaletaGlobo,
  lienzo: { ancho: number; alto: number; visor: number },
  conMira: boolean,
) => {
  if (intensidad <= 0.01) return;
  const medida = medirContorno(contorno, camara);

  if (medida) {
    const velo = contexto.createRadialGradient(
      medida.x,
      medida.y,
      medida.radio,
      medida.x,
      medida.y,
      Math.max(medida.radio * 4.6, lienzo.visor * 0.4),
    );
    velo.addColorStop(0, "rgba(1, 10, 7, 0)");
    velo.addColorStop(1, `rgba(1, 10, 7, ${0.58 * intensidad})`);
    contexto.save();
    contexto.fillStyle = velo;
    contexto.fillRect(0, 0, lienzo.ancho, lienzo.alto);
    contexto.restore();
  }

  contexto.save();
  contexto.globalAlpha = intensidad;
  contexto.shadowColor = paleta.foco;
  contexto.shadowBlur = 24 + 30 * pulso;
  contexto.strokeStyle = paleta.foco;
  contexto.lineWidth = 3;
  trazarAnillos(contexto, contorno.anillos, camara);
  contexto.stroke();
  contexto.stroke();
  contexto.shadowBlur = 0;
  contexto.globalAlpha = intensidad * (0.2 + pulso * 0.26);
  contexto.fillStyle = paleta.foco;
  contexto.fill();
  contexto.restore();

  if (!conMira || !medida) return;
  const punto = medida;
  const radio = medida.radio * 1.28;

  contexto.save();
  contexto.globalAlpha = intensidad * 0.85;
  contexto.strokeStyle = paleta.foco;
  contexto.lineWidth = 1.4;
  contexto.beginPath();
  contexto.arc(punto.x, punto.y, radio, 0, Math.PI * 2);
  contexto.stroke();
  for (const grados of [0, 90, 180, 270]) {
    const angulo = (grados * Math.PI) / 180;
    contexto.beginPath();
    contexto.moveTo(
      punto.x + Math.cos(angulo) * (radio - 11),
      punto.y + Math.sin(angulo) * (radio - 11),
    );
    contexto.lineTo(
      punto.x + Math.cos(angulo) * (radio + 13),
      punto.y + Math.sin(angulo) * (radio + 13),
    );
    contexto.stroke();
  }
  contexto.globalAlpha = intensidad * (1 - pulso) * 0.7;
  contexto.lineWidth = 1;
  contexto.beginPath();
  contexto.arc(punto.x, punto.y, radio * (1 + pulso * 1.1), 0, Math.PI * 2);
  contexto.stroke();
  contexto.restore();
};

export const IntroCinematica = () => {
  const [corriendo, setCorriendo] = useState(false);
  const [pase, setPase] = useState(0);
  const [momento, setMomento] = useState<Momento>({ fase: "aparicion", avance: 0, escena: 0 });
  const [elegido, setElegido] = useState(elegirDepartamento);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const entregado = useRef(false);
  const cadenaLista = useRef(false);

  const alTerminarCadena = useCallback(() => {
    cadenaLista.current = true;
  }, []);

  const iniciar = () => {
    anotar("iniciar");
    entregado.current = false;
    cadenaLista.current = false;
    document.documentElement.setAttribute("data-cinematica", "corriendo");
    document.documentElement.setAttribute("data-intro", "corriendo");
    window.scrollTo({ top: 0, behavior: "instant" });
    setElegido(elegirDepartamento());
    setMomento({ fase: "aparicion", avance: 0, escena: 0 });
    setPase((anterior) => anterior + 1);
    setCorriendo(true);
  };

  const cerrar = () => {
    anotar("cerrar");
    entregado.current = true;
    document.documentElement.removeAttribute("data-cinematica");
    document.documentElement.setAttribute("data-intro", "listo");
    marcarIntroVista();
    setCorriendo(false);
  };

  useEffect(() => {
    const activa = cinematicaActiva();
    anotar("capa-montada", { activa });
    if (activa) {
      iniciar();
      return;
    }
    document.documentElement.removeAttribute("data-cinematica");
    document.documentElement.setAttribute("data-intro", "listo");
  }, []);

  useEffect(() => {
    const alPedir = () => iniciar();
    window.addEventListener(CANAL_INTRO, alPedir);
    return () => window.removeEventListener(CANAL_INTRO, alPedir);
  }, []);

  useEffect(() => {
    const alCambiarHash = () => {
      const ruta = window.location.pathname;
      const hash = window.location.hash;
      const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      anotar("hash-cambiado", { ruta, hash, reducido });
      if (ruta !== "/") return;
      if (!pedidaPorHash(hash)) return;
      limpiarHashIntro();
      iniciar();
    };
    window.addEventListener("hashchange", alCambiarHash);
    return () => window.removeEventListener("hashchange", alCambiarHash);
  }, []);

  useEffect(() => {
    if (!corriendo) return undefined;
    const elemento = lienzo.current;
    const contexto = elemento ? elemento.getContext("2d") : null;
    anotar("bucle", { corriendo, pase, lienzo: Boolean(elemento), contexto: Boolean(contexto) });
    if (!elemento) return undefined;
    if (!contexto) return undefined;

    const raiz = document.documentElement;
    const paleta = leerPaletaGlobo(raiz);
    let ancho = 0;
    let alto = 0;
    let cuadro = 0;

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
      anotar("entregar");
      entregado.current = true;
      raiz.removeAttribute("data-cinematica");
      raiz.setAttribute("data-intro", "listo");
    };

    let inicio = 0;
    let previa = "";
    let cuadros = 0;

    const dibujar = (ahora: number) => {
      cuadros += 1;
      if (cuadros === 1) {
        inicio = ahora;
        anotar("primer-cuadro", { ancho, alto });
      }
      if (cadenaLista.current) {
        cadenaLista.current = false;
        const transcurrido = ahora - inicio;
        if (transcurrido < INICIO_SALIDA) {
          inicio -= INICIO_SALIDA - transcurrido;
          anotar("cadena-lista", { ms: Math.round(transcurrido) });
        }
      }
      const tiempo = ahora - inicio;
      if (tiempo >= DURACION_TOTAL) {
        anotar("fin", { cuadros });
        entregar();
        marcarIntroVista();
        setCorriendo(false);
        return;
      }

      const actual = momentoEn(tiempo);
      const clave = `${actual.fase}:${actual.escena}`;
      if (clave !== previa) {
        previa = clave;
        anotar("fase", { clave, ms: Math.round(tiempo) });
        setMomento(actual);
        if (actual.fase === "salida") entregar();
      }

      const encuadre = encuadreEn(actual, elegido);
      const visor = Math.min(ancho, alto) * RADIO_BASE * encuadre.acercamiento;
      const camara: Camara = {
        lon: encuadre.lon,
        lat: encuadre.lat,
        radio: visor,
        centroX: ancho / 2,
        centroY: alto / 2,
      };
      const pulso = (Math.sin(ahora / 420) + 1) / 2;

      contexto.globalAlpha = 1;
      contexto.clearRect(0, 0, ancho, alto);

      if (encuadre.opacidad > 0.01) {
        contexto.save();
        contexto.globalAlpha = encuadre.opacidad;
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
          destacado:
            actual.fase === "seleccion" || actual.fase === "entrada" ? elegido.codigo : null,
        });

        if (actual.fase === "colombia") resaltarColombia(contexto, camara, actual.avance, paleta);
        if (actual.fase === "zoom")
          resaltarColombia(contexto, camara, 1 - actual.avance * 0.6, paleta);
        const lienzoActual = { ancho, alto, visor };
        if (actual.fase === "seleccion")
          senalarDepartamento(
            contexto,
            camara,
            elegido,
            Math.min(1, actual.avance * 3),
            pulso,
            paleta,
            lienzoActual,
            true,
          );
        if (actual.fase === "entrada")
          senalarDepartamento(
            contexto,
            camara,
            elegido,
            1 - actual.avance,
            pulso,
            paleta,
            lienzoActual,
            false,
          );
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
  }, [corriendo, pase, elegido]);

  useEffect(() => {
    const raiz = document.documentElement;
    return () => {
      raiz.removeAttribute("data-cinematica");
      raiz.setAttribute("data-intro", "listo");
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

  const fase = momento.fase;
  const enEcosistema = fase === "ecosistema" || fase === "salida";
  const catalogo = DEPARTAMENTOS.find((departamento) => departamento.codigo === elegido.codigo);

  return (
    <div
      className="cinematica"
      data-fase={fase}
      key={pase}
      style={{ "--cinematica-total": `${DURACION_TOTAL}ms` } as CSSProperties}
    >
      <div className="cinematica__escenario" aria-hidden="true">
        <canvas ref={lienzo} className="cinematica__lienzo" />

        <span className="cinematica__banda cinematica__banda--alta" />
        <span className="cinematica__banda cinematica__banda--baja" />
        <span className="cinematica__velo" />
        <span className="cinematica__destello" />

        <div className="cinematica__capa" data-visible={fase === "aparicion" ? "si" : "no"}>
          <p className="cinematica__marca">SICAMED</p>
          <span className="cinematica__regla" />
          <p className="cinematica__lema">Sistema de Información del Cannabis Medicinal</p>
        </div>

        <div
          className="cinematica__capa cinematica__capa--pie"
          data-visible={fase === "giro" ? "si" : "no"}
        >
          <p className="cinematica__rotulo">Localizando el territorio</p>
        </div>

        <div
          className="cinematica__capa cinematica__capa--pie"
          data-visible={fase === "colombia" || fase === "zoom" ? "si" : "no"}
        >
          <p className="cinematica__rotulo">República de Colombia</p>
          <p className="cinematica__dato mono">{MARCAS.length} departamentos con presencia</p>
        </div>

        <div
          className="cinematica__ficha"
          data-visible={fase === "seleccion" || fase === "entrada" ? "si" : "no"}
        >
          <p className="cinematica__rotulo">Departamento seleccionado</p>
          <p className="cinematica__nombre">{elegido.nombre}</p>
          <ul className="cinematica__cifras">
            <li>
              <span className="mono">{numero(catalogo?.proveedores ?? 0)}</span>
              <span className="cinematica__unidad">proveedores</span>
            </li>
            <li>
              <span className="mono">{numero(catalogo?.dispensadores ?? 0)}</span>
              <span className="cinematica__unidad">dispensadores</span>
            </li>
            <li>
              <span className="mono">{numero(catalogo?.pacientes ?? 0)}</span>
              <span className="cinematica__unidad">pacientes</span>
            </li>
          </ul>
        </div>

        <div className="cinematica__ecosistema" data-visible={enEcosistema ? "si" : "no"}>
          <p className="cinematica__rotulo">Ecosistema SICAMED</p>
          {enEcosistema ? <EscenaCadena modo="automatico" onFinal={alTerminarCadena} /> : null}
        </div>

        <span className="cinematica__progreso" />
      </div>

      <button type="button" className="cinematica__salto" onClick={cerrar}>
        Saltar la introducción
      </button>
    </div>
  );
};
