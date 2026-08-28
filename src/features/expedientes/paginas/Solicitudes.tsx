import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { ErrorNormativo } from "../../../shared/ui/patrones/ErrorNormativo";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { aProblema } from "../../../shared/api/problemDetails";
import { fechaCorta, numero } from "../../../shared/i18n/formato";
import type { SolicitudRegistro } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useAbrirExpediente, useSolicitudes } from "../hooks/useExpedientes";

const TONO_SOLICITUD = {
  RECIBIDA: "info",
  EXPEDIENTE_ABIERTO: "exito",
  DESCARTADA: "neutro",
} as const;

const ETIQUETA_SOLICITUD = {
  RECIBIDA: "Recibida",
  EXPEDIENTE_ABIERTO: "Expediente abierto",
  DESCARTADA: "Descartada",
} as const;

const ETIQUETA_ACTOR = {
  CULTIVADOR: "Cultivador",
  TRANSFORMADOR: "Transformador",
  DISPENSADOR: "Dispensador",
  IPS: "IPS",
  LABORATORIO: "Laboratorio",
} as const;

export const Solicitudes = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(1);

  const consulta = useSolicitudes({ busqueda, estado, tipo, pagina, porPagina: 10 });
  const abrir = useAbrirExpediente();
  const autor = useAutor();

  const visibles = consulta.data?.datos ?? [];
  const pendientes = visibles.filter((solicitud) => solicitud.estado === "RECIBIDA").length;
  const abiertas = visibles.filter(
    (solicitud) => solicitud.estado === "EXPEDIENTE_ABIERTO",
  ).length;

  const columnas: readonly Columna<SolicitudRegistro>[] = [
    {
      clave: "organizacion",
      encabezado: "Organización solicitante",
      render: (solicitud) => (
        <span>
          <strong>{solicitud.organizacion}</strong>
          <br />
          <span className="enlace-fila__meta mono">NIT {solicitud.nit}</span>
        </span>
      ),
    },
    {
      clave: "tipo",
      encabezado: "Tipo de actor",
      render: (solicitud) => (
        <Insignia tono="neutro">{ETIQUETA_ACTOR[solicitud.tipoActor]}</Insignia>
      ),
    },
    {
      clave: "ubicacion",
      encabezado: "Ubicación",
      render: (solicitud) => `${solicitud.municipio}, ${solicitud.departamento}`,
    },
    {
      clave: "representante",
      encabezado: "Representante legal",
      render: (solicitud) => (
        <span>
          {solicitud.representante}
          <br />
          <span className="enlace-fila__meta mono">{solicitud.correo}</span>
        </span>
      ),
    },
    {
      clave: "recibida",
      encabezado: "Recibida",
      render: (solicitud) => <span className="dato">{fechaCorta(solicitud.recibida)}</span>,
    },
    {
      clave: "estado",
      encabezado: "Estado",
      render: (solicitud) => (
        <span>
          <Insignia tono={TONO_SOLICITUD[solicitud.estado]}>
            {ETIQUETA_SOLICITUD[solicitud.estado]}
          </Insignia>
          {solicitud.expedienteId ? (
            <>
              <br />
              <span className="enlace-fila__meta mono">{solicitud.expedienteId}</span>
            </>
          ) : null}
        </span>
      ),
    },
    {
      clave: "acciones",
      encabezado: "Trámite",
      render: (solicitud) =>
        solicitud.estado === "RECIBIDA" ? (
          <SiTienePermiso permiso="cumplimiento:solicitud:tramitar">
            <Boton
              variante="secundario"
              tamano="sm"
              icono="documento"
              cargando={abrir.isPending && abrir.variables?.solicitudId === solicitud.id}
              onClick={() => abrir.mutate({ solicitudId: solicitud.id, autor })}
            >
              Abrir expediente
            </Boton>
          </SiTienePermiso>
        ) : (
          <span className="enlace-fila__meta">Sin acción pendiente</span>
        ),
    },
  ];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Solicitudes de registro"
        subtitulo="Altas recibidas desde el formulario público. Abrir el expediente crea la organización en trámite, genera el checklist documental de su tipo de actor e invita a su representante legal."
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Solicitudes recibidas" valor={numero(consulta.data?.total ?? 0)} icono="usuario" />
        <Kpi etiqueta="Sin tramitar" valor={numero(pendientes)} icono="reloj" nota="Esperan apertura de expediente" />
        <Kpi etiqueta="Con expediente" valor={numero(abiertas)} icono="documento" />
        <Kpi
          etiqueta="Descartadas"
          valor={numero(visibles.length - pendientes - abiertas)}
          icono="cerrar"
        />
      </div>

      <div className="aviso aviso--info">
        <Icono nombre="escudo" tamano={18} />
        <p>
          Registrar la solicitud no valida requisitos legales: solo abre el trámite. La política
          vigente al momento de abrir el expediente queda congelada en él, de modo que un cambio
          posterior de reglas no altera un trámite en curso.
        </p>
      </div>

      {abrir.error ? (
        <ErrorNormativo problema={aProblema(abrir.error)} onReintentar={() => abrir.reset()} />
      ) : null}

      <TablaConFiltros
        descripcion="Solicitudes de registro recibidas"
        columnas={columnas}
        claveFila={(solicitud) => solicitud.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar solicitud"
        marcadorBusqueda="Buscar por organización o NIT"
        segmentos={{
          etiqueta: "Filtrar por estado",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todas" },
            { valor: "RECIBIDA", etiqueta: "Sin tramitar" },
            { valor: "EXPEDIENTE_ABIERTO", etiqueta: "Con expediente" },
            { valor: "DESCARTADA", etiqueta: "Descartadas" },
          ],
        }}
        selectores={[
          {
            clave: "tipo",
            etiqueta: "Tipo de actor",
            valor: tipo,
            opciones: Object.entries(ETIQUETA_ACTOR).map(([valor, etiqueta]) => ({
              valor,
              etiqueta,
            })),
            onCambiar: (valor) => {
              setTipo(valor);
              setPagina(1);
            },
          },
        ]}
        onPagina={setPagina}
        etiquetaPlural="solicitudes"
        vacio={
          <EstadoVacio
            icono="usuario"
            titulo="No hay solicitudes con esos criterios"
            texto="Las solicitudes llegan desde el formulario público de registro."
          />
        }
      />
    </div>
  );
};
