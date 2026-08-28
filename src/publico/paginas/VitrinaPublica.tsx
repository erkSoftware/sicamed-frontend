import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { listaOfertasJsonLd, migasJsonLd } from "../../shared/seo/datosEstructurados";
import { EstadoVacio } from "../../shared/ui/patrones/EstadoVacio";
import { useTraduccion } from "../../shared/i18n/ProveedorIdioma";
import { DEPARTAMENTOS } from "../../shared/api/mock/catalogos";
import type { OrdenVitrina, SugerenciaVitrina } from "../../shared/api/mock/servidorMock";
import type { Oferta } from "../../shared/api/mock/tipos";
import { useEstadisticasVitrina, useOfertasPublicas } from "../hooks/useVitrinaPublica";
import { useMomentoDelDia } from "../hooks/useMomentoDelDia";
import { CabezaPortal } from "../componentes/vitrina/CabezaPortal";
import { BarraBusqueda } from "../componentes/vitrina/BarraBusqueda";
import { PaisajeAndino } from "../componentes/vitrina/PaisajeAndino";
import type { ModoVitrina } from "../componentes/vitrina/AlternadorVitrina";
import { RazonesVitrina } from "../componentes/vitrina/RazonesVitrina";
import { PanelFiltros, type ClaveFiltro } from "../componentes/vitrina/PanelFiltros";
import type { FichaActiva } from "../componentes/vitrina/FichasFiltro";
import type { Vista } from "../componentes/vitrina/ControlesMercado";
import { TarjetaOferta } from "../componentes/vitrina/TarjetaOferta";
import { RejillaEsqueleto } from "../componentes/vitrina/EsqueletoOferta";
import { PaginacionCursor, TAMANOS_PAGINA } from "../componentes/vitrina/PaginacionCursor";
import { DialogoInteres } from "../componentes/vitrina/DialogoInteres";

const LIMITE_POR_DEFECTO = 12;
const MAXIMO_EJEMPLOS = 5;

const PARAMETROS_FILTRO: Readonly<Record<ClaveFiltro, string>> = {
  producto: "producto",
  departamento: "departamento",
  actor: "actor",
  disponibilidad: "disponibilidad",
};

const NOMBRES_DEPARTAMENTO = DEPARTAMENTOS.map((departamento) => departamento.nombre);

const ALTERNATIVAS_VITRINA = [
  { idioma: "es-CO", ruta: "/vitrina" },
  { idioma: "en", ruta: "/vitrina" },
  { idioma: "x-default", ruta: "/vitrina" },
];

const ESTADISTICAS_VACIAS = {
  ofertas: 0,
  actores: 0,
  departamentos: 0,
  totales: { ofertas: 0, actores: 0, departamentos: 0 },
  actualizacion: new Date().toISOString(),
  facetas: {
    tipoProducto: {},
    departamento: {},
    tipoActor: {},
    disponibilidad: {},
  },
};

const mayores = (conteos: Record<string, number>, cantidad: number): readonly string[] =>
  Object.entries(conteos)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .slice(0, cantidad)
    .map(([valor]) => valor);

export const VitrinaPublica = () => {
  const { t, locale } = useTraduccion();
  const momento = useMomentoDelDia();
  const [parametros, setParametros] = useSearchParams();
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [ofertaEnInteres, setOfertaEnInteres] = useState<Oferta | null>(null);
  const [ejemplos, setEjemplos] = useState<readonly string[]>([]);

  const busqueda = parametros.get("busqueda") ?? "";
  const seleccion: Record<ClaveFiltro, string> = {
    producto: parametros.get("producto") ?? "",
    departamento: parametros.get("departamento") ?? "",
    actor: parametros.get("actor") ?? "",
    disponibilidad: parametros.get("disponibilidad") ?? "",
  };
  const orden = (parametros.get("orden") as OrdenVitrina | null) ?? "RECIENTES";
  const vista = (parametros.get("vista") as Vista | null) ?? "rejilla";
  const cursor = parametros.get("cursor");
  const limiteCrudo = Number(parametros.get("limite") ?? LIMITE_POR_DEFECTO);
  const limite = TAMANOS_PAGINA.includes(limiteCrudo as (typeof TAMANOS_PAGINA)[number])
    ? limiteCrudo
    : LIMITE_POR_DEFECTO;

  const consulta = useMemo(
    () => ({
      busqueda: busqueda || undefined,
      tipoProducto: seleccion.producto || undefined,
      departamento: seleccion.departamento || undefined,
      tipoActor: seleccion.actor || undefined,
      disponibilidad: seleccion.disponibilidad || undefined,
      orden,
    }),
    [
      busqueda,
      seleccion.producto,
      seleccion.departamento,
      seleccion.actor,
      seleccion.disponibilidad,
      orden,
    ],
  );

  const pagina = useOfertasPublicas(consulta, cursor, limite);
  const estadisticas = useEstadisticasVitrina(consulta);

  const escribirParametros = useCallback(
    (cambios: Record<string, string | null>, conservarCursor = false) => {
      const siguientes = new URLSearchParams(parametros);
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) siguientes.set(clave, valor);
        else siguientes.delete(clave);
      }
      if (!conservarCursor) siguientes.delete("cursor");
      setParametros(siguientes, { replace: true });
    },
    [parametros, setParametros],
  );

  const buscar = useCallback(
    (texto: string) => escribirParametros({ busqueda: texto || null, modo: null }),
    [escribirParametros],
  );

  const aplicarSugerencia = useCallback(
    (sugerencia: SugerenciaVitrina) => {
      if (sugerencia.tipo === "PRODUCTO")
        escribirParametros({ producto: sugerencia.valor, busqueda: null, modo: null });
      if (sugerencia.tipo === "TERRITORIO")
        escribirParametros({ departamento: sugerencia.valor, busqueda: null, modo: null });
      if (sugerencia.tipo === "ACTOR")
        escribirParametros({ busqueda: sugerencia.valor, modo: null });
    },
    [escribirParametros],
  );

  const cambiarFiltro = useCallback(
    (clave: ClaveFiltro, valor: string) =>
      escribirParametros({ [PARAMETROS_FILTRO[clave]]: valor || null, modo: null }),
    [escribirParametros],
  );

  const limpiar = useCallback(
    () => setParametros(new URLSearchParams(), { replace: true }),
    [setParametros],
  );

  const etiquetaFiltro = (clave: ClaveFiltro, valor: string): string => {
    if (clave === "producto") return t(`producto.${valor}`);
    if (clave === "actor") return t(`actor.${valor}`);
    if (clave === "disponibilidad") return t(`disponibilidad.${valor}`);
    return valor;
  };

  const fichas: readonly FichaActiva[] = [
    ...(Object.keys(PARAMETROS_FILTRO) as ClaveFiltro[])
      .filter((clave) => seleccion[clave] !== "")
      .map((clave) => ({
        clave: PARAMETROS_FILTRO[clave],
        etiqueta: etiquetaFiltro(clave, seleccion[clave]),
      })),
    ...(busqueda ? [{ clave: "busqueda", etiqueta: `“${busqueda}”` }] : []),
  ];

  const hayConsulta = fichas.length > 0;
  const modoPedido = parametros.get("modo") as ModoVitrina | null;
  const modo: ModoVitrina =
    modoPedido === "buscador" || modoPedido === "resultados"
      ? modoPedido
      : hayConsulta
        ? "resultados"
        : "buscador";

  const cambiarModo = useCallback(
    (siguiente: ModoVitrina) =>
      escribirParametros(
        { modo: siguiente === "resultados" || hayConsulta ? siguiente : null },
        true,
      ),
    [escribirParametros, hayConsulta],
  );

  const facetas = estadisticas.data?.facetas;

  useEffect(() => {
    if (hayConsulta || !facetas || ejemplos.length > 0) return;
    const semillas = [
      ...mayores(facetas.tipoProducto, 3),
      ...mayores(facetas.departamento, 2),
    ].slice(0, MAXIMO_EJEMPLOS);
    if (semillas.length > 0) setEjemplos(semillas);
  }, [hayConsulta, facetas, ejemplos]);

  const total = estadisticas.data?.ofertas ?? 0;
  const ofertas = pagina.data?.ofertas ?? [];
  const cargando = pagina.isPending || estadisticas.isPending;
  const cosecha = `${cursor ?? ""}|${JSON.stringify(consulta)}`;

  return (
    <>
      <Seo
        titulo={t("vitrina.seo.titulo")}
        descripcion={t("vitrina.seo.descripcion", { conteo: total })}
        ruta="/vitrina"
        idioma={locale}
        alternativas={ALTERNATIVAS_VITRINA}
        palabrasClave={[
          "vitrina cannabis medicinal",
          "ofertas cannabis Colombia",
          "productores habilitados cannabis",
        ]}
        datosEstructurados={[
          listaOfertasJsonLd(ofertas),
          migasJsonLd([
            { nombre: t("migas.inicio"), ruta: "/" },
            { nombre: t("migas.vitrina"), ruta: "/vitrina" },
          ]),
        ]}
      />

      <div className="portal" data-modo={modo} data-hora={momento}>
        <PaisajeAndino momento={momento} />

        <div className="contenedor contenedor--mercado">
          <nav aria-label={t("migas.ruta")}>
            <ol className="migas">
              <li>
                <Link to="/">{t("migas.inicio")}</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{t("migas.vitrina")}</li>
            </ol>
          </nav>
        </div>

        <CabezaPortal />

        <BarraBusqueda
          modo={modo}
          onCambiarModo={cambiarModo}
          busqueda={busqueda}
          ejemplos={ejemplos}
          fichas={fichas}
          orden={orden}
          vista={vista}
          total={total}
          trabajando={pagina.isFetching || estadisticas.isFetching}
          panelAbierto={panelAbierto}
          onBuscar={buscar}
          onElegirSugerencia={aplicarSugerencia}
          onQuitarFicha={(clave) => escribirParametros({ [clave]: null })}
          onLimpiar={limpiar}
          onOrden={(siguiente) => escribirParametros({ orden: siguiente })}
          onVista={(siguiente) => escribirParametros({ vista: siguiente }, true)}
          onAbrirFiltros={() => setPanelAbierto(true)}
        />

        {modo === "resultados" ? (
          <div className="contenedor contenedor--mercado portal__cosecha">
            {cargando ? (
              <RejillaEsqueleto cantidad={Math.min(limite, 8)} />
            ) : ofertas.length === 0 ? (
              <EstadoVacio
                icono="vitrina"
                titulo={t("vitrina.vacio.titulo")}
                texto={
                  seleccion.departamento ? t("vitrina.vacio.territorio") : t("vitrina.vacio.texto")
                }
                accion={
                  fichas.length > 0 ? (
                    <button
                      type="button"
                      className="boton boton--primario boton--sm"
                      onClick={limpiar}
                    >
                      {t("vitrina.filtros.limpiar")}
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className="mercado__rejilla" data-vista={vista} key={cosecha}>
                  {ofertas.map((oferta, indice) => (
                    <TarjetaOferta
                      key={oferta.id}
                      oferta={oferta}
                      indice={indice}
                      onManifestarInteres={setOfertaEnInteres}
                    />
                  ))}
                </div>

                <PaginacionCursor
                  desde={pagina.data?.desde ?? 0}
                  hasta={pagina.data?.hasta ?? 0}
                  total={total}
                  limite={limite}
                  cursorAnterior={pagina.data?.cursorAnterior ?? null}
                  cursorSiguiente={pagina.data?.cursorSiguiente ?? null}
                  onNavegar={(siguiente) => escribirParametros({ cursor: siguiente }, true)}
                  onCambiarLimite={(siguiente) => escribirParametros({ limite: String(siguiente) })}
                />
              </>
            )}
          </div>
        ) : null}

        {modo === "resultados" ? (
          <RazonesVitrina
            actualizacion={estadisticas.data?.actualizacion ?? ESTADISTICAS_VACIAS.actualizacion}
          />
        ) : null}
      </div>

      <PanelFiltros
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        facetas={estadisticas.data?.facetas ?? ESTADISTICAS_VACIAS.facetas}
        seleccion={seleccion}
        onCambiar={cambiarFiltro}
        onLimpiar={limpiar}
        conteoResultados={total}
        departamentosDisponibles={NOMBRES_DEPARTAMENTO}
      />

      <DialogoInteres oferta={ofertaEnInteres} onCerrar={() => setOfertaEnInteres(null)} />
    </>
  );
};
