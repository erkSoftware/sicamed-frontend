import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Boton } from "../../primitivos/Boton";
import { Icono } from "../../primitivos/Icono";
import { consultarUbicacion } from "../../../ubicacion/porIp";
import type { UbicacionAproximada } from "../../../ubicacion/porIp";
import { MapaTrazabilidad } from "./MapaTrazabilidad";
import { EscenaCultivo, EscenaIps, EscenaLaboratorio, EscenaPaciente } from "./escenas";
import { formaDe } from "./mapa";
import { DURACION_TOTAL, ESLABONES, ROTULOS, faseEn, inicioDe } from "./guion";
import type { FaseRecorrido } from "./guion";

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
  }, []);

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
      const origen = performance.now() - desde;
      const paso = (ahora: number) => {
        const transcurrido = ahora - origen;
        const avance = Math.min(1, transcurrido / DURACION_TOTAL);
        if (barra.current) barra.current.style.transform = `scaleX(${avance})`;
        if (transcurrido >= DURACION_TOTAL) {
          cuadro.current = 0;
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
    [detener, marcar],
  );

  const saltar = (destino: FaseRecorrido) => correr(inicioDe(destino));

  const explorar = () => {
    if (corriendo) {
      detener();
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
