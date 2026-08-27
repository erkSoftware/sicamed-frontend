import { Link, useParams } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { EnlaceBoton } from "../../../shared/ui/primitivos/EnlaceBoton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { diasHasta, fechaCorta, fechaHora, numero } from "../../../shared/i18n/formato";
import { usePlanta } from "../hooks/usePlantas";

const ETIQUETA_LABOR = {
  TRASPLANTE: "Trasplante",
  RIEGO: "Riego",
  PODA: "Poda",
  FERTILIZACION: "Fertilización",
  FITOSANITARIO: "Aplicación fitosanitaria",
  MONITOREO: "Monitoreo fenológico",
} as const;

const ETIQUETA_ESTADO = {
  PROPAGACION: "Propagación",
  VEGETATIVO: "Vegetativo",
  FLORACION: "Floración",
  COSECHADA: "Cosechada",
  DESTRUIDA: "Destruida",
} as const;

export const DetallePlanta = () => {
  const { id = "" } = useParams();
  const consulta = usePlanta(id);
  const planta = consulta.data?.planta;
  const labores = consulta.data?.labores ?? [];
  const madre = consulta.data?.madre ?? null;
  const clones = consulta.data?.clones ?? [];
  const restantes = planta ? diasHasta(planta.aptaDesde) : 0;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo={planta ? planta.codigo : "Ficha de planta"}
        subtitulo="Genealogía, labores culturales y periodo de carencia de una planta individual. Cada registro está encadenado a la huella del anterior."
        acciones={<EnlaceBoton a="/app/plantas" variante="secundario" icono="flecha">Volver al listado</EnlaceBoton>}
      />

      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {!planta ? (
          <EstadoVacio
            icono="hoja"
            titulo="Planta no encontrada"
            texto="El identificador no corresponde a ninguna planta trazada en esta organización."
          />
        ) : (
          <>
            <div className="rejilla-kpi">
              <Kpi
                etiqueta="Estado fenológico"
                valor={ETIQUETA_ESTADO[planta.estado]}
                icono="produccion"
                nota={planta.bloque}
              />
              <Kpi
                etiqueta="Variedad"
                valor={planta.variedad}
                icono="hoja"
                nota={planta.tipo === "PSICOACTIVO" ? "Cannabis psicoactivo" : "Cannabis no psicoactivo"}
              />
              <Kpi
                etiqueta="Labores registradas"
                valor={numero(labores.length)}
                icono="documento"
                nota="Con responsable y huella"
              />
              <Kpi
                etiqueta="Apta para cosecha"
                valor={restantes > 0 ? `En ${restantes} días` : "Sí"}
                icono="reloj"
                nota={fechaCorta(planta.aptaDesde)}
              />
            </div>

            {restantes > 0 ? (
              <div className="aviso aviso--alerta">
                <Icono nombre="alerta" tamano={18} />
                <p>
                  Esta planta está en periodo de carencia hasta el{" "}
                  <strong>{fechaCorta(planta.aptaDesde)}</strong>. Cosecharla antes de esa fecha
                  invalida el lote resultante frente al certificado de Buenas Prácticas Agrícolas.
                </p>
              </div>
            ) : null}

            <div className="rejilla rejilla--2">
              <Tarjeta
                titulo="Genealogía"
                descripcion="De dónde viene esta planta y qué se propagó a partir de ella"
              >
                <ol className="genealogia">
                  <li className="genealogia__nodo" data-nivel="madre">
                    <span className="genealogia__rol">Planta madre</span>
                    {madre ? (
                      <Link to={`/app/plantas/${madre.id}`} className="genealogia__nombre mono">
                        {madre.codigo}
                      </Link>
                    ) : (
                      <span className="genealogia__nombre">
                        Esta planta nació de semilla certificada
                      </span>
                    )}
                    <span className="genealogia__meta">
                      {madre
                        ? `${madre.variedad} · sembrada el ${fechaCorta(madre.siembra)}`
                        : `${planta.variedad} · sin planta madre en el sistema`}
                    </span>
                  </li>
                  <li className="genealogia__nodo" data-nivel="actual">
                    <span className="genealogia__rol">
                      {planta.origen === "SEMILLA" ? "Esta planta · de semilla" : "Esta planta · clon"}
                    </span>
                    <span className="genealogia__nombre mono">{planta.codigo}</span>
                    <span className="genealogia__meta">
                      {planta.cultivo} · sembrada el {fechaCorta(planta.siembra)}
                    </span>
                  </li>
                  <li className="genealogia__nodo" data-nivel="hijas">
                    <span className="genealogia__rol">Clones propagados</span>
                    {clones.length === 0 ? (
                      <span className="genealogia__nombre">Todavía no se ha propagado</span>
                    ) : (
                      <span className="genealogia__hijas">
                        {clones.map((clon) => (
                          <Link key={clon.id} to={`/app/plantas/${clon.id}`} className="mono">
                            {clon.codigo}
                          </Link>
                        ))}
                      </span>
                    )}
                    <span className="genealogia__meta">
                      {clones.length === 0
                        ? "Solo las plantas madre pueden originar material de propagación"
                        : `${numero(clones.length)} plantas heredan esta genética`}
                    </span>
                  </li>
                </ol>
              </Tarjeta>

              <Tarjeta
                titulo="Labores culturales"
                descripcion="Cada aplicación queda con responsable, dosis y huella encadenada"
                sinRelleno
                pie={
                  <p className="pie-region mono">
                    {numero(labores.length)} labores · la carencia más larga define la fecha de aptitud
                  </p>
                }
              >
                <RegionDesplazable etiqueta="Labores culturales de la planta" alto={360}>
                  <ol className="linea-tiempo">
                    {labores.map((labor) => (
                      <li key={labor.id} className="linea-tiempo__item">
                        <span className="linea-tiempo__punto" aria-hidden="true">
                          <Icono
                            nombre={labor.tipo === "FITOSANITARIO" ? "alerta" : "hoja"}
                            tamano={13}
                          />
                        </span>
                        <span>
                          <p className="linea-tiempo__titulo">
                            {ETIQUETA_LABOR[labor.tipo]}
                            {labor.agroinsumo ? ` · ${labor.agroinsumo}` : ""}
                          </p>
                          <p className="linea-tiempo__meta">
                            {fechaHora(labor.fecha)} · {labor.responsable}
                            {labor.agroinsumo ? ` · ${labor.dosis}` : ""}
                          </p>
                          {labor.aptaDesde ? (
                            <p className="linea-tiempo__meta">
                              <Insignia tono="alerta">
                                Carencia hasta {fechaCorta(labor.aptaDesde)}
                              </Insignia>
                            </p>
                          ) : null}
                          <p className="linea-tiempo__meta mono">{labor.huella}</p>
                        </span>
                      </li>
                    ))}
                  </ol>
                </RegionDesplazable>
              </Tarjeta>
            </div>
          </>
        )}
      </EstadoConsulta>
    </div>
  );
};
