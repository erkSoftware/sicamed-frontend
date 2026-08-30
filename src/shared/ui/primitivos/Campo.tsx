import clsx from "clsx";
import { useId, useState } from "react";
import { Icono } from "./Icono";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Comunes = {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
  className?: string;
};

const Envoltura = ({
  etiqueta,
  ayuda,
  error,
  requerido,
  className,
  idControl,
  idAyuda,
  idError,
  children,
}: Comunes & { idControl: string; idAyuda: string; idError: string; children: ReactNode }) => (
  <div className={clsx("campo", error && "campo--error", className)}>
    <label className="campo__etiqueta" htmlFor={idControl}>
      {etiqueta}
      {requerido ? (
        <span className="campo__requerido" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
    {children}
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

type PropsTexto = Comunes & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export const CampoTexto = ({ etiqueta, ayuda, error, requerido, className, ...resto }: PropsTexto) => {
  const base = useId();
  const idControl = `${base}-control`;
  const idAyuda = `${base}-ayuda`;
  const idError = `${base}-error`;
  return (
    <Envoltura
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      requerido={requerido}
      className={className}
      idControl={idControl}
      idAyuda={idAyuda}
      idError={idError}
    >
      <input
        id={idControl}
        className="campo__control"
        required={requerido}
        aria-invalid={error ? true : undefined}
        aria-describedby={clsx(ayuda && idAyuda, error && idError) || undefined}
        {...resto}
      />
    </Envoltura>
  );
};

type PropsClave = Comunes & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type">;

export const CampoClave = ({ etiqueta, ayuda, error, requerido, className, ...resto }: PropsClave) => {
  const base = useId();
  const idControl = `${base}-control`;
  const idAyuda = `${base}-ayuda`;
  const idError = `${base}-error`;
  const [visible, setVisible] = useState(false);
  return (
    <Envoltura
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      requerido={requerido}
      className={className}
      idControl={idControl}
      idAyuda={idAyuda}
      idError={idError}
    >
      <div className="campo__clave">
        <input
          id={idControl}
          className="campo__control"
          type={visible ? "text" : "password"}
          required={requerido}
          aria-invalid={error ? true : undefined}
          aria-describedby={clsx(ayuda && idAyuda, error && idError) || undefined}
          {...resto}
        />
        <button
          type="button"
          className="campo__ojo"
          aria-pressed={visible}
          aria-controls={idControl}
          aria-label={visible ? "Ocultar la contraseña" : "Mostrar la contraseña"}
          onClick={() => setVisible((valor) => !valor)}
        >
          <Icono nombre={visible ? "ojo-cerrado" : "ojo"} tamano={18} />
        </button>
      </div>
    </Envoltura>
  );
};

type PropsArea = Comunes & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export const CampoArea = ({ etiqueta, ayuda, error, requerido, className, ...resto }: PropsArea) => {
  const base = useId();
  const idControl = `${base}-control`;
  const idAyuda = `${base}-ayuda`;
  const idError = `${base}-error`;
  return (
    <Envoltura
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      requerido={requerido}
      className={className}
      idControl={idControl}
      idAyuda={idAyuda}
      idError={idError}
    >
      <textarea
        id={idControl}
        className="campo__control"
        required={requerido}
        aria-invalid={error ? true : undefined}
        aria-describedby={clsx(ayuda && idAyuda, error && idError) || undefined}
        {...resto}
      />
    </Envoltura>
  );
};

type PropsSelect = Comunes & {
  opciones: readonly { valor: string; etiqueta: string }[];
  vacio?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">;

export const CampoSelect = ({
  etiqueta,
  ayuda,
  error,
  requerido,
  className,
  opciones,
  vacio,
  ...resto
}: PropsSelect) => {
  const base = useId();
  const idControl = `${base}-control`;
  const idAyuda = `${base}-ayuda`;
  const idError = `${base}-error`;
  return (
    <Envoltura
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      requerido={requerido}
      className={className}
      idControl={idControl}
      idAyuda={idAyuda}
      idError={idError}
    >
      <select
        id={idControl}
        className="campo__control"
        required={requerido}
        aria-invalid={error ? true : undefined}
        aria-describedby={clsx(ayuda && idAyuda, error && idError) || undefined}
        {...resto}
      >
        {vacio ? <option value="">{vacio}</option> : null}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </Envoltura>
  );
};
