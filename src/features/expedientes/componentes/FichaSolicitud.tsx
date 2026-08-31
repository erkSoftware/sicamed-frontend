import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import { Dialogo } from "../../../shared/ui/primitivos/Dialogo";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { ErrorNormativo } from "../../../shared/ui/patrones/ErrorNormativo";
import { VisorDeArchivo } from "../../../shared/ui/patrones/VisorDeArchivo";
import type { ArchivoVisible } from "../../../shared/ui/patrones/VisorDeArchivo";
import { apiComercial } from "../../../shared/api/clienteComercial";
import { aProblema } from "../../../shared/api/problemDetails";
import { fechaCorta } from "../../../shared/i18n/formato";
import { nombreDeDepartamento, nombreDeMunicipio } from "../../../shared/ubicacion/divipola";
import { useRequisitos } from "../../../publico/registro/requisitos";
import { useSolicitud } from "../hooks/useExpedientes";
import { etiquetaDeclarada, extensionDe, pesoLegible } from "../soportes";
import { ETIQUETA_ACTOR, ETIQUETA_SOLICITUD, TONO_SOLICITUD } from "../tramite";
import type { SolicitudRegistro } from "../../../shared/api/mock/tipos";

type Props = {
  solicitud: SolicitudRegistro | null;
  onCerrar: () => void;
};

const Dato = ({ rotulo, children }: { rotulo: string; children: ReactNode }) => (
  <div className="ficha__dato">
    <dt>{rotulo}</dt>
    <dd>{children}</dd>
  </div>
);

export const FichaSolicitud = ({ solicitud, onCerrar }: Props) => {
  const [enPantalla, setEnPantalla] = useState<number | null>(null);

  const detalle = useSolicitud(solicitud?.id ?? null);
  const requisitos = useRequisitos(solicitud?.tipoActor ?? "CULTIVADOR", solicitud !== null);

  const declarados = useMemo(() => detalle.data?.declarados ?? [], [detalle.data]);

  const consultas = useQueries({
    queries: declarados.map((declarado) => ({
      queryKey: ["comercial", "soporte", declarado.soporteId],
      queryFn: () => apiComercial.archivoDeSoporte(declarado.soporteId),
      enabled: declarado.soporteId !== "",
      staleTime: 5 * 60_000,
      retry: false,
    })),
  });

  const catalogo = requisitos.data?.documentos ?? [];

  const archivos: readonly ArchivoVisible[] = declarados.map((declarado, i) => ({
    id: declarado.soporteId,
    titulo: etiquetaDeclarada(declarado.tipo, catalogo),
    nombre: declarado.nombre,
    url: consultas[i]?.data?.url ?? "",
    mime: consultas[i]?.data?.mime ?? "",
    bytes: consultas[i]?.data?.bytes ?? 0,
    cargando: consultas[i]?.isPending && declarado.soporteId !== "",
  }));

  if (!solicitud) return null;

  const ubicacion = `${nombreDeMunicipio(solicitud.municipio)}, ${nombreDeDepartamento(solicitud.departamento)}`;

  return (
    <>
      <Dialogo
        abierto={enPantalla === null}
        titulo={solicitud.organizacion}
        onCerrar={onCerrar}
        ancho
        pie={
          <Boton variante="secundario" onClick={onCerrar}>
            Cerrar
          </Boton>
        }
      >
        <dl className="ficha__datos">
          <Dato rotulo="Estado">
            <Insignia tono={TONO_SOLICITUD[solicitud.estado]}>
              {ETIQUETA_SOLICITUD[solicitud.estado]}
            </Insignia>
          </Dato>
          <Dato rotulo="Radicada">{fechaCorta(solicitud.recibida)}</Dato>
          <Dato rotulo="NIT">
            <span className="mono">{solicitud.nit}</span>
          </Dato>
          <Dato rotulo="Tipo de actor">{ETIQUETA_ACTOR[solicitud.tipoActor]}</Dato>
          <Dato rotulo="Ubicación">{ubicacion}</Dato>
          <Dato rotulo="Representante legal">{solicitud.representante}</Dato>
          <Dato rotulo="Correo">
            <span className="mono">{solicitud.correo}</span>
            {solicitud.correoVerificado === false ? (
              <span className="ficha__meta">Sin verificar</span>
            ) : null}
          </Dato>
          <Dato rotulo="Teléfono">
            <span className="mono">{solicitud.telefono}</span>
          </Dato>
          <Dato rotulo="Expediente">
            {solicitud.expedienteId ? (
              <span className="mono">{solicitud.expedienteId}</span>
            ) : (
              <span className="ficha__meta">Todavía sin abrir</span>
            )}
          </Dato>
          <Dato rotulo="Organización inscrita">
            {detalle.data?.organizacionId ? (
              <span className="mono">{detalle.data.organizacionId}</span>
            ) : (
              <span className="ficha__meta">Aún no existe con ese NIT</span>
            )}
          </Dato>
        </dl>

        {solicitud.motivoRechazo ? (
          <div className="aviso aviso--alerta">
            <Icono nombre="alerta" tamano={18} />
            <p>{solicitud.motivoRechazo}</p>
          </div>
        ) : null}

        <h3 className="ficha__titulo">Soportes adjuntos</h3>

        {detalle.error ? (
          <ErrorNormativo
            problema={aProblema(detalle.error)}
            onReintentar={() => void detalle.refetch()}
          />
        ) : null}

        {detalle.isPending ? <p className="ficha__meta">Leyendo la ficha…</p> : null}

        {!detalle.isPending && declarados.length === 0 ? (
          <p className="ficha__meta">
            Esta solicitud no declaró soportes, o el servidor todavía no los expone en el detalle.
          </p>
        ) : null}

        <ul className="ficha__soportes">
          {archivos.map((archivo, i) => (
            <li key={`${archivo.id}-${i}`} className="ficha__soporte">
              <Icono nombre="documento" tamano={20} />
              <div className="ficha__soporte-texto">
                <strong>{archivo.titulo}</strong>
                <span className="mono ficha__meta">{archivo.nombre}</span>
                <span className="ficha__meta">
                  {archivo.cargando
                    ? "Resolviendo el archivo…"
                    : archivo.url === ""
                      ? "El servidor no publicó una dirección"
                      : [extensionDe(archivo.nombre).toUpperCase(), pesoLegible(archivo.bytes)]
                          .filter(Boolean)
                          .join(" · ")}
                </span>
              </div>
              <div className="ficha__soporte-acciones">
                <Boton variante="secundario" tamano="sm" icono="ojo" onClick={() => setEnPantalla(i)}>
                  Ver
                </Boton>
                {archivo.url ? (
                  <a
                    className="boton boton--fantasma boton--sm"
                    href={archivo.url}
                    download={archivo.nombre}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icono nombre="descargar" tamano={15} />
                    Descargar
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Dialogo>

      <VisorDeArchivo
        abierto={enPantalla !== null}
        archivos={archivos}
        indice={enPantalla ?? 0}
        onIndice={setEnPantalla}
        onCerrar={() => setEnPantalla(null)}
      />
    </>
  );
};
