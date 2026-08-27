import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../shared/auth/useAuth";
import { useNavegacionAgrupada } from "../../shared/rbac/useNavegacion";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { Icono } from "../../shared/ui/primitivos/Icono";
import type { NombreIcono } from "../../shared/ui/primitivos/Icono";
import { iniciales } from "../../shared/i18n/formato";
import { NAVEGACION } from "../../shared/rbac/navegacion";

export const LayoutApp = () => {
  const { sesion, cerrarSesion } = useAuth();
  const grupos = useNavegacionAgrupada();
  const ubicacion = useLocation();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => setAbierto(false), [ubicacion.pathname]);

  const actual = [...NAVEGACION]
    .sort((a, b) => b.ruta.length - a.ruta.length)
    .find((item) => ubicacion.pathname.startsWith(item.ruta));

  return (
    <div className="marco">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <a className="saltar-al-contenido" href="#contenido-principal">
        Saltar al contenido principal
      </a>

      {abierto ? (
        <button
          type="button"
          className="velo"
          aria-label="Cerrar el menú de navegación"
          onClick={() => setAbierto(false)}
        />
      ) : null}

      <aside className="lateral" data-abierto={abierto} id="navegacion-lateral">
        <Link to="/app" className="lateral__marca">
          <img src="/marca/isotipo.svg" alt="" width={30} height={30} />
          <span>
            <span className="lateral__nombre">
              SICA<span>MED</span>
            </span>
            <span className="lateral__lema">Cannabis medicinal</span>
          </span>
        </Link>

        <nav className="lateral__nav" aria-label="Navegación principal">
          {grupos.map(([grupo, items]) => (
            <div key={grupo}>
              <p className="lateral__grupo">{grupo}</p>
              {items.map((item) => (
                <NavLink
                  key={item.ruta}
                  to={item.ruta}
                  end={item.ruta === "/app"}
                  className={({ isActive }) => (isActive ? "lateral__enlace activo" : "lateral__enlace")}
                >
                  <Icono nombre={item.icono as NombreIcono} tamano={17} />
                  {item.etiqueta}
                  {item.zona === "clinica" ? <span className="lateral__clinico">Clínica</span> : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="lateral__pie">
          <span className="avatar" aria-hidden="true">
            {iniciales(sesion?.usuario.nombre ?? "SM")}
          </span>
          <span className="lateral__usuario">
            <strong>{sesion?.usuario.nombre}</strong>
            <span>{sesion?.usuario.rol}</span>
          </span>
          <Boton
            variante="fantasma"
            tamano="sm"
            icono="salir"
            aria-label="Cerrar sesión"
            onClick={() => void cerrarSesion()}
          />
        </div>
      </aside>

      <div className="contenido">
        <header className="barra">
          <Boton
            variante="fantasma"
            tamano="sm"
            icono="menu"
            className="lateral-boton"
            aria-label="Abrir el menú de navegación"
            aria-expanded={abierto}
            aria-controls="navegacion-lateral"
            onClick={() => setAbierto((valor) => !valor)}
          />
          <nav className="barra__migas" aria-label="Ruta actual">
            <Link to="/app">Inicio</Link>
            {actual && actual.ruta !== "/app" ? (
              <>
                <span aria-hidden="true">/</span>
                <span className="barra__titulo">{actual.etiqueta}</span>
              </>
            ) : (
              <span className="barra__titulo">Tablero</span>
            )}
          </nav>

          <div className="barra__acciones">
            <span className="selector-contexto">
              <span className="selector-contexto__etiqueta">Organización</span>
              <strong>{sesion?.usuario.organizacion}</strong>
            </span>
            <Boton variante="fantasma" tamano="sm" icono="campana" aria-label="Notificaciones" />
          </div>
        </header>

        <main id="contenido-principal" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
