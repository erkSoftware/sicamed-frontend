import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Aurora } from "./Aurora";
import { EsferaAurora } from "./EsferaAurora";
import { HaloVoz } from "./HaloVoz";
import { useAurora } from "./almacen";
import type { EstadoVoz } from "./almacen";
import { iniciarConversacion, interrumpir, nivelDeVoz, terminarConversacion } from "./voz/motor";
import { usePermiso } from "../../rbac/usePermiso";
import { useConsultaMedios } from "../movimiento/useConsultaMedios";
import { Boton } from "../primitivos/Boton";
import { Icono } from "../primitivos/Icono";

const ROTULOS: Record<EstadoVoz, string> = {
  inactiva: "Aurora está en silencio",
  permiso: "Autoriza el micrófono en el navegador",
  conectando: "Abriendo la conversación",
  escuchando: "Te escucho",
  hablando: "Aurora está hablando",
  fallo: "La conversación no está activa",
};

export const AsistenteAurora = () => {
  const visible = useAurora((estado) => estado.visible);
  const accion = useAurora((estado) => estado.accion);
  const voz = useAurora((estado) => estado.voz);
  const vozDisponible = useAurora((estado) => estado.vozDisponible);
  const vozDemostrativa = useAurora((estado) => estado.vozDemostrativa);
  const transcripcion = useAurora((estado) => estado.transcripcion);
  const falloVoz = useAurora((estado) => estado.falloVoz);
  const mensajes = useAurora((estado) => estado.mensajes);
  const alternarVisible = useAurora((estado) => estado.alternarVisible);
  const ocultar = useAurora((estado) => estado.ocultar);

  const soporteAudio = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const puedeHablar = usePermiso("asistente:sesion:abrir");
  const compacta = useConsultaMedios("(max-width: 640px)");

  const activa = voz !== "inactiva" && voz !== "fallo";
  const rotulo = puedeHablar ? ROTULOS[voz] : "Aurora no abre voz con tu perfil";
  const veto = puedeHablar
    ? null
    : "Tu rol no tiene habilitada la conversación por voz. Pídeselo a quien administra los permisos.";
  const ultimaFrase = [...mensajes].reverse().find((mensaje) => mensaje.autor === "aurora");
  const subtitulo = transcripcion.trim() || (activa ? (ultimaFrase?.texto ?? "") : "");

  const entorno = useRef({ navegar, ruta: ubicacion.pathname });
  entorno.current = { navegar, ruta: ubicacion.pathname };

  const hablar = useCallback(() => {
    if (!audio.current) return;
    void iniciarConversacion({
      audio: audio.current,
      navegar: (ruta) => entorno.current.navegar(ruta),
      contexto: { ruta: entorno.current.ruta },
    });
  }, []);

  const colgar = useCallback(() => {
    terminarConversacion();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      terminarConversacion();
      ocultar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [visible, ocultar]);

  useEffect(() => {
    const alSalir = () => terminarConversacion();
    window.addEventListener("beforeunload", alSalir);
    return () => {
      window.removeEventListener("beforeunload", alSalir);
      terminarConversacion();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      terminarConversacion();
      return undefined;
    }
    const soporte = soporteAudio.current;
    if (!soporte) return undefined;
    const elemento = document.createElement("audio");
    elemento.autoplay = true;
    elemento.setAttribute("aria-hidden", "true");
    soporte.appendChild(elemento);
    audio.current = elemento;

    const estado = useAurora.getState();
    if (puedeHablar && estado.vozDisponible && estado.voz === "inactiva") hablar();

    return () => {
      elemento.remove();
      audio.current = null;
    };
  }, [visible, puedeHablar, hablar]);

  return (
    <div className="aurora-asistente" data-abierto={visible ? "si" : "no"} data-voz={voz}>
      <HaloVoz nivel={nivelDeVoz} activa={voz === "hablando" || voz === "escuchando"} />

      {visible ? (
        <section id="aurora-panel" className="aurora-panel" aria-label="Aurora, guía del sistema">
          {compacta ? (
            <div className="aurora-figura aurora-figura--esfera">
              <EsferaAurora nivel={nivelDeVoz} activa={activa} />
            </div>
          ) : (
            <div className="aurora-figura">
              <Aurora
                accion={accion}
                voz={nivelDeVoz}
                encuadre="cuerpo"
                fondo="ninguno"
                className="aurora-figura__escena"
              />
              <Boton
                variante="fantasma"
                tamano="sm"
                icono="cerrar"
                aria-label="Cerrar el panel de Aurora"
                className="aurora-figura__cerrar"
                onClick={() => {
                  terminarConversacion();
                  ocultar();
                }}
              />
            </div>
          )}

          {compacta ? (
            <p className="solo-lectores" role="status">
              {rotulo}
            </p>
          ) : null}

          {compacta ? null : (
            <div className="aurora-conversacion">
              <p className="aurora-conversacion__estado" role="status">
                <span className="aurora-conversacion__pulso" aria-hidden="true" />
                {rotulo}
                {vozDemostrativa && activa ? " · demostración local" : ""}
              </p>

              {veto ? <p className="aurora-conversacion__subtitulo">{veto}</p> : null}

              {subtitulo ? <p className="aurora-conversacion__subtitulo">{subtitulo}</p> : null}

              {falloVoz ? (
                <p className="aurora-conversacion__fallo" role="alert">
                  <strong>{falloVoz.titulo}.</strong> {falloVoz.detalle}
                </p>
              ) : null}

              <div className="aurora-conversacion__mandos">
                {!activa && puedeHablar && vozDisponible ? (
                  <Boton tamano="sm" icono="microfono" onClick={hablar}>
                    {falloVoz?.reintentable ? "Reintentar" : "Hablar con Aurora"}
                  </Boton>
                ) : null}

                {voz === "hablando" ? (
                  <Boton variante="secundario" tamano="sm" icono="pausa" onClick={interrumpir}>
                    Interrumpir
                  </Boton>
                ) : null}

                {activa ? (
                  <Boton variante="fantasma" tamano="sm" icono="silencio" onClick={colgar}>
                    Terminar
                  </Boton>
                ) : null}
              </div>
            </div>
          )}

          <div ref={soporteAudio} className="aurora-audio" />
        </section>
      ) : null}

      <button
        type="button"
        className="aurora-lanzador"
        onClick={() => {
          if (visible) terminarConversacion();
          alternarVisible();
        }}
        aria-expanded={visible}
        aria-controls="aurora-panel"
        aria-label={visible ? "Cerrar a Aurora" : "Abrir a Aurora, la guía del sistema"}
      >
        <Icono nombre={visible ? "cerrar" : "usuario"} tamano={18} />
        <span aria-hidden="true">Aurora</span>
      </button>
    </div>
  );
};
