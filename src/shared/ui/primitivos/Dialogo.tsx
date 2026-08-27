import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Boton } from "./Boton";

type Props = {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: boolean;
};

export const Dialogo = ({ abierto, titulo, onCerrar, children, pie, ancho }: Props) => {
  const referencia = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return;
    if (abierto && !elemento.open) elemento.showModal();
    if (!abierto && elemento.open) elemento.close();
  }, [abierto]);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return undefined;
    const manejar = (evento: Event) => {
      evento.preventDefault();
      onCerrar();
    };
    elemento.addEventListener("cancel", manejar);
    return () => elemento.removeEventListener("cancel", manejar);
  }, [onCerrar]);

  return (
    <dialog ref={referencia} className={ancho ? "dialogo dialogo--ancho" : "dialogo"} aria-labelledby="titulo-dialogo">
      <div className="dialogo__encabezado">
        <h2 className="tarjeta__titulo" id="titulo-dialogo">
          {titulo}
        </h2>
        <Boton variante="fantasma" tamano="sm" icono="cerrar" aria-label="Cerrar" onClick={onCerrar} />
      </div>
      <div className="dialogo__cuerpo">{children}</div>
      {pie ? <div className="dialogo__pie">{pie}</div> : null}
    </dialog>
  );
};
