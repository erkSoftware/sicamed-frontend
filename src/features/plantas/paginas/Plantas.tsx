import { useState } from "react";
import { Link } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { diasHasta, fechaCorta, numero } from "../../../shared/i18n/formato";
import type { Planta } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import {
  useAgroinsumos,
  useCultivosDisponibles,
  usePlantas,
  useRegistrarPlanta,
  useVariedades,
} from "../hooks/usePlantas";

const TONO_ESTADO = {
  PROPAGACION: "info",
  VEGETATIVO: "acento",
  FLORACION: "exito",
  COSECHADA: "neutro",
  DESTRUIDA: "peligro",
} as const;

const ETIQUETA_ESTADO = {
  PROPAGACION: "Propagación",
  VEGETATIVO: "Vegetativo",
  FLORACION: "Floración",
  COSECHADA: "Cosechada",
  DESTRUIDA: "Destruida",
} as const;

const ETIQUETA_CATEGORIA = {
  FERTILIZANTE: "Fertilizante",
  FITOSANITARIO: "Fitosanitario",
  BIOLOGICO: "Control biológico",
  SUSTRATO: "Sustrato",
} as const;

const COLUMNAS: readonly Columna<Planta>[] = [
  {
    clave: "codigo",
    encabezado: "Planta",
    render: (planta) => (
      <Link to={`/app/plantas/${planta.id}`} className="enlace-fila">
        <strong className="mono">{planta.codigo}</strong>
        <span className="enlace-fila__meta">{planta.bloque}</span>
      </Link>
    ),
  },
  {
    clave: "variedad",
    encabezado: "Variedad",
    render: (planta) => (
      <span>
        {planta.variedad}
        <br />
        <Insignia tono={planta.tipo === "PSICOACTIVO" ? "alerta" : "neutro"}>
          {planta.tipo === "PSICOACTIVO" ? "Psicoactivo" : "No psicoactivo"}
        </Insignia>
      </span>
    ),
  },
  {
    clave: "origen",
    encabezado: "Origen",
    render: (planta) =>
      planta.origen === "SEMILLA" ? (
        <span>
          <strong>Semilla</strong>
          <br />
          <span className="enlace-fila__meta">Planta madre del bloque</span>
        </span>
      ) : (
        <span>
          <strong>Clon</strong>
          <br />
          <span className="enlace-fila__meta mono">de {planta.madre}</span>
        </span>
      ),
  },
  { clave: "cultivo", encabezado: "Predio", render: (planta) => planta.cultivo },
  {
    clave: "estado",
    encabezado: "Estado",
    render: (planta) => (
      <Insignia tono={TONO_ESTADO[planta.estado]}>{ETIQUETA_ESTADO[planta.estado]}</Insignia>
    ),
  },
  {
    clave: "siembra",
    encabezado: "Siembra",
    render: (planta) => <span className="dato">{fechaCorta(planta.siembra)}</span>,
  },
  {
    clave: "carencia",
    encabezado: "Apta desde",
    render: (planta) => {
      const restantes = diasHasta(planta.aptaDesde);
      return restantes > 0 ? (
        <Insignia tono="alerta">Carencia · {restantes} d</Insignia>
      ) : (
        <span className="dato">{fechaCorta(planta.aptaDesde)}</span>
      );
    },
  },
];

type Formulario = {
  cultivoId: string;
  variedadId: string;
  origen: "SEMILLA" | "CLON";
  madre: string;
  bloque: string;
  siembra: string;
};

const INICIAL: Formulario = {
  cultivoId: "",
  variedadId: "",
  origen: "SEMILLA",
  madre: "",
  bloque: "",
  siembra: "",
};

type Errores = Partial<Record<keyof Formulario, string>>;

const validar = (valores: Formulario): Errores => {
  const errores: Errores = {};
  if (!valores.cultivoId) errores.cultivoId = "Selecciona el predio donde se siembra.";
  if (!valores.variedadId) errores.variedadId = "Selecciona la variedad registrada.";
  if (valores.origen === "CLON" && !valores.madre.trim())
    errores.madre = "Un clon debe declarar el código de su planta madre.";
  if (valores.bloque.trim().length < 3) errores.bloque = "Indica el bloque y la cama.";
  if (!valores.siembra) errores.siembra = "Indica la fecha de siembra.";
  return errores;
};

export const Plantas = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [origen, setOrigen] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});

  const consulta = usePlantas({ busqueda, estado, tipo: origen, departamento, pagina, porPagina: 10 });
  const variedades = useVariedades();
  const insumos = useAgroinsumos();
  const cultivos = useCultivosDisponibles();
  const registrar = useRegistrarPlanta();
  const autor = useAutor();

  const visibles = consulta.data?.datos ?? [];
  const madres = visibles.filter((planta) => planta.origen === "SEMILLA").length;
  const enCarencia = visibles.filter((planta) => diasHasta(planta.aptaDesde) > 0).length;
  const vivas = variedades.data?.reduce((suma, variedad) => suma + variedad.plantasVivas, 0) ?? 0;

  const cerrar = () => {
    setAbierto(false);
    setValores(INICIAL);
    setErrores({});
    registrar.reset();
  };

  const enviar = () => {
    const encontrados = validar(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    registrar.mutate(
      {
        cultivoId: valores.cultivoId,
        variedadId: valores.variedadId,
        origen: valores.origen,
        madre: valores.origen === "CLON" ? valores.madre.trim() : null,
        bloque: valores.bloque,
        siembra: new Date(valores.siembra).toISOString(),
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
        titulo="Plantas y variedades"
        subtitulo="Cada planta tiene identidad propia, una genética registrada ante el ICA y una genealogía verificable. El cupo del licenciatario se controla por número de plantas, no por un contador declarado."
        acciones={
          <SiTienePermiso permiso="produccion:planta:escribir">
            <Boton icono="mas" onClick={() => setAbierto(true)}>
              Registrar planta
            </Boton>
          </SiTienePermiso>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Plantas trazadas" valor={numero(consulta.data?.total ?? 0)} icono="hoja" />
        <Kpi etiqueta="Plantas en pie" valor={numero(vivas)} icono="produccion" nota="Excluye cosechadas y destruidas" />
        <Kpi etiqueta="Madres en esta página" valor={numero(madres)} icono="cadena" nota="Origen semilla" />
        <Kpi
          etiqueta="En periodo de carencia"
          valor={numero(enCarencia)}
          icono="reloj"
          nota="No pueden cosecharse todavía"
        />
      </div>

      <div className="rejilla rejilla--2">
        <Tarjeta
          titulo="Variedades registradas"
          descripcion="Genética declarada con su registro ICA y su perfil de cannabinoides"
          sinRelleno
          pie={<p className="pie-region mono">El perfil declarado se contrasta contra el análisis del lote</p>}
        >
          <EstadoConsulta
            cargando={variedades.isLoading}
            error={variedades.error}
            onReintentar={() => void variedades.refetch()}
          >
            <RegionDesplazable etiqueta="Variedades registradas" alto={300}>
              <ul className="ficha-lista">
                {(variedades.data ?? []).map((variedad) => (
                  <li key={variedad.id} className="ficha-lista__item">
                    <span className="ficha-lista__cuerpo">
                      <strong>{variedad.nombre}</strong>
                      <span className="ficha-lista__meta">
                        {variedad.registroIca} · {variedad.procedencia}
                      </span>
                    </span>
                    <span className="ficha-lista__cifras mono">
                      <span>THC {variedad.thc.toFixed(1)}%</span>
                      <span>CBD {variedad.cbd.toFixed(1)}%</span>
                      <span>{numero(variedad.plantasVivas)} plantas</span>
                    </span>
                    <Insignia tono={variedad.tipo === "PSICOACTIVO" ? "alerta" : "neutro"}>
                      {variedad.tipo === "PSICOACTIVO" ? "Psicoactivo" : "No psicoactivo"}
                    </Insignia>
                  </li>
                ))}
              </ul>
            </RegionDesplazable>
          </EstadoConsulta>
        </Tarjeta>

        <Tarjeta
          titulo="Agroinsumos autorizados"
          descripcion="Solo pueden aplicarse insumos con registro ICA vigente, y cada aplicación abre un periodo de carencia"
          sinRelleno
          pie={
            <p className="pie-region mono">
              La carencia bloquea la cosecha de la planta hasta que se cumple el plazo
            </p>
          }
        >
          <EstadoConsulta
            cargando={insumos.isLoading}
            error={insumos.error}
            onReintentar={() => void insumos.refetch()}
          >
            <RegionDesplazable etiqueta="Agroinsumos autorizados" alto={300}>
              <ul className="ficha-lista">
                {(insumos.data ?? []).map((insumo) => (
                  <li key={insumo.id} className="ficha-lista__item">
                    <span className="ficha-lista__cuerpo">
                      <strong>{insumo.nombre}</strong>
                      <span className="ficha-lista__meta">
                        {insumo.ingrediente} · {insumo.registroIca}
                      </span>
                    </span>
                    <Insignia tono={insumo.carenciaDias >= 14 ? "alerta" : "neutro"}>
                      {insumo.carenciaDias === 0
                        ? "Sin carencia"
                        : `Carencia ${insumo.carenciaDias} d`}
                    </Insignia>
                    <span className="ficha-lista__meta">{ETIQUETA_CATEGORIA[insumo.categoria]}</span>
                  </li>
                ))}
              </ul>
            </RegionDesplazable>
          </EstadoConsulta>
        </Tarjeta>
      </div>

      <div className="aviso aviso--info">
        <Icono nombre="cadena" tamano={18} />
        <p>
          Una planta con origen <strong>clon</strong> hereda la genética de su madre. Al abrir la
          ficha verás la genealogía completa y las labores culturales que la afectaron.
        </p>
      </div>

      <TablaConFiltros
        descripcion="Listado de plantas trazadas"
        columnas={COLUMNAS}
        claveFila={(planta) => planta.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar planta"
        marcadorBusqueda="Buscar por código, variedad o planta madre"
        segmentos={{
          etiqueta: "Filtrar por estado",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todas" },
            { valor: "PROPAGACION", etiqueta: "Propagación" },
            { valor: "VEGETATIVO", etiqueta: "Vegetativo" },
            { valor: "FLORACION", etiqueta: "Floración" },
            { valor: "COSECHADA", etiqueta: "Cosechada" },
          ],
        }}
        selectores={[
          {
            clave: "origen",
            etiqueta: "Origen",
            valor: origen,
            opciones: [
              { valor: "SEMILLA", etiqueta: "Semilla" },
              { valor: "CLON", etiqueta: "Clon" },
            ],
            onCambiar: (valor) => {
              setOrigen(valor);
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
        etiquetaPlural="plantas"
        vacio={
          <EstadoVacio
            icono="hoja"
            titulo="No hay plantas con esos criterios"
            texto="Ajusta los filtros o registra la propagación de un nuevo bloque a partir de una planta madre."
          />
        }
      />

      <DialogoFormulario
        abierto={abierto}
        titulo="Registrar planta"
        descripcion="El servidor valida la genealogía y el cupo del MICC. Un clon exige una planta madre existente cuyo origen sea semilla; sin eso la cadena de origen queda rota."
        etiquetaEnviar="Registrar planta"
        cargando={registrar.isPending}
        error={registrar.error}
        ancho
        onCerrar={cerrar}
        onEnviar={enviar}
        onLimpiarError={() => registrar.reset()}
      >
        <CampoSelect
          etiqueta="Predio"
          requerido
          vacio="Selecciona el predio"
          value={valores.cultivoId}
          error={errores.cultivoId}
          opciones={(cultivos.data?.datos ?? []).map((cultivo) => ({
            valor: cultivo.id,
            etiqueta: `${cultivo.nombre} · ${cultivo.municipio}`,
          }))}
          onChange={(evento) => actualizar("cultivoId")(evento.target.value)}
        />
        <CampoSelect
          etiqueta="Variedad"
          requerido
          vacio="Selecciona la variedad"
          value={valores.variedadId}
          error={errores.variedadId}
          opciones={(variedades.data ?? []).map((variedad) => ({
            valor: variedad.id,
            etiqueta: `${variedad.nombre} · ${variedad.registroIca}`,
          }))}
          onChange={(evento) => actualizar("variedadId")(evento.target.value)}
        />
        <div className="rejilla rejilla--2">
          <CampoSelect
            etiqueta="Origen"
            requerido
            value={valores.origen}
            opciones={[
              { valor: "SEMILLA", etiqueta: "Semilla" },
              { valor: "CLON", etiqueta: "Clon" },
            ]}
            onChange={(evento) => actualizar("origen")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Código de la planta madre"
            requerido={valores.origen === "CLON"}
            disabled={valores.origen === "SEMILLA"}
            value={valores.madre}
            error={errores.madre}
            ayuda={
              valores.origen === "CLON"
                ? "Debe existir y tener origen semilla."
                : "Solo aplica a clones."
            }
            onChange={(evento) => actualizar("madre")(evento.target.value)}
          />
        </div>
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Bloque y cama"
            requerido
            value={valores.bloque}
            error={errores.bloque}
            onChange={(evento) => actualizar("bloque")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Fecha de siembra"
            requerido
            type="date"
            value={valores.siembra}
            error={errores.siembra}
            onChange={(evento) => actualizar("siembra")(evento.target.value)}
          />
        </div>
      </DialogoFormulario>
    </div>
  );
};
