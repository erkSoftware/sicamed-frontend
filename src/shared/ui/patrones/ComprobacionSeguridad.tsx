import { useEffect, useRef, useState } from "react";
import { cargarTurnstile, claveDeSitio } from "../../seguridad/turnstile";

type Props = {
  onToken: (token: string | null) => void;
  accion?: string;
  nota?: string | null;
};

const NOTA = "Esta comprobación distingue a una persona de un guion automatizado.";

export const ComprobacionSeguridad = ({ onToken, accion, nota = NOTA }: Props) => {
  const contenedor = useRef<HTMLDivElement>(null);
  const avisar = useRef(onToken);
  const [fallo, setFallo] = useState<string | null>(null);

  useEffect(() => {
    avisar.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let vigente = true;
    let widget: string | undefined;

    void cargarTurnstile()
      .then((api) => {
        if (!vigente || !contenedor.current) return;
        widget = api.render(contenedor.current, {
          sitekey: claveDeSitio(),
          theme: "light",
          language: "es",
          ...(accion ? { action: accion } : {}),
          callback: (token) => avisar.current(token),
          "expired-callback": () => avisar.current(null),
          "timeout-callback": () => avisar.current(null),
          "error-callback": (codigo) => {
            setFallo(codigo ?? "sin codigo");
            avisar.current(null);
          },
        });
      })
      .catch(() => {
        if (!vigente) return;
        setFallo("sin descarga");
        avisar.current(null);
      });

    return () => {
      vigente = false;
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, [accion]);

  return (
    <div className="comprobacion">
      <div ref={contenedor} className="comprobacion__widget" />
      {fallo ? (
        <p role="alert" className="comprobacion__fallo">
          No se pudo cargar la comprobación de seguridad. Revisa tu conexión y vuelve a intentarlo:
          sin ella el trámite no se puede radicar. <span className="mono">Cloudflare: {fallo}</span>
        </p>
      ) : nota ? (
        <p className="comprobacion__nota">{nota}</p>
      ) : null}
    </div>
  );
};
