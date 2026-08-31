import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { FichaSolicitud } from "../componentes/FichaSolicitud";
import { useAbrirExpediente, useSolicitudes } from "../hooks/useExpedientes";
import { ETIQUETA_ACTOR, ETIQUETA_SOLICITUD, TONO_SOLICITUD } from "../tramite";

export const Solicitudes = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [enFicha, setEnFicha] = useState<SolicitudRegistro | null>(null);

  const consulta = useSolicitudes({ busqueda, estado, tipo, pagina, porPagina: 10 });
  const abrir = useAbrirExpediente();
  const autor = useAutor();
  const navegar = useNavigate();

  const visibles = consulta.data?.datos ?? [];
  const pendientes = visibles.filter((solicitud) => solicitud.estado === "RECIBIDA").length;
  const enTramite = visibles.filter((solicitud) => solicitud.estado === "EN_TRAMITE").length;
  const aprobadas = visibles.filter((solicitud) => solicitud.estado === "APROBADA").length;
  const rechazadas = visibles.filter((solicitud) => solicitud.estado === "RECHAZADA").length;

  const rutaDelExpediente = (id: string, organizacion: string) =>
    `/app/expedientes?expediente=${id}&buscar=${encodeURIComponent(organizacion)}`;

  const columnas: readonly Columna<SolicitudRegistro>[] = [
    {
      clave: "organizacion",
      encabezado: "Organización solicitante",
      render: (solicitud) => (
        <button type="button" className="enlace-fila enlace-fila--boton" onClick={() => setEnFicha(solicitud)}>
          <strong>{solicitud.organizacion}</strong>
          <span className="enlace-fila__meta mono">NIT {solicitud.nit}</span>
        </button>
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
      encabezado: "Radicada",
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
          {solicitud.motivoRechazo ? (
            <>
              <br />
              <span className="expediente__observacion">{solicitud.motivoRechazo}</span>
            </>
          ) : null}
        </span>
      ),
    },
    {
      clave: "ficha",
      encabezado: "Ficha",
      render: (solicitud) => (
        <Boton variante="fantasma" tamano="sm" icono="ojo" onClick={() => setEnFicha(solicitud)}>
          Ver ficha
        </Boton>
      ),
    },
    {
      clave: "acciones",
      encabezado: "Trámite",
      render: (solicitud) =>
        solicitud.estado === "RECIBIDA" ? (
          <SiTienePermiso
            permiso="cumplimiento:solicitud:tramitar"
            alternativa={<span className="enlace-fila__meta">Sin permiso para tramitar</span>}
          >
            <Boton
              variante="secundario"
              tamano="sm"
              icono="documento"
              cargando={abrir.isPending && abrir.variables?.solicitudId === solicitud.id}
              onClick={() =>
                abrir.mutate(
                  { solicitudId: solicitud.id, autor },
                  {
                    onSuccess: (expediente) =>
                      navegar(rutaDelExpediente(expediente.id, solicitud.organizacion)),
                  },
                )
              }
            >
              Admitir a trámite
            </Boton>
          </SiTienePermiso>
        ) : solicitud.expedienteId ? (
          <Boton
            variante="fantasma"
            tamano="sm"
            icono="documento"
            onClick={() =>
              navegar(rutaDelExpediente(solicitud.expedienteId ?? "", solicitud.organizacion))
            }
          >
            Ver expediente
          </Boton>
        ) : (
          <span className="enlace-fila__meta">Sin expediente asociado</span>
        ),
    },
  ];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Solicitudes de registro"
        subtitulo="Altas recibidas desde el formulario público. Admitir a trámite inscribe la organización, abre su expediente con el checklist de su tipo de actor y deja la solicitud en trámite: es una sola llamada."
        acciones={
          <Boton
            variante="secundario"
            icono="flecha"
            cargando={consulta.isFetching}
            onClick={() => void consulta.refetch()}
          >
            Releer la bandeja
          </Boton>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Solicitudes radicadas" valor={numero(consulta.data?.total ?? 0)} icono="usuario" />
        <Kpi etiqueta="Sin tramitar" valor={numero(pendientes)} icono="reloj" nota="Esperan apertura de expediente" />
        <Kpi etiqueta="En trámite" valor={numero(enTramite)} icono="documento" nota="Con expediente abierto" />
        <Kpi
          etiqueta="Resueltas"
          valor={numero(aprobadas + rechazadas)}
          icono="check"
          nota={`${numero(aprobadas)} aprobadas · ${numero(rechazadas)} rechazadas`}
        />
      </div>

      <div className="aviso aviso--info">
        <Icono nombre="escudo" tamano={18} />
        <p>
          Aprobar no es cambiar el estado de la solicitud: es cerrar su expediente. Cuando el último
          paso queda resuelto, la solicitud pasa a aprobada, la organización queda habilitada y la
          cuenta de su representante legal se crea sola, por bus de eventos. Eso ocurre{" "}
          <strong>después</strong> de la respuesta, así que si no lo ves aún, relee la bandeja en vez
          de dar por hecho el estado.
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
            { valor: "EN_TRAMITE", etiqueta: "En trámite" },
            { valor: "APROBADA", etiqueta: "Aprobadas" },
            { valor: "RECHAZADA", etiqueta: "Rechazadas" },
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

      <FichaSolicitud solicitud={enFicha} onCerrar={() => setEnFicha(null)} />
    </div>
  );
};
