import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { esModoDemostracion } from "./proveedor";
import { PERFILES_DEMO } from "./perfiles";
import { useAuth } from "./useAuth";
import { Icono } from "../ui/primitivos/Icono";
import { iniciales } from "../i18n/formato";

export const SelectorPerfil = () => {
  const { sesion, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", alPulsarFuera);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alPulsarFuera);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  if (!esModoDemostracion) return null;

  const actual =
    PERFILES_DEMO.find((perfil) => perfil.correo === sesion?.usuario.correo) ?? PERFILES_DEMO[0];

  const cambiar = async (clave: string) => {
    setCambiando(true);
    setAbierto(false);
    await iniciarSesion(clave);
    setCambiando(false);
    navegar("/app");
  };

  return (
    <div className="selector-perfil" ref={contenedor}>
      <button
        type="button"
        className="selector-perfil__disparador"
        aria-haspopup="menu"
        aria-expanded={abierto}
        disabled={cambiando}
        onClick={() => setAbierto((valor) => !valor)}
      >
        <span className="avatar avatar--pequeno" aria-hidden="true">
          {iniciales(actual?.nombre ?? "SM")}
        </span>
        <span className="selector-perfil__texto">
          <span className="selector-perfil__etiqueta">Perfil en demostración</span>
          <strong>{actual?.rol}</strong>
        </span>
        <Icono nombre="chevron" tamano={15} />
      </button>

      {abierto ? (
        <div className="selector-perfil__lista" role="menu" aria-label="Cambiar de perfil">
          <p className="selector-perfil__nota">
            El proveedor de identidad está en modo de demostración. Al cambiar de perfil cambia el
            conjunto de permisos y la navegación se recalcula.
          </p>
          {PERFILES_DEMO.map((perfil) => (
            <button
              key={perfil.clave}
              type="button"
              role="menuitemradio"
              aria-checked={perfil.clave === actual?.clave}
              className="selector-perfil__opcion"
              onClick={() => void cambiar(perfil.clave)}
            >
              <span className="avatar avatar--pequeno" aria-hidden="true">
                {iniciales(perfil.nombre)}
              </span>
              <span className="selector-perfil__detalle">
                <strong>{perfil.nombre}</strong>
                <span>{perfil.rol}</span>
                <span className="selector-perfil__organizacion">{perfil.organizacion}</span>
              </span>
              {perfil.clave === actual?.clave ? <Icono nombre="check" tamano={16} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
