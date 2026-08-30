import { useState } from "react";
import { Link } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fecha, numero } from "../../../shared/i18n/formato";
import type { Paciente } from "../../../shared/api/mock/datosClinicos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useIndicadoresClinicos, usePacientes } from "../hooks/usePacientes";

const TONO = {
  ACTIVO: "exito",
  EN_TITULACION: "info",
  SUSPENDIDO: "alerta",
  ALTA: "neutro",
} as const;

const COLUMNAS: readonly Columna<Paciente>[] = [
  {
    clave: "paciente",
    encabezado: "Paciente",
    render: (paciente) => (
      <Link to={`/app/salud/pacientes/${paciente.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
        {paciente.nombre}
        <br />
        <span className="mono" style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)", fontWeight: 400 }}>
          {paciente.documento}
        </span>
      </Link>
    ),
  },
  {
    clave: "edad",
    encabezado: "Edad / Sexo",
    render: (paciente) =>
      paciente.sexo === "SIN_DATO"
        ? `${paciente.edad} años`
        : `${paciente.edad} años · ${paciente.sexo}`,
  },
  {
    clave: "diagnostico",
    encabezado: "Diagnóstico",
    render: (paciente) => (
      <span>
        {paciente.diagnostico}
        <br />
        <span className="mono" style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
          CIE-10 {paciente.codigoDiagnostico}
        </span>
      </span>
    ),
  },
  { clave: "aseguradora", encabezado: "Aseguradora", render: (paciente) => paciente.aseguradora },
  { clave: "tratante", encabezado: "Médico tratante", render: (paciente) => paciente.medicoTratante },
  {
    clave: "estado",
    encabezado: "Tratamiento",
    render: (paciente) => <Insignia tono={TONO[paciente.estado]}>{paciente.estado.replace("_", " ")}</Insignia>,
  },
  { clave: "ultima", encabezado: "Última atención", render: (paciente) => fecha(paciente.ultimaAtencion) },
];

export const ListaPacientes = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const consulta = usePacientes({ busqueda, estado, departamento, pagina, porPagina: 8 });
  const indicadores = useIndicadoresClinicos();

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Pacientes"
        subtitulo="Datos sensibles de salud. Esta zona no cachea respuestas, no persiste nada en el dispositivo y no es indexable ni observable por herramientas de monitoreo."
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Pacientes activos" valor={numero(indicadores.data?.pacientesActivos ?? 0)} icono="pacientes" />
        <Kpi etiqueta="Citas de hoy" valor={numero(indicadores.data?.citasHoy ?? 0)} icono="agenda" a="/app/salud/agenda" />
        <Kpi etiqueta="Teleconsultas" valor={numero(indicadores.data?.teleconsultasSemana ?? 0)} icono="teleconsulta" a="/app/salud/teleconsulta" />
        <Kpi etiqueta="Fórmulas vigentes" valor={numero(indicadores.data?.formulasVigentes ?? 0)} icono="documento" />
      </div>

      <TablaConFiltros
        descripcion="Listado de pacientes en tratamiento"
        columnas={COLUMNAS}
        claveFila={(paciente) => paciente.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar paciente"
        marcadorBusqueda="Buscar por nombre, documento o diagnóstico"
        segmentos={{
          etiqueta: "Filtrar por estado del tratamiento",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todos" },
            { valor: "ACTIVO", etiqueta: "Activos" },
            { valor: "EN_TITULACION", etiqueta: "En titulación" },
            { valor: "SUSPENDIDO", etiqueta: "Suspendidos" },
            { valor: "ALTA", etiqueta: "De alta" },
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
        etiquetaPlural="pacientes"
        vacio={
          <EstadoVacio
            icono="pacientes"
            titulo="No hay pacientes con esos criterios"
            texto="Ajusta los filtros de búsqueda. Solo verás los pacientes de las IPS sobre las que tienes competencia asignada."
          />
        }
      />
    </div>
  );
};
