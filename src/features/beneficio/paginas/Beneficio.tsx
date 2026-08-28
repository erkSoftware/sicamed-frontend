import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { usePermiso } from "../../../shared/rbac/usePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fechaCorta, numero, porcentaje } from "../../../shared/i18n/formato";
import type { Beneficio as RegistroBeneficio, EstadoBeneficio } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import {
  useAvanzarBeneficio,
  useBeneficios,
  useCultivosEnCosecha,
  useRegistrarBeneficio,
} from "../hooks/useBeneficios";

const TONO_ESTADO = {
  SECADO: "info",
  CURADO: "acento",
  ACONDICIONADO: "exito",
  RECHAZADO: "peligro",
} as const;

const ETIQUETA_ESTADO = {
  SECADO: "En secado",
  CURADO: "En curado",
  ACONDICIONADO: "Acondicionado",
  RECHAZADO: "Rechazado",
} as const;

const merma = (registro: RegistroBeneficio): number =>
  registro.pesoHumedo > 0 ? (registro.pesoHumedo - registro.pesoSeco) / registro.pesoHumedo : 0;

const SIGUIENTE: Partial<Record<EstadoBeneficio, EstadoBeneficio>> = {
  SECADO: "CURADO",
  CURADO: "ACONDICIONADO",
};

const ETIQUETA_AVANCE: Record<string, string> = {
  CURADO: "Registrar peso seco",
  ACONDICIONADO: "Acondicionar y crear lote",
};

const COLUMNAS_BASE: readonly Columna<RegistroBeneficio>[] = [
  {
    clave: "codigo",
    encabezado: "Proceso",
    render: (registro) => (
      <span>
        <strong className="mono nombre-compacto">{registro.codigo}</strong>
        <br />
        <span className="enlace-fila__meta">
          {registro.cultivo} · {registro.departamento}
        </span>
        <br />
        <span className="enlace-fila__meta">Cierre: {fechaCorta(registro.fin)}</span>
      </span>
    ),
  },
  {
    clave: "variedad",
    encabezado: "Variedad",
    render: (registro) => (
      <span>
        {registro.variedad}
        <br />
        <Insignia tono={registro.tipo === "PSICOACTIVO" ? "alerta" : "neutro"}>
          {registro.tipo === "PSICOACTIVO" ? "Psicoactivo" : "No psicoactivo"}
        </Insignia>
      </span>
    ),
  },
  {
    clave: "plantas",
    encabezado: "Plantas",
    numerica: true,
    render: (registro) => <span className="mono">{numero(registro.plantas)}</span>,
  },
  {
    clave: "balance",
    encabezado: "Balance de masa",
    render: (registro) => (
      <span className="balance">
        <span className="balance__pista" aria-hidden="true">
          <span
            className="balance__seco"
            style={{ width: `${Math.round((1 - merma(registro)) * 100)}%` }}
          />
        </span>
        <span className="balance__cifras mono">
          <span>{registro.pesoHumedo.toFixed(1)} kg húmedo</span>
          <span aria-hidden="true">→</span>
          <span>{registro.pesoSeco.toFixed(1)} kg seco</span>
        </span>
        <span className="balance__cifras mono">
          <span>Humedad final {registro.humedad.toFixed(1)}%</span>
        </span>
      </span>
    ),
  },
  {
    clave: "merma",
    encabezado: "Merma",
    numerica: true,
    render: (registro) => (
      <Insignia tono={merma(registro) > 0.8 ? "alerta" : "neutro"}>
        {porcentaje(merma(registro), 1)}
      </Insignia>
    ),
  },
  {
    clave: "estado",
    encabezado: "Estado",
    render: (registro) => (
      <Insignia tono={TONO_ESTADO[registro.estado]}>{ETIQUETA_ESTADO[registro.estado]}</Insignia>
    ),
  },
  {
    clave: "lote",
    encabezado: "Lote resultante",
    render: (registro) =>
      registro.loteCodigo ? (
        <span className="mono">{registro.loteCodigo}</span>
      ) : (
        <span className="enlace-fila__meta">Todavía sin lote</span>
      ),
  },
];

type FormApertura = { cultivoId: string; plantas: string; pesoHumedo: string; responsable: string };

const APERTURA_INICIAL: FormApertura = {
  cultivoId: "",
  plantas: "",
  pesoHumedo: "",
  responsable: "",
};

export const Beneficio = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abriendo, setAbriendo] = useState(false);
  const [avanzando, setAvanzando] = useState<RegistroBeneficio | null>(null);
  const [apertura, setApertura] = useState<FormApertura>(APERTURA_INICIAL);
  const [erroresApertura, setErroresApertura] = useState<
    Partial<Record<keyof FormApertura, string>>
  >({});
  const [peso, setPeso] = useState("");
  const [humedad, setHumedad] = useState("");
  const [erroresAvance, setErroresAvance] = useState<{ peso?: string; humedad?: string }>({});

  const consulta = useBeneficios({ busqueda, estado, departamento, pagina, porPagina: 10 });
  const cultivos = useCultivosEnCosecha();
  const registrar = useRegistrarBeneficio();
  const avanzar = useAvanzarBeneficio();
  const autor = useAutor();
  const puedeEscribir = usePermiso("produccion:beneficio:escribir");

  const visibles = consulta.data?.datos ?? [];
  const humedo = visibles.reduce((suma, registro) => suma + registro.pesoHumedo, 0);
  const seco = visibles.reduce((suma, registro) => suma + registro.pesoSeco, 0);
  const rendimiento = humedo > 0 ? seco / humedo : 0;
  const acondicionados = visibles.filter((registro) => registro.estado === "ACONDICIONADO").length;

  const cerrarApertura = () => {
    setAbriendo(false);
    setApertura(APERTURA_INICIAL);
    setErroresApertura({});
    registrar.reset();
  };

  const cerrarAvance = () => {
    setAvanzando(null);
    setPeso("");
    setHumedad("");
    setErroresAvance({});
    avanzar.reset();
  };

  const enviarApertura = () => {
    const encontrados: Partial<Record<keyof FormApertura, string>> = {};
    if (!apertura.cultivoId) encontrados.cultivoId = "Selecciona el predio cosechado.";
    if (!(Number(apertura.plantas) > 0)) encontrados.plantas = "Declara cuántas plantas se cosecharon.";
    if (!(Number(apertura.pesoHumedo) > 0))
      encontrados.pesoHumedo = "Declara el peso húmedo de entrada.";
    if (apertura.responsable.trim().length < 4)
      encontrados.responsable = "Identifica al responsable del beneficio.";
    setErroresApertura(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    registrar.mutate(
      {
        cultivoId: apertura.cultivoId,
        plantas: Number(apertura.plantas),
        pesoHumedo: Number(apertura.pesoHumedo),
        responsable: apertura.responsable,
        autor,
      },
      { onSuccess: cerrarApertura },
    );
  };

  const enviarAvance = () => {
    if (!avanzando) return;
    const siguiente = SIGUIENTE[avanzando.estado];
    if (!siguiente) return;
    const encontrados: { peso?: string; humedad?: string } = {};
    if (!(Number(peso) > 0)) encontrados.peso = "Declara el peso resultante.";
    if (!(Number(humedad) >= 0)) encontrados.humedad = "Declara la humedad final.";
    setErroresAvance(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    avanzar.mutate(
      {
        id: avanzando.id,
        estado: siguiente,
        peso: Number(peso),
        humedad: Number(humedad),
        autor,
      },
      { onSuccess: cerrarAvance },
    );
  };

  const COLUMNAS: readonly Columna<RegistroBeneficio>[] = [
    ...COLUMNAS_BASE,
    ...(puedeEscribir
      ? [
          {
            clave: "acciones",
            encabezado: "Avanzar",
            render: (registro: RegistroBeneficio) => {
              const siguiente = SIGUIENTE[registro.estado];
              if (!siguiente) return <span className="enlace-fila__meta">Proceso cerrado</span>;
              return (
                <Boton
                  variante="secundario"
                  tamano="sm"
                  icono="flecha"
                  onClick={() => {
                    setAvanzando(registro);
                    setPeso("");
                    setHumedad(String(registro.humedad || ""));
                  }}
                >
                  {ETIQUETA_AVANCE[siguiente] ?? "Avanzar"}
                </Boton>
              );
            },
          } satisfies Columna<RegistroBeneficio>,
        ]
      : []),
  ];

  const siguienteDelAvance = avanzando ? SIGUIENTE[avanzando.estado] : undefined;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Cosecha y beneficio"
        subtitulo="El tramo que explica por qué el peso baja entre la planta y el lote: secado, curado y acondicionamiento, con el balance de masa declarado en cada paso."
        acciones={
          <SiTienePermiso permiso="produccion:beneficio:escribir">
            <Boton icono="mas" onClick={() => setAbriendo(true)}>
              Abrir beneficio
            </Boton>
          </SiTienePermiso>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Procesos registrados" valor={numero(consulta.data?.total ?? 0)} icono="inventario" />
        <Kpi
          etiqueta="Biomasa húmeda"
          valor={`${numero(Math.round(humedo))} kg`}
          icono="hoja"
          nota="Suma de la página actual"
        />
        <Kpi
          etiqueta="Producto seco"
          valor={`${numero(Math.round(seco))} kg`}
          icono="inventario"
          nota="Suma de la página actual"
        />
        <Kpi
          etiqueta="Rendimiento medio"
          valor={porcentaje(rendimiento, 1)}
          icono="reportes"
          nota={`${acondicionados} procesos ya acondicionados`}
        />
      </div>

      <div className="aviso aviso--info">
        <Icono nombre="cadena" tamano={18} />
        <p>
          Una cosecha de 100 kg húmedos que entrega 22 kg secos no es un salto sin explicar: el
          secado retira agua y el curado y el acondicionamiento retiran material vegetal no
          aprovechable. Sin este registro, la diferencia entre lo cosechado y lo inventariado queda
          sin justificar frente a la autoridad.
        </p>
      </div>

      <TablaConFiltros
        descripcion="Procesos de beneficio poscosecha"
        columnas={COLUMNAS}
        claveFila={(registro) => registro.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar proceso"
        marcadorBusqueda="Buscar por código, predio o variedad"
        segmentos={{
          etiqueta: "Filtrar por estado",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todos" },
            { valor: "SECADO", etiqueta: "Secado" },
            { valor: "CURADO", etiqueta: "Curado" },
            { valor: "ACONDICIONADO", etiqueta: "Acondicionado" },
            { valor: "RECHAZADO", etiqueta: "Rechazado" },
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
        etiquetaPlural="procesos"
        vacio={
          <EstadoVacio
            icono="inventario"
            titulo="No hay procesos con esos criterios"
            texto="Ajusta los filtros o abre un proceso de beneficio a partir de una cosecha registrada."
          />
        }
      />

      <DialogoFormulario
        abierto={abriendo}
        titulo="Abrir proceso de beneficio"
        descripcion="El peso húmedo de entrada es el techo de todo el proceso: ni el secado ni el acondicionamiento pueden aumentar la masa."
        etiquetaEnviar="Iniciar secado"
        cargando={registrar.isPending}
        error={registrar.error}
        ancho
        onCerrar={cerrarApertura}
        onEnviar={enviarApertura}
        onLimpiarError={() => registrar.reset()}
      >
        <CampoSelect
          etiqueta="Predio cosechado"
          requerido
          vacio="Selecciona el predio"
          value={apertura.cultivoId}
          error={erroresApertura.cultivoId}
          opciones={(cultivos.data?.datos ?? []).map((cultivo) => ({
            valor: cultivo.id,
            etiqueta: `${cultivo.nombre} · ${cultivo.variedad} · ${cultivo.estado}`,
          }))}
          onChange={(evento) =>
            setApertura((previo) => ({ ...previo, cultivoId: evento.target.value }))
          }
        />
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Plantas cosechadas"
            requerido
            type="number"
            min="1"
            value={apertura.plantas}
            error={erroresApertura.plantas}
            onChange={(evento) =>
              setApertura((previo) => ({ ...previo, plantas: evento.target.value }))
            }
          />
          <CampoTexto
            etiqueta="Peso húmedo (kg)"
            requerido
            type="number"
            step="0.1"
            min="0"
            value={apertura.pesoHumedo}
            error={erroresApertura.pesoHumedo}
            onChange={(evento) =>
              setApertura((previo) => ({ ...previo, pesoHumedo: evento.target.value }))
            }
          />
        </div>
        <CampoTexto
          etiqueta="Responsable del beneficio"
          requerido
          value={apertura.responsable}
          error={erroresApertura.responsable}
          onChange={(evento) =>
            setApertura((previo) => ({ ...previo, responsable: evento.target.value }))
          }
        />
      </DialogoFormulario>

      <DialogoFormulario
        abierto={avanzando !== null}
        titulo={
          siguienteDelAvance === "ACONDICIONADO"
            ? "Acondicionar y generar lote"
            : "Registrar peso seco"
        }
        descripcion={
          siguienteDelAvance === "ACONDICIONADO"
            ? `El acondicionamiento cierra el proceso y crea el lote en inventario. No puede superar los ${avanzando?.pesoSeco ?? 0} kg secos registrados.`
            : `El secado solo puede reducir masa: no puede superar los ${avanzando?.pesoHumedo ?? 0} kg húmedos de entrada.`
        }
        etiquetaEnviar={
          siguienteDelAvance === "ACONDICIONADO" ? "Acondicionar y crear lote" : "Registrar peso seco"
        }
        cargando={avanzar.isPending}
        error={avanzar.error}
        onCerrar={cerrarAvance}
        onEnviar={enviarAvance}
        onLimpiarError={() => avanzar.reset()}
      >
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta={siguienteDelAvance === "ACONDICIONADO" ? "Peso acondicionado (kg)" : "Peso seco (kg)"}
            requerido
            type="number"
            step="0.1"
            min="0"
            value={peso}
            error={erroresAvance.peso}
            onChange={(evento) => setPeso(evento.target.value)}
          />
          <CampoTexto
            etiqueta="Humedad final (%)"
            requerido
            type="number"
            step="0.1"
            min="0"
            value={humedad}
            error={erroresAvance.humedad}
            ayuda="Entre 8% y 12% es lo esperado tras el curado."
            onChange={(evento) => setHumedad(evento.target.value)}
          />
        </div>
      </DialogoFormulario>
    </div>
  );
};
