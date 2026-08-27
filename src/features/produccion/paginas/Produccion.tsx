import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fecha, numero } from "../../../shared/i18n/formato";
import type { Cultivo } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useCultivos } from "../hooks/useCultivos";

const TONO_ESTADO = {
  PREPARACION: "neutro",
  VEGETATIVO: "info",
  FLORACION: "acento",
  COSECHA: "exito",
  CERRADO: "neutro",
} as const;

const COLUMNAS: readonly Columna<Cultivo>[] = [
  {
    clave: "nombre",
    encabezado: "Predio",
    render: (cultivo) => (
      <span>
        <strong>{cultivo.nombre}</strong>
        <br />
        <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
          {cultivo.municipio}, {cultivo.departamento}
        </span>
      </span>
    ),
  },
  { clave: "variedad", encabezado: "Variedad", render: (cultivo) => cultivo.variedad },
  {
    clave: "psicoactivo",
    encabezado: "Clasificación",
    render: (cultivo) => (
      <Insignia tono={cultivo.psicoactivo ? "alerta" : "neutro"}>
        {cultivo.psicoactivo ? "Psicoactivo" : "No psicoactivo"}
      </Insignia>
    ),
  },
  {
    clave: "area",
    encabezado: "Área (ha)",
    numerica: true,
    render: (cultivo) => <span className="mono">{cultivo.areaHectareas.toFixed(1)}</span>,
  },
  {
    clave: "plantas",
    encabezado: "Plantas",
    numerica: true,
    render: (cultivo) => <span className="mono">{numero(cultivo.plantas)}</span>,
  },
  {
    clave: "estado",
    encabezado: "Etapa",
    render: (cultivo) => <Insignia tono={TONO_ESTADO[cultivo.estado]}>{cultivo.estado}</Insignia>,
  },
  { clave: "siembra", encabezado: "Siembra", render: (cultivo) => fecha(cultivo.siembra) },
  { clave: "cosecha", encabezado: "Cosecha estimada", render: (cultivo) => fecha(cultivo.cosechaEstimada) },
];

export const Produccion = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const consulta = useCultivos({ busqueda, estado, departamento, pagina, porPagina: 10 });

  const visibles = consulta.data?.datos ?? [];
  const hectareas = visibles.reduce((suma, cultivo) => suma + cultivo.areaHectareas, 0);
  const plantas = visibles.reduce((suma, cultivo) => suma + cultivo.plantas, 0);
  const enFloracion = visibles.filter((cultivo) => cultivo.estado === "FLORACION").length;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Producción"
        subtitulo="Predios de cultivo registrados, su etapa fenológica y la cosecha estimada. Cada cambio de etapa queda sellado en la cadena de trazabilidad."
        acciones={
          <SiTienePermiso permiso="produccion:cultivo:escribir">
            <Boton icono="mas">Registrar predio</Boton>
          </SiTienePermiso>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Predios registrados" valor={numero(consulta.data?.total ?? 0)} icono="produccion" />
        <Kpi etiqueta="Área en esta página" valor={`${hectareas.toFixed(1)} ha`} icono="mapa" />
        <Kpi etiqueta="Plantas en pie" valor={numero(plantas)} icono="hoja" nota="Suma de la página actual" />
        <Kpi etiqueta="En floración" valor={numero(enFloracion)} icono="reloj" nota="Próximas a cosecha" />
      </div>

      <TablaConFiltros
        descripcion="Listado de predios de cultivo"
        columnas={COLUMNAS}
        claveFila={(cultivo) => cultivo.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar predio"
        marcadorBusqueda="Buscar por predio o variedad"
        segmentos={{
          etiqueta: "Filtrar por etapa",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todas" },
            { valor: "VEGETATIVO", etiqueta: "Vegetativo" },
            { valor: "FLORACION", etiqueta: "Floración" },
            { valor: "COSECHA", etiqueta: "Cosecha" },
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
        etiquetaPlural="predios"
        vacio={
          <EstadoVacio
            icono="produccion"
            titulo="No hay predios con esos criterios"
            texto="Ajusta los filtros o registra un nuevo predio de cultivo con su licencia asociada."
          />
        }
      />
    </div>
  );
};
