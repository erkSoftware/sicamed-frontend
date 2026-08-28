import { useState } from "react";
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
import type { EstadoDocumento, Expediente } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useDecidirDocumento, useExpedientes, useResolverPaso } from "../hooks/useExpedientes";

const TONO_EXPEDIENTE = {
  BORRADOR: "neutro",
  RADICADO: "info",
  EN_VERIFICACION: "acento",
  APROBADO: "exito",
  DEVUELTO: "peligro",
} as const;

const ETIQUETA_EXPEDIENTE = {
  BORRADOR: "Borrador",
  RADICADO: "Radicado",
  EN_VERIFICACION: "En verificación",
  APROBADO: "Aprobado",
  DEVUELTO: "Devuelto",
} as const;

const TONO_DOCUMENTO = {
  PENDIENTE: "neutro",
  EN_VERIFICACION: "info",
  APROBADO: "exito",
  DEVUELTO: "peligro",
  VENCIDO: "alerta",
} as const;

const ETIQUETA_DOCUMENTO = {
  PENDIENTE: "Sin cargar",
  EN_VERIFICACION: "En verificación",
  APROBADO: "Aprobado",
  DEVUELTO: "Devuelto",
  VENCIDO: "Vencido",
} as const;

const ETIQUETA_ACTOR = {
  CULTIVADOR: "Cultivador",
  TRANSFORMADOR: "Transformador",
  DISPENSADOR: "Dispensador",
  IPS: "IPS",
  LABORATORIO: "Laboratorio",
} as const;

const TONO_PASO = {
  PENDIENTE: "neutro",
  VERIFICADO: "exito",
  DEVUELTO: "peligro",
} as const;

type Decision =
  | { clase: "documento"; documentoId: string; valor: Extract<EstadoDocumento, "APROBADO" | "DEVUELTO"> }
  | { clase: "paso"; pasoId: string; orden: number; valor: "VERIFICADO" | "DEVUELTO" };

export const Expedientes = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState<string | null>(null);
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
  const devolviendo = decision?.valor === "DEVUELTO";

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
      encabezado: "Documentos",
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
        const resueltos = expediente.pasos.filter(
          (paso) => paso.veredicto === "VERIFICADO",
        ).length;
        return (
          <span className="mono">
            paso {Math.min(resueltos + 1, expediente.pasos.length)} de {expediente.pasos.length}
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
          onClick={() => setAbierto(expediente.id === abierto ? null : expediente.id)}
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
        subtitulo="La puerta de entrada al sistema: una organización carga sus documentos, un analista los verifica uno por uno y la política define cuáles son obligatorios según el tipo de actor."
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
          SICAMED no expide licencias: verifica que el acto administrativo cargado exista, esté
          vigente y corresponda a la modalidad declarada. La licencia la otorga MinJusticia o
          MinSalud según la modalidad.
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
            descripcion={`Política ${seleccionado.politicaVersion}, congelada al radicar. Modo secuencial con doble control.`}
            acciones={
              <Insignia tono={TONO_EXPEDIENTE[seleccionado.estado]}>
                {ETIQUETA_EXPEDIENTE[seleccionado.estado]}
              </Insignia>
            }
          >
            <ol className="pasos">
              {seleccionado.pasos.map((paso) => (
                <li key={paso.id} className="pasos__paso" data-veredicto={paso.veredicto}>
                  <span className="pasos__orden mono">{paso.orden}</span>
                  <span className="pasos__cuerpo">
                    <strong>{ETIQUETA_ROL[paso.rol]}</strong>
                    <span className="pasos__meta">
                      SLA de {paso.slaHoras} horas
                      {paso.revisor ? ` · resolvió ${paso.revisor}` : " · sin revisor asignado"}
                      {paso.resuelto ? ` el ${fechaCorta(paso.resuelto)}` : ""}
                    </span>
                    {paso.observacion ? (
                      <span className="expediente__observacion">{paso.observacion}</span>
                    ) : null}
                    {paso.huella ? <span className="pasos__meta mono">{paso.huella}</span> : null}
                  </span>
                  <span className="pasos__decision">
                    <Insignia tono={TONO_PASO[paso.veredicto]}>{paso.veredicto}</Insignia>
                    <SiTienePermiso permiso="cumplimiento:expediente:verificar">
                      {paso.veredicto === "PENDIENTE" ? (
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
                                valor: "VERIFICADO",
                              })
                            }
                          >
                            Verificar
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
                                valor: "DEVUELTO",
                              })
                            }
                          >
                            Devolver
                          </Boton>
                        </span>
                      ) : null}
                    </SiTienePermiso>
                  </span>
                </li>
              ))}
            </ol>
          </Tarjeta>

          <Tarjeta
            titulo={`Documentos de ${seleccionado.organizacion}`}
            descripcion={ETIQUETA_ACTOR[seleccionado.tipoActor]}
            sinRelleno
            pie={
              <p className="pie-region mono">
                Cada decisión de verificación queda como evento de trazabilidad con la huella del
                documento, el revisor y el sello de tiempo
              </p>
            }
          >
            <RegionDesplazable etiqueta="Documentos del expediente" alto={420}>
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
                        {documento.verificadoPor ? ` · verificó ${documento.verificadoPor}` : ""}
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
                                valor: "APROBADO",
                              })
                            }
                          >
                            Aprobar
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
                                valor: "DEVUELTO",
                              })
                            }
                          >
                            Devolver
                          </Boton>
                        </span>
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
          decision?.clase === "paso"
            ? `${decision.valor === "VERIFICADO" ? "Verificar" : "Devolver"} el paso ${decision.orden}`
            : decision?.valor === "APROBADO"
              ? "Aprobar el documento"
              : "Devolver el documento"
        }
        descripcion={
          devolviendo
            ? "La observación es obligatoria: es lo que el solicitante verá para saber qué corregir. Queda registrada junto con tu nombre y el sello de tiempo."
            : "Tu decisión queda sellada en el ledger con la huella del documento, tu identidad y la versión de política vigente al radicar."
        }
        etiquetaEnviar={devolviendo ? "Devolver con observación" : "Confirmar verificación"}
        cargando={enCurso}
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
          requerido={devolviendo}
          rows={4}
          value={observacion}
          ayuda={
            devolviendo
              ? "Indica con precisión qué documento falta o qué no corresponde."
              : "Opcional. Útil para dejar constancia de lo que se comprobó."
          }
          onChange={(evento) => setObservacion(evento.target.value)}
        />
      </DialogoFormulario>

      {errorDecision && decision === null ? (
        <ErrorNormativo problema={aProblema(errorDecision)} />
      ) : null}
    </div>
  );
};
