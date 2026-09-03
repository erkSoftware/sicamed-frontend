import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { fechaHora, numero } from "../../../shared/i18n/formato";
import type { EventoTrazabilidad } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useEventos } from "../hooks/useEventos";

const TIPOS = [
  { valor: "ORGANIZACION_REGISTRADA", etiqueta: "Organización registrada" },
  { valor: "EXPEDIENTE_ABIERTO", etiqueta: "Expediente abierto" },
  { valor: "ATESTACION_REGISTRADA", etiqueta: "Atestación registrada" },
  { valor: "PUBLICACION_RECHAZADA", etiqueta: "Publicación rechazada" },
  { valor: "OFERTA_PUBLICADA", etiqueta: "Oferta publicada" },
  { valor: "LOTE_CREADO", etiqueta: "Lote creado" },
  { valor: "LOTE_TRASLADADO", etiqueta: "Lote trasladado" },
  { valor: "INTERES_MANIFESTADO", etiqueta: "Interés manifestado" },
  { valor: "CONTACTO_HABILITADO", etiqueta: "Contacto habilitado" },
  { valor: "CREDENCIAL_VERIFICADA", etiqueta: "Credencial verificada" },
  { valor: "DISPENSACION_REGISTRADA", etiqueta: "Dispensación registrada" },
  { valor: "RECOMPRA_BLOQUEADA", etiqueta: "Recompra bloqueada" },
  { valor: "VERIFICACION_FALLIDA", etiqueta: "Verificación fallida" },
];

const EVENTOS_DE_RECHAZO = new Set([
  "PUBLICACION_RECHAZADA",
  "RECOMPRA_BLOQUEADA",
  "VERIFICACION_FALLIDA",
]);

const COLUMNAS: readonly Columna<EventoTrazabilidad>[] = [
  {
    clave: "secuencia",
    encabezado: "#",
    numerica: true,
    render: (evento) => <span className="mono">{numero(evento.secuencia)}</span>,
  },
  {
    clave: "evento",
    encabezado: "Hecho registrado",
    render: (evento) => (
      <span>
        <strong>{evento.descripcion}</strong>
        <br />
        <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
          {evento.entidad} · {evento.entidadId}
        </span>
      </span>
    ),
  },
  {
    clave: "tipo",
    encabezado: "Tipo",
    render: (evento) => (
      <Insignia tono={EVENTOS_DE_RECHAZO.has(evento.tipo) ? "peligro" : "neutro"}>
        {evento.tipo.replaceAll("_", " ")}
      </Insignia>
    ),
  },
  { clave: "actor", encabezado: "Actor", render: (evento) => evento.actor },
  { clave: "fecha", encabezado: "Fecha", render: (evento) => <span className="dato">{fechaHora(evento.fecha)}</span> },
  {
    clave: "huella",
    encabezado: "Sello",
    render: (evento) => (
      <span className="mono" style={{ fontSize: "var(--texto-xs)" }}>
        {evento.huella}
        <br />
        <span style={{ color: "var(--texto-tenue)" }}>← {evento.huellaPrevia}</span>
      </span>
    ),
  },
];

export const Trazabilidad = () => {
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(1);
  const consulta = useEventos({ busqueda, tipo, pagina, porPagina: 12 });

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Trazabilidad"
        subtitulo="Cadena de eventos sellados. Cada registro encadena su huella con la del anterior: reescribir un hecho pasado rompería toda la cadena posterior."
        acciones={<Boton variante="secundario" icono="descargar">Exportar evidencia</Boton>}
      />

      <Tarjeta>
        <div className="fila" style={{ gap: "var(--e4)", flexWrap: "wrap" }}>
          <span className="fila" style={{ gap: "var(--e2)", color: "var(--verde-700)" }}>
            <Icono nombre="cadena" tamano={18} />
            <strong>Cadena íntegra</strong>
          </span>
          <span style={{ color: "var(--texto-tenue)" }}>
            {numero(consulta.data?.total ?? 0)} eventos consultables · verificación de huellas
            encadenadas al día de hoy sin discontinuidades
          </span>
        </div>
      </Tarjeta>

      <TablaConFiltros
        descripcion="Ledger de eventos de trazabilidad"
        columnas={COLUMNAS}
        claveFila={(evento) => evento.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar evento"
        marcadorBusqueda="Buscar por hecho, actor o sello"
        selectores={[
          {
            clave: "tipo",
            etiqueta: "Tipo de evento",
            valor: tipo,
            opciones: TIPOS,
            onCambiar: (valor) => {
              setTipo(valor);
              setPagina(1);
            },
          },
        ]}
        onPagina={setPagina}
        etiquetaPlural="eventos"
        vacio={
          <EstadoVacio
            icono="trazabilidad"
            titulo="No hay eventos con esos criterios"
            texto="El ledger es de solo escritura por el sistema. Ajusta los filtros para encontrar el hecho que buscas."
          />
        }
      />
    </div>
  );
};
