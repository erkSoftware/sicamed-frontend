import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { listaOfertasJsonLd, migasJsonLd } from "../../shared/seo/datosEstructurados";
import { EstadoVacio } from "../../shared/ui/patrones/EstadoVacio";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { PortadaOferta, SimboloHoja } from "../../shared/ui/graficos/PortadaOferta";
import { DEPARTAMENTOS, TIPOS_PRODUCTO } from "../../shared/api/mock/catalogos";
import { ofertasPublicasMock } from "../../shared/api/mock/servidorMock";
import { OFERTAS_PUBLICAS } from "../../shared/api/mock/datos";
import { fecha, numero } from "../../shared/i18n/formato";

const ACTORES: Record<string, string> = {
  CULTIVADOR: "Cultivador habilitado",
  TRANSFORMADOR: "Transformador habilitado",
  DISPENSADOR: "Dispensador autorizado",
  IPS: "Prestador de salud",
  LABORATORIO: "Laboratorio habilitado",
};

const DISPONIBILIDAD: Record<string, string> = {
  INMEDIATA: "Disponibilidad inmediata",
  PROGRAMADA: "Disponibilidad programada",
  POR_CAMPAÑA: "Disponibilidad por campaña",
};

const iniciales = (nombre: string): string =>
  nombre
    .split(/\s+/)
    .filter((parte) => parte.length > 2)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");

const etiquetar = (texto: string): string =>
  `#${texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((parte) => parte[0]?.toUpperCase() + parte.slice(1))
    .join("")}`;

const DEPARTAMENTOS_ACTIVOS = [...new Set(OFERTAS_PUBLICAS.map((oferta) => oferta.departamento))];

const ACTORES_DESTACADOS = [...new Map(
  OFERTAS_PUBLICAS.map((oferta) => [oferta.organizacion, oferta]),
).values()]
  .slice(0, 6)
  .map((oferta) => ({
    organizacion: oferta.organizacion,
    tipoActor: oferta.tipoActor,
    departamento: oferta.departamento,
  }));

export const VitrinaPublica = () => {
  const [parametros, setParametros] = useSearchParams();
  const [busqueda, setBusqueda] = useState(parametros.get("busqueda") ?? "");
  const departamento = parametros.get("departamento") ?? "";
  const tipoProducto = parametros.get("producto") ?? "";

  const ofertas = useMemo(
    () => ofertasPublicasMock({ busqueda, departamento, tipoProducto }),
    [busqueda, departamento, tipoProducto],
  );

  const actualizar = (clave: string, valor: string) => {
    const siguientes = new URLSearchParams(parametros);
    if (valor) siguientes.set(clave, valor);
    else siguientes.delete(clave);
    setParametros(siguientes, { replace: true });
  };

  const buscarActor = (organizacion: string) => {
    setBusqueda(organizacion);
    actualizar("busqueda", organizacion);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const limpiar = () => {
    setBusqueda("");
    setParametros(new URLSearchParams(), { replace: true });
  };

  const filtrosActivos = [
    departamento ? { clave: "departamento", valor: departamento } : null,
    tipoProducto ? { clave: "producto", valor: tipoProducto } : null,
    busqueda ? { clave: "busqueda", valor: busqueda } : null,
  ].filter((filtro): filtro is { clave: string; valor: string } => filtro !== null);

  return (
    <>
      <Seo
        titulo="Vitrina pública de ofertas de cannabis medicinal"
        descripcion={`Consulta abierta de ${numero(ofertas.length)} ofertas publicadas por actores habilitados del ecosistema de cannabis medicinal en Colombia. Sin registro previo.`}
        ruta="/vitrina"
        palabrasClave={[
          "vitrina cannabis medicinal",
          "ofertas cannabis Colombia",
          "productores habilitados cannabis",
        ]}
        datosEstructurados={[
          listaOfertasJsonLd(ofertas),
          migasJsonLd([
            { nombre: "Inicio", ruta: "/" },
            { nombre: "Vitrina", ruta: "/vitrina" },
          ]),
        ]}
      />
      <SimboloHoja />

      <div className="contenedor">
        <nav aria-label="Ruta de navegación">
          <ol className="migas">
            <li>
              <Link to="/">Inicio</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Vitrina</li>
          </ol>
        </nav>
      </div>

      <div className="contenedor vitrina">
        <aside className="vitrina__lateral" aria-label="Filtros de la vitrina">
          <div className="panel panel--pegado">
            <div className="panel__cabecera">
              <p className="panel__titulo">Vitrina pública</p>
              <p className="panel__nota">
                Consulta abierta sin registro, conforme a la Ley 1712 de 2014.
              </p>
            </div>

            <div className="buscador-vitrina">
              <Icono nombre="buscar" tamano={16} />
              <label className="solo-lectores" htmlFor="busqueda-vitrina">
                Buscar oferta
              </label>
              <input
                id="busqueda-vitrina"
                type="search"
                value={busqueda}
                placeholder="Buscar producto u organización"
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  actualizar("busqueda", evento.target.value);
                }}
              />
            </div>

            <nav className="rail" aria-label="Filtrar por tipo de producto">
              <p className="rail__titulo rotulo">Tipo de producto</p>
              <ul className="rail__lista">
                <li>
                  <button
                    type="button"
                    className="rail__opcion"
                    aria-pressed={tipoProducto === ""}
                    onClick={() => actualizar("producto", "")}
                  >
                    <span className="rail__icono" aria-hidden="true">
                      <Icono nombre="vitrina" tamano={15} />
                    </span>
                    Todos los productos
                    <span className="rail__conteo mono">{OFERTAS_PUBLICAS.length}</span>
                  </button>
                </li>
                {TIPOS_PRODUCTO.map((tipo) => {
                  const total = OFERTAS_PUBLICAS.filter((oferta) => oferta.tipoProducto === tipo).length;
                  return (
                    <li key={tipo}>
                      <button
                        type="button"
                        className="rail__opcion"
                        aria-pressed={tipoProducto === tipo}
                        onClick={() => actualizar("producto", tipoProducto === tipo ? "" : tipo)}
                      >
                        <span className="rail__icono" aria-hidden="true">
                          <Icono nombre="hoja" tamano={15} />
                        </span>
                        {tipo}
                        <span className="rail__conteo mono">{total}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <nav className="rail" aria-label="Filtrar por departamento">
              <p className="rail__titulo rotulo">Departamento</p>
              <div className="rail__desplazable">
                <ul className="rail__lista">
                  <li>
                    <button
                      type="button"
                      className="rail__opcion"
                      aria-pressed={departamento === ""}
                      onClick={() => actualizar("departamento", "")}
                    >
                      <span className="rail__icono" aria-hidden="true">
                        <Icono nombre="mapa" tamano={15} />
                      </span>
                      Todo el territorio
                      <span className="rail__conteo mono">{DEPARTAMENTOS_ACTIVOS.length}</span>
                    </button>
                  </li>
                  {DEPARTAMENTOS.filter((item) => DEPARTAMENTOS_ACTIVOS.includes(item.nombre)).map((item) => {
                    const total = OFERTAS_PUBLICAS.filter(
                      (oferta) => oferta.departamento === item.nombre,
                    ).length;
                    return (
                      <li key={item.codigo}>
                        <button
                          type="button"
                          className="rail__opcion"
                          aria-pressed={departamento === item.nombre}
                          onClick={() =>
                            actualizar("departamento", departamento === item.nombre ? "" : item.nombre)
                          }
                        >
                          <span className="rail__icono" aria-hidden="true">
                            <Icono nombre="mapa" tamano={15} />
                          </span>
                          {item.nombre}
                          <span className="rail__conteo mono">{total}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>
          </div>
        </aside>

        <main className="vitrina__muro">
          <header className="muro__encabezado">
            <p className="seccion__etiqueta">Consulta pública</p>
            <h1 className="muro__titulo">Vitrina de ofertas</h1>
            <p className="muro__texto">
              Publicaciones de actores con habilitación vigente. Se muestran únicamente los campos
              clasificados como públicos: la existencia de la oferta, el tipo de producto, el
              territorio y el actor. Las cantidades y la capacidad productiva son información
              reservada de carácter comercial.
            </p>
          </header>

          <div className="muro__barra">
            <p aria-live="polite" className="muro__conteo">
              <strong>{numero(ofertas.length)}</strong> ofertas publicadas
            </p>
            {filtrosActivos.length > 0 ? (
              <ul className="muro__fichas">
                {filtrosActivos.map((filtro) => (
                  <li key={filtro.clave}>
                    <button
                      type="button"
                      className="ficha-filtro"
                      onClick={() => {
                        if (filtro.clave === "busqueda") setBusqueda("");
                        actualizar(filtro.clave, "");
                      }}
                    >
                      {filtro.valor}
                      <Icono nombre="cerrar" tamano={12} />
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" className="ficha-filtro ficha-filtro--limpiar" onClick={limpiar}>
                    Limpiar todo
                  </button>
                </li>
              </ul>
            ) : null}
          </div>

          {ofertas.length === 0 ? (
            <EstadoVacio
              icono="vitrina"
              titulo="No hay ofertas con esos criterios"
              texto="Prueba con otro departamento o tipo de producto. La vitrina se actualiza cada vez que un actor habilitado publica o cierra una oferta."
            />
          ) : (
            <div className="muro__publicaciones">
              {ofertas.map((oferta) => (
                <article key={oferta.id} className="publicacion">
                  <header className="publicacion__cabecera">
                    <span className="publicacion__avatar" aria-hidden="true">
                      {iniciales(oferta.organizacion)}
                    </span>
                    <div className="publicacion__identidad">
                      <p className="publicacion__actor">
                        {oferta.organizacion}
                        <span className="publicacion__verificado" title="Habilitación vigente">
                          <Icono nombre="check" tamano={10} titulo="Habilitación vigente" />
                        </span>
                      </p>
                      <p className="publicacion__meta">
                        <span>{ACTORES[oferta.tipoActor] ?? "Actor habilitado"}</span>
                        <span aria-hidden="true">·</span>
                        <span>{fecha(oferta.publicada)}</span>
                        <span aria-hidden="true">·</span>
                        <Icono nombre="mundo" tamano={12} titulo="Publicación pública" />
                      </p>
                    </div>
                    <span className="publicacion__estado mono">Vigente</span>
                  </header>

                  <p className="publicacion__texto">{oferta.descripcion}</p>

                  <ul className="publicacion__etiquetas">
                    <li>{etiquetar(oferta.tipoProducto)}</li>
                    <li>{etiquetar(oferta.departamento)}</li>
                    <li>{etiquetar(oferta.disponibilidad.replace("_", " ").toLowerCase())}</li>
                  </ul>

                  <Link className="publicacion__portada" to={`/vitrina/${oferta.id}`}>
                    <PortadaOferta
                      clave={oferta.id}
                      producto={oferta.tipoProducto}
                      rotulo={`${oferta.municipio}, ${oferta.departamento}`}
                      pie={`${oferta.id} · ${DISPONIBILIDAD[oferta.disponibilidad] ?? "Disponibilidad declarada"}`}
                    />
                  </Link>

                  <div className="publicacion__resumen">
                    <span className="publicacion__interes">
                      <span className="publicacion__punto" aria-hidden="true" />
                      {numero(oferta.interesados)} actores manifestaron interés
                    </span>
                    <span>{oferta.certificaciones.length} certificaciones verificadas</span>
                  </div>

                  <div className="publicacion__acciones">
                    <Link className="accion" to={`/vitrina/${oferta.id}`}>
                      <Icono nombre="documento" tamano={16} />
                      Ver ficha completa
                    </Link>
                    <button
                      type="button"
                      className="accion"
                      onClick={() => buscarActor(oferta.organizacion)}
                    >
                      <Icono nombre="organizacion" tamano={16} />
                      Ofertas de este actor
                    </button>
                    <Link className="accion" to="/normativa">
                      <Icono nombre="licencias" tamano={16} />
                      Marco normativo
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className="vitrina__contexto" aria-label="Contexto de la vitrina">
          <div className="panel panel--pegado">
            <div className="panel__cabecera">
              <p className="panel__titulo">Actores en la vitrina</p>
              <p className="panel__nota">Organizaciones con habilitación vigente publicando ahora.</p>
            </div>
            <ul className="destacados">
              {ACTORES_DESTACADOS.map((actor) => (
                <li key={actor.organizacion}>
                  <button
                    type="button"
                    className="destacado"
                    onClick={() => buscarActor(actor.organizacion)}
                  >
                    <span className="destacado__avatar" aria-hidden="true">
                      {iniciales(actor.organizacion)}
                    </span>
                    <span className="destacado__cuerpo">
                      <span className="destacado__nombre">{actor.organizacion}</span>
                      <span className="destacado__meta">
                        {ACTORES[actor.tipoActor] ?? "Actor habilitado"} · {actor.departamento}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="panel__cabecera">
              <p className="panel__titulo">Cómo leer esta vitrina</p>
            </div>
            <dl className="clave-lectura">
              <div>
                <dt>Público</dt>
                <dd>Existencia de la oferta, tipo de producto, territorio y actor habilitado.</dd>
              </div>
              <div>
                <dt>Reservado</dt>
                <dd>Cantidades, capacidad productiva y datos de contacto del actor.</dd>
              </div>
              <div>
                <dt>Fuera del sistema</dt>
                <dd>
                  SICAMED no es un canal transaccional: habilita el contacto entre actores
                  habilitados y registra el hecho, nada más.
                </dd>
              </div>
            </dl>
            <Link to="/transparencia" className="panel__enlace">
              Ver la política de datos abiertos
              <Icono nombre="flecha" tamano={14} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
};
