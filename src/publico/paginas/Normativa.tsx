import { Link } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { migasJsonLd } from "../../shared/seo/datosEstructurados";

const NORMAS = [
  {
    id: "res-1241",
    titulo: "Resolución 1241 de 2026",
    resumen:
      "Establece el sistema de información del cannabis medicinal, la obligación de habilitación previa para publicar ofertas y la frontera entre la información clínica y la comercial.",
    articulos: [
      {
        numero: "Art. 3.7",
        texto: "La consulta de la vitrina es pública y no requiere autenticación.",
      },
      {
        numero: "Art. 8c",
        texto:
          "La habilitación del canal de contacto entre actores no constituye una transacción comercial.",
      },
      {
        numero: "Art. 13b",
        texto:
          "No se publica oferta alguna sin atestación de licencia vigente para el tipo de producto.",
      },
      {
        numero: "Art. 21",
        texto:
          "Las cantidades y la capacidad productiva son información reservada de carácter comercial.",
      },
      {
        numero: "Art. 24",
        texto:
          "Los datos clínicos y los comerciales se administran en zonas separadas e independientes.",
      },
    ],
  },
  {
    id: "ley-1712",
    titulo: "Ley 1712 de 2014",
    resumen:
      "Ley de transparencia y del derecho de acceso a la información pública nacional. Fundamenta que la vitrina se sirva sin autenticación y sea indexable.",
    articulos: [
      { numero: "Art. 3", texto: "Principio de máxima publicidad para titular universal." },
      {
        numero: "Art. 4",
        texto:
          "Toda persona puede acceder a la información pública sin necesidad de justificar su solicitud.",
      },
    ],
  },
  {
    id: "ley-1581",
    titulo: "Ley 1581 de 2012",
    resumen:
      "Régimen general de protección de datos personales. Clasifica los datos de salud como sensibles y determina las restricciones de tratamiento aplicables a la zona clínica.",
    articulos: [
      { numero: "Art. 5", texto: "Los datos relativos a la salud son datos sensibles." },
      {
        numero: "Art. 6",
        texto:
          "Se prohíbe el tratamiento de datos sensibles salvo las excepciones expresamente previstas.",
      },
    ],
  },
];

export const Normativa = () => (
  <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
    <Seo
      titulo="Marco normativo del cannabis medicinal en Colombia"
      descripcion="Normas que fundamentan SICAMED: Resolución 1241 de 2026, Ley 1712 de 2014 de transparencia y Ley 1581 de 2012 de protección de datos personales."
      ruta="/normativa"
      palabrasClave={[
        "normativa cannabis medicinal Colombia",
        "Resolución 1241 de 2026",
        "Ley 1712 de 2014",
      ]}
      datosEstructurados={[
        migasJsonLd([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Normativa", ruta: "/normativa" },
        ]),
      ]}
    />

    <nav aria-label="Ruta de navegación">
      <ol className="migas">
        <li>
          <Link to="/">Inicio</Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">Normativa</li>
      </ol>
    </nav>

    <header className="seccion__encabezado">
      <p className="seccion__etiqueta">Fundamento jurídico</p>
      <h1 className="seccion__titulo">Marco normativo</h1>
      <p className="seccion__texto">
        Cada rechazo del sistema cita la norma que lo fundamenta. Esta página reúne las
        disposiciones que la plataforma aplica de forma automática.
      </p>
    </header>

    <div className="prosa" style={{ maxWidth: "none" }}>
      {NORMAS.map((norma) => (
        <section
          key={norma.id}
          id={norma.id}
          className="tarjeta"
          style={{ marginBottom: "var(--e5)" }}
        >
          <div className="tarjeta__cuerpo">
            <h2 style={{ marginTop: 0 }}>{norma.titulo}</h2>
            <p>{norma.resumen}</p>
            <ul>
              {norma.articulos.map((articulo) => (
                <li key={articulo.numero}>
                  <strong className="mono">{articulo.numero}</strong> — {articulo.texto}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  </div>
);
