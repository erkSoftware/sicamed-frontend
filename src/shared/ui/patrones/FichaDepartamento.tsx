import { Dialogo } from "../primitivos/Dialogo";
import { Insignia } from "../primitivos/Insignia";
import { EnlaceBoton } from "../primitivos/EnlaceBoton";
import { resumenDepartamento } from "../../api/mock/departamentos";
import { fecha, numero } from "../../i18n/formato";

type Props = {
  codigo: string | null;
  onCerrar: () => void;
};

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
  ETIQUETA_EVENTO[clave] ??
  clave.charAt(0) + clave.slice(1).toLowerCase().replace(/_/g, " ");

const ETIQUETA_ESTADO_CULTIVO: Record<string, string> = {
  PREPARACION: "Preparación",
  VEGETATIVO: "Vegetativo",
  FLORACION: "Floración",
  COSECHA: "Cosecha",
  CERRADO: "Cerrado",
};

export const FichaDepartamento = ({ codigo, onCerrar }: Props) => {
  const resumen = codigo ? resumenDepartamento(codigo) : null;

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

          <section className="ficha-dpto__bloque">
            <h3 className="ficha-dpto__titulo">Cultivo</h3>
            <p className="ficha-dpto__resumen">
              {`${numero(resumen.cultivos.length)} predios registrados · ${numero(resumen.areaHectareas)} ha sembradas · ${numero(resumen.plantas)} plantas en pie`}
              {resumen.cultivosPsicoactivos > 0
                ? ` · ${numero(resumen.cultivosPsicoactivos)} con licencia psicoactiva`
                : " · ninguno psicoactivo"}
            </p>

            {resumen.variedades.length > 0 ? (
              <ul className="ficha-dpto__variedades">
                {resumen.variedades.slice(0, 5).map((item) => (
                  <li key={item.variedad}>
                    <span>{item.variedad}</span>
                    <span className="mono">{`${numero(item.plantas)} plantas`}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ficha-dpto__vacio">Sin predios registrados en este departamento.</p>
            )}

            {resumen.cultivos.length > 0 ? (
              <ul className="ficha-dpto__lista">
                {resumen.cultivos.slice(0, 4).map((cultivo) => (
                  <li key={cultivo.id}>
                    <span className="ficha-dpto__principal">{cultivo.nombre}</span>
                    <span className="ficha-dpto__meta">
                      {`${cultivo.municipio} · ${cultivo.variedad} · ${numero(cultivo.areaHectareas)} ha`}
                    </span>
                    <Insignia tono={cultivo.estado === "COSECHA" ? "exito" : "neutro"}>
                      {ETIQUETA_ESTADO_CULTIVO[cultivo.estado] ?? cultivo.estado}
                    </Insignia>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="ficha-dpto__bloque">
            <h3 className="ficha-dpto__titulo">Producto y trazabilidad</h3>
            <p className="ficha-dpto__resumen">
              {`${numero(resumen.lotes.length)} lotes con cadena de custodia · ${numero(resumen.lotesEnTransito)} en tránsito · ${numero(resumen.ofertasPublicadas)} ofertas publicadas`}
              {resumen.lotesRetenidos > 0 ? ` · ${numero(resumen.lotesRetenidos)} retenidos` : ""}
            </p>

            {resumen.eventos.length > 0 ? (
              <ol className="ficha-dpto__eventos">
                {resumen.eventos.map((evento) => (
                  <li key={evento.id}>
                    <span className="mono">{fecha(evento.fecha)}</span>
                    <span className="ficha-dpto__principal">{humanizar(evento.tipo)}</span>
                    <span className="ficha-dpto__meta">{evento.actor}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="ficha-dpto__vacio">Sin eventos de trazabilidad en el período.</p>
            )}
          </section>

          <section className="ficha-dpto__bloque">
            <h3 className="ficha-dpto__titulo">Actores habilitados</h3>
            <p className="ficha-dpto__resumen">
              {`${numero(resumen.organizaciones.length)} organizaciones · ${numero(resumen.habilitadas)} habilitadas · ${numero(resumen.atestacionesVigentes)} atestaciones vigentes`}
            </p>
            {resumen.municipios.length > 0 ? (
              <p className="ficha-dpto__meta">{`Municipios con presencia: ${resumen.municipios.join(", ")}`}</p>
            ) : null}
          </section>
        </div>
      ) : null}
    </Dialogo>
  );
};
