import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { DEPARTAMENTOS } from "../../../shared/api/mock/catalogos";
import { fechaCorta, numero, porcentaje } from "../../../shared/i18n/formato";
import type { Beneficio as RegistroBeneficio } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { useBeneficios } from "../hooks/useBeneficios";

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

const COLUMNAS: readonly Columna<RegistroBeneficio>[] = [
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

export const Beneficio = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [pagina, setPagina] = useState(1);
  const consulta = useBeneficios({ busqueda, estado, departamento, pagina, porPagina: 10 });

  const visibles = consulta.data?.datos ?? [];
  const humedo = visibles.reduce((suma, registro) => suma + registro.pesoHumedo, 0);
  const seco = visibles.reduce((suma, registro) => suma + registro.pesoSeco, 0);
  const rendimiento = humedo > 0 ? seco / humedo : 0;
  const acondicionados = visibles.filter((registro) => registro.estado === "ACONDICIONADO").length;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Cosecha y beneficio"
        subtitulo="El tramo que explica por qué el peso baja entre la planta y el lote: secado, curado y acondicionamiento, con el balance de masa declarado en cada paso."
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
    </div>
  );
};
