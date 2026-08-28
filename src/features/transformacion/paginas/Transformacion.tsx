import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { CampoArea, CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { DEPARTAMENTOS, TIPOS_PRODUCTO } from "../../../shared/api/mock/catalogos";
import { fechaCorta, numero, porcentaje } from "../../../shared/i18n/formato";
import type { Transformacion as Registro } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import {
  useLotesDisponibles,
  useRegistrarTransformacion,
  useTransformaciones,
} from "../hooks/useTransformaciones";

const TONO_ESTADO = {
  EN_PROCESO: "info",
  LIBERADA: "exito",
  RECHAZADA: "peligro",
} as const;

const ETIQUETA_ESTADO = {
  EN_PROCESO: "En proceso",
  LIBERADA: "Liberada",
  RECHAZADA: "Rechazada",
} as const;

const COLUMNAS: readonly Columna<Registro>[] = [
  {
    clave: "codigo",
    encabezado: "Transformación",
    render: (registro) => (
      <span>
        <strong className="mono">{registro.codigo}</strong>
        <br />
        <span className="enlace-fila__meta">{fechaCorta(registro.fecha)}</span>
      </span>
    ),
  },
  {
    clave: "trazabilidad",
    encabezado: "Origen → resultado",
    render: (registro) => (
      <span>
        <span className="mono">{registro.loteOrigen}</span>
        {registro.loteResultante ? (
          <>
            {" → "}
            <span className="mono">{registro.loteResultante}</span>
          </>
        ) : (
          <span className="enlace-fila__meta"> · sin lote resultante</span>
        )}
        <br />
        <span className="enlace-fila__meta">{registro.organizacion}</span>
      </span>
    ),
  },
  {
    clave: "producto",
    encabezado: "Producto terminado",
    render: (registro) => (
      <span>
        <strong>{registro.producto}</strong>
        <br />
        <span className="enlace-fila__meta">{registro.formula}</span>
      </span>
    ),
  },
  {
    clave: "balance",
    encabezado: "Balance",
    numerica: true,
    render: (registro) => (
      <span className="mono">
        {registro.entradaKg} kg → {registro.salida} {registro.unidadSalida}
      </span>
    ),
  },
  {
    clave: "rendimiento",
    encabezado: "Rendimiento",
    numerica: true,
    render: (registro) => <span className="mono">{porcentaje(registro.rendimiento, 2)}</span>,
  },
  {
    clave: "invima",
    encabezado: "Registro sanitario",
    render: (registro) =>
      registro.registroInvima ? (
        <span className="mono">{registro.registroInvima}</span>
      ) : (
        <Insignia tono="alerta">Sin registro</Insignia>
      ),
  },
  {
    clave: "estado",
    encabezado: "Estado",
    render: (registro) => (
      <Insignia tono={TONO_ESTADO[registro.estado]}>{ETIQUETA_ESTADO[registro.estado]}</Insignia>
    ),
  },
];

type Formulario = {
  loteOrigenId: string;
  producto: string;
  formula: string;
  entradaKg: string;
  salida: string;
  unidadSalida: string;
  registroInvima: string;
  responsable: string;
};

const INICIAL: Formulario = {
  loteOrigenId: "",
  producto: "",
  formula: "",
  entradaKg: "",
  salida: "",
  unidadSalida: "L",
  registroInvima: "",
  responsable: "",
};

type Errores = Partial<Record<keyof Formulario, string>>;

export const Transformacion = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});

  const consulta = useTransformaciones({ busqueda, estado, departamento, pagina, porPagina: 10 });
  const lotes = useLotesDisponibles();
  const registrar = useRegistrarTransformacion();
  const autor = useAutor();

  const visibles = consulta.data?.datos ?? [];
  const liberadas = visibles.filter((registro) => registro.estado === "LIBERADA").length;
  const entrada = visibles.reduce((suma, registro) => suma + registro.entradaKg, 0);
  const promedio =
    visibles.length > 0
      ? visibles.reduce((suma, registro) => suma + registro.rendimiento, 0) / visibles.length
      : 0;

  const cerrar = () => {
    setAbierto(false);
    setValores(INICIAL);
    setErrores({});
    registrar.reset();
  };

  const enviar = () => {
    const encontrados: Errores = {};
    if (!valores.loteOrigenId) encontrados.loteOrigenId = "Selecciona el lote de origen.";
    if (!valores.producto) encontrados.producto = "Selecciona el producto terminado.";
    if (valores.formula.trim().length < 15)
      encontrados.formula = "Describe la fórmula o el proceso de extracción.";
    if (!(Number(valores.entradaKg) > 0)) encontrados.entradaKg = "La entrada debe ser mayor que cero.";
    if (!(Number(valores.salida) > 0)) encontrados.salida = "La salida debe ser mayor que cero.";
    if (!valores.registroInvima.trim())
      encontrados.registroInvima = "El producto terminado exige registro sanitario del INVIMA.";
    if (valores.responsable.trim().length < 4)
      encontrados.responsable = "Identifica al director técnico responsable.";
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    registrar.mutate(
      {
        loteOrigenId: valores.loteOrigenId,
        producto: valores.producto,
        formula: valores.formula,
        entradaKg: Number(valores.entradaKg),
        salida: Number(valores.salida),
        unidadSalida: valores.unidadSalida,
        registroInvima: valores.registroInvima,
        responsable: valores.responsable,
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
        titulo="Transformación"
        subtitulo="El paso de biomasa a producto terminado: la fórmula aplicada, el rendimiento de extracción y el registro sanitario que ampara el producto resultante."
        acciones={
          <SiTienePermiso permiso="produccion:transformacion:escribir">
            <Boton icono="mas" onClick={() => setAbierto(true)}>
              Registrar transformación
            </Boton>
          </SiTienePermiso>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Transformaciones" valor={numero(consulta.data?.total ?? 0)} icono="capas" />
        <Kpi etiqueta="Liberadas en esta página" valor={numero(liberadas)} icono="check" nota="Con registro INVIMA" />
        <Kpi etiqueta="Biomasa procesada" valor={`${entrada.toFixed(1)} kg`} icono="inventario" />
        <Kpi
          etiqueta="Rendimiento promedio"
          valor={porcentaje(promedio, 2)}
          icono="reportes"
          nota="Salida sobre entrada"
        />
      </div>

      <div className="aviso aviso--info">
        <Icono nombre="escudo" tamano={18} />
        <p>
          SICAMED no expide el registro sanitario: lo expide el INVIMA. Aquí se declara cuál ampara
          el producto y el servidor rechaza la liberación de un lote de producto terminado sin él.
          La entrada tampoco puede superar las existencias del lote de origen.
        </p>
      </div>

      <TablaConFiltros
        descripcion="Transformaciones a producto terminado"
        columnas={COLUMNAS}
        claveFila={(registro) => registro.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar transformación"
        marcadorBusqueda="Buscar por código, producto o lote de origen"
        segmentos={{
          etiqueta: "Filtrar por estado",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todas" },
            { valor: "LIBERADA", etiqueta: "Liberadas" },
            { valor: "EN_PROCESO", etiqueta: "En proceso" },
            { valor: "RECHAZADA", etiqueta: "Rechazadas" },
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
        etiquetaPlural="transformaciones"
        vacio={
          <EstadoVacio
            icono="capas"
            titulo="No hay transformaciones con esos criterios"
            texto="Registra la transformación de un lote de biomasa en producto terminado."
          />
        }
      />

      <DialogoFormulario
        abierto={abierto}
        titulo="Registrar transformación"
        descripcion="El servidor cierra el balance: la entrada no puede superar las existencias del lote y la liberación exige registro sanitario vigente."
        etiquetaEnviar="Registrar y liberar"
        cargando={registrar.isPending}
        error={registrar.error}
        ancho
        onCerrar={cerrar}
        onEnviar={enviar}
        onLimpiarError={() => registrar.reset()}
      >
        <CampoSelect
          etiqueta="Lote de origen"
          requerido
          vacio="Selecciona el lote de biomasa"
          value={valores.loteOrigenId}
          error={errores.loteOrigenId}
          opciones={(lotes.data?.datos ?? []).map((lote) => ({
            valor: lote.id,
            etiqueta: `${lote.codigo} · ${lote.cantidad} ${lote.unidad} · ${lote.bodega}`,
          }))}
          onChange={(evento) => actualizar("loteOrigenId")(evento.target.value)}
        />
        <CampoSelect
          etiqueta="Producto terminado"
          requerido
          vacio="Selecciona el producto"
          value={valores.producto}
          error={errores.producto}
          opciones={TIPOS_PRODUCTO.map((tipo) => ({ valor: tipo, etiqueta: tipo }))}
          onChange={(evento) => actualizar("producto")(evento.target.value)}
        />
        <CampoArea
          etiqueta="Fórmula y proceso"
          requerido
          rows={3}
          value={valores.formula}
          error={errores.formula}
          ayuda="Por ejemplo: extracción CO₂ supercrítico, winterización y estandarización a 30 mg/mL."
          onChange={(evento) => actualizar("formula")(evento.target.value)}
        />
        <div className="rejilla rejilla--3">
          <CampoTexto
            etiqueta="Entrada (kg)"
            requerido
            type="number"
            step="0.1"
            min="0"
            value={valores.entradaKg}
            error={errores.entradaKg}
            onChange={(evento) => actualizar("entradaKg")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Salida"
            requerido
            type="number"
            step="0.01"
            min="0"
            value={valores.salida}
            error={errores.salida}
            onChange={(evento) => actualizar("salida")(evento.target.value)}
          />
          <CampoSelect
            etiqueta="Unidad de salida"
            value={valores.unidadSalida}
            opciones={[
              { valor: "L", etiqueta: "Litros" },
              { valor: "kg", etiqueta: "Kilogramos" },
              { valor: "unidades", etiqueta: "Unidades" },
            ]}
            onChange={(evento) => actualizar("unidadSalida")(evento.target.value)}
          />
        </div>
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Registro sanitario INVIMA"
            requerido
            value={valores.registroInvima}
            error={errores.registroInvima}
            ayuda="El que ampara el producto terminado."
            onChange={(evento) => actualizar("registroInvima")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Director técnico responsable"
            requerido
            value={valores.responsable}
            error={errores.responsable}
            onChange={(evento) => actualizar("responsable")(evento.target.value)}
          />
        </div>
      </DialogoFormulario>
    </div>
  );
};
