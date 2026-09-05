import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useFormularioDeAurora } from "../../../shared/ui/aurora/pantalla/useFormularioDeAurora";
import { usePermiso } from "../../../shared/rbac/usePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fechaCorta, numero } from "../../../shared/i18n/formato";
import type { EstadoLote, Lote, TipoLote } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import {
  useCultivosDelActor,
  useLotes,
  useMoverLote,
  useRegistrarLote,
} from "../hooks/useLotes";

const TONO_ESTADO = {
  EN_BODEGA: "exito",
  EN_TRANSITO: "info",
  DISPENSADO: "neutro",
  RETENIDO: "peligro",
  DESTRUIDO: "peligro",
} as const;

const TIPOS_DE_LOTE = [
  { valor: "FLOR_SECA", etiqueta: "Flor seca" },
  { valor: "BIOMASA", etiqueta: "Biomasa" },
  { valor: "EXTRACTO", etiqueta: "Extracto" },
  { valor: "ACEITE", etiqueta: "Aceite" },
  { valor: "FORMULA_MAGISTRAL", etiqueta: "Fórmula magistral" },
];

const UNIDAD_POR_TIPO: Record<TipoLote, string> = {
  FLOR_SECA: "kg",
  BIOMASA: "kg",
  EXTRACTO: "L",
  ACEITE: "L",
  FORMULA_MAGISTRAL: "unidades",
};

type FormLote = {
  cultivoId: string;
  tipo: TipoLote;
  cantidad: string;
  thc: string;
  cbd: string;
  bodega: string;
  departamento: string;
  vencimiento: string;
};

const LOTE_INICIAL: FormLote = {
  cultivoId: "",
  tipo: "FLOR_SECA",
  cantidad: "",
  thc: "",
  cbd: "",
  bodega: "",
  departamento: "",
  vencimiento: "",
};

type FormMovimiento = { estado: EstadoLote; bodega: string; motivo: string };

export const Inventario = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const [creando, setCreando] = useState(false);
  const [moviendo, setMoviendo] = useState<Lote | null>(null);
  const [valores, setValores] = useState<FormLote>(LOTE_INICIAL);
  const [errores, setErrores] = useState<Partial<Record<keyof FormLote, string>>>({});
  const [movimiento, setMovimiento] = useState<FormMovimiento>({
    estado: "EN_TRANSITO",
    bodega: "",
    motivo: "",
  });
  const [erroresMovimiento, setErroresMovimiento] = useState<
    Partial<Record<keyof FormMovimiento, string>>
  >({});

  const [parametros, fijarParametros] = useSearchParams();

  const consulta = useLotes({ busqueda, estado, tipo, departamento, pagina, porPagina: 10 });
  const cultivos = useCultivosDelActor();
  const registrar = useRegistrarLote();
  const mover = useMoverLote();
  const autor = useAutor();
  const puedeEscribir = usePermiso("inventario:lote:escribir");

  useEffect(() => {
    if (parametros.get("crear") !== "lote" || !puedeEscribir) return;
    setCreando(true);
    const siguientes = new URLSearchParams(parametros);
    siguientes.delete("crear");
    fijarParametros(siguientes, { replace: true });
  }, [parametros, puedeEscribir, fijarParametros]);

  const visibles = consulta.data?.datos ?? [];
  const enBodega = visibles.filter((lote) => lote.estado === "EN_BODEGA").length;
  const retenidos = visibles.filter((lote) => lote.estado === "RETENIDO").length;
  const enTransito = visibles.filter((lote) => lote.estado === "EN_TRANSITO").length;

  const cerrarCreacion = () => {
    setCreando(false);
    setValores(LOTE_INICIAL);
    setErrores({});
    registrar.reset();
  };

  const cerrarMovimiento = () => {
    setMoviendo(null);
    setMovimiento({ estado: "EN_TRANSITO", bodega: "", motivo: "" });
    setErroresMovimiento({});
    mover.reset();
  };

  const enviarLote = () => {
    const encontrados: Partial<Record<keyof FormLote, string>> = {};
    if (!valores.cultivoId) encontrados.cultivoId = "Selecciona el predio de origen.";
    if (!(Number(valores.cantidad) > 0)) encontrados.cantidad = "La cantidad debe ser mayor que cero.";
    if (valores.bodega.trim().length < 4) encontrados.bodega = "Indica la bodega de almacenamiento.";
    if (!valores.departamento) encontrados.departamento = "Selecciona el departamento.";
    if (!valores.vencimiento) encontrados.vencimiento = "Indica la fecha de vencimiento.";
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    registrar.mutate(
      {
        organizacionId: autor.organizacionId,
        cultivoId: valores.cultivoId,
        tipo: valores.tipo,
        cantidad: Number(valores.cantidad),
        unidad: UNIDAD_POR_TIPO[valores.tipo],
        thc: Number(valores.thc || 0),
        cbd: Number(valores.cbd || 0),
        bodega: valores.bodega,
        departamento: valores.departamento,
        vencimiento: new Date(valores.vencimiento).toISOString(),
        autor,
      },
      { onSuccess: cerrarCreacion },
    );
  };

  const enviarMovimiento = () => {
    if (!moviendo) return;
    const encontrados: Partial<Record<keyof FormMovimiento, string>> = {};
    if (movimiento.bodega.trim().length < 4)
      encontrados.bodega = "Indica la bodega o el destino del lote.";
    if (movimiento.motivo.trim().length < 8) encontrados.motivo = "Declara el motivo del movimiento.";
    setErroresMovimiento(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    mover.mutate(
      {
        id: moviendo.id,
        estado: movimiento.estado,
        bodega: movimiento.bodega,
        motivo: movimiento.motivo,
        autor,
      },
      { onSuccess: cerrarMovimiento },
    );
  };

  const fijarValor = (clave: keyof FormLote) => (valor: string) =>
    setValores((previos) => ({ ...previos, [clave]: valor }));

  useFormularioDeAurora({
    pantalla: "Inventario",
    etiqueta: "Crear lote",
    objetivo: "lote",
    abierto: creando,
    permiso: "inventario:lote:escribir",
    abrir: () => setCreando(true),
    cerrar: cerrarCreacion,
    enviar: enviarLote,
    campos: [
      {
        clave: "cultivoId",
        etiqueta: "Predio de origen",
        sinonimos: ["predio", "cultivo", "origen"],
        valor: valores.cultivoId,
        error: errores.cultivoId,
        opciones: (cultivos.data?.datos ?? []).map((cultivo) => ({
          valor: cultivo.id,
          etiqueta: `${cultivo.nombre} · ${cultivo.variedad}`,
        })),
        fijar: fijarValor("cultivoId"),
      },
      { clave: "tipo", etiqueta: "Tipo de lote", valor: valores.tipo, opciones: TIPOS_DE_LOTE, fijar: fijarValor("tipo") },
      { clave: "cantidad", etiqueta: "Cantidad", valor: valores.cantidad, error: errores.cantidad, fijar: fijarValor("cantidad") },
      { clave: "thc", etiqueta: "THC", valor: valores.thc, fijar: fijarValor("thc") },
      { clave: "cbd", etiqueta: "CBD", valor: valores.cbd, fijar: fijarValor("cbd") },
      { clave: "bodega", etiqueta: "Bodega", valor: valores.bodega, error: errores.bodega, fijar: fijarValor("bodega") },
      {
        clave: "departamento",
        etiqueta: "Departamento",
        valor: valores.departamento,
        error: errores.departamento,
        opciones: DEPARTAMENTOS.map((d) => ({ valor: d.nombre, etiqueta: d.nombre })),
        fijar: fijarValor("departamento"),
      },
      {
        clave: "vencimiento",
        etiqueta: "Vencimiento",
        valor: valores.vencimiento,
        error: errores.vencimiento,
        fijar: fijarValor("vencimiento"),
      },
    ],
  });

  const columnas: readonly Columna<Lote>[] = [
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
    { clave: "fecha", encabezado: "Creado", render: (lote) => <span className="dato">{fechaCorta(lote.fecha)}</span> },
    { clave: "vencimiento", encabezado: "Vence", render: (lote) => <span className="dato">{fechaCorta(lote.vencimiento)}</span> },
    ...(puedeEscribir
      ? [
          {
            clave: "acciones",
            encabezado: "Custodia",
            render: (lote: Lote) =>
              lote.estado === "DESTRUIDO" ? (
                <span className="enlace-fila__meta">Disposición final</span>
              ) : (
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  icono="flecha"
                  onClick={() => {
                    setMoviendo(lote);
                    setMovimiento({ estado: "EN_TRANSITO", bodega: lote.bodega, motivo: "" });
                  }}
                >
                  Mover
                </Boton>
              ),
          } satisfies Columna<Lote>,
        ]
      : []),
  ];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Inventario"
        subtitulo="Lotes de producto con su cadena de custodia. Todo traslado entre bodegas genera un evento verificable en el ledger de trazabilidad."
        acciones={
          <SiTienePermiso permiso="inventario:lote:escribir">
            <Boton icono="mas" onClick={() => setCreando(true)}>
              Crear lote
            </Boton>
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
        columnas={columnas}
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
            opciones: TIPOS_DE_LOTE,
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
        aurora={{
          pantalla: "Inventario",
          etiquetaFila: (lote) => lote.codigo,
        }}
        vacio={
          <EstadoVacio
            icono="inventario"
            titulo="No hay lotes con esos criterios"
            texto="Ajusta los filtros o crea un lote a partir de una cosecha registrada en el módulo de producción."
          />
        }
      />

      <DialogoFormulario
        abierto={creando}
        titulo="Crear lote"
        descripcion="El lote hereda la cadena de origen del predio del que proviene. Su creación queda sellada en el ledger."
        etiquetaEnviar="Crear lote"
        cargando={registrar.isPending}
        error={registrar.error}
        ancho
        onCerrar={cerrarCreacion}
        onEnviar={enviarLote}
        onLimpiarError={() => registrar.reset()}
      >
        <CampoSelect
          etiqueta="Predio de origen"
          data-campo="cultivoId"
          requerido
          vacio="Selecciona el predio"
          value={valores.cultivoId}
          error={errores.cultivoId}
          opciones={(cultivos.data?.datos ?? []).map((cultivo) => ({
            valor: cultivo.id,
            etiqueta: `${cultivo.nombre} · ${cultivo.variedad}`,
          }))}
          onChange={(evento) =>
            setValores((previos) => ({ ...previos, cultivoId: evento.target.value }))
          }
        />
        <div className="rejilla rejilla--2">
          <CampoSelect
            etiqueta="Tipo de lote"
          data-campo="tipo"
            requerido
            value={valores.tipo}
            ayuda={`Unidad: ${UNIDAD_POR_TIPO[valores.tipo]}`}
            opciones={TIPOS_DE_LOTE}
            onChange={(evento) =>
              setValores((previos) => ({ ...previos, tipo: evento.target.value as TipoLote }))
            }
          />
          <CampoTexto
            etiqueta={`Cantidad (${UNIDAD_POR_TIPO[valores.tipo]})`}
          data-campo="cantidad"
            requerido
            type="number"
            step="0.1"
            min="0"
            value={valores.cantidad}
            error={errores.cantidad}
            onChange={(evento) =>
              setValores((previos) => ({ ...previos, cantidad: evento.target.value }))
            }
          />
        </div>
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="THC (%)"
          data-campo="thc"
            type="number"
            step="0.01"
            min="0"
            value={valores.thc}
            onChange={(evento) => setValores((previos) => ({ ...previos, thc: evento.target.value }))}
          />
          <CampoTexto
            etiqueta="CBD (%)"
          data-campo="cbd"
            type="number"
            step="0.01"
            min="0"
            value={valores.cbd}
            onChange={(evento) => setValores((previos) => ({ ...previos, cbd: evento.target.value }))}
          />
        </div>
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Bodega"
          data-campo="bodega"
            requerido
            value={valores.bodega}
            error={errores.bodega}
            onChange={(evento) =>
              setValores((previos) => ({ ...previos, bodega: evento.target.value }))
            }
          />
          <CampoSelect
            etiqueta="Departamento"
          data-campo="departamento"
            requerido
            vacio="Selecciona un departamento"
            value={valores.departamento}
            error={errores.departamento}
            opciones={DEPARTAMENTOS.map((d) => ({ valor: d.nombre, etiqueta: d.nombre }))}
            onChange={(evento) =>
              setValores((previos) => ({ ...previos, departamento: evento.target.value }))
            }
          />
        </div>
        <CampoTexto
          etiqueta="Vencimiento"
          data-campo="vencimiento"
          requerido
          type="date"
          value={valores.vencimiento}
          error={errores.vencimiento}
          onChange={(evento) =>
            setValores((previos) => ({ ...previos, vencimiento: evento.target.value }))
          }
        />
      </DialogoFormulario>

      <DialogoFormulario
        abierto={moviendo !== null}
        titulo={`Mover el lote ${moviendo?.codigo ?? ""}`}
        descripcion="Todo cambio de custodia queda como evento en el ledger con el motivo declarado. Un lote destruido no admite movimientos."
        etiquetaEnviar="Registrar movimiento"
        cargando={mover.isPending}
        error={mover.error}
        onCerrar={cerrarMovimiento}
        onEnviar={enviarMovimiento}
        onLimpiarError={() => mover.reset()}
      >
        <CampoSelect
          etiqueta="Nuevo estado"
          requerido
          value={movimiento.estado}
          opciones={[
            { valor: "EN_BODEGA", etiqueta: "En bodega" },
            { valor: "EN_TRANSITO", etiqueta: "En tránsito" },
            { valor: "DISPENSADO", etiqueta: "Dispensado" },
            { valor: "RETENIDO", etiqueta: "Retenido" },
          ]}
          onChange={(evento) =>
            setMovimiento((previo) => ({ ...previo, estado: evento.target.value as EstadoLote }))
          }
        />
        <CampoTexto
          etiqueta="Bodega o destino"
          requerido
          value={movimiento.bodega}
          error={erroresMovimiento.bodega}
          onChange={(evento) =>
            setMovimiento((previo) => ({ ...previo, bodega: evento.target.value }))
          }
        />
        <CampoTexto
          etiqueta="Motivo del movimiento"
          requerido
          value={movimiento.motivo}
          error={erroresMovimiento.motivo}
          ayuda="Queda escrito en el evento de trazabilidad."
          onChange={(evento) =>
            setMovimiento((previo) => ({ ...previo, motivo: evento.target.value }))
          }
        />
      </DialogoFormulario>
    </div>
  );
};
