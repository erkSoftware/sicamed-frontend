import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { migasJsonLd, ofertaJsonLd } from "../../shared/seo/datosEstructurados";
import { EstadoVacio } from "../../shared/ui/patrones/EstadoVacio";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { VisualCategoria } from "../../shared/ui/graficos/VisualCategoria";
import { useTraduccion } from "../../shared/i18n/ProveedorIdioma";
import { fecha, iniciales } from "../../shared/i18n/formato";
import { camposPorClasificacion, esPublico } from "../../shared/config/camposPublicos";
import { useOfertaPublica } from "../hooks/useVitrinaPublica";
import { DialogoInteres } from "../componentes/vitrina/DialogoInteres";
import { AvisoClasificacion } from "../componentes/vitrina/AvisoClasificacion";
import type { Oferta } from "../../shared/api/mock/tipos";

const RESERVADOS: Record<string, string> = {
  cantidadDisponible: "Cantidades exactas",
  capacidadProductiva: "Capacidad productiva",
  contacto: "Datos de contacto",
  interesados: "Demanda registrada",
};

export const DetalleOfertaPublica = () => {
  const { id = "" } = useParams();
  const { t, locale } = useTraduccion();
  const consulta = useOfertaPublica(id);
  const [interes, setInteres] = useState<Oferta | null>(null);
  const oferta = consulta.data ?? null;

  if (consulta.isPending)
    return (
      <div className="contenedor contenedor--mercado">
        <div
          className="detalle-oferta__esqueleto"
          role="status"
          aria-label={t("vitrina.resultados.cargando")}
        >
          <span className="esqueleto esqueleto--bloque esqueleto--alto" />
          <span className="esqueleto esqueleto--linea esqueleto--titulo" />
          <span className="esqueleto esqueleto--linea esqueleto--media" />
        </div>
      </div>
    );

  if (!oferta)
    return (
      <div className="contenedor contenedor--mercado" style={{ padding: "var(--e8) 0" }}>
        <Seo
          titulo={t("detalle.noEncontrada.titulo")}
          descripcion={t("detalle.noEncontrada.texto")}
          ruta={`/vitrina/${id}`}
          idioma={locale}
          noIndexar
        />
        <EstadoVacio
          icono="vitrina"
          titulo={t("detalle.noEncontrada.titulo")}
          texto={t("detalle.noEncontrada.texto")}
          accion={
            <Link to="/vitrina" className="boton boton--primario boton--sm">
              {t("detalle.volver")}
            </Link>
          }
        />
      </div>
    );

  const producto = t(`producto.${oferta.tipoProducto}`);
  const territorio =
    esPublico("municipio") && oferta.municipio
      ? `${oferta.municipio}, ${oferta.departamento}`
      : oferta.departamento;

  const datosPublicos = [
    { clave: "tipoProducto", etiqueta: t("vitrina.buscador.grupo.producto"), valor: producto },
    { clave: "organizacion", etiqueta: t("detalle.actor"), valor: oferta.organizacion },
    {
      clave: "tipoActor",
      etiqueta: t("vitrina.filtros.grupo.actor"),
      valor: t(`actor.${oferta.tipoActor}`),
    },
    { clave: "departamento", etiqueta: t("detalle.territorio"), valor: territorio },
    {
      clave: "disponibilidad",
      etiqueta: t("vitrina.tarjeta.disponibilidad"),
      valor: t(`disponibilidad.${oferta.disponibilidad}`),
    },
    {
      clave: "publicada",
      etiqueta: t("vitrina.tarjeta.publicada"),
      valor: fecha(oferta.publicada, locale),
    },
    {
      clave: "vigencia",
      etiqueta: t("detalle.actualizacion"),
      valor: fecha(oferta.vigencia, locale),
    },
  ].filter((dato) => esPublico(dato.clave as never));

  return (
    <div className="contenedor contenedor--mercado detalle-oferta">
      <Seo
        titulo={`${producto} · ${oferta.departamento}`}
        descripcion={t("detalle.seo.descripcion", {
          producto: producto.toLowerCase(),
          actor: oferta.organizacion,
          territorio,
        })}
        ruta={`/vitrina/${oferta.id}`}
        idioma={locale}
        tipo="article"
        palabrasClave={[oferta.tipoProducto, oferta.departamento, "cannabis medicinal Colombia"]}
        datosEstructurados={[
          ofertaJsonLd(oferta),
          migasJsonLd([
            { nombre: t("migas.inicio"), ruta: "/" },
            { nombre: t("migas.vitrina"), ruta: "/vitrina" },
            { nombre: producto, ruta: `/vitrina/${oferta.id}` },
          ]),
        ]}
      />

      <nav aria-label={t("migas.ruta")}>
        <ol className="migas">
          <li>
            <Link to="/">{t("migas.inicio")}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/vitrina">{t("migas.vitrina")}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{producto}</li>
        </ol>
      </nav>

      <div className="detalle-oferta__cabecera">
        <div className="detalle-oferta__visual">
          <VisualCategoria
            clave={oferta.id}
            tipoProducto={oferta.tipoProducto}
            rotulo={territorio}
            pie={oferta.id}
            descripcionAlternativa={t("vitrina.tarjeta.imagenCategoria")}
          />
        </div>

        <div className="detalle-oferta__identidad">
          <p className="seccion__etiqueta">{t("detalle.etiqueta")}</p>
          <h1 className="detalle-oferta__titulo">{producto}</h1>

          <p className="detalle-oferta__actor">
            <span className="tarjeta-oferta__avatar" aria-hidden="true">
              {iniciales(oferta.organizacion)}
            </span>
            <span>{oferta.organizacion}</span>
            <span className="tarjeta-oferta__atestado">
              <Icono
                nombre="check"
                tamano={10}
                titulo={t("vitrina.tarjeta.habilitacionAtestada")}
              />
            </span>
          </p>

          <p className="detalle-oferta__meta">
            <span className="tarjeta-oferta__meta-dato">
              <Icono nombre="mapa" tamano={14} />
              {territorio}
            </span>
            <span className="tarjeta-oferta__estado mono">{t("vitrina.tarjeta.vigente")}</span>
          </p>

          <p className="detalle-oferta__texto">{oferta.descripcion}</p>

          <div className="detalle-oferta__acciones">
            <button
              type="button"
              className="boton boton--primario"
              onClick={() => setInteres(oferta)}
            >
              {t("vitrina.tarjeta.interes")}
            </button>
            <Link to="/vitrina" className="boton boton--fantasma">
              {t("detalle.volver")}
            </Link>
          </div>

          <AvisoClasificacion />
        </div>
      </div>

      <div className="detalle-oferta__cuerpo">
        <section className="panel-detalle" aria-labelledby="datos-publicados">
          <h2 className="panel-detalle__titulo" id="datos-publicados">
            {t("detalle.publicado")}
          </h2>
          <dl className="panel-detalle__datos">
            {datosPublicos.map((dato) => (
              <div key={dato.clave}>
                <dt className="rotulo">{dato.etiqueta}</dt>
                <dd>{dato.valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        {esPublico("certificaciones") && oferta.certificaciones.length > 0 ? (
          <section className="panel-detalle" aria-labelledby="atestaciones">
            <h2 className="panel-detalle__titulo" id="atestaciones">
              {t("detalle.atestaciones")}
            </h2>
            <ul className="panel-detalle__atestaciones">
              {oferta.certificaciones.map((atestacion) => (
                <li key={atestacion}>
                  <Icono nombre="documento" tamano={15} />
                  {atestacion}
                </li>
              ))}
            </ul>
            <p className="panel-detalle__nota">{t("detalle.atestaciones.nota")}</p>
          </section>
        ) : null}

        <section className="panel-detalle panel-detalle--reservado" aria-labelledby="reservado">
          <h2 className="panel-detalle__titulo" id="reservado">
            <Icono nombre="candado" tamano={15} />
            {t("detalle.reservado.titulo")}
          </h2>
          <ul className="panel-detalle__reservados">
            {camposPorClasificacion("RESERVADO_COMERCIAL").map((campo) => (
              <li key={campo} className="mono">
                {RESERVADOS[campo] ?? campo}
              </li>
            ))}
          </ul>
          <p className="panel-detalle__nota">{t("detalle.reservado.texto")}</p>
          <button
            type="button"
            className="boton boton--primario boton--bloque"
            onClick={() => setInteres(oferta)}
          >
            {t("vitrina.tarjeta.interes")}
          </button>
        </section>
      </div>

      <DialogoInteres oferta={interes} onCerrar={() => setInteres(null)} />
    </div>
  );
};
