import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { esModoDemostracion } from "./proveedor";
import { PERFILES_DEMO } from "./perfiles";
import { useAuth } from "./useAuth";
import { Icono } from "../ui/primitivos/Icono";
import { iniciales } from "../i18n/formato";

export const SelectorPerfil = () => {
  const { sesion, sesionReal, perfilAdoptado, puedeAdoptarPerfil, adoptarPerfil } = useAuth();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
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

  if (!puedeAdoptarPerfil) return null;

  const propia = sesionReal?.usuario;
  const actual = esModoDemostracion
    ? (perfilAdoptado ??
      PERFILES_DEMO.find((perfil) => perfil.correo === propia?.correo)?.clave ??
      null)
    : perfilAdoptado;
  const etiqueta = esModoDemostracion ? "Perfil en demostración" : "Viendo la plataforma como";
  const rotulo = perfilAdoptado === null ? (propia?.rol ?? "Mi cuenta") : (sesion?.usuario.rol ?? "");

  const cambiar = (clave: string | null) => {
    setAbierto(false);
    adoptarPerfil(clave);
    navegar("/app");
  };

  return (
    <div className="selector-perfil" ref={contenedor}>
      <button
        type="button"
        className="selector-perfil__disparador"
        aria-label={`Cambiar de perfil. Ahora: ${rotulo}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((valor) => !valor)}
      >
        <span className="avatar avatar--pequeno" aria-hidden="true">
          {iniciales(sesion?.usuario.nombre ?? "SM")}
        </span>
        <span className="selector-perfil__texto">
          <span className="selector-perfil__etiqueta">
            {perfilAdoptado === null && !esModoDemostracion ? "Tu cuenta" : etiqueta}
          </span>
          <strong>{rotulo}</strong>
        </span>
        <Icono nombre="chevron" tamano={15} />
      </button>

      {abierto ? (
        <div className="selector-perfil__lista" role="menu" aria-label="Cambiar de perfil">
          <p className="selector-perfil__nota">
            {esModoDemostracion
              ? "El proveedor de identidad está en modo de demostración. Al cambiar de perfil cambia el conjunto de permisos y la navegación se recalcula."
              : "Tu sesión sigue siendo la tuya: solo cambia el rol con el que se pinta el panel y el conjunto de datos simulados que ves. Solo un administrador puede hacerlo."}
          </p>

          {!esModoDemostracion && propia ? (
            <button
              type="button"
              role="menuitemradio"
              aria-checked={perfilAdoptado === null}
              className="selector-perfil__opcion"
              onClick={() => cambiar(null)}
            >
              <span className="avatar avatar--pequeno" aria-hidden="true">
                {iniciales(propia.nombre)}
              </span>
              <span className="selector-perfil__detalle">
                <strong>{propia.nombre}</strong>
                <span>{propia.rol}</span>
                <span className="selector-perfil__organizacion">
                  Tu cuenta real · sin datos de demostración
                </span>
              </span>
              {perfilAdoptado === null ? <Icono nombre="check" tamano={16} /> : null}
            </button>
          ) : null}

          {PERFILES_DEMO.map((perfil) => (
            <button
              key={perfil.clave}
              type="button"
              role="menuitemradio"
              aria-checked={perfil.clave === actual}
              className="selector-perfil__opcion"
              onClick={() => cambiar(perfil.clave)}
            >
              <span className="avatar avatar--pequeno" aria-hidden="true">
                {iniciales(perfil.nombre)}
              </span>
              <span className="selector-perfil__detalle">
                <strong>{perfil.nombre}</strong>
                <span>{perfil.rol}</span>
                <span className="selector-perfil__organizacion">{perfil.organizacion}</span>
              </span>
              {perfil.clave === actual ? <Icono nombre="check" tamano={16} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
