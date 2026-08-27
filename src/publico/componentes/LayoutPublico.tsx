import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { IntroMarca } from "./IntroMarca";
import { useRevelarSeccion } from "../../shared/ui/movimiento/useRevelarSeccion";

const ANIO = new Date().getFullYear();

export const LayoutPublico = () => {
  const ubicacion = useLocation();

  useRevelarSeccion(ubicacion.pathname);

  return (
    <div className="sitio">
      <a className="saltar-al-contenido" href="#contenido-principal">
        Saltar al contenido principal
      </a>

      <IntroMarca />

      <header className="cabecera-sitio">
        <div className="contenedor cabecera-sitio__interior">
          <Link to="/" className="marca">
            <img src="/marca/isotipo.svg" alt="" width={36} height={36} />
            <span className="marca__bloque">
              <span className="marca__texto">
                SICA<span>MED</span>
              </span>
              <span className="marca__lema">Sistema de Información del Cannabis Medicinal</span>
            </span>
          </Link>

          <nav className="nav-sitio" aria-label="Navegación del sitio público">
            <NavLink to="/vitrina" className={({ isActive }) => (isActive ? "activo" : undefined)}>
              Vitrina
            </NavLink>
            <NavLink to="/actores" className={({ isActive }) => (isActive ? "activo" : undefined)}>
              Actores
            </NavLink>
            <NavLink to="/normativa" className={({ isActive }) => (isActive ? "activo" : undefined)}>
              Normativa
            </NavLink>
            <NavLink to="/transparencia" className={({ isActive }) => (isActive ? "activo" : undefined)}>
              Transparencia
            </NavLink>
            <Link to="/acceso" className="boton boton--primario boton--sm">
              Ingresar
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenido-principal" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="pie-sitio">
        <div className="contenedor">
          <div className="pie-sitio__rejilla">
            <div>
              <p className="marca__texto marca__texto--pie">
                SICA<span>MED</span>
              </p>
              <p style={{ marginTop: "var(--e3)", maxWidth: "42ch" }}>
                Sistema de información del cannabis medicinal en Colombia. La consulta de la vitrina
                pública es abierta y no requiere autenticación.
              </p>
            </div>
            <div>
              <h3>Consulta pública</h3>
              <ul>
                <li>
                  <Link to="/vitrina">Vitrina de ofertas</Link>
                </li>
                <li>
                  <Link to="/actores">Actores habilitados</Link>
                </li>
                <li>
                  <Link to="/transparencia">Datos abiertos</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3>Marco normativo</h3>
              <ul>
                <li>
                  <Link to="/normativa">Res. 1241 de 2026</Link>
                </li>
                <li>
                  <Link to="/normativa#ley-1712">Ley 1712 de 2014</Link>
                </li>
                <li>
                  <Link to="/normativa#ley-1581">Ley 1581 de 2012</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3>Plataforma</h3>
              <ul>
                <li>
                  <Link to="/acceso">Ingresar</Link>
                </li>
                <li>
                  <Link to="/accesibilidad">Accesibilidad</Link>
                </li>
                <li>
                  <Link to="/privacidad">Tratamiento de datos</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pie-sitio__legal">
            <span>© {ANIO} SICAMED · República de Colombia</span>
            <span>Conformidad WCAG 2.1 AA · Contenido en español (es-CO)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
