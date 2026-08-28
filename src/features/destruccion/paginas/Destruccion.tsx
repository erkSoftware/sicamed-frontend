import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fechaCorta, numero } from "../../../shared/i18n/formato";
import type { ActaDestruccion, CausalDestruccion } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useDestrucciones, useLotesDestruibles, useRegistrarActa } from "../hooks/useDestrucciones";

const ETIQUETA_CAUSAL: Record<CausalDestruccion, string> = {
  PLAGA_NO_CONTROLABLE: "Plaga no controlable",
  FUERA_DE_ESPECIFICACION: "Fuera de especificación",
  VENCIMIENTO: "Vencimiento",
  ORDEN_AUTORIDAD: "Orden de autoridad",
  EXCEDENTE_DE_CUPO: "Excedente de cupo",
};

const TONO_CAUSAL: Record<CausalDestruccion, "neutro" | "alerta" | "peligro" | "info"> = {
  PLAGA_NO_CONTROLABLE: "alerta",
  FUERA_DE_ESPECIFICACION: "alerta",
  VENCIMIENTO: "neutro",
  ORDEN_AUTORIDAD: "peligro",
  EXCEDENTE_DE_CUPO: "info",
};

const COLUMNAS: readonly Columna<ActaDestruccion>[] = [
  {
    clave: "acta",
    encabezado: "Acta",
    render: (acta) => (
      <span>
        <strong className="mono">{acta.acta}</strong>
        <br />
        <span className="enlace-fila__meta">{fechaCorta(acta.fecha)}</span>
      </span>
    ),
  },
  {
    clave: "referencia",
    encabezado: "Material destruido",
    render: (acta) => (
      <span>
        <span className="mono">{acta.referencia}</span>
        <br />
        <span className="enlace-fila__meta">
          {acta.entidad === "PLANTA" ? "Planta individual" : "Lote de inventario"} ·{" "}
          {acta.organizacion}
        </span>
      </span>
    ),
  },
  {
    clave: "cantidad",
    encabezado: "Cantidad",
    numerica: true,
    render: (acta) => (
      <span className="mono">
        {numero(acta.cantidad)} {acta.unidad}
      </span>
    ),
  },
  {
    clave: "causal",
    encabezado: "Causal",
    render: (acta) => <Insignia tono={TONO_CAUSAL[acta.causal]}>{ETIQUETA_CAUSAL[acta.causal]}</Insignia>,
  },
  { clave: "metodo", encabezado: "Método", render: (acta) => acta.metodo },
  {
    clave: "testigo",
    encabezado: "Testigo",
    render: (acta) => (
      <span>
        <strong>{acta.testigo}</strong>
        <br />
        <span className="enlace-fila__meta">{acta.cargoTestigo}</span>
      </span>
    ),
  },
  {
    clave: "huella",
    encabezado: "Huella",
    render: (acta) => <span className="mono">{acta.huella}</span>,
  },
];

type Formulario = {
  entidadId: string;
  cantidad: string;
  causal: CausalDestruccion;
  metodo: string;
  testigo: string;
  cargoTestigo: string;
};

const INICIAL: Formulario = {
  entidadId: "",
  cantidad: "",
  causal: "VENCIMIENTO",
  metodo: "",
  testigo: "",
  cargoTestigo: "",
};

type Errores = Partial<Record<keyof Formulario, string>>;

export const Destruccion = () => {
  const [busqueda, setBusqueda] = useState("");
  const [entidad, setEntidad] = useState("");
  const [causal, setCausal] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});

  const consulta = useDestrucciones({
    busqueda,
    estado: entidad,
    tipo: causal,
    departamento,
    pagina,
    porPagina: 10,
  });
  const lotes = useLotesDestruibles();
  const registrar = useRegistrarActa();
  const autor = useAutor();

  const visibles = consulta.data?.datos ?? [];
  const plantas = visibles.filter((acta) => acta.entidad === "PLANTA").length;
  const porAutoridad = visibles.filter((acta) => acta.causal === "ORDEN_AUTORIDAD").length;

  const cerrar = () => {
    setAbierto(false);
    setValores(INICIAL);
    setErrores({});
    registrar.reset();
  };

  const enviar = () => {
    const encontrados: Errores = {};
    if (!valores.entidadId) encontrados.entidadId = "Selecciona el lote a destruir.";
    if (!(Number(valores.cantidad) > 0)) encontrados.cantidad = "Declara la cantidad destruida.";
    if (valores.metodo.trim().length < 10) encontrados.metodo = "Describe el método de destrucción.";
    if (valores.testigo.trim().length < 4)
      encontrados.testigo = "El acta exige un testigo identificado.";
    if (valores.cargoTestigo.trim().length < 4)
      encontrados.cargoTestigo = "Indica el cargo o entidad del testigo.";
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    registrar.mutate(
      {
        entidad: "LOTE",
        entidadId: valores.entidadId,
        cantidad: Number(valores.cantidad),
        causal: valores.causal,
        metodo: valores.metodo,
        testigo: valores.testigo,
        cargoTestigo: valores.cargoTestigo,
        autor,
      },
      { onSuccess: cerrar },
    );
  };

  const actualizar = (campo: keyof Formulario) => (valor: string) =>
    setValores((previos) => ({ ...previos, [campo]: valor }));

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Destrucción y disposición final"
        subtitulo="Todo material vegetal que sale del ciclo productivo lo hace con un acta: causal, método, testigo identificado y huella. La destrucción es un estado terminal, no se revierte."
        acciones={
          <SiTienePermiso permiso="produccion:destruccion:escribir">
            <Boton variante="peligro" icono="alerta" onClick={() => setAbierto(true)}>
              Levantar acta
            </Boton>
          </SiTienePermiso>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Actas levantadas" valor={numero(consulta.data?.total ?? 0)} icono="documento" />
        <Kpi etiqueta="Sobre plantas" valor={numero(plantas)} icono="hoja" nota="Individuales, en esta página" />
        <Kpi
          etiqueta="Sobre lotes"
          valor={numero(visibles.length - plantas)}
          icono="inventario"
          nota="Producto e inventario"
        />
        <Kpi
          etiqueta="Por orden de autoridad"
          valor={numero(porAutoridad)}
          icono="escudo"
          nota="Requieren delegado presente"
        />
      </div>

      <div className="aviso aviso--alerta">
        <Icono nombre="candado" tamano={18} />
        <p>
          Un acta sin testigo identificado no tiene valor probatorio frente a la autoridad: el
          servidor la rechaza. Una vez levantada, el material no admite movimientos posteriores y el
          cupo de plantas se recalcula.
        </p>
      </div>

      <TablaConFiltros
        descripcion="Actas de destrucción y disposición final"
        columnas={COLUMNAS}
        claveFila={(acta) => acta.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar acta"
        marcadorBusqueda="Buscar por acta, referencia u organización"
        segmentos={{
          etiqueta: "Filtrar por material",
          valor: entidad,
          onCambiar: (valor) => {
            setEntidad(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todo" },
            { valor: "PLANTA", etiqueta: "Plantas" },
            { valor: "LOTE", etiqueta: "Lotes" },
          ],
        }}
        selectores={[
          {
            clave: "causal",
            etiqueta: "Causal",
            valor: causal,
            opciones: Object.entries(ETIQUETA_CAUSAL).map(([valor, etiqueta]) => ({
              valor,
              etiqueta,
            })),
            onCambiar: (valor) => {
              setCausal(valor);
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
        etiquetaPlural="actas"
        vacio={
          <EstadoVacio
            icono="documento"
            titulo="No hay actas con esos criterios"
            texto="Las actas de destrucción documentan la disposición final de plantas y lotes."
          />
        }
      />

      <DialogoFormulario
        abierto={abierto}
        titulo="Acta de destrucción de lote"
        descripcion="Para destruir una planta individual, ábrela desde el listado de plantas. Aquí se documenta la disposición final de un lote de inventario."
        etiquetaEnviar="Levantar acta y destruir"
        cargando={registrar.isPending}
        error={registrar.error}
        ancho
        onCerrar={cerrar}
        onEnviar={enviar}
        onLimpiarError={() => registrar.reset()}
      >
        <CampoSelect
          etiqueta="Lote a destruir"
          requerido
          vacio="Selecciona el lote"
          value={valores.entidadId}
          error={errores.entidadId}
          opciones={(lotes.data?.datos ?? [])
            .filter((lote) => lote.estado !== "DESTRUIDO")
            .map((lote) => ({
              valor: lote.id,
              etiqueta: `${lote.codigo} · ${lote.cantidad} ${lote.unidad} · ${lote.bodega}`,
            }))}
          onChange={(evento) => actualizar("entidadId")(evento.target.value)}
        />
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Cantidad destruida"
            requerido
            type="number"
            step="0.1"
            min="0"
            value={valores.cantidad}
            error={errores.cantidad}
            onChange={(evento) => actualizar("cantidad")(evento.target.value)}
          />
          <CampoSelect
            etiqueta="Causal"
            requerido
            value={valores.causal}
            opciones={Object.entries(ETIQUETA_CAUSAL).map(([valor, etiqueta]) => ({
              valor,
              etiqueta,
            }))}
            onChange={(evento) =>
              setValores((previos) => ({
                ...previos,
                causal: evento.target.value as CausalDestruccion,
              }))
            }
          />
        </div>
        <CampoTexto
          etiqueta="Método de destrucción"
          requerido
          value={valores.metodo}
          error={errores.metodo}
          ayuda="Por ejemplo: incineración en horno autorizado con registro de temperatura."
          onChange={(evento) => actualizar("metodo")(evento.target.value)}
        />
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Testigo"
            requerido
            value={valores.testigo}
            error={errores.testigo}
            onChange={(evento) => actualizar("testigo")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Cargo o entidad del testigo"
            requerido
            value={valores.cargoTestigo}
            error={errores.cargoTestigo}
            ayuda="Delegado del FNE, inspector del ICA, auditor de calidad…"
            onChange={(evento) => actualizar("cargoTestigo")(evento.target.value)}
          />
        </div>
      </DialogoFormulario>
    </div>
  );
};
