import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { ErrorNormativo } from "../../../shared/ui/patrones/ErrorNormativo";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { CampoArea } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { aProblema } from "../../../shared/api/problemDetails";
import { NOMBRE_DOCUMENTO } from "../../../shared/api/mock/datosProceso";
import { ETIQUETA_ROL } from "../../../shared/api/mock/datosGobierno";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fechaCorta, numero } from "../../../shared/i18n/formato";
import type { Expediente, PasoVerificacion } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useDecidirDocumento, useExpedientes, useResolverPaso } from "../hooks/useExpedientes";
import {
  ETIQUETA_ACTOR,
  ETIQUETA_DOCUMENTO,
  ETIQUETA_EXPEDIENTE,
  ETIQUETA_PASO,
  TONO_DOCUMENTO,
  TONO_EXPEDIENTE,
  TONO_PASO,
  exigeObservacion,
  pasoEnTurno,
  porOrden,
  resueltosPor,
  tramiteCerrado,
} from "../tramite";
import type { DecisionDocumento, VeredictoResoluble } from "../tramite";

type Decision =
  | { clase: "documento"; documentoId: string; nombre: string; valor: DecisionDocumento }
  | { clase: "paso"; pasoId: string; orden: number; etiqueta: string; valor: VeredictoResoluble };

const TITULO_DECISION: Record<DecisionDocumento | VeredictoResoluble, string> = {
  APROBADO: "Aceptar el soporte",
  VERIFICADO: "Aprobar el paso",
  DEVUELTO: "Devolver para subsanar",
  RECHAZADO: "Rechazar",
};

const AYUDA_DECISION: Record<DecisionDocumento | VeredictoResoluble, string> = {
  APROBADO: "Opcional. Útil para dejar constancia de lo que se comprobó.",
  VERIFICADO: "Opcional. Útil para dejar constancia de lo que se comprobó.",
  DEVUELTO:
    "Obligatoria. Indica con precisión qué falta o qué no corresponde: el actor la lee para subsanar.",
  RECHAZADO:
    "Obligatoria. Es el motivo del rechazo que va a leer quien radicó la solicitud: escríbelo para esa persona.",
};

export const Expedientes = () => {
  const [parametros, fijarParametros] = useSearchParams();
  const [busqueda, setBusqueda] = useState(parametros.get("buscar") ?? "");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState<string | null>(parametros.get("expediente"));
  const [decision, setDecision] = useState<Decision | null>(null);
  const [observacion, setObservacion] = useState("");

  const consulta = useExpedientes({ busqueda, estado, departamento, pagina, porPagina: 8 });
  const decidirDocumento = useDecidirDocumento();
  const resolverPaso = useResolverPaso();
  const autor = useAutor();

  const visibles = consulta.data?.datos ?? [];
  const seleccionado = visibles.find((expediente) => expediente.id === abierto) ?? null;

  const aprobados = visibles.filter((expediente) => expediente.estado === "APROBADO").length;
  const enCola = visibles.filter((expediente) => expediente.estado === "EN_VERIFICACION").length;
  const devueltos = visibles.filter((expediente) => expediente.estado === "DEVUELTO").length;

  const enTurno = seleccionado ? pasoEnTurno(seleccionado.pasos) : null;
  const mios = seleccionado ? resueltosPor(seleccionado.pasos, autor.nombre) : [];

  const seleccionar = (id: string | null) => {
    setAbierto(id);
    const siguientes = new URLSearchParams(parametros);
    if (id) siguientes.set("expediente", id);
    else siguientes.delete("expediente");
    fijarParametros(siguientes, { replace: true });
  };

  const cerrarDecision = () => {
    setDecision(null);
    setObservacion("");
    decidirDocumento.reset();
    resolverPaso.reset();
  };

  const confirmar = () => {
    if (!decision || !seleccionado) return;
    if (decision.clase === "documento") {
      decidirDocumento.mutate(
        {
          expedienteId: seleccionado.id,
          documentoId: decision.documentoId,
          decision: decision.valor,
          observacion,
          autor,
        },
        { onSuccess: cerrarDecision },
      );
      return;
    }
    resolverPaso.mutate(
      {
        expedienteId: seleccionado.id,
        pasoId: decision.pasoId,
        veredicto: decision.valor,
        observacion,
        autor,
      },
      { onSuccess: cerrarDecision },
    );
  };

  const enCurso = decidirDocumento.isPending || resolverPaso.isPending;
  const errorDecision = decidirDocumento.error ?? resolverPaso.error;
  const faltaObservacion =
    decision !== null && exigeObservacion(decision.valor) && observacion.trim() === "";

  const impedimentoDelPaso = (paso: PasoVerificacion): string | null => {
    if (paso.rol !== autor.rol)
      return `Este paso lo resuelve ${ETIQUETA_ROL[paso.rol]}, no tu rol.`;
    if (paso.exigeDobleControl && mios.length > 0)
      return `Exige doble control y tú ya resolviste ${mios.length === 1 ? "otro paso" : `${mios.length} pasos`} de este expediente: lo cierra un segundo analista.`;
    return null;
  };

  const columnas: readonly Columna<Expediente>[] = [
    {
      clave: "radicado",
      encabezado: "Radicado",
      render: (expediente) => (
        <span>
          <strong className="mono">{expediente.radicado}</strong>
          <br />
          <span className="enlace-fila__meta">{fechaCorta(expediente.radicacion)}</span>
        </span>
      ),
    },
    {
      clave: "organizacion",
      encabezado: "Organización",
      render: (expediente) => (
        <span>
          <strong>{expediente.organizacion}</strong>
          <br />
          <span className="enlace-fila__meta">
            {ETIQUETA_ACTOR[expediente.tipoActor]} · {expediente.departamento}
          </span>
        </span>
      ),
    },
    {
      clave: "documentos",
      encabezado: "Soportes",
      render: (expediente) => {
        const listos = expediente.documentos.filter(
          (documento) => documento.estado === "APROBADO",
        ).length;
        return (
          <span className="mono">
            {listos} de {expediente.documentos.length}
          </span>
        );
      },
    },
    {
      clave: "pasos",
      encabezado: "Trámite",
      render: (expediente) => {
        const turno = pasoEnTurno(expediente.pasos);
        return (
          <span>
            <span className="mono">
              paso {turno?.orden ?? expediente.pasos.length} de {expediente.pasos.length}
            </span>
            <br />
            <span className="enlace-fila__meta">
              {turno ? turno.etiqueta : "Sin pasos pendientes"}
            </span>
          </span>
        );
      },
    },
    {
      clave: "estado",
      encabezado: "Estado",
      render: (expediente) => (
        <Insignia tono={TONO_EXPEDIENTE[expediente.estado]}>
          {ETIQUETA_EXPEDIENTE[expediente.estado]}
        </Insignia>
      ),
    },
    {
      clave: "abrir",
      encabezado: "Expediente",
      render: (expediente) => (
        <Boton
          variante="secundario"
          tamano="sm"
          icono="documento"
          onClick={() => seleccionar(expediente.id === abierto ? null : expediente.id)}
        >
          {expediente.id === abierto ? "Cerrar" : "Revisar"}
        </Boton>
      ),
    },
  ];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Expedientes de registro"
        subtitulo="La puerta de entrada al sistema: se decide soporte por soporte y se resuelve paso por paso. No hay un botón final de aprobar: el expediente se cierra solo cuando el último paso queda resuelto."
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Expedientes radicados" valor={numero(consulta.data?.total ?? 0)} icono="documento" />
        <Kpi etiqueta="Aprobados en esta página" valor={numero(aprobados)} icono="check" />
        <Kpi etiqueta="En verificación" valor={numero(enCola)} icono="reloj" nota="Con analista asignado" />
        <Kpi etiqueta="Devueltos" valor={numero(devueltos)} icono="alerta" nota="Requieren corrección del actor" />
      </div>

      <div className="aviso aviso--info">
        <Icono nombre="escudo" tamano={18} />
        <p>
          El super administrador define la política de verificación y por eso no la aplica; nadie
          verifica su propia organización; cada paso es del rol al que la política se lo asignó, y el
          último exige un segundo analista. SICAMED no expide licencias: comprueba que el acto
          administrativo exista, esté vigente y corresponda a la modalidad declarada.
        </p>
      </div>

      <TablaConFiltros
        descripcion="Expedientes de registro radicados"
        columnas={columnas}
        claveFila={(expediente) => expediente.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar expediente"
        marcadorBusqueda="Buscar por radicado u organización"
        segmentos={{
          etiqueta: "Filtrar por estado",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todos" },
            { valor: "RADICADO", etiqueta: "Radicados" },
            { valor: "EN_VERIFICACION", etiqueta: "En verificación" },
            { valor: "APROBADO", etiqueta: "Aprobados" },
            { valor: "DEVUELTO", etiqueta: "Devueltos" },
            { valor: "RECHAZADO", etiqueta: "Rechazados" },
          ],
        }}
        selectores={[
          {
            clave: "departamento",
            etiqueta: "Departamento",
            valor: departamento,
            opciones: DEPARTAMENTOS.map((d) => ({ valor: d.nombre, etiqueta: d.nombre })),
            onCambiar: (valor) => {
              setDepartamento(valor);
              setPagina(1);
            },
          },
        ]}
        onPagina={setPagina}
        etiquetaPlural="expedientes"
        vacio={
          <EstadoVacio
            icono="documento"
            titulo="No hay expedientes con esos criterios"
            texto="Ajusta los filtros para encontrar el expediente que buscas."
          />
        }
      />

      {seleccionado ? (
        <>
          <Tarjeta
            titulo={`Trámite del expediente ${seleccionado.radicado}`}
            descripcion={`Política ${seleccionado.politicaVersion}, congelada al abrir. Los pasos se resuelven en orden: solo el primero sin resolver admite decisión.`}
            acciones={
              <Insignia tono={TONO_EXPEDIENTE[seleccionado.estado]}>
                {ETIQUETA_EXPEDIENTE[seleccionado.estado]}
              </Insignia>
            }
            pie={
              tramiteCerrado(seleccionado.estado) ? (
                <p className="pie-region">
                  {seleccionado.estado === "APROBADO"
                    ? "El expediente quedó aprobado. La habilitación de la organización y la cuenta de su representante legal las crea el bus de eventos, no esta pantalla: vuelve a la bandeja de solicitudes en unos segundos para verlo reflejado."
                    : "El expediente quedó rechazado. La observación del paso que lo rechazó viaja como motivo a la solicitud, y es lo que va a leer quien radicó."}
                </p>
              ) : null
            }
          >
            <ol className="pasos">
              {porOrden(seleccionado.pasos).map((paso) => {
                const esTurno = enTurno?.id === paso.id;
                const impedimento = esTurno ? impedimentoDelPaso(paso) : null;
                return (
                  <li key={paso.id} className="pasos__paso" data-veredicto={paso.veredicto}>
                    <span className="pasos__orden mono">{paso.orden}</span>
                    <span className="pasos__cuerpo">
                      <strong>{paso.etiqueta}</strong>
                      <span className="pasos__meta">
                        Responsable {ETIQUETA_ROL[paso.rol]} · SLA de {paso.slaHoras} horas
                        {paso.exigeDobleControl ? " · exige doble control" : ""}
                        {paso.revisor ? ` · resolvió ${paso.revisor}` : ""}
                        {paso.resuelto ? ` el ${fechaCorta(paso.resuelto)}` : ""}
                      </span>
                      {paso.observacion ? (
                        <span className="expediente__observacion">{paso.observacion}</span>
                      ) : null}
                      {!esTurno && paso.veredicto === "PENDIENTE" && enTurno ? (
                        <span className="pasos__meta">
                          Espera a que se resuelva «{enTurno.etiqueta}».
                        </span>
                      ) : null}
                      {impedimento ? <span className="pasos__meta">{impedimento}</span> : null}
                      {paso.huella ? <span className="pasos__meta mono">{paso.huella}</span> : null}
                    </span>
                    <span className="pasos__decision">
                      <Insignia tono={TONO_PASO[paso.veredicto]}>
                        {ETIQUETA_PASO[paso.veredicto]}
                      </Insignia>
                      <SiTienePermiso permiso="cumplimiento:expediente:verificar">
                        {esTurno && impedimento === null ? (
                          <span className="expediente__acciones">
                            <Boton
                              variante="secundario"
                              tamano="sm"
                              icono="check"
                              onClick={() =>
                                setDecision({
                                  clase: "paso",
                                  pasoId: paso.id,
                                  orden: paso.orden,
                                  etiqueta: paso.etiqueta,
                                  valor: "VERIFICADO",
                                })
                              }
                            >
                              Aprobar
                            </Boton>
                            <Boton
                              variante="fantasma"
                              tamano="sm"
                              icono="alerta"
                              onClick={() =>
                                setDecision({
                                  clase: "paso",
                                  pasoId: paso.id,
                                  orden: paso.orden,
                                  etiqueta: paso.etiqueta,
                                  valor: "DEVUELTO",
                                })
                              }
                            >
                              Devolver
                            </Boton>
                            <Boton
                              variante="peligro"
                              tamano="sm"
                              icono="cerrar"
                              onClick={() =>
                                setDecision({
                                  clase: "paso",
                                  pasoId: paso.id,
                                  orden: paso.orden,
                                  etiqueta: paso.etiqueta,
                                  valor: "RECHAZADO",
                                })
                              }
                            >
                              Rechazar
                            </Boton>
                          </span>
                        ) : null}
                      </SiTienePermiso>
                    </span>
                  </li>
                );
              })}
            </ol>
          </Tarjeta>

          <Tarjeta
            titulo={`Soportes de ${seleccionado.organizacion}`}
            descripcion={`${ETIQUETA_ACTOR[seleccionado.tipoActor]} · un soporte a la vez, y la observación es obligatoria salvo al aceptar.`}
            sinRelleno
            pie={
              <p className="pie-region mono">
                Cada decisión queda como evento de trazabilidad con la huella del documento, el
                revisor y el sello de tiempo
              </p>
            }
          >
            <RegionDesplazable etiqueta="Soportes del expediente" alto={420}>
              <ul className="expediente">
                {seleccionado.documentos.map((documento) => (
                  <li
                    key={documento.id}
                    className="expediente__documento"
                    data-estado={documento.estado}
                  >
                    <span className="expediente__icono" aria-hidden="true">
                      <Icono nombre="documento" tamano={17} />
                    </span>
                    <span className="expediente__cuerpo">
                      <strong>{NOMBRE_DOCUMENTO[documento.tipo]}</strong>
                      <span className="expediente__meta mono">{documento.archivo}</span>
                      <span className="expediente__meta">
                        Cargado el {fechaCorta(documento.cargado)}
                        {documento.vence ? ` · vence el ${fechaCorta(documento.vence)}` : " · sin vigencia"}
                        {documento.verificadoPor ? ` · decidió ${documento.verificadoPor}` : ""}
                      </span>
                      {documento.observacion ? (
                        <span className="expediente__observacion">{documento.observacion}</span>
                      ) : null}
                      <span className="expediente__meta mono">{documento.huella}</span>
                    </span>
                    <span className="expediente__decision">
                      <Insignia tono={TONO_DOCUMENTO[documento.estado]}>
                        {ETIQUETA_DOCUMENTO[documento.estado]}
                      </Insignia>
                      <SiTienePermiso permiso="cumplimiento:expediente:verificar">
                        {tramiteCerrado(seleccionado.estado) ? null : (
                          <span className="expediente__acciones">
                            <Boton
                              variante="secundario"
                              tamano="sm"
                              icono="check"
                              disabled={documento.estado === "APROBADO"}
                              onClick={() =>
                                setDecision({
                                  clase: "documento",
                                  documentoId: documento.id,
                                  nombre: NOMBRE_DOCUMENTO[documento.tipo],
                                  valor: "APROBADO",
                                })
                              }
                            >
                              Aceptar
                            </Boton>
                            <Boton
                              variante="fantasma"
                              tamano="sm"
                              icono="alerta"
                              disabled={documento.estado === "DEVUELTO"}
                              onClick={() =>
                                setDecision({
                                  clase: "documento",
                                  documentoId: documento.id,
                                  nombre: NOMBRE_DOCUMENTO[documento.tipo],
                                  valor: "DEVUELTO",
                                })
                              }
                            >
                              Devolver
                            </Boton>
                            <Boton
                              variante="peligro"
                              tamano="sm"
                              icono="cerrar"
                              disabled={documento.estado === "RECHAZADO"}
                              onClick={() =>
                                setDecision({
                                  clase: "documento",
                                  documentoId: documento.id,
                                  nombre: NOMBRE_DOCUMENTO[documento.tipo],
                                  valor: "RECHAZADO",
                                })
                              }
                            >
                              Rechazar
                            </Boton>
                          </span>
                        )}
                      </SiTienePermiso>
                    </span>
                  </li>
                ))}
              </ul>
            </RegionDesplazable>
          </Tarjeta>
        </>
      ) : null}

      <DialogoFormulario
        abierto={decision !== null}
        titulo={
          decision === null
            ? ""
            : decision.clase === "paso"
              ? `${TITULO_DECISION[decision.valor]}: ${decision.etiqueta}`
              : `${TITULO_DECISION[decision.valor]}: ${decision.nombre}`
        }
        descripcion={
          decision?.valor === "RECHAZADO" && decision.clase === "paso"
            ? "Rechazar un paso cierra el expediente entero. La observación viaja como motivo a la solicitud y es lo que va a leer quien radicó."
            : decision?.valor === "DEVUELTO"
              ? "Devolver deja el trámite abierto para que el actor subsane. La observación es obligatoria."
              : decision?.clase === "paso"
                ? "El expediente no se aprueba con un botón final: se cierra solo cuando el último paso queda resuelto."
                : "Tu decisión queda sellada en el ledger con la huella del documento, tu identidad y la versión de política vigente."
        }
        etiquetaEnviar={decision === null ? "Confirmar" : TITULO_DECISION[decision.valor]}
        cargando={enCurso}
        deshabilitado={faltaObservacion}
        error={errorDecision}
        onCerrar={cerrarDecision}
        onEnviar={confirmar}
        onLimpiarError={() => {
          decidirDocumento.reset();
          resolverPaso.reset();
        }}
      >
        <CampoArea
          etiqueta="Observación"
          requerido={decision !== null && exigeObservacion(decision.valor)}
          rows={4}
          value={observacion}
          ayuda={decision === null ? undefined : AYUDA_DECISION[decision.valor]}
          onChange={(evento) => setObservacion(evento.target.value)}
        />
      </DialogoFormulario>

      {errorDecision && decision === null ? (
        <ErrorNormativo problema={aProblema(errorDecision)} />
      ) : null}
    </div>
  );
};
