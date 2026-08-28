import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { ErrorNormativo } from "../../../shared/ui/patrones/ErrorNormativo";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useAutor } from "../../../shared/auth/useAutor";
import { aProblema } from "../../../shared/api/problemDetails";
import { NOMBRE_DOCUMENTO } from "../../../shared/api/mock/datosProceso";
import { numero } from "../../../shared/i18n/formato";
import type { TipoActor } from "../../../shared/api/mock/tipos";
import { useGuardarPolitica, usePoliticaVerificacion } from "../hooks/useExpedientes";

const ETIQUETA_ACTOR: Record<TipoActor, string> = {
  CULTIVADOR: "Cultivador",
  TRANSFORMADOR: "Transformador",
  DISPENSADOR: "Dispensador",
  IPS: "IPS",
  LABORATORIO: "Laboratorio",
};

const ORDEN_ACTOR: readonly TipoActor[] = [
  "CULTIVADOR",
  "TRANSFORMADOR",
  "LABORATORIO",
  "DISPENSADOR",
  "IPS",
];

export const PoliticaVerificacion = () => {
  const consulta = usePoliticaVerificacion();
  const guardar = useGuardarPolitica();
  const autor = useAutor();
  const [obligatorios, setObligatorios] = useState<Record<string, boolean>>({});
  const [modos, setModos] = useState<Record<string, "MANUAL" | "AUTOMATICO">>({});

  const reglas = consulta.data?.reglas ?? [];
  const version = consulta.data?.version ?? "—";
  const esObligatorio = (id: string, valor: boolean) => obligatorios[id] ?? valor;
  const modoDe = (id: string, valor: "MANUAL" | "AUTOMATICO") => modos[id] ?? valor;

  const automaticas = reglas.filter(
    (regla) => modoDe(regla.id, regla.modo) === "AUTOMATICO",
  ).length;
  const requeridas = reglas.filter((regla) => esObligatorio(regla.id, regla.obligatorio)).length;

  const pendientes = reglas.filter(
    (regla) =>
      esObligatorio(regla.id, regla.obligatorio) !== regla.obligatorio ||
      modoDe(regla.id, regla.modo) !== regla.modo,
  );

  const publicar = () =>
    guardar.mutate(
      {
        reglas: reglas.map((regla) => ({
          id: regla.id,
          obligatorio: esObligatorio(regla.id, regla.obligatorio),
          modo: modoDe(regla.id, regla.modo),
        })),
        autor,
      },
      {
        onSuccess: () => {
          setObligatorios({});
          setModos({});
        },
      },
    );

  const descartar = () => {
    setObligatorios({});
    setModos({});
    guardar.reset();
  };

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Política de verificación"
        subtitulo="Qué documento exige el sistema a cada tipo de actor, cuál se comprueba contra un registro externo y cuál pasa por revisión humana. Solo el super administrador puede modificarla."
        acciones={
          <div className="fila" style={{ gap: "var(--e3)" }}>
            <Insignia tono="info">Versión {version}</Insignia>
            {pendientes.length > 0 ? (
              <>
                <Boton variante="secundario" onClick={descartar}>
                  Descartar
                </Boton>
                <Boton cargando={guardar.isPending} onClick={publicar}>
                  Publicar {pendientes.length} cambio{pendientes.length === 1 ? "" : "s"}
                </Boton>
              </>
            ) : null}
          </div>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Reglas configuradas" valor={numero(reglas.length)} icono="escudo" />
        <Kpi etiqueta="Documentos obligatorios" valor={numero(requeridas)} icono="licencias" />
        <Kpi
          etiqueta="Verificación automática"
          valor={numero(automaticas)}
          icono="cadena"
          nota="Contra RUES, MICC o ICA"
        />
        <Kpi
          etiqueta="Revisión humana"
          valor={numero(reglas.length - automaticas)}
          icono="usuario"
          nota="Asignada a un analista documental"
        />
      </div>

      <div className="aviso aviso--alerta">
        <Icono nombre="candado" tamano={18} />
        <p>
          Cambiar una regla no reabre los expedientes ya aprobados. La política se resuelve al
          radicar y queda congelada en el expediente con su número de versión. Publicar genera una
          versión nueva y un evento de trazabilidad con el usuario que lo hizo.
        </p>
      </div>

      {guardar.error ? (
        <ErrorNormativo problema={aProblema(guardar.error)} onReintentar={() => guardar.reset()} />
      ) : null}

      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        <div className="rejilla rejilla--2">
          {ORDEN_ACTOR.filter((actor) => reglas.some((regla) => regla.tipoActor === actor)).map(
            (actor) => (
              <Tarjeta
                key={actor}
                titulo={ETIQUETA_ACTOR[actor]}
                descripcion={`${reglas.filter((regla) => regla.tipoActor === actor).length} reglas activas para este tipo de actor`}
                sinRelleno
              >
                <ul className="politica">
                  {reglas
                    .filter((regla) => regla.tipoActor === actor)
                    .map((regla) => {
                      const obligatorio = esObligatorio(regla.id, regla.obligatorio);
                      const modo = modoDe(regla.id, regla.modo);
                      const modificada =
                        obligatorio !== regla.obligatorio || modo !== regla.modo;
                      return (
                        <li key={regla.id} className="politica__regla">
                          <span className="politica__cuerpo">
                            <strong>
                              {NOMBRE_DOCUMENTO[regla.documento]}
                              {modificada ? (
                                <span className="politica__pendiente"> · sin publicar</span>
                              ) : null}
                            </strong>
                            <span className="politica__norma mono">{regla.norma}</span>
                            <span className="politica__norma">
                              {regla.vigenciaMeses
                                ? `Vigencia exigida: ${regla.vigenciaMeses} meses`
                                : "Sin vigencia exigida"}
                            </span>
                          </span>
                          <span className="politica__mandos">
                            <Boton
                              variante={obligatorio ? "secundario" : "fantasma"}
                              tamano="sm"
                              aria-pressed={obligatorio}
                              onClick={() =>
                                setObligatorios((previos) => ({
                                  ...previos,
                                  [regla.id]: !obligatorio,
                                }))
                              }
                            >
                              {obligatorio ? "Obligatorio" : "Opcional"}
                            </Boton>
                            <Boton
                              variante="fantasma"
                              tamano="sm"
                              onClick={() =>
                                setModos((previos) => ({
                                  ...previos,
                                  [regla.id]: modo === "MANUAL" ? "AUTOMATICO" : "MANUAL",
                                }))
                              }
                            >
                              {modo === "AUTOMATICO" ? "Automática" : "Manual"}
                            </Boton>
                            <Insignia tono={modo === "AUTOMATICO" ? "exito" : "info"}>
                              {modo === "AUTOMATICO" ? "Registro externo" : "Analista"}
                            </Insignia>
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </Tarjeta>
            ),
          )}
        </div>
      </EstadoConsulta>
    </div>
  );
};
