import { Link } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";

export const Accesibilidad = () => (
  <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
    <Seo
      titulo="Declaración de accesibilidad"
      descripcion="SICAMED cumple WCAG 2.1 nivel AA. Conoce las medidas de accesibilidad aplicadas y cómo reportar una barrera."
      ruta="/accesibilidad"
    />

    <nav aria-label="Ruta de navegación">
      <ol className="migas">
        <li>
          <Link to="/">Inicio</Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">Accesibilidad</li>
      </ol>
    </nav>

    <div className="prosa">
      <h1 className="seccion__titulo">Declaración de accesibilidad</h1>
      <p>
        SICAMED se compromete con el nivel <strong>AA de las WCAG 2.1</strong>. La accesibilidad no
        es aquí un ejercicio de cumplimiento: buena parte de los usuarios accede desde móviles de
        gama media con conexión irregular en zonas rurales.
      </p>

      <h2>Medidas aplicadas</h2>
      <ul>
        <li>Contraste mínimo de 4.5:1 en texto normal y 3:1 en texto grande, verificado sobre los tokens del sistema de diseño.</li>
        <li>Navegación completa por teclado con foco visible en todo elemento interactivo.</li>
        <li>Enlace de salto al contenido principal al inicio de cada página.</li>
        <li>Formularios con etiqueta real asociada; nunca se usa el texto de marcador como etiqueta.</li>
        <li>Errores anunciados con <span className="mono">role=&quot;alert&quot;</span> y regiones activas.</li>
        <li>Tablas de datos con encabezados asociados y descripción accesible.</li>
        <li>Gráficos con alternativa textual: toda visualización tiene su tabla o resumen equivalente.</li>
        <li>Respeto de <span className="mono">prefers-reduced-motion</span> en todas las animaciones.</li>
        <li>Diseño adaptable hasta 320 píxeles de ancho.</li>
        <li>Idioma declarado como <span className="mono">es-CO</span>.</li>
      </ul>

      <h2>Verificación continua</h2>
      <p>
        Las violaciones automáticas de accesibilidad bloquean la integración de cambios: cero
        violaciones críticas o serias en las pruebas de componente, auditoría de páginas clave con
        puntaje mínimo de 90, y recorrido completo por teclado de los flujos críticos.
      </p>

      <h2>Reportar una barrera</h2>
      <p>
        Si encuentras una barrera de accesibilidad, repórtala indicando la página, el navegador y la
        tecnología de apoyo utilizada. Toda barrera reportada se atiende como defecto bloqueante.
      </p>
    </div>
  </div>
);
