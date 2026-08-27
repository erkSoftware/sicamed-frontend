import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fechaHora } from "../../../shared/i18n/formato";
import { useTeleconsultas } from "../../pacientes/hooks/usePacientes";

export const Teleconsulta = () => {
  const consulta = useTeleconsultas();
  const sesiones = consulta.data ?? [];
  const proximas = sesiones.filter((cita) => cita.estado === "PROGRAMADA" || cita.estado === "CONFIRMADA");

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Teleconsulta"
        subtitulo="Atención remota para pacientes en zonas sin oferta especializada cercana. La sesión de video no se graba ni se transcribe."
      />

      <div className="aviso aviso--alerta">
        <Icono nombre="escudo" tamano={18} />
        <p>
          Ninguna herramienta de monitoreo, grabación de sesión o mapa de calor opera dentro de{" "}
          <span className="mono">/app/salud</span>. Los reportes de error de esta zona se envían sin
          cuerpo de respuesta y con la ruta parametrizada.
        </p>
      </div>

      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {proximas.length === 0 ? (
          <EstadoVacio
            icono="teleconsulta"
            titulo="No hay teleconsultas programadas"
            texto="Cuando agendes una cita en modalidad de teleconsulta, aparecerá aquí con su enlace de sala."
          />
        ) : (
          <div className="rejilla rejilla--3">
            {proximas.map((cita) => (
              <Tarjeta
                key={cita.id}
                titulo={cita.paciente}
                descripcion={cita.motivo}
                pie={
                  <Boton
                    tamano="sm"
                    bloque
                    icono="teleconsulta"
                    disabled={cita.estado !== "CONFIRMADA"}
                  >
                    {cita.estado === "CONFIRMADA" ? "Entrar a la sala" : "Pendiente de confirmación"}
                  </Boton>
                }
              >
                <div className="pila" style={{ gap: "var(--e3)" }}>
                  <Insignia tono={cita.estado === "CONFIRMADA" ? "exito" : "info"}>
                    {cita.estado.replace("_", " ")}
                  </Insignia>
                  <p className="fila" style={{ gap: "var(--e2)", color: "var(--texto-suave)" }}>
                    <Icono nombre="reloj" tamano={16} />
                    {fechaHora(cita.fecha)} · {cita.duracionMinutos} min
                  </p>
                  <p className="fila" style={{ gap: "var(--e2)", color: "var(--texto-suave)" }}>
                    <Icono nombre="medico" tamano={16} />
                    {cita.profesional} · {cita.especialidad}
                  </p>
                </div>
              </Tarjeta>
            ))}
          </div>
        )}
      </EstadoConsulta>
    </div>
  );
};
