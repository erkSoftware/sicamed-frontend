import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { usePermiso } from "../../../shared/rbac/usePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fechaCorta, numero } from "../../../shared/i18n/formato";
import type { Cultivo, EstadoCultivo } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useCambiarEtapa, useCultivos, useRegistrarCultivo, useVariedades } from "../hooks/useCultivos";

const TONO_ESTADO = {
  PREPARACION: "neutro",
  VEGETATIVO: "info",
  FLORACION: "acento",
  COSECHA: "exito",
  CERRADO: "neutro",
} as const;

const SIGUIENTE_ETAPA: Partial<Record<EstadoCultivo, EstadoCultivo>> = {
  PREPARACION: "VEGETATIVO",
  VEGETATIVO: "FLORACION",
  FLORACION: "COSECHA",
  COSECHA: "CERRADO",
};

type Formulario = {
  nombre: string;
  departamento: string;
  municipio: string;
  variedad: string;
  areaHectareas: string;
  plantas: string;
  siembra: string;
  cosechaEstimada: string;
};

const INICIAL: Formulario = {
  nombre: "",
  departamento: "",
  municipio: "",
  variedad: "",
  areaHectareas: "",
  plantas: "",
  siembra: "",
  cosechaEstimada: "",
};

type Errores = Partial<Record<keyof Formulario, string>>;

const validar = (valores: Formulario): Errores => {
  const errores: Errores = {};
  if (valores.nombre.trim().length < 5) errores.nombre = "Indica el nombre del predio.";
  if (!valores.departamento) errores.departamento = "Selecciona el departamento.";
  if (valores.municipio.trim().length < 3) errores.municipio = "Indica el municipio.";
  if (!valores.variedad) errores.variedad = "Selecciona la variedad registrada ante el ICA.";
  if (!(Number(valores.areaHectareas) > 0)) errores.areaHectareas = "El área debe ser mayor que cero.";
  if (!(Number(valores.plantas) > 0)) errores.plantas = "Declara el número de plantas proyectadas.";
  if (!valores.siembra) errores.siembra = "Indica la fecha de siembra.";
  if (!valores.cosechaEstimada) errores.cosechaEstimada = "Indica la cosecha estimada.";
  return errores;
};

export const Produccion = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});

  const consulta = useCultivos({ busqueda, estado, departamento, pagina, porPagina: 10 });
  const variedades = useVariedades();
  const registrar = useRegistrarCultivo();
  const cambiarEtapa = useCambiarEtapa();
  const autor = useAutor();
  const puedeEscribir = usePermiso("produccion:cultivo:escribir");

  const visibles = consulta.data?.datos ?? [];
  const hectareas = visibles.reduce((suma, cultivo) => suma + cultivo.areaHectareas, 0);
  const plantas = visibles.reduce((suma, cultivo) => suma + cultivo.plantas, 0);
  const enFloracion = visibles.filter((cultivo) => cultivo.estado === "FLORACION").length;

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
        nombre: valores.nombre,
        organizacionId: autor.organizacionId,
        departamento: valores.departamento,
        municipio: valores.municipio,
        variedad: valores.variedad,
        areaHectareas: Number(valores.areaHectareas),
        plantas: Number(valores.plantas),
        siembra: new Date(valores.siembra).toISOString(),
        cosechaEstimada: new Date(valores.cosechaEstimada).toISOString(),
        autor,
      },
      { onSuccess: cerrar },
    );
  };

  const actualizar = (campo: keyof Formulario) => (valor: string) =>
    setValores((previos) => ({ ...previos, [campo]: valor }));

  const columnas: readonly Columna<Cultivo>[] = [
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
    { clave: "siembra", encabezado: "Siembra", render: (cultivo) => <span className="dato">{fechaCorta(cultivo.siembra)}</span> },
    { clave: "cosecha", encabezado: "Cosecha estimada", render: (cultivo) => <span className="dato">{fechaCorta(cultivo.cosechaEstimada)}</span> },
    ...(puedeEscribir
      ? [
          {
            clave: "acciones",
            encabezado: "Avanzar etapa",
            render: (cultivo: Cultivo) => {
              const siguiente = SIGUIENTE_ETAPA[cultivo.estado];
              if (!siguiente) return <span className="texto-tenue">Ciclo cerrado</span>;
              return (
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  cargando={cambiarEtapa.isPending && cambiarEtapa.variables?.id === cultivo.id}
                  onClick={() => cambiarEtapa.mutate({ id: cultivo.id, estado: siguiente, autor })}
                >
                  Pasar a {siguiente.toLowerCase()}
                </Boton>
              );
            },
          } satisfies Columna<Cultivo>,
        ]
      : []),
  ];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Producción"
        subtitulo="Predios de cultivo registrados, su etapa fenológica y la cosecha estimada. Cada cambio de etapa queda sellado en la cadena de trazabilidad."
        acciones={
          <SiTienePermiso permiso="produccion:cultivo:escribir">
            <Boton icono="mas" onClick={() => setAbierto(true)}>
              Registrar predio
            </Boton>
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
        columnas={columnas}
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

      <DialogoFormulario
        abierto={abierto}
        titulo="Registrar predio de cultivo"
        descripcion="El servidor verifica el cupo de plantas asignado por el MICC antes de aceptar la siembra. El régimen de cupos opera por número de plantas, no por área."
        etiquetaEnviar="Registrar predio"
        cargando={registrar.isPending}
        error={registrar.error}
        ancho
        onCerrar={cerrar}
        onEnviar={enviar}
        onLimpiarError={() => registrar.reset()}
      >
        <CampoTexto
          etiqueta="Nombre del predio"
          requerido
          value={valores.nombre}
          error={errores.nombre}
          onChange={(evento) => actualizar("nombre")(evento.target.value)}
        />
        <div className="rejilla rejilla--2">
          <CampoSelect
            etiqueta="Departamento"
            requerido
            vacio="Selecciona un departamento"
            value={valores.departamento}
            error={errores.departamento}
            opciones={DEPARTAMENTOS.map((d) => ({ valor: d.nombre, etiqueta: d.nombre }))}
            onChange={(evento) => actualizar("departamento")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Municipio"
            requerido
            value={valores.municipio}
            error={errores.municipio}
            onChange={(evento) => actualizar("municipio")(evento.target.value)}
          />
        </div>
        <CampoSelect
          etiqueta="Variedad"
          requerido
          vacio="Selecciona una variedad registrada"
          value={valores.variedad}
          error={errores.variedad}
          ayuda="Solo variedades con registro ICA vigente. La clasificación psicoactiva se deriva del perfil de la variedad."
          opciones={(variedades.data ?? []).map((variedad) => ({
            valor: variedad.nombre,
            etiqueta: `${variedad.nombre} · THC ${variedad.thc}% · ${variedad.registroIca}`,
          }))}
          onChange={(evento) => actualizar("variedad")(evento.target.value)}
        />
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Área (hectáreas)"
            requerido
            type="number"
            step="0.1"
            min="0"
            value={valores.areaHectareas}
            error={errores.areaHectareas}
            onChange={(evento) => actualizar("areaHectareas")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Plantas proyectadas"
            requerido
            type="number"
            min="1"
            value={valores.plantas}
            error={errores.plantas}
            ayuda="Se contrasta contra el cupo asignado."
            onChange={(evento) => actualizar("plantas")(evento.target.value)}
          />
        </div>
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Fecha de siembra"
            requerido
            type="date"
            value={valores.siembra}
            error={errores.siembra}
            onChange={(evento) => actualizar("siembra")(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Cosecha estimada"
            requerido
            type="date"
            value={valores.cosechaEstimada}
            error={errores.cosechaEstimada}
            onChange={(evento) => actualizar("cosechaEstimada")(evento.target.value)}
          />
        </div>
      </DialogoFormulario>
    </div>
  );
};
