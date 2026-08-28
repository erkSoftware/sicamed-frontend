import { Link } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { migasJsonLd } from "../../shared/seo/datosEstructurados";
import { BarrasHorizontales } from "../../shared/ui/graficos/BarrasHorizontales";
import { RegionDesplazable } from "../../shared/ui/patrones/RegionDesplazable";
import { Insignia } from "../../shared/ui/primitivos/Insignia";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { DEPARTAMENTOS, TOTALES_NACIONALES } from "../../shared/api/mock/catalogos";
import { ORGANIZACIONES } from "../../shared/api/mock/datos";
import { numero } from "../../shared/i18n/formato";

const HABILITADAS = ORGANIZACIONES.filter((organizacion) => organizacion.estado === "HABILITADA");

const GRUPOS = [
  {
    titulo: "Proveedores",
    icono: "hoja" as const,
    total: TOTALES_NACIONALES.proveedores,
    texto: "Cultivadores y transformadores con licencia registrada.",
  },
  {
    titulo: "Dispensadores",
    icono: "vitrina" as const,
    total: TOTALES_NACIONALES.dispensadores,
    texto: "Establecimientos autorizados para la dispensación.",
  },
  {
    titulo: "IPS",
    icono: "edificio" as const,
    total: TOTALES_NACIONALES.ips,
    texto: "Prestadores de servicios de salud vinculados.",
  },
  {
    titulo: "Médicos",
    icono: "medico" as const,
    total: TOTALES_NACIONALES.medicos,
    texto: "Profesionales habilitados para prescribir.",
  },
];

export const ActoresPublico = () => (
  <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
    <Seo
      titulo="Actores habilitados del cannabis medicinal en Colombia"
      descripcion="Directorio público de proveedores, dispensadores, IPS y médicos registrados en SICAMED, con su distribución territorial por departamento."
      ruta="/actores"
      palabrasClave={[
        "actores cannabis medicinal",
        "cultivadores habilitados Colombia",
        "dispensarios cannabis",
      ]}
      datosEstructurados={[
        migasJsonLd([
          { nombre: "Inicio", ruta: "/" },
          { nombre: "Actores", ruta: "/actores" },
        ]),
      ]}
    />

    <nav aria-label="Ruta de navegación">
      <ol className="migas">
        <li>
          <Link to="/">Inicio</Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">Actores</li>
      </ol>
    </nav>

    <header className="seccion__encabezado">
      <p className="seccion__etiqueta">Registro nacional</p>
      <h1 className="seccion__titulo">Actores del ecosistema</h1>
      <p className="seccion__texto">
        La identidad de los actores habilitados y su territorio son información pública. Los datos
        de contacto y la capacidad productiva son reservados y no se publican.
      </p>
    </header>

    <div className="tarjetas-valor" style={{ marginBottom: "var(--e7)" }}>
      {GRUPOS.map((grupo) => (
        <article key={grupo.titulo} className="valor">
          <span className="valor__icono" aria-hidden="true">
            <Icono nombre={grupo.icono} tamano={20} />
          </span>
          <strong style={{ fontSize: "var(--texto-3xl)", letterSpacing: "-0.035em" }}>
            {numero(grupo.total)}
          </strong>
          <h2 className="valor__titulo">{grupo.titulo}</h2>
          <p className="valor__texto">{grupo.texto}</p>
        </article>
      ))}
    </div>

    <div className="rejilla rejilla--mapa">
      <section>
        <h2 className="seccion__titulo" style={{ marginBottom: "var(--e4)" }}>
          Organizaciones con habilitación vigente
        </h2>
        <div className="pila" style={{ gap: "var(--e2)" }}>
          {HABILITADAS.slice(0, 12).map((organizacion) => (
            <article key={organizacion.id} className="ficha" style={{ cursor: "default" }}>
              <span className="ficha__medio" aria-hidden="true">
                <Icono nombre="edificio" tamano={18} />
              </span>
              <span className="ficha__cuerpo">
                <span className="ficha__titulo">{organizacion.nombre}</span>
                <span className="ficha__meta">
                  <span>{organizacion.tipo.replace("_", " ")}</span>
                  <span>
                    {organizacion.municipio}, {organizacion.departamento}
                  </span>
                </span>
              </span>
              <Insignia tono="exito">Habilitada</Insignia>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="seccion__titulo" style={{ marginBottom: "var(--e4)" }}>
          Distribución territorial
        </h2>
        <RegionDesplazable etiqueta="Proveedores por departamento" className="tarjeta" alto={430}>
          <BarrasHorizontales
            titulo="Proveedores registrados por departamento"
            unidad="Proveedores"
            datos={[...DEPARTAMENTOS]
              .sort((a, b) => b.proveedores - a.proveedores)
              .map((departamento) => ({
                etiqueta: departamento.nombre,
                valor: departamento.proveedores,
              }))}
          />
        </RegionDesplazable>
        <p className="pie-region mono" style={{ marginTop: "var(--e3)" }}>
          {DEPARTAMENTOS.length} departamentos · desplaza dentro del panel para ver el resto
        </p>
      </section>
    </div>
  </div>
);
