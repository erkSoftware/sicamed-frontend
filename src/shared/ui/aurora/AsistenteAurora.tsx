import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Aurora } from "./Aurora";
import { EsferaAurora } from "./EsferaAurora";
import { HaloVoz } from "./HaloVoz";
import { GuiaDeSeccion } from "./GuiaDeSeccion";
import { PresentacionAurora, marcarPresentada, yaSePresento } from "./PresentacionAurora";
import { useAurora } from "./almacen";
import type { EstadoVoz } from "./almacen";
import {
  despedirConversacion,
  iniciarConversacion,
  interrumpir,
  nivelDeVoz,
  terminarConversacion,
} from "./voz/motor";
import { cupoDelDia, vedaDelCupo } from "./voz/cupo";
import { minutos, reloj } from "../../api/mock/configuracionAsistente";
import { apiComercial } from "../../api/clienteComercial";
import { aProblema } from "../../api/problemDetails";
import type { EstadoLlamadasAsistente } from "../../api/mock/tipos";
import { usePermiso } from "../../rbac/usePermiso";
import { useAuth } from "../../auth/useAuth";
import { useAutor } from "../../auth/useAutor";
import { useConsultaMedios } from "../movimiento/useConsultaMedios";
import { Boton } from "../primitivos/Boton";
import { Icono } from "../primitivos/Icono";

const OTRO_ENCIMA =
  "Se levantó ese bloqueo, pero hay otro encima creado después. Ábrelo en Llamadas de AURORA y " +
  "levanta también el que aparece ahora.";

const ROTULOS: Record<EstadoVoz, string> = {
  inactiva: "Aurora está en silencio",
  permiso: "Autoriza el micrófono en el navegador",
  conectando: "Abriendo la conversación",
  reconectando: "Restableciendo la conversación",
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
  const conexionDebil = useAurora((estado) => estado.conexionDebil);
  const transcripcion = useAurora((estado) => estado.transcripcion);
  const falloVoz = useAurora((estado) => estado.falloVoz);
  const segundosRestantes = useAurora((estado) => estado.segundosRestantes);
  const cupoRestante = useAurora((estado) => estado.cupoRestante);
  const mensajes = useAurora((estado) => estado.mensajes);
  const alternarVisible = useAurora((estado) => estado.alternarVisible);
  const mostrar = useAurora((estado) => estado.mostrar);
  const presentando = useAurora((estado) => estado.presentando);
  const presentar = useAurora((estado) => estado.presentar);
  const cerrarPresentacion = useAurora((estado) => estado.cerrarPresentacion);
  const ocultar = useAurora((estado) => estado.ocultar);
  const reintentoDesde = useAurora((estado) => estado.reintentoDesde);
  const [cierre, setCierre] = useState<string | null>(null);
  const [cupo, setCupo] = useState<EstadoLlamadasAsistente | null>(null);
  const [espera, setEspera] = useState(0);
  const [levantando, setLevantando] = useState(false);
  const [falloDelLevantamiento, setFalloDelLevantamiento] = useState("");

  const soporteAudio = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const arrancada = useRef(false);
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const puedeHablar = usePermiso("asistente:sesion:abrir");
  const gestionaBloqueos = usePermiso("asistente:llamadas:gestionar");
  const autor = useAutor();
  const { permisos } = useAuth();
  const compacta = useConsultaMedios("(max-width: 640px)");

  const activa = voz !== "inactiva" && voz !== "fallo";
  const rotulo = puedeHablar ? ROTULOS[voz] : "Aurora no abre voz con tu perfil";
  const veto = puedeHablar
    ? null
    : "Tu rol no tiene habilitada la conversación por voz. Pídeselo a quien administra los permisos.";
  const veda = cupo ? vedaDelCupo(cupo) : null;
  const bloqueoPropio = veda && cupo?.bloqueo ? cupo.bloqueo : null;
  const puedeLevantarse = gestionaBloqueos && bloqueoPropio !== null;
  const cupoDisponible = cupo && !veda ? cupoDelDia(cupo) : null;
  const aviso = falloVoz ?? veda;
  const puedeAbrir =
    !activa && puedeHablar && vozDisponible && !veda && falloVoz?.reintentable !== false;
  const ultimaFrase = [...mensajes].reverse().find((mensaje) => mensaje.autor === "aurora");
  const subtitulo = transcripcion.trim() || (activa ? (ultimaFrase?.texto ?? "") : "");

  const entorno = useRef({ navegar, ruta: ubicacion.pathname, permisos });
  entorno.current = { navegar, ruta: ubicacion.pathname, permisos };

  const hablar = useCallback(() => {
    if (!audio.current) return;
    void iniciarConversacion({
      audio: audio.current,
      navegar: (ruta) => entorno.current.navegar(ruta),
      permisos: entorno.current.permisos,
      contexto: { ruta: entorno.current.ruta },
    });
  }, []);

  const colgar = useCallback(() => {
    terminarConversacion();
  }, []);

  const levantarme = () => {
    if (!bloqueoPropio) return;
    arrancada.current = true;
    setLevantando(true);
    setFalloDelLevantamiento("");
    apiComercial
      .desbloquearAsistente({ id: bloqueoPropio.id, autor })
      .then(() => apiComercial.estadoLlamadasAsistente())
      .then((estado) => {
        setCupo(estado);
        setFalloDelLevantamiento(estado.bloqueo ? OTRO_ENCIMA : "");
        const almacen = useAurora.getState();
        if (!estado.bloqueo && almacen.voz === "fallo") almacen.fijarVoz("inactiva");
      })
      .catch((error) => {
        const problema = aProblema(error);
        setFalloDelLevantamiento(problema.detail || problema.title);
      })
      .finally(() => setLevantando(false));
  };

  const desbloqueo = puedeLevantarse ? (
    <div className="aurora-panel__mando">
      <Boton
        variante="secundario"
        tamano="sm"
        icono="candado"
        cargando={levantando}
        onClick={levantarme}
      >
        Levantar mi bloqueo
      </Boton>
      <span className="aurora-panel__nota">
        {falloDelLevantamiento ||
          "Administras los bloqueos de voz, así que puedes levantar este sin salir de aquí."}
      </span>
    </div>
  ) : null;

  const vozPrevia = useRef(voz);

  useEffect(() => {
    const previa = vozPrevia.current;
    vozPrevia.current = voz;
    if (!compacta) return;
    if (previa !== "escuchando" && previa !== "hablando") return;
    if (voz !== "inactiva" && voz !== "fallo") return;
    const cerrada = [...useAurora.getState().mensajes]
      .reverse()
      .find((mensaje) => mensaje.autor === "aurora");
    setCierre(cerrada?.texto ?? null);
    ocultar();
  }, [voz, compacta, ocultar]);

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
    const alSalir = () => despedirConversacion();
    window.addEventListener("pagehide", alSalir);
    return () => {
      window.removeEventListener("pagehide", alSalir);
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

    return () => {
      elemento.remove();
      audio.current = null;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !puedeHablar) {
      arrancada.current = false;
      setCupo(null);
      setFalloDelLevantamiento("");
      return undefined;
    }
    if (activa) return undefined;
    let vigente = true;
    apiComercial
      .estadoLlamadasAsistente()
      .then((estado) => {
        if (vigente) setCupo(estado);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [visible, puedeHablar, activa]);

  useEffect(() => {
    if (!visible || !puedeHablar || arrancada.current) return;
    if (cupo?.puedeLlamar !== true) return;
    const estado = useAurora.getState();
    if (!estado.vozDisponible || estado.voz !== "inactiva") return;
    arrancada.current = true;
    hablar();
  }, [visible, puedeHablar, cupo, hablar]);

  useEffect(() => {
    const pendiente = () => Math.max(0, Math.ceil((reintentoDesde - Date.now()) / 1000));
    setEspera(pendiente());
    if (pendiente() === 0) return undefined;
    const paso = window.setInterval(() => {
      const queda = pendiente();
      setEspera(queda);
      if (queda === 0) window.clearInterval(paso);
    }, 1000);
    return () => window.clearInterval(paso);
  }, [reintentoDesde]);

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
            <>
              <p className="solo-lectores" role="status">
                {rotulo}
              </p>
              {aviso ? (
                <div className="aurora-panel__aviso" role="alert">
                  <p>
                    <strong>{aviso.titulo}.</strong> {aviso.detalle}
                  </p>
                  {desbloqueo}
                </div>
              ) : null}
            </>
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

              {activa && conexionDebil ? (
                <p className="aurora-conversacion__debil" role="status">
                  <Icono nombre="alerta" tamano={14} />
                  <span>
                    {voz === "reconectando"
                      ? "Se cayó el audio y estoy volviendo a entrar. No cuelgues: el tiempo que no hablaste no se te cobra."
                      : "La conexión va débil y el audio puede entrecortarse. No hace falta que cuelgues."}
                  </span>
                </p>
              ) : null}

              {activa && segundosRestantes !== null ? (
                <p className="aurora-conversacion__contador">
                  <Icono nombre="reloj" tamano={14} />
                  <span>
                    Queda {reloj(segundosRestantes)} de esta llamada
                    {cupoRestante !== null && cupoRestante > 0
                      ? ` · ${minutos(cupoRestante)} de cupo hoy`
                      : ""}
                  </span>
                </p>
              ) : null}

              {!activa && cupoDisponible ? (
                <p className="aurora-conversacion__contador">
                  <Icono nombre="reloj" tamano={14} />
                  <span>{cupoDisponible}</span>
                </p>
              ) : null}

              {aviso ? (
                <div className="aurora-conversacion__fallo" role="alert">
                  <p>
                    <strong>{aviso.titulo}.</strong> {aviso.detalle}
                  </p>
                  {desbloqueo}
                </div>
              ) : null}

              <div className="aurora-conversacion__mandos">
                {puedeAbrir ? (
                  <Boton tamano="sm" icono="microfono" onClick={hablar} disabled={espera > 0}>
                    {espera > 0
                      ? `Reintentar en ${espera} s`
                      : falloVoz?.reintentable
                        ? "Reintentar"
                        : "Hablar con Aurora"}
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

      <GuiaDeSeccion
        activa={compacta && !visible}
        permisos={permisos}
        puedeHablar={puedeHablar && vozDisponible}
        cierre={cierre}
        onHablar={() => {
          setCierre(null);
          if (!yaSePresento()) {
            marcarPresentada();
            presentar();
            return;
          }
          mostrar();
        }}
        onCierreVisto={() => setCierre(null)}
      />

      <PresentacionAurora
        abierta={presentando}
        onCerrar={() => {
          cerrarPresentacion();
          mostrar();
        }}
      />

      <button
        type="button"
        className="aurora-lanzador"
        onClick={() => {
          if (visible) {
            terminarConversacion();
            alternarVisible();
            return;
          }
          if (!yaSePresento()) {
            marcarPresentada();
            presentar();
            return;
          }
          alternarVisible();
        }}
        aria-expanded={visible}
        aria-controls="aurora-panel"
        aria-label={visible ? "Cerrar a Aurora" : "Abrir a Aurora, la guía del sistema"}
      >
        <Icono nombre={visible ? "cerrar" : "asistente"} tamano={18} />
        <span aria-hidden="true">Aurora</span>
      </button>
    </div>
  );
};
