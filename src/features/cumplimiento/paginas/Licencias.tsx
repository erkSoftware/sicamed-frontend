import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Dialogo } from "../../../shared/ui/primitivos/Dialogo";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { diasHasta, fecha, numero } from "../../../shared/i18n/formato";
import type { Atestacion } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useAtestaciones } from "../hooks/useAtestaciones";

const TONO = {
  VIGENTE: "exito",
  POR_VENCER: "alerta",
  VENCIDA: "peligro",
  EN_TRAMITE: "info",
  RECHAZADA: "peligro",
} as const;

const TIPOS = [
  { valor: "CULTIVO_NO_PSICOACTIVO", etiqueta: "Cultivo no psicoactivo" },
  { valor: "CULTIVO_PSICOACTIVO", etiqueta: "Cultivo psicoactivo" },
  { valor: "FABRICACION_DERIVADOS", etiqueta: "Fabricación de derivados" },
  { valor: "DISPENSACION", etiqueta: "Dispensación" },
  { valor: "EXPORTACION", etiqueta: "Exportación" },
];

const COLUMNAS: readonly Columna<Atestacion>[] = [
  { clave: "organizacion", encabezado: "Organización", render: (a) => a.organizacion },
  { clave: "tipo", encabezado: "Tipo", render: (a) => a.tipo.replaceAll("_", " ") },
  { clave: "acto", encabezado: "Acto administrativo", render: (a) => a.acto },
  { clave: "autoridad", encabezado: "Autoridad", render: (a) => a.autoridad },
  { clave: "expedicion", encabezado: "Expedición", render: (a) => fecha(a.expedicion) },
  {
    clave: "vencimiento",
    encabezado: "Vencimiento",
    render: (a) => {
      const dias = diasHasta(a.vencimiento);
      return (
        <span>
          {fecha(a.vencimiento)}
          <br />
          <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
            {dias < 0 ? `vencida hace ${Math.abs(dias)} días` : `en ${dias} días`}
          </span>
        </span>
      );
    },
  },
  {
    clave: "estado",
    encabezado: "Estado",
    render: (a) => <Insignia tono={TONO[a.estado]}>{a.estado.replace("_", " ")}</Insignia>,
  },
  {
    clave: "evidencia",
    encabezado: "Evidencia",
    render: (a) => <span className="mono" style={{ fontSize: "var(--texto-xs)" }}>{a.evidencia}</span>,
  },
];

export const Licencias = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const consulta = useAtestaciones({ busqueda, estado, tipo, pagina, porPagina: 10 });

  const todas = consulta.data?.datos ?? [];
  const porVencer = todas.filter((a) => a.estado === "POR_VENCER").length;
  const vencidas = todas.filter((a) => a.estado === "VENCIDA").length;
  const vigentes = todas.filter((a) => a.estado === "VIGENTE").length;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Licencias y atestaciones"
        subtitulo="Una atestación es el registro documental de una licencia expedida por la autoridad competente. Sin atestación vigente, el sistema rechaza la publicación de ofertas del tipo de producto correspondiente."
        acciones={
          <SiTienePermiso permiso="cumplimiento:atestacion:escribir">
            <Boton icono="mas" onClick={() => setDialogoAbierto(true)}>
              Registrar atestación
            </Boton>
          </SiTienePermiso>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Vigentes en esta página" valor={numero(vigentes)} icono="escudo" nota="Habilitan publicación" />
        <Kpi etiqueta="Por vencer" valor={numero(porVencer)} icono="reloj" nota="Menos de 45 días" />
        <Kpi etiqueta="Vencidas" valor={numero(vencidas)} icono="alerta" nota="Bloquean la publicación" />
        <Kpi etiqueta="Total registradas" valor={numero(consulta.data?.total ?? 0)} icono="licencias" />
      </div>

      <TablaConFiltros
        descripcion="Listado de atestaciones de licencia"
        columnas={COLUMNAS}
        claveFila={(a) => a.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar atestación"
        marcadorBusqueda="Buscar por organización o acto administrativo"
        segmentos={{
          etiqueta: "Filtrar por estado",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todas" },
            { valor: "VIGENTE", etiqueta: "Vigentes" },
            { valor: "POR_VENCER", etiqueta: "Por vencer" },
            { valor: "VENCIDA", etiqueta: "Vencidas" },
            { valor: "EN_TRAMITE", etiqueta: "En trámite" },
          ],
        }}
        selectores={[
          {
            clave: "tipo",
            etiqueta: "Tipo de licencia",
            valor: tipo,
            opciones: TIPOS,
            onCambiar: (valor) => {
              setTipo(valor);
              setPagina(1);
            },
          },
        ]}
        onPagina={setPagina}
        etiquetaPlural="atestaciones"
        vacio={
          <EstadoVacio
            icono="licencias"
            titulo="No hay atestaciones con esos criterios"
            texto="Ajusta los filtros o registra una nueva atestación adjuntando el acto administrativo que la sustenta."
          />
        }
      />

      <Dialogo
        abierto={dialogoAbierto}
        titulo="Registrar atestación de licencia"
        onCerrar={() => setDialogoAbierto(false)}
        pie={
          <>
            <Boton variante="secundario" onClick={() => setDialogoAbierto(false)}>
              Cancelar
            </Boton>
            <Boton onClick={() => setDialogoAbierto(false)}>Registrar</Boton>
          </>
        }
      >
        <form className="pila" style={{ gap: "var(--e4)" }}>
          <CampoSelect etiqueta="Tipo de licencia" requerido vacio="Selecciona un tipo" opciones={TIPOS} />
          <CampoTexto etiqueta="Acto administrativo" requerido placeholder="Resolución 1234 de 2026" />
          <CampoTexto etiqueta="Autoridad que expide" requerido placeholder="INVIMA" />
          <div className="rejilla rejilla--2">
            <CampoTexto etiqueta="Fecha de expedición" type="date" requerido />
            <CampoTexto etiqueta="Fecha de vencimiento" type="date" requerido />
          </div>
          <CampoTexto
            etiqueta="Evidencia documental"
            type="file"
            requerido
            ayuda="PDF del acto administrativo. Queda sellado en la cadena de trazabilidad."
          />
        </form>
      </Dialogo>
    </div>
  );
};
