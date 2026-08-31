import { useEffect, useRef } from "react";
import type { FormEvent, ReactNode } from "react";
import { Dialogo } from "../primitivos/Dialogo";
import { Boton } from "../primitivos/Boton";
import { ErrorNormativo } from "./ErrorNormativo";
import { aProblema } from "../../api/problemDetails";

type Props = {
  abierto: boolean;
  titulo: string;
  descripcion?: string;
  etiquetaEnviar?: string;
  cargando?: boolean;
  deshabilitado?: boolean;
  error?: unknown;
  ancho?: boolean;
  onCerrar: () => void;
  onEnviar: () => void;
  onLimpiarError?: () => void;
  children: ReactNode;
};

export const DialogoFormulario = ({
  abierto,
  titulo,
  descripcion,
  etiquetaEnviar = "Guardar",
  cargando,
  deshabilitado,
  error,
  ancho,
  onCerrar,
  onEnviar,
  onLimpiarError,
  children,
}: Props) => {
  const contenedorError = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!error) return;
    const alerta = contenedorError.current?.querySelector<HTMLElement>('[role="alert"]');
    alerta?.setAttribute("tabindex", "-1");
    alerta?.focus();
  }, [error]);

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    onEnviar();
  };

  return (
    <Dialogo
      abierto={abierto}
      titulo={titulo}
      ancho={ancho}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            form="formulario-dialogo"
            type="submit"
            cargando={cargando}
            disabled={deshabilitado}
          >
            {etiquetaEnviar}
          </Boton>
        </>
      }
    >
      <form id="formulario-dialogo" onSubmit={enviar} noValidate className="pila" style={{ gap: "var(--e4)" }}>
        {descripcion ? <p className="dialogo__descripcion">{descripcion}</p> : null}
        {children}
        <div ref={contenedorError}>
          {error ? <ErrorNormativo problema={aProblema(error)} onReintentar={onLimpiarError} /> : null}
        </div>
      </form>
    </Dialogo>
  );
};
