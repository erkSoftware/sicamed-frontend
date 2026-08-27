import { useState } from "react";
import { Link } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { Buscador } from "../../../shared/ui/patrones/Buscador";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { iniciales, numero } from "../../../shared/i18n/formato";
import { usePermiso } from "../../../shared/rbac/usePermiso";
import { ColumnaActores } from "../componentes/ColumnaActores";
import { useDirectorio } from "../hooks/useDirectorio";

const TONO_ESTADO = {
  HABILITADA: "exito",
  EN_TRAMITE: "alerta",
  SUSPENDIDA: "peligro",
  VENCIDA: "peligro",
} as const;

export const DirectorioActores = () => {
  const [busqueda, setBusqueda] = useState("");
  const consulta = useDirectorio(busqueda);
  const puedeVerClinico = usePermiso("clinico:atencion:leer");
  const datos = consulta.data;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Directorio de actores"
        subtitulo="Los cinco eslabones del proceso del cannabis medicinal en Colombia. Cada ficha es un actor registrado; los datos de pacientes viven en la zona clínica y nunca se mezclan con esta vista."
      />

      <div className="fila" style={{ gap: "var(--e3)", flexWrap: "wrap" }}>
        <Buscador
          valor={busqueda}
          onCambiar={setBusqueda}
          etiqueta="Buscar actor por nombre"
          marcador="Buscar por razón social, médico o especialidad"
        />
        <span className="fila" style={{ gap: "var(--e2)", color: "var(--texto-tenue)", fontSize: "var(--texto-sm)" }}>
          <Icono nombre="filtro" tamano={16} />
          Filtros aplicados sobre el registro nacional
        </span>
      </div>

      <EstadoConsulta cargando={consulta.isLoading} error={consulta.error} onReintentar={() => void consulta.refetch()}>
        {datos ? (
          <div className="directorio">
            <ColumnaActores
              titulo="Proveedores"
              total={datos.totales.proveedores}
              visibles={datos.proveedores.length}
              icono="hoja"
            >
              {datos.proveedores.map((actor) => (
                <li key={actor.id}>
                  <Link to={`/app/organizacion/${actor.id}`} className="ficha">
                    <span className="ficha__medio" aria-hidden="true">
                      <Icono nombre="hoja" tamano={18} />
                    </span>
                    <span className="ficha__cuerpo">
                      <span className="ficha__titulo">{actor.nombre}</span>
                      <span className="ficha__meta">
                        <span>{actor.municipio}</span>
                        <Insignia tono={TONO_ESTADO[actor.estado]}>{actor.estado.replace("_", " ")}</Insignia>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ColumnaActores>

            <ColumnaActores
              titulo="Dispensadores"
              total={datos.totales.dispensadores}
              visibles={datos.dispensadores.length}
              icono="vitrina"
            >
              {datos.dispensadores.map((actor) => (
                <li key={actor.id}>
                  <Link to={`/app/organizacion/${actor.id}`} className="ficha">
                    <span className="ficha__medio" aria-hidden="true">
                      <Icono nombre="vitrina" tamano={18} />
                    </span>
                    <span className="ficha__cuerpo">
                      <span className="ficha__titulo">{actor.nombre}</span>
                      <span className="ficha__meta">
                        <span>{actor.departamento}</span>
                        <Insignia tono={TONO_ESTADO[actor.estado]}>{actor.estado.replace("_", " ")}</Insignia>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ColumnaActores>

            <ColumnaActores
              titulo="EPS / IPS"
              total={datos.totales.ips}
              visibles={datos.prestadores.length}
              icono="edificio"
            >
              {datos.prestadores.map((actor) => (
                <li key={actor.id}>
                  <Link to={`/app/organizacion/${actor.id}`} className="ficha">
                    <span className="ficha__medio" aria-hidden="true">
                      <Icono nombre="edificio" tamano={18} />
                    </span>
                    <span className="ficha__cuerpo">
                      <span className="ficha__titulo">{actor.nombre}</span>
                      <span className="ficha__meta">
                        <span>{actor.municipio}</span>
                        <Insignia tono={TONO_ESTADO[actor.estado]}>{actor.estado.replace("_", " ")}</Insignia>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ColumnaActores>

            <ColumnaActores
              titulo="Médicos"
              total={datos.totales.medicos}
              visibles={datos.medicos.length}
              icono="medico"
            >
              {datos.medicos.map((medico) => (
                <li key={medico.id}>
                  <div className="ficha">
                    <span className="avatar" aria-hidden="true">
                      {iniciales(medico.nombre.replace("Dr. ", ""))}
                    </span>
                    <span className="ficha__cuerpo">
                      <span className="ficha__titulo">{medico.nombre}</span>
                      <span className="ficha__meta">
                        <span>{medico.especialidad}</span>
                        <span className="mono">{medico.rethus}</span>
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ColumnaActores>

            <ColumnaActores
              titulo="Pacientes"
              total={datos.totales.pacientes}
              visibles={0}
              icono="pacientes"
              pie={
                <div style={{ padding: "var(--e4)", borderTop: "1px solid var(--borde)" }}>
                  {puedeVerClinico ? (
                    <Link to="/app/salud/pacientes" className="boton boton--primario boton--sm boton--bloque">
                      Abrir zona clínica
                    </Link>
                  ) : (
                    <p style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
                      Requiere permiso <span className="mono">clinico:atencion:leer</span>.
                    </p>
                  )}
                </div>
              }
            >
              <li>
                <div className="aviso aviso--info" style={{ flexDirection: "column", gap: "var(--e2)" }}>
                  <span className="fila" style={{ gap: "var(--e2)", fontWeight: 600 }}>
                    <Icono nombre="candado" tamano={16} />
                    Zona clínica separada
                  </span>
                  <p style={{ fontSize: "var(--texto-sm)" }}>
                    Los {numero(datos.totales.pacientes)} pacientes son datos sensibles (Ley 1581 de
                    2012, Art. 5). No se listan junto a la información comercial: se consultan en un
                    módulo aparte, con caché deshabilitado y sin persistencia en el dispositivo.
                  </p>
                </div>
              </li>
            </ColumnaActores>
          </div>
        ) : null}
      </EstadoConsulta>
    </div>
  );
};
