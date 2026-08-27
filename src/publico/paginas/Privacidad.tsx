import { Link } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";

export const Privacidad = () => (
  <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
    <Seo
      titulo="Tratamiento de datos personales"
      descripcion="Política de tratamiento de datos personales de SICAMED conforme a la Ley 1581 de 2012, con separación estricta entre datos clínicos y comerciales."
      ruta="/privacidad"
    />

    <nav aria-label="Ruta de navegación">
      <ol className="migas">
        <li>
          <Link to="/">Inicio</Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">Tratamiento de datos</li>
      </ol>
    </nav>

    <div className="prosa">
      <h1 className="seccion__titulo">Tratamiento de datos personales</h1>
      <p>
        SICAMED trata datos personales conforme a la Ley 1581 de 2012 y sus decretos
        reglamentarios. Los datos relativos a la salud son datos sensibles y reciben el régimen
        reforzado que la norma exige.
      </p>

      <h2>Separación de zonas</h2>
      <p>
        La información clínica y la comercial se administran en zonas independientes, con bases de
        datos y redes separadas. En la aplicación web esa separación se sostiene con controles
        explícitos:
      </p>
      <ul>
        <li>Cachés independientes por zona; la zona clínica descarta los datos al desmontar la vista.</li>
        <li>Prohibición total de persistencia clínica en el dispositivo: sin almacenamiento local, sin almacenamiento de sesión, sin bases de datos del navegador, sin caché de trabajo sin conexión.</li>
        <li>Observabilidad ciega a lo clínico: sin grabación de sesión, sin cuerpo de respuesta en los reportes de error y con rutas parametrizadas en lugar de identificadores reales.</li>
        <li>El cierre de sesión limpia el estado de ambas zonas.</li>
      </ul>

      <h2>Datos que se publican sin autenticación</h2>
      <p>
        En la vitrina pública solo se exponen campos clasificados como públicos: la existencia de la
        oferta, el tipo de producto, el departamento y la identidad del actor habilitado. Nunca se
        publican cantidades, capacidad productiva ni datos de contacto.
      </p>

      <h2>Derechos del titular</h2>
      <p>
        El titular puede conocer, actualizar, rectificar y suprimir sus datos, así como revocar la
        autorización otorgada. Las solicitudes se atienden por los canales dispuestos por el
        responsable del tratamiento.
      </p>
    </div>
  </div>
);
