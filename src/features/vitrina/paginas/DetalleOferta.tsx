import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fecha, numero } from "../../../shared/i18n/formato";
import { aOfertaVista } from "../modelo/mapeo";
import { useManifestarInteres, useOferta } from "../hooks/useOfertas";

export const DetalleOferta = () => {
  const { id = "" } = useParams();
  const consulta = useOferta(id);
  const oferta = consulta.data ? aOfertaVista(consulta.data) : null;
  const manifestar = useManifestarInteres();
  const autor = useAutor();
  const [abierto, setAbierto] = useState(false);
  const [solicitante, setSolicitante] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [errores, setErrores] = useState<{ solicitante?: string; departamento?: string }>({});

  const cerrar = () => {
    setAbierto(false);
    setSolicitante("");
    setDepartamento("");
    setErrores({});
    manifestar.reset();
  };

  const enviar = () => {
    const encontrados: { solicitante?: string; departamento?: string } = {};
    if (solicitante.trim().length < 5)
      encontrados.solicitante = "Identifica a la organización interesada.";
    if (!departamento) encontrados.departamento = "Selecciona el departamento.";
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    manifestar.mutate(
      { ofertaId: id, solicitante: solicitante.trim(), departamento, autor },
      { onSuccess: cerrar },
    );
  };

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
                  <SiTienePermiso permiso="vitrina:oferta:leer">
                    <Boton icono="mas" onClick={() => setAbierto(true)}>
                      Manifestar interés
                    </Boton>
                  </SiTienePermiso>
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

      <DialogoFormulario
        abierto={abierto}
        titulo="Manifestar interés"
        descripcion="Manifestar interés deja constancia ante el oferente, que decidirá si revela sus datos de contacto. No es una orden de compra ni compromete condición económica alguna."
        etiquetaEnviar="Manifestar interés"
        cargando={manifestar.isPending}
        error={manifestar.error}
        onCerrar={cerrar}
        onEnviar={enviar}
        onLimpiarError={() => manifestar.reset()}
      >
        <CampoTexto
          etiqueta="Organización interesada"
          requerido
          value={solicitante}
          error={errores.solicitante}
          onChange={(evento) => setSolicitante(evento.target.value)}
        />
        <CampoSelect
          etiqueta="Departamento"
          requerido
          vacio="Selecciona un departamento"
          value={departamento}
          error={errores.departamento}
          opciones={DEPARTAMENTOS.map((d) => ({ valor: d.nombre, etiqueta: d.nombre }))}
          onChange={(evento) => setDepartamento(evento.target.value)}
        />
      </DialogoFormulario>

    </div>
  );
};
