import { Link, useParams } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { migasJsonLd, ofertaJsonLd } from "../../shared/seo/datosEstructurados";
import { EstadoVacio } from "../../shared/ui/patrones/EstadoVacio";
import { Insignia } from "../../shared/ui/primitivos/Insignia";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { OFERTAS_PUBLICAS } from "../../shared/api/mock/datos";
import { fecha } from "../../shared/i18n/formato";

export const DetalleOfertaPublica = () => {
  const { id = "" } = useParams();
  const oferta = OFERTAS_PUBLICAS.find((item) => item.id === id);

  if (!oferta)
    return (
      <div className="contenedor" style={{ padding: "var(--e8) 0" }}>
        <Seo
          titulo="Oferta no encontrada"
          descripcion="La oferta consultada no existe o fue retirada de la vitrina pública."
          ruta={`/vitrina/${id}`}
          noIndexar
        />
        <EstadoVacio
          icono="vitrina"
          titulo="Esta oferta no está disponible"
          texto="La oferta fue cerrada, suspendida o nunca existió. Consulta la vitrina para ver las publicaciones vigentes."
          accion={
            <Link to="/vitrina" className="boton boton--primario boton--sm">
              Volver a la vitrina
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
      <Seo
        titulo={`${oferta.tipoProducto} en ${oferta.departamento}`}
        descripcion={`Oferta pública de ${oferta.tipoProducto.toLowerCase()} publicada por ${oferta.organizacion} en ${oferta.municipio}, ${oferta.departamento}. Actor con habilitación vigente registrada en SICAMED.`}
        ruta={`/vitrina/${oferta.id}`}
        tipo="article"
        palabrasClave={[oferta.tipoProducto, oferta.departamento, "cannabis medicinal Colombia"]}
        datosEstructurados={[
          ofertaJsonLd(oferta),
          migasJsonLd([
            { nombre: "Inicio", ruta: "/" },
            { nombre: "Vitrina", ruta: "/vitrina" },
            { nombre: oferta.tipoProducto, ruta: `/vitrina/${oferta.id}` },
          ]),
        ]}
      />

      <nav aria-label="Ruta de navegación">
        <ol className="migas">
          <li>
            <Link to="/">Inicio</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/vitrina">Vitrina</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{oferta.tipoProducto}</li>
        </ol>
      </nav>

      <header className="seccion__encabezado">
        <p className="seccion__etiqueta">Oferta pública</p>
        <h1 className="seccion__titulo">{oferta.titulo}</h1>
        <p className="seccion__texto">{oferta.descripcion}</p>
      </header>

      <div className="rejilla rejilla--2">
        <article className="tarjeta">
          <div className="tarjeta__cuerpo">
            <h2 className="tarjeta__titulo" style={{ marginBottom: "var(--e4)" }}>
              Información publicada
            </h2>
            <dl className="pila" style={{ gap: "var(--e4)" }}>
              <div>
                <dt className="kpi__etiqueta">Actor</dt>
                <dd>{oferta.organizacion}</dd>
              </div>
              <div>
                <dt className="kpi__etiqueta">Tipo de actor</dt>
                <dd>{oferta.tipoActor.replace("_", " ")}</dd>
              </div>
              <div>
                <dt className="kpi__etiqueta">Territorio</dt>
                <dd>
                  {oferta.municipio}, {oferta.departamento}
                </dd>
              </div>
              <div>
                <dt className="kpi__etiqueta">Tipo de producto</dt>
                <dd>{oferta.tipoProducto}</dd>
              </div>
              <div>
                <dt className="kpi__etiqueta">Disponibilidad</dt>
                <dd>{oferta.disponibilidad.replace("_", " ").toLowerCase()}</dd>
              </div>
              <div>
                <dt className="kpi__etiqueta">Publicada</dt>
                <dd>{fecha(oferta.publicada)}</dd>
              </div>
              <div>
                <dt className="kpi__etiqueta">Vigente hasta</dt>
                <dd>{fecha(oferta.vigencia)}</dd>
              </div>
            </dl>
          </div>
        </article>

        <div className="pila" style={{ gap: "var(--e4)" }}>
          <article className="tarjeta">
            <div className="tarjeta__cuerpo">
              <h2 className="tarjeta__titulo" style={{ marginBottom: "var(--e4)" }}>
                Habilitación verificada
              </h2>
              <ul className="pila" style={{ gap: "var(--e3)", listStyle: "none", padding: 0 }}>
                {oferta.certificaciones.map((certificacion) => (
                  <li key={certificacion} className="fila" style={{ gap: "var(--e3)" }}>
                    <span style={{ color: "var(--verde-600)" }}>
                      <Icono nombre="escudo" tamano={16} />
                    </span>
                    {certificacion}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="tarjeta">
            <div className="tarjeta__cuerpo">
              <h2 className="tarjeta__titulo" style={{ marginBottom: "var(--e3)" }}>
                Información no publicada
              </h2>
              <p style={{ color: "var(--texto-suave)", marginBottom: "var(--e3)" }}>
                Los siguientes datos son de carácter reservado y no se exponen en la consulta
                pública:
              </p>
              <div className="fila" style={{ gap: "var(--e2)", flexWrap: "wrap" }}>
                <Insignia tono="neutro" sinPunto>
                  Cantidades exactas
                </Insignia>
                <Insignia tono="neutro" sinPunto>
                  Capacidad productiva
                </Insignia>
                <Insignia tono="neutro" sinPunto>
                  Datos de contacto
                </Insignia>
                <Insignia tono="neutro" sinPunto>
                  Condiciones económicas
                </Insignia>
              </div>
            </div>
          </article>

          <article className="tarjeta">
            <div className="tarjeta__cuerpo">
              <h2 className="tarjeta__titulo" style={{ marginBottom: "var(--e3)" }}>
                ¿Eres un actor habilitado?
              </h2>
              <p style={{ color: "var(--texto-suave)", marginBottom: "var(--e4)" }}>
                Ingresa a la plataforma para manifestar interés. La habilitación del canal de
                contacto no constituye una transacción comercial.
              </p>
              <Link to="/acceso" className="boton boton--primario boton--bloque">
                Ingresar a SICAMED
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
