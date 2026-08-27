import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Buscador } from "../../../shared/ui/patrones/Buscador";
import { GrupoFiltros } from "../../../shared/ui/patrones/GrupoFiltros";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fechaLarga } from "../../../shared/i18n/formato";
import { useAgenda } from "../../pacientes/hooks/usePacientes";

const TONO = {
  PROGRAMADA: "info",
  CONFIRMADA: "exito",
  ATENDIDA: "neutro",
  CANCELADA: "peligro",
  NO_ASISTIO: "alerta",
} as const;

export const Agenda = () => {
  const [busqueda, setBusqueda] = useState("");
  const [modalidad, setModalidad] = useState("");
  const consulta = useAgenda({ busqueda, tipo: modalidad });
  const citas = consulta.data ?? [];

  const porDia = citas.reduce<Record<string, typeof citas>>((acumulado, cita) => {
    const clave = cita.fecha.slice(0, 10);
    acumulado[clave] = [...(acumulado[clave] ?? []), cita];
    return acumulado;
  }, {});

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Agenda clínica"
        subtitulo="Citas de valoración, control y titulación. Los datos de esta pantalla no se conservan al cerrar el módulo."
        acciones={<Boton icono="mas">Agendar cita</Boton>}
      />

      <div className="fila" style={{ gap: "var(--e3)", flexWrap: "wrap" }}>
        <Buscador
          valor={busqueda}
          onCambiar={setBusqueda}
          etiqueta="Buscar cita"
          marcador="Buscar por paciente o profesional"
        />
        <GrupoFiltros
          etiqueta="Filtrar por modalidad"
          valor={modalidad}
          onCambiar={setModalidad}
          opciones={[
            { valor: "", etiqueta: "Todas" },
            { valor: "TELECONSULTA", etiqueta: "Teleconsulta" },
            { valor: "PRESENCIAL", etiqueta: "Presencial" },
          ]}
        />
      </div>

      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {citas.length === 0 ? (
          <EstadoVacio
            icono="agenda"
            titulo="No hay citas con esos criterios"
            texto="Ajusta los filtros o agenda una nueva cita de control para un paciente en tratamiento."
          />
        ) : (
          <div className="pila" style={{ gap: "var(--e5)" }}>
            {Object.entries(porDia).map(([dia, citasDelDia]) => (
              <Tarjeta key={dia} titulo={fechaLarga(dia)} descripcion={`${citasDelDia.length} citas`} sinRelleno>
                <ul style={{ listStyle: "none", padding: "var(--e3)", margin: 0, display: "grid", gap: "var(--e2)" }}>
                  {citasDelDia.map((cita) => (
                    <li key={cita.id}>
                      <div className="ficha">
                        <span className="ficha__medio" aria-hidden="true">
                          <Icono nombre={cita.modalidad === "TELECONSULTA" ? "teleconsulta" : "agenda"} tamano={18} />
                        </span>
                        <span className="ficha__cuerpo">
                          <span className="ficha__titulo">{cita.paciente}</span>
                          <span className="ficha__meta">
                            <span className="mono">
                              {new Date(cita.fecha).toLocaleTimeString("es-CO", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>{cita.motivo}</span>
                            <span>{cita.profesional}</span>
                            <span>{cita.duracionMinutos} min</span>
                          </span>
                        </span>
                        <Insignia tono={TONO[cita.estado]}>{cita.estado.replace("_", " ")}</Insignia>
                      </div>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            ))}
          </div>
        )}
      </EstadoConsulta>
    </div>
  );
};
