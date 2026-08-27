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
import type { Lote } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useLotes } from "../hooks/useLotes";

const TONO_ESTADO = {
  EN_BODEGA: "exito",
  EN_TRANSITO: "info",
  DISPENSADO: "neutro",
  RETENIDO: "peligro",
  DESTRUIDO: "peligro",
} as const;

const COLUMNAS: readonly Columna<Lote>[] = [
  {
    clave: "codigo",
    encabezado: "Lote",
    render: (lote) => (
      <span>
        <strong className="mono">{lote.codigo}</strong>
        <br />
        <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>{lote.bodega}</span>
      </span>
    ),
  },
  { clave: "tipo", encabezado: "Tipo", render: (lote) => lote.tipo.replaceAll("_", " ") },
  {
    clave: "cantidad",
    encabezado: "Cantidad",
    numerica: true,
    render: (lote) => (
      <span className="mono">
        {numero(lote.cantidad)} {lote.unidad}
      </span>
    ),
  },
  {
    clave: "cannabinoides",
    encabezado: "THC / CBD",
    numerica: true,
    render: (lote) => (
      <span className="mono">
        {lote.thc.toFixed(2)}% / {lote.cbd.toFixed(2)}%
      </span>
    ),
  },
  { clave: "departamento", encabezado: "Departamento", render: (lote) => lote.departamento },
  {
    clave: "estado",
    encabezado: "Estado",
    render: (lote) => <Insignia tono={TONO_ESTADO[lote.estado]}>{lote.estado.replace("_", " ")}</Insignia>,
  },
  { clave: "fecha", encabezado: "Creado", render: (lote) => fecha(lote.fecha) },
  { clave: "vencimiento", encabezado: "Vence", render: (lote) => fecha(lote.vencimiento) },
];

export const Inventario = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const consulta = useLotes({ busqueda, estado, tipo, departamento, pagina, porPagina: 10 });

  const visibles = consulta.data?.datos ?? [];
  const enBodega = visibles.filter((lote) => lote.estado === "EN_BODEGA").length;
  const retenidos = visibles.filter((lote) => lote.estado === "RETENIDO").length;
  const enTransito = visibles.filter((lote) => lote.estado === "EN_TRANSITO").length;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Inventario"
        subtitulo="Lotes de producto con su cadena de custodia. Todo traslado entre bodegas genera un evento verificable en el ledger de trazabilidad."
        acciones={
          <SiTienePermiso permiso="inventario:lote:escribir">
            <Boton icono="mas">Crear lote</Boton>
          </SiTienePermiso>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Lotes registrados" valor={numero(consulta.data?.total ?? 0)} icono="inventario" />
        <Kpi etiqueta="En bodega" valor={numero(enBodega)} icono="escudo" nota="Página actual" />
        <Kpi etiqueta="En tránsito" valor={numero(enTransito)} icono="flecha" nota="Con guía de traslado" />
        <Kpi etiqueta="Retenidos" valor={numero(retenidos)} icono="alerta" nota="Bloqueados para dispensación" />
      </div>

      <TablaConFiltros
        descripcion="Listado de lotes en inventario"
        columnas={COLUMNAS}
        claveFila={(lote) => lote.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar lote"
        marcadorBusqueda="Buscar por código de lote u organización"
        segmentos={{
          etiqueta: "Filtrar por estado",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todos" },
            { valor: "EN_BODEGA", etiqueta: "En bodega" },
            { valor: "EN_TRANSITO", etiqueta: "En tránsito" },
            { valor: "DISPENSADO", etiqueta: "Dispensado" },
            { valor: "RETENIDO", etiqueta: "Retenido" },
          ],
        }}
        selectores={[
          {
            clave: "tipo",
            etiqueta: "Tipo de lote",
            valor: tipo,
            opciones: [
              { valor: "FLOR_SECA", etiqueta: "Flor seca" },
              { valor: "BIOMASA", etiqueta: "Biomasa" },
              { valor: "EXTRACTO", etiqueta: "Extracto" },
              { valor: "ACEITE", etiqueta: "Aceite" },
              { valor: "FORMULA_MAGISTRAL", etiqueta: "Fórmula magistral" },
            ],
            onCambiar: (valor) => {
              setTipo(valor);
              setPagina(1);
            },
          },
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
        etiquetaPlural="lotes"
        vacio={
          <EstadoVacio
            icono="inventario"
            titulo="No hay lotes con esos criterios"
            texto="Ajusta los filtros o crea un lote a partir de una cosecha registrada en el módulo de producción."
          />
        }
      />
    </div>
  );
};
