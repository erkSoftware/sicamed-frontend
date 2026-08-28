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
import { diasHasta, fechaCorta, numero, porcentaje } from "../../../shared/i18n/formato";
import type { CupoMicc } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useConciliarCupos, useCupos } from "../hooks/useCupos";

const TONO_CUPO = {
  VIGENTE: "exito",
  POR_VENCER: "alerta",
  AGOTADO: "peligro",
  SIN_CUPO: "peligro",
} as const;

const ETIQUETA_CUPO = {
  VIGENTE: "Vigente",
  POR_VENCER: "Por vencer",
  AGOTADO: "Agotado",
  SIN_CUPO: "Sin cupo",
} as const;

const ETIQUETA_MODALIDAD = {
  CULTIVO_NO_PSICOACTIVO: "Cultivo no psicoactivo",
  CULTIVO_PSICOACTIVO: "Cultivo psicoactivo",
  FABRICACION_DERIVADOS: "Fabricación de derivados",
  DISPENSACION: "Dispensación",
  EXPORTACION: "Exportación",
} as const;

const COLUMNAS: readonly Columna<CupoMicc>[] = [
  {
    clave: "organizacion",
    encabezado: "Licenciatario",
    render: (cupo) => (
      <span>
        <strong>{cupo.organizacion}</strong>
        <br />
        <span className="enlace-fila__meta mono">{cupo.actoAsignacion}</span>
      </span>
    ),
  },
  {
    clave: "modalidad",
    encabezado: "Modalidad",
    render: (cupo) => (
      <Insignia tono={cupo.modalidad === "CULTIVO_PSICOACTIVO" ? "alerta" : "neutro"}>
        {ETIQUETA_MODALIDAD[cupo.modalidad]}
      </Insignia>
    ),
  },
  {
    clave: "autorizadas",
    encabezado: "Autorizadas",
    numerica: true,
    render: (cupo) => <span className="mono">{numero(cupo.plantasAutorizadas)}</span>,
  },
  {
    clave: "sembradas",
    encabezado: "En pie",
    numerica: true,
    render: (cupo) => <span className="mono">{numero(cupo.plantasSembradas)}</span>,
  },
  {
    clave: "ocupacion",
    encabezado: "Ocupación del cupo",
    render: (cupo) => {
      const razon =
        cupo.plantasAutorizadas === 0 ? 1 : cupo.plantasSembradas / cupo.plantasAutorizadas;
      return (
        <span className="barra-cupo">
          <span
            className="barra-cupo__relleno"
            data-estado={cupo.estado}
            style={{ width: `${Math.min(100, razon * 100).toFixed(1)}%` }}
          />
          <span className="barra-cupo__cifra mono">{porcentaje(razon * 100, 0)}</span>
        </span>
      );
    },
  },
  {
    clave: "vigencia",
    encabezado: "Vigencia",
    render: (cupo) => {
      const restantes = diasHasta(cupo.vigencia);
      return restantes < 0 ? (
        <Insignia tono="peligro">Vencido</Insignia>
      ) : (
        <span className="dato">{fechaCorta(cupo.vigencia)}</span>
      );
    },
  },
  {
    clave: "estado",
    encabezado: "Estado",
    render: (cupo) => <Insignia tono={TONO_CUPO[cupo.estado]}>{ETIQUETA_CUPO[cupo.estado]}</Insignia>,
  },
  {
    clave: "conciliado",
    encabezado: "Conciliado",
    render: (cupo) => <span className="dato">{fechaCorta(cupo.conciliado)}</span>,
  },
];

export const Cupos = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [pagina, setPagina] = useState(1);

  const consulta = useCupos({ busqueda, estado, tipo: modalidad, pagina, porPagina: 10 });
  const conciliar = useConciliarCupos();
  const autor = useAutor();

  const visibles = consulta.data?.datos ?? [];
  const autorizadas = visibles.reduce((suma, cupo) => suma + cupo.plantasAutorizadas, 0);
  const sembradas = visibles.reduce((suma, cupo) => suma + cupo.plantasSembradas, 0);
  const agotados = visibles.filter(
    (cupo) => cupo.estado === "AGOTADO" || cupo.estado === "SIN_CUPO",
  ).length;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Cupos asignados"
        subtitulo="El régimen de cupos opera por número de plantas, no por área ni por un contador declarado. Cada siembra se contrasta contra el cupo vigente antes de aceptarse."
        acciones={
          <SiTienePermiso permiso="interoperabilidad:conexion:conciliar">
            <Boton
              icono="mundo"
              cargando={conciliar.isPending}
              onClick={() => conciliar.mutate({ autor })}
            >
              Conciliar contra el MICC
            </Boton>
          </SiTienePermiso>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Cupos vigentes" valor={numero(consulta.data?.total ?? 0)} icono="escudo" />
        <Kpi etiqueta="Plantas autorizadas" valor={numero(autorizadas)} icono="documento" nota="Suma de la página" />
        <Kpi etiqueta="Plantas en pie" valor={numero(sembradas)} icono="hoja" nota="Conteo real del registro" />
        <Kpi
          etiqueta="Cupos agotados o vencidos"
          valor={numero(agotados)}
          icono="alerta"
          nota="Bloquean nuevas siembras"
        />
      </div>

      <div className="aviso aviso--alerta">
        <Icono nombre="candado" tamano={18} />
        <p>
          El cupo lo asigna el MICC, no SICAMED. Aquí solo se lee el cupo vigente y se contrasta
          contra las plantas efectivamente registradas. Si la ocupación llega al 100%, el servidor
          rechaza la siembra citando el Decreto 1138 de 2025.
        </p>
      </div>

      {conciliar.error ? (
        <ErrorNormativo problema={aProblema(conciliar.error)} onReintentar={() => conciliar.reset()} />
      ) : null}

      <TablaConFiltros
        descripcion="Cupos de plantas asignados por el MICC"
        columnas={COLUMNAS}
        claveFila={(cupo) => cupo.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar cupo"
        marcadorBusqueda="Buscar por licenciatario o acto de asignación"
        segmentos={{
          etiqueta: "Filtrar por estado",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todos" },
            { valor: "VIGENTE", etiqueta: "Vigentes" },
            { valor: "POR_VENCER", etiqueta: "Por vencer" },
            { valor: "AGOTADO", etiqueta: "Agotados" },
            { valor: "SIN_CUPO", etiqueta: "Sin cupo" },
          ],
        }}
        selectores={[
          {
            clave: "modalidad",
            etiqueta: "Modalidad",
            valor: modalidad,
            opciones: [
              { valor: "CULTIVO_PSICOACTIVO", etiqueta: "Cultivo psicoactivo" },
              { valor: "CULTIVO_NO_PSICOACTIVO", etiqueta: "Cultivo no psicoactivo" },
            ],
            onCambiar: (valor) => {
              setModalidad(valor);
              setPagina(1);
            },
          },
        ]}
        onPagina={setPagina}
        etiquetaPlural="cupos"
        vacio={
          <EstadoVacio
            icono="escudo"
            titulo="No hay cupos con esos criterios"
            texto="El cupo se asigna por acto administrativo del MICC para cada modalidad licenciada."
          />
        }
      />
    </div>
  );
};
