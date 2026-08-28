import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { diasHasta, fechaCorta, numero } from "../../../shared/i18n/formato";
import type { Atestacion } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import {
  useAtestaciones,
  useExpedientesAprobados,
  useRegistrarAtestacion,
} from "../hooks/useAtestaciones";

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
  { clave: "expedicion", encabezado: "Expedición", render: (a) => <span className="dato">{fechaCorta(a.expedicion)}</span> },
  {
    clave: "vencimiento",
    encabezado: "Vencimiento",
    render: (a) => {
      const dias = diasHasta(a.vencimiento);
      return (
        <span>
          <span className="dato">{fechaCorta(a.vencimiento)}</span>
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

type Formulario = {
  expedienteId: string;
  tipo: string;
  acto: string;
  autoridad: string;
  expedicion: string;
  vencimiento: string;
  evidencia: string;
};

const INICIAL: Formulario = {
  expedienteId: "",
  tipo: "",
  acto: "",
  autoridad: "",
  expedicion: "",
  vencimiento: "",
  evidencia: "",
};

export const Licencias = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Partial<Record<keyof Formulario, string>>>({});

  const consulta = useAtestaciones({ busqueda, estado, tipo, pagina, porPagina: 10 });
  const expedientes = useExpedientesAprobados();
  const registrar = useRegistrarAtestacion();
  const autor = useAutor();

  const cerrar = () => {
    setDialogoAbierto(false);
    setValores(INICIAL);
    setErrores({});
    registrar.reset();
  };

  const actualizar = (campo: keyof Formulario) => (valor: string) =>
    setValores((previos) => ({ ...previos, [campo]: valor }));

  const enviar = () => {
    const encontrados: Partial<Record<keyof Formulario, string>> = {};
    if (!valores.tipo) encontrados.tipo = "Selecciona el tipo de licencia.";
    if (valores.acto.trim().length < 8) encontrados.acto = "Indica el acto administrativo.";
    if (valores.autoridad.trim().length < 3)
      encontrados.autoridad = "Indica la autoridad que lo expide.";
    if (!valores.expedicion) encontrados.expedicion = "Indica la fecha de expedición.";
    if (!valores.vencimiento) encontrados.vencimiento = "Indica la fecha de vencimiento.";
    if (valores.evidencia.trim().length < 5)
      encontrados.evidencia = "Adjunta el archivo del acto administrativo.";
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    registrar.mutate(
      {
        organizacionId: autor.organizacionId,
        tipo: valores.tipo as Atestacion["tipo"],
        acto: valores.acto,
        autoridad: valores.autoridad,
        expedicion: new Date(valores.expedicion).toISOString(),
        vencimiento: new Date(valores.vencimiento).toISOString(),
        evidencia: valores.evidencia,
        expedienteId: valores.expedienteId || null,
        autor,
      },
      { onSuccess: cerrar },
    );
  };

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

      <DialogoFormulario
        abierto={dialogoAbierto}
        titulo="Registrar atestación de licencia"
        descripcion="Una atestación no nace de un formulario: nace de una fuente autoritativa o de un expediente cuya evidencia documental ya fue verificada. SICAMED no expide la licencia, atestigua que existe."
        etiquetaEnviar="Registrar atestación"
        cargando={registrar.isPending}
        error={registrar.error}
        ancho
        onCerrar={cerrar}
        onEnviar={enviar}
        onLimpiarError={() => registrar.reset()}
      >
        <CampoSelect
          etiqueta="Origen probatorio"
          vacio="Sincronización con fuente autoritativa"
          value={valores.expedienteId}
          ayuda="Si eliges un expediente, su evidencia debe estar verificada; la atestación quedará marcada como DOCUMENTAL_VERIFICADA."
          opciones={(expedientes.data?.datos ?? []).map((expediente) => ({
            valor: expediente.id,
            etiqueta: `${expediente.radicado} · ${expediente.organizacion}`,
          }))}
          onChange={(evento) => actualizar("expedienteId")(evento.target.value)}
        />
        <CampoSelect
          etiqueta="Tipo de licencia"
          requerido
          vacio="Selecciona un tipo"
          value={valores.tipo}
          error={errores.tipo}
          opciones={TIPOS}
          onChange={(evento) => actualizar("tipo")(evento.target.value)}
        />
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Acto administrativo"
            requerido
            placeholder="Resolución 1234 de 2026"
            value={valores.acto}
            error={errores.acto}
            onChange={(evento) => actualizar("acto")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Autoridad que expide"
            requerido
            placeholder="INVIMA"
            value={valores.autoridad}
            error={errores.autoridad}
            onChange={(evento) => actualizar("autoridad")(evento.target.value)}
          />
        </div>
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Fecha de expedición"
            type="date"
            requerido
            value={valores.expedicion}
            error={errores.expedicion}
            onChange={(evento) => actualizar("expedicion")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Fecha de vencimiento"
            type="date"
            requerido
            value={valores.vencimiento}
            error={errores.vencimiento}
            onChange={(evento) => actualizar("vencimiento")(evento.target.value)}
          />
        </div>
        <CampoTexto
          etiqueta="Evidencia documental"
          requerido
          value={valores.evidencia}
          error={errores.evidencia}
          placeholder="resolucion-1234-2026.pdf"
          ayuda="Nombre del archivo del acto administrativo. Su huella queda sellada en la cadena de trazabilidad."
          onChange={(evento) => actualizar("evidencia")(evento.target.value)}
        />
      </DialogoFormulario>
    </div>
  );
};
