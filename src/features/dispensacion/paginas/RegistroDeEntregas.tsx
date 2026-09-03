import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fechaHora, numero } from "../../../shared/i18n/formato";
import { ETIQUETA_METODO, OPCIONES_METODO } from "../../../shared/dispensacion/metodos";
import { useActos, usePuntos } from "../hooks/useDispensacion";
import type { ActoDispensacion } from "../../../shared/api/mock/datosDispensacion";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";

const COLUMNAS: readonly Columna<ActoDispensacion>[] = [
  {
    clave: "codigo",
    encabezado: "Acto",
    render: (acto) => (
      <span>
        <strong className="mono">{acto.codigo}</strong>
        <br />
        <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
          contra {acto.prescripcionCodigo}
        </span>
      </span>
    ),
  },
  {
    clave: "seudonimo",
    encabezado: "Credencial",
    render: (acto) => <span className="mono">{acto.seudonimo}</span>,
  },
  {
    clave: "producto",
    encabezado: "Entregado",
    render: (acto) => (
      <span>
        {acto.denominacionComun}
        <br />
        <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
          {numero(acto.unidades)} {acto.unidadFarmaceutica}
        </span>
      </span>
    ),
  },
  {
    clave: "metodo",
    encabezado: "Verificación",
    render: (acto) => <Insignia tono="neutro">{ETIQUETA_METODO[acto.metodo]}</Insignia>,
  },
  { clave: "punto", encabezado: "Punto", render: (acto) => acto.municipio },
  {
    clave: "fecha",
    encabezado: "Fecha",
    render: (acto) => <span className="dato">{fechaHora(acto.fecha)}</span>,
  },
  {
    clave: "evento",
    encabezado: "Sello",
    render: (acto) => (
      <span className="mono" style={{ fontSize: "var(--texto-xs)" }}>
        {acto.eventoId}
      </span>
    ),
  },
];

export const RegistroDeEntregas = () => {
  const [busqueda, setBusqueda] = useState("");
  const [metodo, setMetodo] = useState("");
  const [puntoId, setPuntoId] = useState("");
  const [pagina, setPagina] = useState(1);
  const puntos = usePuntos();
  const consulta = useActos({ busqueda, tipo: metodo, puntoId, pagina, porPagina: 10 });

  const fiscalizados = (consulta.data?.datos ?? []).filter((acto) => acto.fiscalizado).length;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Registro de entregas"
        subtitulo="Cada acto de dispensación quedó sellado en la cadena de trazabilidad contra el seudónimo de la credencial. Ninguna fila de esta tabla identifica a una persona."
        acciones={
          <Boton variante="secundario" icono="descargar">
            Exportar evidencia
          </Boton>
        }
      />

      <Tarjeta>
        <div className="fila" style={{ gap: "var(--e4)", flexWrap: "wrap" }}>
          <span className="fila" style={{ gap: "var(--e2)", color: "var(--verde-700)" }}>
            <Icono nombre="candado" tamano={18} />
            <strong>Todas presenciales</strong>
          </span>
          <span style={{ color: "var(--texto-tenue)" }}>
            {numero(consulta.data?.total ?? 0)} entregas registradas · {numero(fiscalizados)} de
            producto fiscalizado en esta página · ninguna por domicilio, correo ni medio similar
          </span>
        </div>
      </Tarjeta>

      <TablaConFiltros
        descripcion="Actos de dispensación registrados"
        columnas={COLUMNAS}
        claveFila={(acto) => acto.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar entrega"
        marcadorBusqueda="Buscar por acto, credencial o fórmula"
        selectores={[
          {
            clave: "punto",
            etiqueta: "Punto de dispensación",
            valor: puntoId,
            opciones: (puntos.data ?? []).map((punto) => ({
              valor: punto.id,
              etiqueta: punto.nombre,
            })),
            onCambiar: (valor) => {
              setPuntoId(valor);
              setPagina(1);
            },
          },
          {
            clave: "metodo",
            etiqueta: "Verificación",
            valor: metodo,
            opciones: OPCIONES_METODO,
            onCambiar: (valor) => {
              setMetodo(valor);
              setPagina(1);
            },
          },
        ]}
        onPagina={setPagina}
        etiquetaPlural="entregas"
        vacio={
          <EstadoVacio
            icono="trazabilidad"
            titulo="No hay entregas con esos criterios"
            texto="Las entregas aparecen aquí en cuanto se registran en el mostrador. El registro es de solo escritura."
          />
        }
      />
    </div>
  );
};
