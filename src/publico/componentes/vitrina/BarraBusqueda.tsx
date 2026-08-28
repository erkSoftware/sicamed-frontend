import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useTraduccion } from "../../../shared/i18n/ProveedorIdioma";
import type { OrdenVitrina, SugerenciaVitrina } from "../../../shared/api/mock/servidorMock";
import { BuscadorVitrina } from "./BuscadorVitrina";
import { FichasFiltro, type FichaActiva } from "./FichasFiltro";
import { SelectorOrden, SelectorVista, type Vista } from "./ControlesMercado";
import { AlternadorVitrina, type ModoVitrina } from "./AlternadorVitrina";

type Props = {
  modo: ModoVitrina;
  busqueda: string;
  ejemplos: readonly string[];
  fichas: readonly FichaActiva[];
  orden: OrdenVitrina;
  vista: Vista;
  total: number;
  trabajando: boolean;
  panelAbierto: boolean;
  onCambiarModo: (modo: ModoVitrina) => void;
  onBuscar: (texto: string) => void;
  onElegirSugerencia: (sugerencia: SugerenciaVitrina) => void;
  onQuitarFicha: (clave: string) => void;
  onLimpiar: () => void;
  onOrden: (orden: OrdenVitrina) => void;
  onVista: (vista: Vista) => void;
  onAbrirFiltros: () => void;
};

export const BarraBusqueda = ({
  modo,
  busqueda,
  ejemplos,
  fichas,
  orden,
  vista,
  total,
  trabajando,
  panelAbierto,
  onCambiarModo,
  onBuscar,
  onElegirSugerencia,
  onQuitarFicha,
  onLimpiar,
  onOrden,
  onVista,
  onAbrirFiltros,
}: Props) => {
  const { t } = useTraduccion();

  return (
    <div className="barra-vitrina">
      <div className="contenedor contenedor--mercado barra-vitrina__interior">
        <div className="barra-vitrina__mando">
          <AlternadorVitrina modo={modo} total={total} onCambiar={onCambiarModo} />
        </div>

        <div className="barra-vitrina__campo">
          <BuscadorVitrina
            valor={busqueda}
            ejemplos={ejemplos}
            onBuscar={onBuscar}
            onElegirSugerencia={onElegirSugerencia}
          />
        </div>

        <div className="barra-vitrina__acciones">
          <button
            type="button"
            className="boton-filtros"
            aria-expanded={panelAbierto}
            onClick={onAbrirFiltros}
          >
            <Icono nombre="filtro" tamano={15} />
            {t("vitrina.filtros.abrir")}
            {fichas.length > 0 ? (
              <span className="boton-filtros__conteo mono">{fichas.length}</span>
            ) : null}
          </button>
          <SelectorOrden valor={orden} onCambiar={onOrden} />
          <SelectorVista valor={vista} onCambiar={onVista} />
        </div>

        <p className="barra-vitrina__conteo" aria-live="polite">
          <strong>{t("vitrina.resultados.conteo", { conteo: total })}</strong>
          <span className="barra-vitrina__nota">{t("vitrina.orden.nota")}</span>
        </p>

        <FichasFiltro fichas={fichas} onQuitar={onQuitarFicha} onLimpiar={onLimpiar} />
      </div>
      <span
        className="barra-vitrina__pulso"
        data-activo={trabajando ? "si" : undefined}
        aria-hidden="true"
      />
    </div>
  );
};
