import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { ErrorNormativo } from "../../../shared/ui/patrones/ErrorNormativo";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { EnlaceBoton } from "../../../shared/ui/primitivos/EnlaceBoton";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { aProblema } from "../../../shared/api/problemDetails";
import { diasHasta, fechaCorta, fechaHora, numero } from "../../../shared/i18n/formato";
import type { CausalDestruccion, TipoLabor } from "../../../shared/api/mock/tipos";
import {
  useAgroinsumos,
  useCosecharPlanta,
  usePlanta,
  useRegistrarDestruccion,
  useRegistrarLabor,
} from "../hooks/usePlantas";

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

const CAUSALES: readonly { valor: CausalDestruccion; etiqueta: string }[] = [
  { valor: "PLAGA_NO_CONTROLABLE", etiqueta: "Plaga no controlable" },
  { valor: "FUERA_DE_ESPECIFICACION", etiqueta: "Fuera de especificación" },
  { valor: "VENCIMIENTO", etiqueta: "Vencimiento" },
  { valor: "ORDEN_AUTORIDAD", etiqueta: "Orden de autoridad" },
  { valor: "EXCEDENTE_DE_CUPO", etiqueta: "Excedente de cupo" },
];

type FormLabor = { tipo: TipoLabor; agroinsumoId: string; dosis: string; responsable: string };

type FormActa = {
  causal: CausalDestruccion;
  metodo: string;
  testigo: string;
  cargoTestigo: string;
};

const LABOR_INICIAL: FormLabor = {
  tipo: "MONITOREO",
  agroinsumoId: "",
  dosis: "",
  responsable: "",
};

const ACTA_INICIAL: FormActa = {
  causal: "PLAGA_NO_CONTROLABLE",
  metodo: "",
  testigo: "",
  cargoTestigo: "",
};

export const DetallePlanta = () => {
  const { id = "" } = useParams();
  const consulta = usePlanta(id);
  const insumos = useAgroinsumos();
  const registrarLabor = useRegistrarLabor();
  const cosechar = useCosecharPlanta();
  const destruir = useRegistrarDestruccion();
  const autor = useAutor();

  const [dialogoLabor, setDialogoLabor] = useState(false);
  const [dialogoActa, setDialogoActa] = useState(false);
  const [labor, setLabor] = useState<FormLabor>(LABOR_INICIAL);
  const [acta, setActa] = useState<FormActa>(ACTA_INICIAL);
  const [erroresLabor, setErroresLabor] = useState<Partial<Record<keyof FormLabor, string>>>({});
  const [erroresActa, setErroresActa] = useState<Partial<Record<keyof FormActa, string>>>({});

  const planta = consulta.data?.planta;
  const labores = consulta.data?.labores ?? [];
  const madre = consulta.data?.madre ?? null;
  const clones = consulta.data?.clones ?? [];
  const restantes = planta ? diasHasta(planta.aptaDesde) : 0;
  const enCiclo = planta?.estado !== "COSECHADA" && planta?.estado !== "DESTRUIDA";

  const cerrarLabor = () => {
    setDialogoLabor(false);
    setLabor(LABOR_INICIAL);
    setErroresLabor({});
    registrarLabor.reset();
  };

  const cerrarActa = () => {
    setDialogoActa(false);
    setActa(ACTA_INICIAL);
    setErroresActa({});
    destruir.reset();
  };

  const enviarLabor = () => {
    const errores: Partial<Record<keyof FormLabor, string>> = {};
    if (labor.responsable.trim().length < 4)
      errores.responsable = "Identifica al responsable de la labor.";
    if (labor.agroinsumoId && !labor.dosis.trim())
      errores.dosis = "Declara la dosis aplicada.";
    setErroresLabor(errores);
    if (Object.keys(errores).length > 0) return;
    registrarLabor.mutate(
      {
        plantaId: id,
        tipo: labor.tipo,
        agroinsumoId: labor.agroinsumoId || null,
        dosis: labor.dosis,
        responsable: labor.responsable,
        autor,
      },
      { onSuccess: cerrarLabor },
    );
  };

  const enviarActa = () => {
    const errores: Partial<Record<keyof FormActa, string>> = {};
    if (acta.metodo.trim().length < 10) errores.metodo = "Describe el método de destrucción.";
    if (acta.testigo.trim().length < 4) errores.testigo = "El acta exige un testigo identificado.";
    if (acta.cargoTestigo.trim().length < 4)
      errores.cargoTestigo = "Indica el cargo o entidad del testigo.";
    setErroresActa(errores);
    if (Object.keys(errores).length > 0) return;
    destruir.mutate(
      {
        entidad: "PLANTA",
        entidadId: id,
        cantidad: 1,
        causal: acta.causal,
        metodo: acta.metodo,
        testigo: acta.testigo,
        cargoTestigo: acta.cargoTestigo,
        autor,
      },
      { onSuccess: cerrarActa },
    );
  };

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo={planta ? planta.codigo : "Ficha de planta"}
        subtitulo="Genealogía, labores culturales y periodo de carencia de una planta individual. Cada registro está encadenado a la huella del anterior."
        acciones={
          <div className="fila" style={{ gap: "var(--e3)" }}>
            {enCiclo ? (
              <SiTienePermiso permiso="produccion:planta:escribir">
                <Boton variante="secundario" icono="mas" onClick={() => setDialogoLabor(true)}>
                  Registrar labor
                </Boton>
                <Boton
                  icono="check"
                  cargando={cosechar.isPending}
                  onClick={() => cosechar.mutate({ id, autor })}
                >
                  Cosechar
                </Boton>
              </SiTienePermiso>
            ) : null}
            {enCiclo ? (
              <SiTienePermiso permiso="produccion:destruccion:escribir">
                <Boton variante="peligro" icono="alerta" onClick={() => setDialogoActa(true)}>
                  Destruir
                </Boton>
              </SiTienePermiso>
            ) : null}
            <EnlaceBoton a="/app/plantas" variante="secundario" icono="flecha">
              Volver al listado
            </EnlaceBoton>
          </div>
        }
      />

      {cosechar.error ? (
        <ErrorNormativo problema={aProblema(cosechar.error)} onReintentar={() => cosechar.reset()} />
      ) : null}

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

      <DialogoFormulario
        abierto={dialogoLabor}
        titulo="Registrar labor cultural"
        descripcion="Si aplicas un agroinsumo con periodo de carencia, el servidor recalcula la fecha desde la cual la planta puede cosecharse."
        etiquetaEnviar="Registrar labor"
        cargando={registrarLabor.isPending}
        error={registrarLabor.error}
        onCerrar={cerrarLabor}
        onEnviar={enviarLabor}
        onLimpiarError={() => registrarLabor.reset()}
      >
        <CampoSelect
          etiqueta="Tipo de labor"
          requerido
          value={labor.tipo}
          opciones={[
            { valor: "TRASPLANTE", etiqueta: "Trasplante" },
            { valor: "RIEGO", etiqueta: "Riego" },
            { valor: "PODA", etiqueta: "Poda" },
            { valor: "FERTILIZACION", etiqueta: "Fertilización" },
            { valor: "FITOSANITARIO", etiqueta: "Aplicación fitosanitaria" },
            { valor: "MONITOREO", etiqueta: "Monitoreo fenológico" },
          ]}
          onChange={(evento) =>
            setLabor((previo) => ({ ...previo, tipo: evento.target.value as TipoLabor }))
          }
        />
        <CampoSelect
          etiqueta="Agroinsumo aplicado"
          vacio="Sin agroinsumo"
          value={labor.agroinsumoId}
          ayuda="Solo insumos con registro ICA vigente. La carencia se aplica automáticamente."
          opciones={(insumos.data ?? []).map((insumo) => ({
            valor: insumo.id,
            etiqueta: `${insumo.nombre} · carencia ${insumo.carenciaDias} d`,
          }))}
          onChange={(evento) =>
            setLabor((previo) => ({ ...previo, agroinsumoId: evento.target.value }))
          }
        />
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Dosis"
            disabled={!labor.agroinsumoId}
            value={labor.dosis}
            error={erroresLabor.dosis}
            onChange={(evento) => setLabor((previo) => ({ ...previo, dosis: evento.target.value }))}
          />
          <CampoTexto
            etiqueta="Responsable"
            requerido
            value={labor.responsable}
            error={erroresLabor.responsable}
            onChange={(evento) =>
              setLabor((previo) => ({ ...previo, responsable: evento.target.value }))
            }
          />
        </div>
      </DialogoFormulario>

      <DialogoFormulario
        abierto={dialogoActa}
        titulo="Acta de destrucción"
        descripcion="La disposición final es un estado terminal: la planta no vuelve al ciclo productivo. El acta exige testigo identificado para tener valor probatorio ante la autoridad."
        etiquetaEnviar="Levantar acta y destruir"
        cargando={destruir.isPending}
        error={destruir.error}
        ancho
        onCerrar={cerrarActa}
        onEnviar={enviarActa}
        onLimpiarError={() => destruir.reset()}
      >
        <CampoSelect
          etiqueta="Causal"
          requerido
          value={acta.causal}
          opciones={CAUSALES.map((causal) => ({ valor: causal.valor, etiqueta: causal.etiqueta }))}
          onChange={(evento) =>
            setActa((previo) => ({ ...previo, causal: evento.target.value as CausalDestruccion }))
          }
        />
        <CampoTexto
          etiqueta="Método de destrucción"
          requerido
          value={acta.metodo}
          error={erroresActa.metodo}
          ayuda="Por ejemplo: incineración en horno autorizado con registro de temperatura."
          onChange={(evento) => setActa((previo) => ({ ...previo, metodo: evento.target.value }))}
        />
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Testigo"
            requerido
            value={acta.testigo}
            error={erroresActa.testigo}
            onChange={(evento) => setActa((previo) => ({ ...previo, testigo: evento.target.value }))}
          />
          <CampoTexto
            etiqueta="Cargo o entidad del testigo"
            requerido
            value={acta.cargoTestigo}
            error={erroresActa.cargoTestigo}
            onChange={(evento) =>
              setActa((previo) => ({ ...previo, cargoTestigo: evento.target.value }))
            }
          />
        </div>
      </DialogoFormulario>
    </div>
  );
};
