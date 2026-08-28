import clsx from "clsx";
import { useId, useRef, useState } from "react";
import { Icono } from "./Icono";

export type Props = {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
  acepta?: string;
  pesoMaximo?: number;
  archivo: File | null;
  onArchivo: (archivo: File | null) => void;
  onRechazo?: (motivo: string) => void;
};

const PESO_POR_DEFECTO = 10 * 1024 * 1024;

export const formatearPeso = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const extensionValida = (archivo: File, acepta: string): boolean => {
  const permitidas = acepta
    .split(",")
    .map((parte) => parte.trim().toLowerCase())
    .filter(Boolean);
  if (permitidas.length === 0) return true;
  const nombre = archivo.name.toLowerCase();
  return permitidas.some((permitida) =>
    permitida.startsWith(".") ? nombre.endsWith(permitida) : archivo.type === permitida,
  );
};

export const CampoArchivo = ({
  etiqueta,
  ayuda,
  error,
  requerido,
  acepta = ".pdf",
  pesoMaximo = PESO_POR_DEFECTO,
  archivo,
  onArchivo,
  onRechazo,
}: Props) => {
  const base = useId();
  const idControl = `${base}-control`;
  const idAyuda = `${base}-ayuda`;
  const idError = `${base}-error`;
  const entrada = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);

  const admitir = (candidato: File | undefined) => {
    if (!candidato) return;
    if (!extensionValida(candidato, acepta)) {
      onRechazo?.(`Formato no admitido. Se espera ${acepta}.`);
      return;
    }
    if (candidato.size > pesoMaximo) {
      onRechazo?.(`El archivo pesa ${formatearPeso(candidato.size)} y el máximo es ${formatearPeso(pesoMaximo)}.`);
      return;
    }
    onArchivo(candidato);
  };

  const quitar = () => {
    onArchivo(null);
    if (entrada.current) entrada.current.value = "";
  };

  return (
    <div className={clsx("campo", "campo-archivo", error && "campo--error")}>
      <span className="campo__etiqueta" id={`${base}-rotulo`}>
        {etiqueta}
        {requerido ? (
          <span className="campo__requerido" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>

      {archivo ? (
        <div className="campo-archivo__cargado">
          <span className="campo-archivo__sello" aria-hidden="true">
            <Icono nombre="check" tamano={16} />
          </span>
          <span className="campo-archivo__datos">
            <strong className="campo-archivo__nombre">{archivo.name}</strong>
            <span className="campo-archivo__peso mono">{formatearPeso(archivo.size)}</span>
          </span>
          <button type="button" className="campo-archivo__quitar" onClick={quitar}>
            Quitar
          </button>
        </div>
      ) : (
        <div
          className={clsx("campo-archivo__zona", encima && "campo-archivo__zona--encima")}
          onDragOver={(evento) => {
            evento.preventDefault();
            setEncima(true);
          }}
          onDragLeave={() => setEncima(false)}
          onDrop={(evento) => {
            evento.preventDefault();
            setEncima(false);
            admitir(evento.dataTransfer.files[0]);
          }}
        >
          <input
            ref={entrada}
            id={idControl}
            className="campo-archivo__entrada"
            type="file"
            accept={acepta}
            aria-labelledby={`${base}-rotulo`}
            aria-invalid={error ? true : undefined}
            aria-describedby={clsx(ayuda && idAyuda, error && idError) || undefined}
            onChange={(evento) => admitir(evento.target.files?.[0])}
          />
          <label className="campo-archivo__llamada" htmlFor={idControl}>
            <span className="campo-archivo__icono" aria-hidden="true">
              <Icono nombre="subir" tamano={20} />
            </span>
            <span className="campo-archivo__texto">
              <strong>Arrastra el archivo o selecciónalo</strong>
              <span className="campo-archivo__limite">
                {acepta.toUpperCase().replace(/\./g, "")} · hasta {formatearPeso(pesoMaximo)}
              </span>
            </span>
          </label>
        </div>
      )}

      {ayuda ? (
        <span className="campo__ayuda" id={idAyuda}>
          {ayuda}
        </span>
      ) : null}
      {error ? (
        <span className="campo__error" id={idError} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
};
