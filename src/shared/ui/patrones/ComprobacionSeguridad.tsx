import { useCallback, useEffect, useRef, useState } from "react";
import { cargarTurnstile, claveDeSitio, olvidarCarga, URL_TURNSTILE } from "../../seguridad/turnstile";
import { Boton } from "../primitivos/Boton";

type Props = {
  onToken: (token: string | null) => void;
  accion?: string;
  nota?: string | null;
};

const NOTA = "Esta comprobación distingue a una persona de un guion automatizado.";

const ESPERA_MAXIMA_MS = 15_000;

const descartarGuion = (): void => {
  olvidarCarga();
  if (window.turnstile) return;
  document.querySelector<HTMLScriptElement>(`script[src="${URL_TURNSTILE}"]`)?.remove();
};

export const ComprobacionSeguridad = ({ onToken, accion, nota = NOTA }: Props) => {
  const contenedor = useRef<HTMLDivElement>(null);
  const avisar = useRef(onToken);
  const [fallo, setFallo] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    avisar.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let vigente = true;
    let widget: string | undefined;

    const rendirse = (motivo: string) => {
      if (!vigente) return;
      setFallo(motivo);
      avisar.current(null);
    };

    const reloj = window.setTimeout(() => rendirse("sin respuesta"), ESPERA_MAXIMA_MS);
    const detenerReloj = () => window.clearTimeout(reloj);

    void cargarTurnstile()
      .then((api) => {
        if (!vigente || !contenedor.current) return;
        widget = api.render(contenedor.current, {
          sitekey: claveDeSitio(),
          theme: "light",
          language: "es",
          ...(accion ? { action: accion } : {}),
          callback: (token) => {
            detenerReloj();
            avisar.current(token);
          },
          "expired-callback": () => avisar.current(null),
          "timeout-callback": () => avisar.current(null),
          "error-callback": (codigo) => {
            detenerReloj();
            rendirse(codigo ?? "sin codigo");
          },
        });
      })
      .catch(() => {
        detenerReloj();
        rendirse("sin descarga");
      });

    return () => {
      vigente = false;
      detenerReloj();
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, [accion, intento]);

  const reintentar = useCallback(() => {
    setFallo(null);
    avisar.current(null);
    descartarGuion();
    setIntento((previo) => previo + 1);
  }, []);

  return (
    <div className="comprobacion">
      <div ref={contenedor} className="comprobacion__widget" />
      {fallo ? (
        <div className="comprobacion__rescate">
          <p role="alert" className="comprobacion__fallo">
            No se pudo completar la comprobación de seguridad. Revisa tu conexión y vuelve a
            intentarlo: sin ella no se puede continuar.{" "}
            <span className="mono">Cloudflare: {fallo}</span>
          </p>
          <Boton variante="secundario" tamano="sm" onClick={reintentar}>
            Reintentar la comprobación
          </Boton>
        </div>
      ) : nota ? (
        <p className="comprobacion__nota">{nota}</p>
      ) : null}
    </div>
  );
};
