import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../shared/auth/useAuth";
import { SelectorPerfil } from "../../shared/auth/SelectorPerfil";
import {
  itemDeRuta,
  useModuloActivo,
  useModulosDisponibles,
} from "../../shared/rbac/useNavegacion";
import { NAVEGACION } from "../../shared/rbac/navegacion";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { IsotipoMono } from "../../shared/ui/primitivos/IsotipoMono";
import type { NombreIcono } from "../../shared/ui/primitivos/Icono";
import { PaletaComandos } from "../../shared/ui/comandos/PaletaComandos";
import { SelectorTema } from "../../shared/tema/SelectorTema";
import { useTema } from "../../shared/tema/almacen";
import { iniciales } from "../../shared/i18n/formato";

export const LayoutApp = () => {
  const { sesion, cerrarSesion } = useAuth();
  const modulos = useModulosDisponibles();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const moduloActivo = useModuloActivo(ubicacion.pathname);
  const [abierto, setAbierto] = useState(false);
  const [comandos, setComandos] = useState(false);
  const luminosidad = useTema((estado) => estado.luminosidad);

  useEffect(() => setAbierto(false), [ubicacion.pathname]);

  useEffect(() => {
    const atajo = (evento: KeyboardEvent) => {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "k") {
        evento.preventDefault();
        setComandos((valor) => !valor);
      }
    };
    window.addEventListener("keydown", atajo);
    return () => window.removeEventListener("keydown", atajo);
  }, []);

  const irAModulo = useCallback(
    (_id: string, ruta: string) => {
      navegar(ruta);
    },
    [navegar],
  );

  const modulo = modulos.find((item) => item.id === moduloActivo) ?? modulos[0];
  const actual = itemDeRuta(NAVEGACION, ubicacion.pathname);

  return (
    <div
      className="marco"
      data-luminosidad={luminosidad}
      data-menu={abierto ? "si" : "no"}
    >
      <Helmet>
        <title>{actual ? `${actual.etiqueta} · SICAMED` : "SICAMED"}</title>
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

      <nav className="riel" aria-label="Módulos del sistema">
        <Link to="/app" className="riel__marca" aria-label="SICAMED, ir al tablero">
          <IsotipoMono tamano={26} />
        </Link>

        <ul className="riel__lista">
          {modulos.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="riel__modulo"
                data-activo={item.id === moduloActivo ? "si" : "no"}
                data-zona={item.zona}
                aria-label={item.etiqueta}
                aria-current={item.id === moduloActivo ? "true" : undefined}
                onClick={() => navegar(item.items[0]?.ruta ?? "/app")}
              >
                <span className="riel__icono">
                  <Icono nombre={item.icono} tamano={21} />
                </span>
                <span className="riel__etiqueta">{item.etiqueta}</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="riel__comandos"
          onClick={() => setComandos(true)}
          aria-label="Abrir la paleta de comandos"
        >
          <Icono nombre="comando" tamano={17} />
        </button>
      </nav>

      <aside className="lateral" data-abierto={abierto} id="navegacion-lateral">
        <div className="lateral__marca">
          <span className="lateral__nombre">
            SICA<span>MED</span>
          </span>
          <span className="lateral__lema">Cannabis medicinal</span>
        </div>

        {modulo ? (
          <div className="modo">
            <p className="modo__rotulo">Módulo activo</p>
            <p className="modo__titulo">{modulo.rotulo}</p>
            <p className="modo__descripcion">{modulo.descripcion}</p>
            <span className="modo__barra" aria-hidden="true" />
          </div>
        ) : null}

        <nav className="lateral__nav" aria-label="Opciones del módulo activo">
          {(modulo?.items ?? []).map((item) => (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              end={item.ruta === "/app"}
              className={({ isActive }) => (isActive ? "lateral__enlace activo" : "lateral__enlace")}
            >
              <Icono nombre={item.icono as NombreIcono} tamano={17} />
              <span className="lateral__texto">
                <span>{item.etiqueta}</span>
                <span className="lateral__pista">{item.descripcion}</span>
              </span>
              {item.zona === "clinica" ? <span className="lateral__clinico">Clínica</span> : null}
            </NavLink>
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
            {modulo ? (
              <>
                <span aria-hidden="true">/</span>
                <span className="barra__modulo">{modulo.etiqueta}</span>
              </>
            ) : null}
            {actual ? (
              <>
                <span aria-hidden="true">/</span>
                <span className="barra__titulo">{actual.etiqueta}</span>
              </>
            ) : null}
          </nav>

          <div className="barra__acciones">
            <button
              type="button"
              className="barra__comandos"
              aria-label="Buscar o saltar a un módulo"
              onClick={() => setComandos(true)}
            >
              <Icono nombre="buscar" tamano={15} />
              <span>Buscar o saltar</span>
              <kbd>⌘K</kbd>
            </button>
            <span className="selector-contexto">
              <span className="selector-contexto__etiqueta">Organización</span>
              <strong>{sesion?.usuario.organizacion}</strong>
            </span>
            <SelectorTema />
            <SelectorPerfil />
            <Boton variante="fantasma" tamano="sm" icono="campana" aria-label="Notificaciones" />
          </div>
        </header>

        <main id="contenido-principal" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <PaletaComandos
        abierta={comandos}
        onCerrar={() => setComandos(false)}
        onIrAModulo={irAModulo}
      />
    </div>
  );
};
