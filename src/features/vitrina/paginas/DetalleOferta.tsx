import { Link, useParams } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fecha, numero } from "../../../shared/i18n/formato";
import { aOfertaVista } from "../modelo/mapeo";
import { useOferta } from "../hooks/useOfertas";

export const DetalleOferta = () => {
  const { id = "" } = useParams();
  const consulta = useOferta(id);
  const oferta = consulta.data ? aOfertaVista(consulta.data) : null;

  return (
    <div className="pagina">
      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {oferta ? (
          <>
            <EncabezadoPagina
              titulo={oferta.titulo}
              subtitulo={`${oferta.organizacion} · ${oferta.ubicacion}`}
              acciones={
                <>
                  <Link to="/app/vitrina" className="boton boton--secundario">
                    Volver a la vitrina
                  </Link>
                  <Link to={`/vitrina/${oferta.id}`} className="boton boton--fantasma">
                    Ver ficha pública
                  </Link>
                </>
              }
            />

            <div className="rejilla rejilla--2">
              <Tarjeta titulo="Información publicada">
                <dl className="pila" style={{ gap: "var(--e4)" }}>
                  <div>
                    <dt className="kpi__etiqueta">Estado</dt>
                    <dd>
                      <Insignia tono={oferta.tonoEstado}>{oferta.etiquetaEstado}</Insignia>
                    </dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Tipo de producto</dt>
                    <dd>{oferta.tipoProducto}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Publicada</dt>
                    <dd>{fecha(oferta.publicada)}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Vigencia</dt>
                    <dd>{fecha(oferta.vigencia)}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Manifestaciones de interés</dt>
                    <dd className="mono">{numero(oferta.interesados)}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Descripción</dt>
                    <dd>{oferta.descripcion}</dd>
                  </div>
                </dl>
              </Tarjeta>

              <div className="pila" style={{ gap: "var(--e4)" }}>
                <Tarjeta titulo="Certificaciones asociadas">
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
                </Tarjeta>

                <Tarjeta titulo="Clasificación de la información">
                  <div className="aviso aviso--info">
                    <Icono nombre="candado" tamano={18} />
                    <p>
                      Solo los campos clasificados como <strong>PÚBLICO</strong> se exponen sin
                      autenticación. Las cantidades y la capacidad productiva son{" "}
                      <strong>RESERVADO_COMERCIAL</strong> conforme al Art. 21 y no se publican.
                    </p>
                  </div>
                </Tarjeta>
              </div>
            </div>
          </>
        ) : null}
      </EstadoConsulta>
    </div>
  );
};
