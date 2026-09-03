import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fechaCorta, moneda, numero } from "../../../shared/i18n/formato";
import { useCargos, useCorteLiquidacion } from "../hooks/useLiquidacion";
import type { CargoServicio, EstadoCargo, FlujoCargo } from "../../../shared/api/mock/datosDispensacion";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";

type DescripcionFlujo = {
  valor: FlujoCargo;
  etiqueta: string;
  detalle: string;
  icono: "edificio" | "usuario";
};

const FLUJOS: readonly [DescripcionFlujo, DescripcionFlujo] = [
  {
    valor: "B2B_VERIFICACION",
    etiqueta: "A la farmacia",
    detalle:
      "Un cargo por cada acto de dispensación verificado y sellado. Se le cobra al establecimiento el servicio de verificación y trazabilidad, nunca el producto al paciente.",
    icono: "edificio",
  },
  {
    valor: "B2C_CREDENCIAL",
    etiqueta: "Al paciente",
    detalle:
      "Un cargo anual por la emisión de la credencial digital. Es un servicio de identidad, independiente de cuántas veces se dispense.",
    icono: "usuario",
  },
];

const TONO_ESTADO: Readonly<Record<EstadoCargo, "neutro" | "info" | "exito">> = {
  DEVENGADO: "neutro",
  LIQUIDADO: "info",
  CONCILIADO: "exito",
};

const ETIQUETA_ESTADO: Readonly<Record<EstadoCargo, string>> = {
  DEVENGADO: "Devengado",
  LIQUIDADO: "Liquidado",
  CONCILIADO: "Conciliado",
};

const COLUMNAS: readonly Columna<CargoServicio>[] = [
  { clave: "id", encabezado: "Cargo", render: (cargo) => <span className="mono">{cargo.id}</span> },
  {
    clave: "contraparte",
    encabezado: "Contraparte",
    render: (cargo) => (
      <span>
        <strong>{cargo.contraparte}</strong>
        <br />
        <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
          {cargo.concepto}
        </span>
      </span>
    ),
  },
  {
    clave: "valor",
    encabezado: "Valor",
    numerica: true,
    render: (cargo) => <span className="dato">{moneda(cargo.unidades * cargo.valorUnitario)}</span>,
  },
  { clave: "periodo", encabezado: "Periodo", render: (cargo) => <span className="mono">{cargo.periodo}</span> },
  {
    clave: "estado",
    encabezado: "Estado",
    render: (cargo) => <Insignia tono={TONO_ESTADO[cargo.estado]}>{ETIQUETA_ESTADO[cargo.estado]}</Insignia>,
  },
  {
    clave: "origen",
    encabezado: "Hecho que lo originó",
    render: (cargo) => (
      <span className="mono" style={{ fontSize: "var(--texto-xs)" }}>
        {cargo.origenId}
        <br />
        <span style={{ color: "var(--texto-tenue)" }}>{cargo.eventoId ?? "sin evento asociado"}</span>
      </span>
    ),
  },
  {
    clave: "fecha",
    encabezado: "Fecha",
    render: (cargo) => <span className="dato">{fechaCorta(cargo.fecha)}</span>,
  },
];

export const Liquidacion = () => {
  const [flujo, setFlujo] = useState<FlujoCargo>("B2B_VERIFICACION");
  const [periodo, setPeriodo] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);

  const corte = useCorteLiquidacion({ periodo: periodo || undefined });
  const consulta = useCargos({ flujo, periodo: periodo || undefined, estado: estado || undefined, pagina });

  const activo = FLUJOS.find((item) => item.valor === flujo) ?? FLUJOS[0];

  const resumen = corte.data;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Liquidación del servicio"
        subtitulo="Dos flujos de cobro separados y auditables por separado. Cada cargo a la farmacia apunta al evento del ledger que lo originó, así que el corte se puede reconstruir desde la cadena sellada."
        acciones={
          <Boton variante="secundario" icono="descargar">
            Exportar corte
          </Boton>
        }
      />

      <div className="aviso aviso--info">
        <Icono nombre="escudo" tamano={18} />
        <p>
          La teleconsulta no genera cargo de transacción. Un cargo B2B solo puede nacer de un acto de
          dispensación presencial sellado en el ledger, nunca de una cita ni de una sesión remota.
        </p>
      </div>

      <EstadoConsulta
        cargando={corte.isLoading}
        error={corte.error}
        onReintentar={() => void corte.refetch()}
      >
        {resumen ? (
          <div className="rejilla-kpi">
            <Kpi
              etiqueta="Cargos a farmacias"
              cifra={resumen.b2b.cargos}
              icono="edificio"
              nota={moneda(resumen.b2b.total)}
            />
            <Kpi
              etiqueta="Cargos por credencial"
              cifra={resumen.b2c.cargos}
              icono="usuario"
              nota={moneda(resumen.b2c.total)}
            />
            <Kpi
              etiqueta="Cargos sin evento de origen"
              cifra={resumen.sinEventoOrigen}
              icono="alerta"
              nota="Debe ser cero para que el corte sea auditable"
            />
            <Kpi
              etiqueta="Periodos con movimiento"
              cifra={resumen.periodos.length}
              icono="reloj"
              nota={resumen.periodos[0] ?? "sin datos"}
            />
          </div>
        ) : null}

        <Tarjeta sinRelleno>
          <div className="pestanas-flujo" role="tablist" aria-label="Flujos de cobro">
            {FLUJOS.map((item) => (
              <button
                key={item.valor}
                type="button"
                role="tab"
                aria-selected={flujo === item.valor}
                className="pestanas-flujo__pestana"
                onClick={() => {
                  setFlujo(item.valor);
                  setPagina(1);
                }}
              >
                <Icono nombre={item.icono} tamano={16} />
                {item.etiqueta}
              </button>
            ))}
          </div>
          <p className="pestanas-flujo__detalle">{activo.detalle}</p>
        </Tarjeta>

        <TablaConFiltros
          descripcion={`Cargos del flujo ${activo.etiqueta.toLowerCase()}`}
          columnas={COLUMNAS}
          claveFila={(cargo) => cargo.id}
          consulta={{ ...consulta, data: consulta.data }}
          busqueda=""
          onBusqueda={() => undefined}
          etiquetaBusqueda="Buscar cargo"
          selectores={[
            {
              clave: "periodo",
              etiqueta: "Periodo",
              valor: periodo,
              opciones: (resumen?.periodos ?? []).map((valor) => ({ valor, etiqueta: valor })),
              onCambiar: (valor) => {
                setPeriodo(valor);
                setPagina(1);
              },
            },
            {
              clave: "estado",
              etiqueta: "Estado",
              valor: estado,
              opciones: (Object.keys(ETIQUETA_ESTADO) as EstadoCargo[]).map((valor) => ({
                valor,
                etiqueta: ETIQUETA_ESTADO[valor],
              })),
              onCambiar: (valor) => {
                setEstado(valor);
                setPagina(1);
              },
            },
          ]}
          onPagina={setPagina}
          etiquetaPlural="cargos"
          vacio={
            <EstadoVacio
              icono="reportes"
              titulo="No hay cargos en este corte"
              texto="Ajusta el periodo o el estado. Los cargos aparecen a medida que se registran entregas y se emiten credenciales."
            />
          }
        />
        <p className="pie-region">
          {numero(consulta.data?.total ?? 0)} cargos en el flujo seleccionado
        </p>
      </EstadoConsulta>
    </div>
  );
};
