import { Link, useParams } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { CodigoQr } from "../../../shared/ui/patrones/CodigoQr";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Tabla } from "../../../shared/ui/primitivos/Tabla";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fecha, fechaHora, numero } from "../../../shared/i18n/formato";
import { ETIQUETA_PRESCRIPCION, TONO_PRESCRIPCION } from "../../prescripciones/estados";
import { ETIQUETA_METODO } from "../../../shared/dispensacion/metodos";
import { useCredencial, useRotarCodigo } from "../hooks/useCredenciales";
import { ETIQUETA_CREDENCIAL, ETIQUETA_NIVEL, TONO_CREDENCIAL } from "../estados";

export const DetalleCredencial = () => {
  const { id = "" } = useParams();
  const consulta = useCredencial(id);
  const rotar = useRotarCodigo();
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
              titulo={datos.credencial.seudonimo}
              subtitulo={`${datos.credencial.paciente} · emitida el ${fecha(datos.credencial.emitida)} · ${ETIQUETA_NIVEL[datos.credencial.nivelVerificacion]}`}
              acciones={
                <Link to="/app/salud/credenciales" className="boton boton--secundario">
                  Volver al listado
                </Link>
              }
            />

            <div className="aviso aviso--info">
              <Icono nombre="candado" tamano={18} />
              <p>
                El nombre del paciente solo existe en esta pantalla. Lo que viaja al punto de
                dispensación y al ledger de trazabilidad es el seudónimo{" "}
                <span className="mono">{datos.credencial.seudonimo}</span>.
              </p>
            </div>

            <div className="rejilla rejilla--2">
              <Tarjeta
                titulo="Código de presentación"
                descripcion="Es lo que el paciente muestra en el mostrador. Rota para que una captura de pantalla no sirva después."
                acciones={
                  <Insignia tono={TONO_CREDENCIAL[datos.credencial.estado]}>
                    {ETIQUETA_CREDENCIAL[datos.credencial.estado]}
                  </Insignia>
                }
              >
                <div className="credencial-codigo">
                  <CodigoQr
                    valor={datos.credencial.codigoRotatorio}
                    etiqueta={`Código de la credencial ${datos.credencial.seudonimo}`}
                    tamano={188}
                  />
                  <div className="pila" style={{ gap: "var(--e3)" }}>
                    <span className="kpi__etiqueta">Código vigente</span>
                    <strong className="credencial-codigo__texto mono">
                      {datos.credencial.codigoRotatorio}
                    </strong>
                    <span className="texto-tenue">
                      Última rotación {fechaHora(datos.credencial.ultimaRotacion)}
                    </span>
                    <Boton
                      variante="secundario"
                      tamano="sm"
                      icono="reloj"
                      cargando={rotar.isPending}
                      onClick={() => rotar.mutate({ id: datos.credencial.id })}
                    >
                      Rotar el código
                    </Boton>
                  </div>
                </div>
              </Tarjeta>

              <Tarjeta titulo="Estado de la credencial">
                <dl className="pila" style={{ gap: "var(--e4)" }}>
                  <div>
                    <dt className="kpi__etiqueta">Vigencia</dt>
                    <dd>Hasta el {fecha(datos.credencial.vence)}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Nivel de verificación</dt>
                    <dd>{ETIQUETA_NIVEL[datos.credencial.nivelVerificacion]}</dd>
                  </div>
                  <div>
                    <dt className="kpi__etiqueta">Entregas en la ventana vigente</dt>
                    <dd>{numero(datos.credencial.entregasEnVentana)}</dd>
                  </div>
                  {datos.credencial.motivo ? (
                    <div>
                      <dt className="kpi__etiqueta">Motivo del estado</dt>
                      <dd>{datos.credencial.motivo}</dd>
                    </div>
                  ) : null}
                </dl>
              </Tarjeta>
            </div>

            <Tarjeta titulo="Fórmulas del paciente" sinRelleno>
              <Tabla
                descripcion="Prescripciones asociadas a la credencial"
                columnas={[
                  { clave: "codigo", encabezado: "Fórmula", render: (p) => <span className="mono">{p.codigo}</span> },
                  { clave: "denominacion", encabezado: "Denominación común", render: (p) => p.denominacionComun },
                  { clave: "saldo", encabezado: "Entregado", numerica: true, render: (p) => `${p.entregadas} de ${p.cantidadTotal}` },
                  { clave: "vigencia", encabezado: "Vigente hasta", render: (p) => fecha(p.vigenciaHasta) },
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
                    titulo="Sin fórmulas asociadas"
                    texto="Emite una prescripción para que el paciente pueda retirarla en una farmacia licenciada."
                  />
                }
              />
            </Tarjeta>

            <Tarjeta titulo="Entregas registradas" sinRelleno>
              <Tabla
                descripcion="Actos de dispensación de esta credencial"
                columnas={[
                  { clave: "codigo", encabezado: "Acto", render: (a) => <span className="mono">{a.codigo}</span> },
                  { clave: "producto", encabezado: "Entregado", render: (a) => `${a.unidades} ${a.unidadFarmaceutica} · ${a.denominacionComun}` },
                  { clave: "punto", encabezado: "Punto", render: (a) => `${a.punto} · ${a.municipio}` },
                  { clave: "metodo", encabezado: "Verificación", render: (a) => ETIQUETA_METODO[a.metodo] },
                  { clave: "fecha", encabezado: "Fecha", render: (a) => fechaHora(a.fecha) },
                ]}
                filas={datos.entregas}
                claveFila={(a) => a.id}
                vacio={
                  <EstadoVacio
                    icono="trazabilidad"
                    titulo="Sin entregas registradas"
                    texto="Cuando el paciente retire su fórmula en el mostrador, la entrega aparecerá aquí sellada en el ledger."
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
