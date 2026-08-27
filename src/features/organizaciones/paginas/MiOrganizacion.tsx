import { Link, useParams } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Tabla } from "../../../shared/ui/primitivos/Tabla";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useAuth } from "../../../shared/auth/useAuth";
import { fecha, fechaCorta, numero } from "../../../shared/i18n/formato";
import { useAtestacionesDe, useOrganizacionActual } from "../hooks/useOrganizacion";

const TONO = {
  HABILITADA: "exito",
  EN_TRAMITE: "alerta",
  SUSPENDIDA: "peligro",
  VENCIDA: "peligro",
} as const;

const TONO_ATESTACION = {
  VIGENTE: "exito",
  POR_VENCER: "alerta",
  VENCIDA: "peligro",
  EN_TRAMITE: "info",
  RECHAZADA: "peligro",
} as const;

export const MiOrganizacion = () => {
  const { id } = useParams();
  const { sesion } = useAuth();
  const consulta = useOrganizacionActual(id ?? sesion?.usuario.organizacionId);
  const organizacion = consulta.data;
  const atestaciones = useAtestacionesDe(organizacion?.id ?? "");

  return (
    <div className="pagina">
      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {organizacion ? (
          <>
            <EncabezadoPagina
              titulo={organizacion.nombre}
              subtitulo={`NIT ${organizacion.nit} · ${organizacion.municipio}, ${organizacion.departamento}`}
              acciones={
                <Link to="/app/licencias" className="boton boton--primario">
                  Gestionar licencias
                </Link>
              }
            />

            <div className="rejilla-kpi">
              <Kpi
                etiqueta="Habilitación"
                valor={<Insignia tono={TONO[organizacion.estado]}>{organizacion.estado.replace("_", " ")}</Insignia>}
                nota={`Registrada el ${fecha(organizacion.registro)}`}
                icono="escudo"
              />
              <Kpi etiqueta="Cultivos" valor={numero(organizacion.cultivos)} nota="Predios activos" icono="produccion" a="/app/produccion" />
              <Kpi etiqueta="Lotes" valor={numero(organizacion.lotes)} nota="En inventario" icono="inventario" a="/app/inventario" />
              <Kpi etiqueta="Ofertas" valor={numero(organizacion.ofertas)} nota="En vitrina" icono="vitrina" a="/app/vitrina" />
            </div>

            <div className="rejilla rejilla--2">
              <Tarjeta titulo="Datos del actor" descripcion="Información de registro en SICAMED">
                <dl className="pila" style={{ gap: "var(--e4)" }}>
                  <div>
                    <dt className="kpi__etiqueta">Tipo de actor</dt>
                    <dd>{organizacion.tipo.replace("_", " ")}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Representante legal</dt>
                    <dd>{organizacion.representante}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Correo de notificación</dt>
                    <dd>{organizacion.correo}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Teléfono</dt>
                    <dd className="mono">{organizacion.telefono}</dd>
                  </div>
                </dl>
              </Tarjeta>

              <Tarjeta titulo="Expediente de registro" descripcion="Estado del trámite ante la autoridad competente">
                <ol className="linea-tiempo">
                  {[
                    { titulo: "Organización registrada", detalle: fecha(organizacion.registro), hecho: true },
                    { titulo: "Expediente de registro abierto", detalle: "Radicado ante la autoridad", hecho: true },
                    {
                      titulo: "Atestaciones de licencia cargadas",
                      detalle: `${atestaciones.data?.length ?? 0} documentos con evidencia`,
                      hecho: (atestaciones.data?.length ?? 0) > 0,
                    },
                    {
                      titulo: "Habilitación para publicar en vitrina",
                      detalle: organizacion.estado === "HABILITADA" ? "Vigente" : "Pendiente",
                      hecho: organizacion.estado === "HABILITADA",
                    },
                  ].map((paso) => (
                    <li key={paso.titulo} className="linea-tiempo__item">
                      <span
                        className="linea-tiempo__punto"
                        aria-hidden="true"
                        style={
                          paso.hecho
                            ? undefined
                            : { background: "var(--piedra-100)", color: "var(--texto-tenue)", borderColor: "var(--borde)" }
                        }
                      >
                        <Icono nombre={paso.hecho ? "check" : "reloj"} tamano={14} />
                      </span>
                      <div>
                        <p className="linea-tiempo__titulo">{paso.titulo}</p>
                        <p className="linea-tiempo__meta">{paso.detalle}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Tarjeta>
            </div>

            <Tarjeta titulo="Atestaciones de licencia" descripcion="Habilitaciones registradas para esta organización" sinRelleno>
              <EstadoConsulta cargando={atestaciones.isLoading} error={atestaciones.error}>
                <Tabla
                  descripcion="Atestaciones de licencia de la organización"
                  columnas={[
                    { clave: "tipo", encabezado: "Tipo", render: (a) => a.tipo.replaceAll("_", " ") },
                    { clave: "acto", encabezado: "Acto administrativo", render: (a) => a.acto },
                    { clave: "autoridad", encabezado: "Autoridad", render: (a) => a.autoridad },
                    { clave: "vencimiento", encabezado: "Vence", render: (a) => <span className="dato">{fechaCorta(a.vencimiento)}</span> },
                    {
                      clave: "estado",
                      encabezado: "Estado",
                      render: (a) => <Insignia tono={TONO_ATESTACION[a.estado]}>{a.estado.replace("_", " ")}</Insignia>,
                    },
                  ]}
                  filas={atestaciones.data ?? []}
                  claveFila={(a) => a.id}
                  vacio={
                    <EstadoVacio
                      icono="licencias"
                      titulo="Esta organización no tiene atestaciones registradas"
                      texto="Sin una atestación de licencia vigente no es posible publicar ofertas en la vitrina. Registra la atestación con su evidencia documental."
                      accion={
                        <Link to="/app/licencias" className="boton boton--primario boton--sm">
                          Registrar atestación
                        </Link>
                      }
                    />
                  }
                />
              </EstadoConsulta>
            </Tarjeta>
          </>
        ) : null}
      </EstadoConsulta>
    </div>
  );
};
