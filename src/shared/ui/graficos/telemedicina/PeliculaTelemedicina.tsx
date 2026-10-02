import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Boton } from "../../primitivos/Boton";
import { Icono } from "../../primitivos/Icono";
import { consultarUbicacion } from "../../../ubicacion/porIp";
import { InterruptorSonido } from "../../sonido/InterruptorSonido";
import { useEscenaSonora } from "../../sonido/useEscenaSonora";
import type { UbicacionAproximada } from "../../../ubicacion/porIp";
import { MapaTrazabilidad } from "./MapaTrazabilidad";
import { EscenaCultivo, EscenaIps, EscenaLaboratorio, EscenaPaciente } from "./escenas";
import { formaDe } from "./mapa";
import { DURACION_TOTAL, ESLABONES, ROTULOS, faseEn, inicioDe } from "./guion";
import type { FaseRecorrido } from "./guion";
import {
  CLAVES_TELEMEDICINA,
  efectoDeRecorrido,
  locucionDeRecorrido,
  rutaTelemedicina,
  type ClaveTelemedicina,
} from "./sonido";

const VOLUMEN_AMBIENTE_RECORRIDO = 0.05;
const ESPERA_LOCUCION = 1800;

const LAMINAS: Partial<Record<FaseRecorrido, () => JSX.Element>> = {
  cultivo: EscenaCultivo,
  laboratorio: EscenaLaboratorio,
  ips: EscenaIps,
  paciente: EscenaPaciente,
};

const CLAVES_LAMINA = Object.keys(LAMINAS) as readonly FaseRecorrido[];

export const PeliculaTelemedicina = () => {
  const [fase, setFase] = useState<FaseRecorrido>("reposo");
  const [corriendo, setCorriendo] = useState(false);
  const [ubicacion, setUbicacion] = useState<UbicacionAproximada | null>(null);
  const barra = useRef<HTMLSpanElement>(null);
  const cuadro = useRef(0);
  const faseViva = useRef<FaseRecorrido>("reposo");
  const corriendoVivo = useRef(false);
  const salto = useRef(false);
  const { escena, estado: estadoSonoro } = useEscenaSonora<ClaveTelemedicina>({
    ruta: rutaTelemedicina,
    precarga: CLAVES_TELEMEDICINA,
    volumenAmbiente: VOLUMEN_AMBIENTE_RECORRIDO,
    esperaMaxima: ESPERA_LOCUCION,
  });

  useEffect(() => {
    const sonora = escena.current;
    if (!sonora) return;
    const pintar = efectoDeRecorrido(fase);
    const clave = locucionDeRecorrido(fase);
    if (pintar) sonora.efecto(pintar);
    if (clave) sonora.decir(clave, { interrumpir: salto.current, paciente: clave === "cierre" });
    salto.current = false;
  }, [escena, fase]);

  useEffect(() => {
    const sonora = escena.current;
    if (!sonora || estadoSonoro !== "sonando" || !corriendoVivo.current) return;
    sonora.ambiente(true);
    const clave = locucionDeRecorrido(faseViva.current);
    if (clave && !sonora.hablando()) sonora.decir(clave);
  }, [escena, estadoSonoro]);

  useEffect(() => {
    const control = new AbortController();
    void consultarUbicacion(control.signal).then((resultado) => {
      if (!control.signal.aborted) setUbicacion(resultado);
    });
    return () => control.abort();
  }, []);

  const detener = useCallback(() => {
    if (cuadro.current) cancelAnimationFrame(cuadro.current);
    cuadro.current = 0;
    corriendoVivo.current = false;
    escena.current?.ambiente(false);
  }, [escena]);

  useEffect(() => detener, [detener]);

  const marcar = useCallback((siguiente: FaseRecorrido) => {
    if (faseViva.current === siguiente) return;
    faseViva.current = siguiente;
    setFase(siguiente);
  }, []);

  const correr = useCallback(
    (desde: number) => {
      detener();
      setCorriendo(true);
      corriendoVivo.current = true;
      escena.current?.despertar();
      escena.current?.ambiente(true);
      const origen = performance.now() - desde;
      const paso = (ahora: number) => {
        const transcurrido = ahora - origen;
        const avance = Math.min(1, transcurrido / DURACION_TOTAL);
        if (barra.current) barra.current.style.transform = `scaleX(${avance})`;
        if (transcurrido >= DURACION_TOTAL) {
          cuadro.current = 0;
          corriendoVivo.current = false;
          escena.current?.ambiente(false);
          if (barra.current) barra.current.style.transform = "scaleX(0)";
          marcar("reposo");
          setCorriendo(false);
          return;
        }
        marcar(faseEn(transcurrido));
        cuadro.current = requestAnimationFrame(paso);
      };
      cuadro.current = requestAnimationFrame(paso);
    },
    [detener, escena, marcar],
  );

  const saltar = (destino: FaseRecorrido) => {
    salto.current = true;
    correr(inicioDe(destino));
  };

  const explorar = () => {
    if (corriendo) {
      detener();
      escena.current?.callar();
      setCorriendo(false);
      return;
    }
    correr(0);
  };

  const region = useMemo(() => formaDe(ubicacion?.departamento?.codigo), [ubicacion]);
  const etiquetaRegion = ubicacion?.departamento?.nombre ?? ubicacion?.region ?? "";
  const rotulo = ROTULOS[fase];

  return (
    <div className="telemed" data-fase={fase} data-corriendo={corriendo ? "si" : undefined}>
      <MapaTrazabilidad fase={fase} region={region} etiquetaRegion={etiquetaRegion} />

      <div className="telemed__laminas" aria-hidden="true">
        {CLAVES_LAMINA.map((clave) => {
          const Lamina = LAMINAS[clave];
          if (!Lamina) return null;
          return (
            <div
              key={clave}
              className="telemed__escena"
              data-activa={fase === clave ? "si" : undefined}
            >
              <Lamina />
            </div>
          );
        })}
      </div>

      <div className="telemed__relato">
        <p className="telemed__indicador mono">
          <span className="telemed__punto" aria-hidden="true" />
          {rotulo.indicador}
        </p>
        <p className="telemed__titulo">{rotulo.titulo}</p>
        <p className="telemed__subtitulo">{rotulo.subtitulo}</p>

        {etiquetaRegion ? (
          <p className="telemed__ubicacion">
            <Icono nombre="mapa" tamano={14} />
            <span>
              <span className="telemed__ubicacion-rotulo mono">Detectamos tu ubicación</span>
              <span className="telemed__ubicacion-region">
                {etiquetaRegion}
                {ubicacion?.ciudad ? ` · ${ubicacion.ciudad}` : ""}
              </span>
            </span>
          </p>
        ) : null}
      </div>

      <div className="telemed__mando">
        <Boton
          variante="acento"
          className="telemed__llamada"
          icono={corriendo ? "pausa" : "reproducir"}
          onClick={explorar}
        >
          {corriendo ? "Pausar el recorrido" : "Explorar el recorrido"}
        </Boton>

        {estadoSonoro === "sin-audio" ? null : (
          <InterruptorSonido objeto="del recorrido" className="sonido__interruptor--oscuro" />
        )}

        <ul className="telemed__eslabones">
          {ESLABONES.map((eslabon) => (
            <li key={eslabon.fase}>
              <button
                type="button"
                className="telemed__eslabon"
                aria-pressed={fase === eslabon.fase}
                onClick={() => saltar(eslabon.fase)}
              >
                {eslabon.nombre}
              </button>
            </li>
          ))}
        </ul>

        <span className="telemed__barra" aria-hidden="true">
          <span ref={barra} className="telemed__barra-avance" />
        </span>
      </div>
    </div>
  );
};
