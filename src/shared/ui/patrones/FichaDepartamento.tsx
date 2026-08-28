import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Dialogo } from "../primitivos/Dialogo";
import { Insignia } from "../primitivos/Insignia";
import type { TonoInsignia } from "../primitivos/Insignia";
import { EnlaceBoton } from "../primitivos/EnlaceBoton";
import { Icono, type NombreIcono } from "../primitivos/Icono";
import { resumenDepartamento } from "../../api/mock/departamentos";
import { fecha, numero } from "../../i18n/formato";

type Props = {
  codigo: string | null;
  onCerrar: () => void;
};

type Seccion = "cultivo" | "trazabilidad" | "actores";

type Dato = {
  rotulo: string;
  valor: string;
  alerta?: boolean;
};

const SECCIONES: readonly { id: Seccion; etiqueta: string; icono: NombreIcono; ayuda: string }[] = [
  {
    id: "cultivo",
    etiqueta: "Cultivo",
    icono: "hoja",
    ayuda: "Qué se siembra en el departamento, con cuánta área y bajo qué licencia.",
  },
  {
    id: "trazabilidad",
    etiqueta: "Trazabilidad",
    icono: "cadena",
    ayuda: "Los lotes en circulación y los hechos ya sellados en el ledger.",
  },
  {
    id: "actores",
    etiqueta: "Actores",
    icono: "organizacion",
    ayuda: "Quién está habilitado para operar y en qué municipios.",
  },
];

const SECCION_RESPALDO = SECCIONES[0] as (typeof SECCIONES)[number];

const ETIQUETA_EVENTO: Record<string, string> = {
  ORGANIZACION_REGISTRADA: "Organización registrada",
  ATESTACION_EXPEDIDA: "Atestación expedida",
  ATESTACION_RENOVADA: "Atestación renovada",
  CULTIVO_REGISTRADO: "Cultivo registrado",
  COSECHA_REPORTADA: "Cosecha reportada",
  LOTE_CREADO: "Lote creado",
  LOTE_TRASLADADO: "Lote trasladado",
  LOTE_RETENIDO: "Lote retenido",
  OFERTA_PUBLICADA: "Oferta publicada",
  DISPENSACION_CONFIRMADA: "Dispensación confirmada",
};

const humanizar = (clave: string): string =>
  ETIQUETA_EVENTO[clave] ?? clave.charAt(0) + clave.slice(1).toLowerCase().replace(/_/g, " ");

const ETIQUETA_ESTADO_CULTIVO: Record<string, string> = {
  PREPARACION: "Preparación",
  VEGETATIVO: "Vegetativo",
  FLORACION: "Floración",
  COSECHA: "Cosecha",
  CERRADO: "Cerrado",
};

const TONO_ESTADO_CULTIVO: Record<string, TonoInsignia> = {
  PREPARACION: "neutro",
  VEGETATIVO: "info",
  FLORACION: "acento",
  COSECHA: "exito",
  CERRADO: "neutro",
};

const ETIQUETA_HABILITACION: Record<string, string> = {
  HABILITADA: "Habilitada",
  EN_TRAMITE: "En trámite",
  SUSPENDIDA: "Suspendida",
  VENCIDA: "Vencida",
};

const TONO_HABILITACION: Record<string, TonoInsignia> = {
  HABILITADA: "exito",
  EN_TRAMITE: "alerta",
  SUSPENDIDA: "peligro",
  VENCIDA: "peligro",
};

const Datos = ({ items }: { items: readonly Dato[] }) => (
  <dl className="ficha-dpto__datos">
    {items.map((item) => (
      <div key={item.rotulo} className="ficha-dpto__dato" data-alerta={item.alerta ? "si" : undefined}>
        <dt>{item.rotulo}</dt>
        <dd>{item.valor}</dd>
      </div>
    ))}
  </dl>
);

export const FichaDepartamento = ({ codigo, onCerrar }: Props) => {
  const resumen = codigo ? resumenDepartamento(codigo) : null;
  const [seccion, setSeccion] = useState<Seccion>("cultivo");
  const pestanas = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (codigo) setSeccion("cultivo");
  }, [codigo]);

  const activa = SECCIONES.find((item) => item.id === seccion) ?? SECCION_RESPALDO;

  const conteo: Record<Seccion, number> = {
    cultivo: resumen?.cultivos.length ?? 0,
    trazabilidad: resumen?.lotes.length ?? 0,
    actores: resumen?.organizaciones.length ?? 0,
  };

  const navegar = (evento: KeyboardEvent<HTMLButtonElement>) => {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const orden = SECCIONES.findIndex((item) => item.id === seccion);
    const salto = evento.key === "ArrowRight" ? 1 : SECCIONES.length - 1;
    const destino = SECCIONES[(orden + salto) % SECCIONES.length] ?? SECCION_RESPALDO;
    setSeccion(destino.id);
    pestanas.current?.querySelector<HTMLButtonElement>(`#pestana-${destino.id}`)?.focus();
  };

  return (
    <Dialogo
      abierto={Boolean(resumen)}
      titulo={resumen ? resumen.nombre : ""}
      onCerrar={onCerrar}
      ancho
      pie={
        resumen ? (
          <EnlaceBoton a={`/vitrina?departamento=${encodeURIComponent(resumen.nombre)}`} variante="primario">
            Ver ofertas del departamento
          </EnlaceBoton>
        ) : undefined
      }
    >
      {resumen ? (
        <div className="ficha-dpto">
          <p className="ficha-dpto__intro">
            {`Radiografía del departamento: la red registrada, lo que se cultiva y cómo se mueve el producto. Presencia en ${numero(resumen.municipios.length)} municipios.`}
          </p>

          <div className="ficha-dpto__red">
            <p className="ficha-dpto__rotulo">Red registrada</p>
            <dl className="ficha-dpto__cifras">
              <div>
                <dt>Proveedores</dt>
                <dd>{numero(resumen.proveedores)}</dd>
              </div>
              <div>
                <dt>Dispensadores</dt>
                <dd>{numero(resumen.dispensadores)}</dd>
              </div>
              <div>
                <dt>IPS</dt>
                <dd>{numero(resumen.ips)}</dd>
              </div>
              <div>
                <dt>Médicos</dt>
                <dd>{numero(resumen.medicos)}</dd>
              </div>
              <div>
                <dt>Pacientes</dt>
                <dd>{numero(resumen.pacientes)}</dd>
              </div>
            </dl>
          </div>

          <div
            className="pestanas ficha-dpto__pestanas"
            role="tablist"
            aria-label="Secciones del departamento"
            ref={pestanas}
          >
            {SECCIONES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`pestana-${item.id}`}
                className="pestana"
                aria-selected={seccion === item.id}
                aria-controls={`panel-${item.id}`}
                tabIndex={seccion === item.id ? 0 : -1}
                onClick={() => setSeccion(item.id)}
                onKeyDown={navegar}
              >
                <Icono nombre={item.icono} tamano={15} />
                {item.etiqueta}
                <span className="pestana__conteo">{numero(conteo[item.id])}</span>
              </button>
            ))}
          </div>

          <div
            className="ficha-dpto__panel"
            role="tabpanel"
            key={activa.id}
            id={`panel-${activa.id}`}
            aria-labelledby={`pestana-${activa.id}`}
            tabIndex={0}
          >
            <p className="ficha-dpto__ayuda">{activa.ayuda}</p>

            {seccion === "cultivo" ? (
              <>
                <Datos
                  items={[
                    { rotulo: "Predios registrados", valor: numero(resumen.cultivos.length) },
                    { rotulo: "Área sembrada", valor: `${numero(resumen.areaHectareas)} ha` },
                    { rotulo: "Plantas en pie", valor: numero(resumen.plantas) },
                    {
                      rotulo: "Licencia psicoactiva",
                      valor:
                        resumen.cultivosPsicoactivos > 0
                          ? `${numero(resumen.cultivosPsicoactivos)} predios`
                          : "Ninguno",
                    },
                  ]}
                />

                {resumen.variedades.length > 0 ? (
                  <section className="ficha-dpto__bloque">
                    <h3 className="ficha-dpto__titulo">Variedades sembradas</h3>
                    <ul className="ficha-dpto__variedades">
                      {resumen.variedades.slice(0, 5).map((item) => (
                        <li key={item.variedad}>
                          <span>{item.variedad}</span>
                          <span className="mono">{`${numero(item.plantas)} plantas`}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {resumen.cultivos.length > 0 ? (
                  <section className="ficha-dpto__bloque">
                    <h3 className="ficha-dpto__titulo">Predios</h3>
                    <ul className="ficha-dpto__lista">
                      {resumen.cultivos.slice(0, 4).map((cultivo) => (
                        <li key={cultivo.id}>
                          <span className="ficha-dpto__principal">{cultivo.nombre}</span>
                          <span className="ficha-dpto__meta">
                            {`${cultivo.municipio} · ${cultivo.variedad} · ${numero(cultivo.areaHectareas)} ha`}
                          </span>
                          <Insignia tono={TONO_ESTADO_CULTIVO[cultivo.estado] ?? "neutro"}>
                            {ETIQUETA_ESTADO_CULTIVO[cultivo.estado] ?? cultivo.estado}
                          </Insignia>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <p className="ficha-dpto__vacio">Sin predios registrados en este departamento.</p>
                )}
              </>
            ) : null}

            {seccion === "trazabilidad" ? (
              <>
                <Datos
                  items={[
                    { rotulo: "Lotes con custodia", valor: numero(resumen.lotes.length) },
                    { rotulo: "En tránsito", valor: numero(resumen.lotesEnTransito) },
                    {
                      rotulo: "Retenidos",
                      valor: numero(resumen.lotesRetenidos),
                      alerta: resumen.lotesRetenidos > 0,
                    },
                    { rotulo: "Ofertas publicadas", valor: numero(resumen.ofertasPublicadas) },
                  ]}
                />

                <section className="ficha-dpto__bloque">
                  <h3 className="ficha-dpto__titulo">Últimos hechos sellados</h3>
                  {resumen.eventos.length > 0 ? (
                    <ol className="ficha-dpto__eventos">
                      {resumen.eventos.map((evento) => (
                        <li key={evento.id}>
                          <span className="ficha-dpto__marca" aria-hidden="true">
                            <Icono nombre="check" tamano={11} />
                          </span>
                          <span className="ficha-dpto__principal">{humanizar(evento.tipo)}</span>
                          <span className="ficha-dpto__meta">
                            {`${fecha(evento.fecha)} · ${evento.actor}`}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="ficha-dpto__vacio">Sin eventos de trazabilidad en el período.</p>
                  )}
                </section>
              </>
            ) : null}

            {seccion === "actores" ? (
              <>
                <Datos
                  items={[
                    { rotulo: "Organizaciones", valor: numero(resumen.organizaciones.length) },
                    { rotulo: "Habilitadas", valor: numero(resumen.habilitadas) },
                    { rotulo: "Atestaciones vigentes", valor: numero(resumen.atestacionesVigentes) },
                    { rotulo: "Municipios", valor: numero(resumen.municipios.length) },
                  ]}
                />

                {resumen.organizaciones.length > 0 ? (
                  <section className="ficha-dpto__bloque">
                    <h3 className="ficha-dpto__titulo">Organizaciones</h3>
                    <ul className="ficha-dpto__lista">
                      {resumen.organizaciones.slice(0, 5).map((organizacion) => (
                        <li key={organizacion.id}>
                          <span className="ficha-dpto__principal">{organizacion.nombre}</span>
                          <span className="ficha-dpto__meta">
                            {`${organizacion.municipio} · NIT ${organizacion.nit}`}
                          </span>
                          <Insignia tono={TONO_HABILITACION[organizacion.estado] ?? "neutro"}>
                            {ETIQUETA_HABILITACION[organizacion.estado] ?? organizacion.estado}
                          </Insignia>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <p className="ficha-dpto__vacio">Sin organizaciones registradas en este departamento.</p>
                )}

                {resumen.municipios.length > 0 ? (
                  <section className="ficha-dpto__bloque">
                    <h3 className="ficha-dpto__titulo">Municipios con presencia</h3>
                    <ul className="ficha-dpto__variedades">
                      {resumen.municipios.map((municipio) => (
                        <li key={municipio}>
                          <span>{municipio}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </Dialogo>
  );
};
