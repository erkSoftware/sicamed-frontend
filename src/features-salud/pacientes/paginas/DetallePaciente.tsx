import { Link, useParams } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Tabla } from "../../../shared/ui/primitivos/Tabla";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fecha, fechaHora } from "../../../shared/i18n/formato";
import { usePaciente } from "../hooks/usePacientes";
import { ETIQUETA_PRESCRIPCION, TONO_PRESCRIPCION } from "../../prescripciones/estados";

const TONO_CITA = {
  PROGRAMADA: "info",
  CONFIRMADA: "exito",
  ATENDIDA: "neutro",
  CANCELADA: "peligro",
  NO_ASISTIO: "alerta",
} as const;

export const DetallePaciente = () => {
  const { id = "" } = useParams();
  const consulta = usePaciente(id);
  const datos = consulta.data;

  return (
    <div className="pagina">
      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {datos ? (
          <>
            <EncabezadoPagina
              titulo={datos.paciente.nombre}
              subtitulo={`${datos.paciente.documento} · ${datos.paciente.edad} años · ${datos.paciente.aseguradora}`}
              acciones={
                <Link to="/app/salud/pacientes" className="boton boton--secundario">
                  Volver al listado
                </Link>
              }
            />

            <div className="aviso aviso--info">
              <Icono nombre="candado" tamano={18} />
              <p>
                Historia clínica sujeta a reserva. El contenido de esta pantalla se descarta de la
                memoria al salir y nunca se escribe en el dispositivo (Ley 1581 de 2012, Art. 5).
              </p>
            </div>

            <div className="rejilla rejilla--2">
              <Tarjeta titulo="Situación clínica">
                <dl className="pila" style={{ gap: "var(--e4)" }}>
                  <div>
                    <dt className="kpi__etiqueta">Diagnóstico principal</dt>
                    <dd>
                      {datos.paciente.diagnostico}{" "}
                      <span className="mono" style={{ color: "var(--texto-tenue)" }}>
                        (CIE-10 {datos.paciente.codigoDiagnostico})
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Estado del tratamiento</dt>
                    <dd>
                      <Insignia tono={datos.paciente.estado === "ACTIVO" ? "exito" : "info"}>
                        {datos.paciente.estado.replace("_", " ")}
                      </Insignia>
                    </dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Médico tratante</dt>
                    <dd>{datos.paciente.medicoTratante}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Ingreso al programa</dt>
                    <dd>{fecha(datos.paciente.ingreso)}</dd>
                  </div>
                </dl>
              </Tarjeta>

              <Tarjeta titulo="Notas de evolución" descripcion="Registro cronológico de la atención">
                <ol className="linea-tiempo">
                  {datos.notas.slice(0, 5).map((nota) => (
                    <li key={nota.id} className="linea-tiempo__item">
                      <span className="linea-tiempo__punto" aria-hidden="true">
                        <Icono nombre={nota.tipo === "EVENTO_ADVERSO" ? "alerta" : "documento"} tamano={14} />
                      </span>
                      <div>
                        <p className="linea-tiempo__titulo">{nota.resumen}</p>
                        <p className="linea-tiempo__meta">
                          {fecha(nota.fecha)} · {nota.tipo.replace("_", " ")} · {nota.profesional}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Tarjeta>
            </div>

            <Tarjeta titulo="Prescripciones" sinRelleno>
              <Tabla
                descripcion="Prescripciones del paciente"
                columnas={[
                  { clave: "fecha", encabezado: "Fecha", render: (p) => fecha(p.fecha) },
                  { clave: "codigo", encabezado: "Fórmula", render: (p) => <span className="mono">{p.codigo}</span> },
                  { clave: "denominacion", encabezado: "Denominación común", render: (p) => p.denominacionComun },
                  { clave: "concentracion", encabezado: "Concentración", render: (p) => p.concentracion },
                  { clave: "posologia", encabezado: "Posología", render: (p) => p.posologia },
                  {
                    clave: "saldo",
                    encabezado: "Entregado",
                    numerica: true,
                    render: (p) => `${p.entregadas} de ${p.cantidadTotal}`,
                  },
                  {
                    clave: "estado",
                    encabezado: "Estado",
                    render: (p) => (
                      <Insignia tono={TONO_PRESCRIPCION[p.estado]}>{ETIQUETA_PRESCRIPCION[p.estado]}</Insignia>
                    ),
                  },
                ]}
                filas={datos.prescripciones}
                claveFila={(p) => p.id}
                vacio={
                  <EstadoVacio
                    icono="documento"
                    titulo="Sin prescripciones registradas"
                    texto="Este paciente aún no tiene fórmulas asociadas en el sistema."
                  />
                }
              />
            </Tarjeta>

            <Tarjeta titulo="Citas" sinRelleno>
              <Tabla
                descripcion="Citas del paciente"
                columnas={[
                  { clave: "fecha", encabezado: "Fecha", render: (c) => fechaHora(c.fecha) },
                  { clave: "motivo", encabezado: "Motivo", render: (c) => c.motivo },
                  { clave: "modalidad", encabezado: "Modalidad", render: (c) => c.modalidad },
                  { clave: "profesional", encabezado: "Profesional", render: (c) => c.profesional },
                  {
                    clave: "estado",
                    encabezado: "Estado",
                    render: (c) => <Insignia tono={TONO_CITA[c.estado]}>{c.estado.replace("_", " ")}</Insignia>,
                  },
                ]}
                filas={datos.citas}
                claveFila={(c) => c.id}
                vacio={
                  <EstadoVacio
                    icono="agenda"
                    titulo="Sin citas registradas"
                    texto="Agenda una cita de control desde el módulo de agenda."
                  />
                }
              />
            </Tarjeta>
          </>
        ) : null}
      </EstadoConsulta>
    </div>
  );
};
