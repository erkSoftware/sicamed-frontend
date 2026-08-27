import { Link } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { migasJsonLd } from "../../shared/seo/datosEstructurados";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { DEPARTAMENTOS, ETAPAS_PROCESO, TOTALES_NACIONALES } from "../../shared/api/mock/catalogos";
import { compacto, numero } from "../../shared/i18n/formato";

const CONJUNTOS = [
  {
    nombre: "Actores registrados por departamento",
    formato: "CSV · actualización diaria",
    campos: "departamento, tipo_actor, cantidad, fecha_corte",
  },
  {
    nombre: "Ofertas publicadas vigentes",
    formato: "JSON · actualización por evento",
    campos: "id_oferta, tipo_producto, departamento, actor, fecha_publicacion, vigencia",
  },
  {
    nombre: "Volumen por etapa del proceso",
    formato: "CSV · actualización mensual",
    campos: "etapa, volumen, unidad, periodo",
  },
  {
    nombre: "Rechazos normativos agregados",
    formato: "CSV · actualización mensual",
    campos: "norma_citada, cantidad, periodo",
  },
];

export const Transparencia = () => (
  <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
    <Seo
      titulo="Datos abiertos y transparencia"
      descripcion="Conjuntos de datos abiertos del sistema de información del cannabis medicinal: actores, ofertas vigentes, volumen por etapa y rechazos normativos agregados."
      ruta="/transparencia"
      palabrasClave={["datos abiertos cannabis", "transparencia SICAMED", "estadísticas cannabis medicinal Colombia"]}
      datosEstructurados={[
        migasJsonLd([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Transparencia", ruta: "/transparencia" },
        ]),
      ]}
    />

    <nav aria-label="Ruta de navegación">
      <ol className="migas">
        <li>
          <Link to="/">Inicio</Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">Transparencia</li>
      </ol>
    </nav>

    <header className="seccion__encabezado">
      <p className="seccion__etiqueta">Datos abiertos</p>
      <h1 className="seccion__titulo">Transparencia activa</h1>
      <p className="seccion__texto">
        Publicación proactiva de la información de interés público, en formatos reutilizables y sin
        necesidad de solicitud previa.
      </p>
    </header>

    <div className="tarjetas-valor" style={{ marginBottom: "var(--e7)" }}>
      <article className="valor">
        <strong style={{ fontSize: "var(--texto-3xl)" }}>{numero(TOTALES_NACIONALES.proveedores)}</strong>
        <p className="valor__texto">Proveedores registrados</p>
      </article>
      <article className="valor">
        <strong style={{ fontSize: "var(--texto-3xl)" }}>{numero(DEPARTAMENTOS.length)}</strong>
        <p className="valor__texto">Departamentos con presencia</p>
      </article>
      <article className="valor">
        <strong style={{ fontSize: "var(--texto-3xl)" }}>
          {compacto(ETAPAS_PROCESO[4]?.valor ?? 0)}
        </strong>
        <p className="valor__texto">Dosis entregadas a pacientes</p>
      </article>
      <article className="valor">
        <strong style={{ fontSize: "var(--texto-3xl)" }}>{compacto(TOTALES_NACIONALES.pacientes)}</strong>
        <p className="valor__texto">Pacientes con acceso potencial</p>
      </article>
    </div>

    <h2 className="seccion__titulo" style={{ marginBottom: "var(--e4)" }}>
      Conjuntos de datos disponibles
    </h2>
    <div className="pila" style={{ gap: "var(--e3)" }}>
      {CONJUNTOS.map((conjunto) => (
        <article key={conjunto.nombre} className="ficha" style={{ cursor: "default" }}>
          <span className="ficha__medio" aria-hidden="true">
            <Icono nombre="descargar" tamano={18} />
          </span>
          <span className="ficha__cuerpo">
            <span className="ficha__titulo">{conjunto.nombre}</span>
            <span className="ficha__meta">
              <span>{conjunto.formato}</span>
              <span className="mono">{conjunto.campos}</span>
            </span>
          </span>
        </article>
      ))}
    </div>

    <div className="aviso aviso--info" style={{ marginTop: "var(--e6)" }}>
      <Icono nombre="candado" tamano={18} />
      <p>
        Ningún conjunto de datos abierto incluye información clínica, ni siquiera agregada por
        establecimiento cuando el tamaño de la muestra permita reidentificar a un paciente.
      </p>
    </div>
  </div>
);
