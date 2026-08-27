import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { NOMBRE_DOCUMENTO } from "../../../shared/api/mock/datosProceso";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fechaCorta, numero } from "../../../shared/i18n/formato";
import type { EstadoDocumento, Expediente } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useExpedientes } from "../hooks/useExpedientes";

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

export const Expedientes = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [decisiones, setDecisiones] = useState<Record<string, EstadoDocumento>>({});
  const consulta = useExpedientes({ busqueda, estado, departamento, pagina, porPagina: 8 });

  const visibles = consulta.data?.datos ?? [];
  const seleccionado = visibles.find((expediente) => expediente.id === abierto) ?? null;

  const estadoDe = (id: string, original: EstadoDocumento): EstadoDocumento =>
    decisiones[id] ?? original;

  const decidir = (id: string, valor: EstadoDocumento) =>
    setDecisiones((previas) => ({ ...previas, [id]: valor }));

  const aprobados = visibles.filter((expediente) => expediente.estado === "APROBADO").length;
  const enCola = visibles.filter((expediente) => expediente.estado === "EN_VERIFICACION").length;
  const devueltos = visibles.filter((expediente) => expediente.estado === "DEVUELTO").length;

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
          (documento) => estadoDe(documento.id, documento.estado) === "APROBADO",
        ).length;
        return (
          <span className="mono">
            {listos} de {expediente.documentos.length}
          </span>
        );
      },
    },
    {
      clave: "analista",
      encabezado: "Analista",
      render: (expediente) =>
        expediente.analista ? (
          expediente.analista
        ) : (
          <span className="enlace-fila__meta">Sin asignar</span>
        ),
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
        <Tarjeta
          titulo={`Expediente ${seleccionado.radicado}`}
          descripcion={`${seleccionado.organizacion} · ${ETIQUETA_ACTOR[seleccionado.tipoActor]}`}
          sinRelleno
          acciones={
            <Insignia tono={TONO_EXPEDIENTE[seleccionado.estado]}>
              {ETIQUETA_EXPEDIENTE[seleccionado.estado]}
            </Insignia>
          }
          pie={
            <p className="pie-region mono">
              Cada decisión de verificación queda como evento de trazabilidad con la huella del
              documento
            </p>
          }
        >
          <RegionDesplazable etiqueta="Documentos del expediente" alto={420}>
            <ul className="expediente">
              {seleccionado.documentos.map((documento) => {
                const actual = estadoDe(documento.id, documento.estado);
                return (
                  <li key={documento.id} className="expediente__documento" data-estado={actual}>
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
                      {documento.observacion && actual === documento.estado ? (
                        <span className="expediente__observacion">{documento.observacion}</span>
                      ) : null}
                      <span className="expediente__meta mono">{documento.huella}</span>
                    </span>
                    <span className="expediente__decision">
                      <Insignia tono={TONO_DOCUMENTO[actual]}>{ETIQUETA_DOCUMENTO[actual]}</Insignia>
                      <SiTienePermiso permiso="cumplimiento:expediente:verificar">
                        <span className="expediente__acciones">
                          <Boton
                            variante="secundario"
                            tamano="sm"
                            icono="check"
                            disabled={actual === "APROBADO"}
                            onClick={() => decidir(documento.id, "APROBADO")}
                          >
                            Aprobar
                          </Boton>
                          <Boton
                            variante="fantasma"
                            tamano="sm"
                            icono="alerta"
                            disabled={actual === "DEVUELTO"}
                            onClick={() => decidir(documento.id, "DEVUELTO")}
                          >
                            Devolver
                          </Boton>
                        </span>
                      </SiTienePermiso>
                    </span>
                  </li>
                );
              })}
            </ul>
          </RegionDesplazable>
        </Tarjeta>
      ) : null}
    </div>
  );
};
