import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fechaLarga, numero, porcentaje } from "../../../shared/i18n/formato";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { ErrorNormativo } from "../../../shared/ui/patrones/ErrorNormativo";
import { useAutor } from "../../../shared/auth/useAutor";
import { aProblema } from "../../../shared/api/problemDetails";
import { useInscribirRueda, useRuedas } from "../hooks/useRuedas";

const TONO = {
  ABIERTA: "exito",
  EN_CURSO: "info",
  CERRADA: "neutro",
} as const;

export const RuedasNegocio = () => {
  const consulta = useRuedas();
  const inscribir = useInscribirRueda();
  const autor = useAutor();
  const ruedas = consulta.data ?? [];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Ruedas de negocio"
        subtitulo="Convocatorias de encuentro entre actores habilitados. La plataforma facilita el contacto; ninguna transacción económica ocurre dentro de SICAMED."
      />

      {inscribir.error ? (
        <ErrorNormativo problema={aProblema(inscribir.error)} onReintentar={() => inscribir.reset()} />
      ) : null}

      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {ruedas.length === 0 ? (
          <EstadoVacio
            icono="ruedas"
            titulo="No hay convocatorias abiertas"
            texto="Cuando una entidad convoque una rueda de negocios, la verás aquí con sus cupos y su enfoque."
          />
        ) : (
          <div className="rejilla rejilla--3">
            {ruedas.map((rueda) => (
              <Tarjeta
                key={rueda.id}
                titulo={rueda.nombre}
                descripcion={`${rueda.sede} · ${rueda.departamento}`}
                pie={
                  <SiTienePermiso
                    permiso="ruedas:convocatoria:inscribir"
                    alternativa={
                      <span className="pie-region">
                        {rueda.inscritos} de {rueda.cupos} cupos asignados
                      </span>
                    }
                  >
                    <Boton
                      variante={rueda.estado === "ABIERTA" ? "primario" : "secundario"}
                      tamano="sm"
                      bloque
                      disabled={rueda.estado !== "ABIERTA" || rueda.inscritos >= rueda.cupos}
                      cargando={inscribir.isPending && inscribir.variables?.id === rueda.id}
                      onClick={() => inscribir.mutate({ id: rueda.id, autor })}
                    >
                      {rueda.estado !== "ABIERTA"
                        ? "Convocatoria cerrada"
                        : rueda.inscritos >= rueda.cupos
                          ? "Sin cupos disponibles"
                          : "Inscribir organización"}
                    </Boton>
                  </SiTienePermiso>
                }
              >
                <div className="pila" style={{ gap: "var(--e3)" }}>
                  <div className="fila" style={{ gap: "var(--e2)", flexWrap: "wrap" }}>
                    <Insignia tono={TONO[rueda.estado]}>{rueda.estado.replace("_", " ")}</Insignia>
                    <Insignia tono="acento">{rueda.modalidad}</Insignia>
                  </div>
                  <p className="fila" style={{ gap: "var(--e2)", color: "var(--texto-suave)" }}>
                    <Icono nombre="agenda" tamano={16} />
                    {fechaLarga(rueda.fecha)}
                  </p>
                  <p className="fila" style={{ gap: "var(--e2)", color: "var(--texto-suave)" }}>
                    <Icono nombre="escudo" tamano={16} />
                    Enfoque: {rueda.enfoque}
                  </p>
                  <div>
                    <div className="fila" style={{ justifyContent: "space-between", fontSize: "var(--texto-sm)" }}>
                      <span>Cupos ocupados</span>
                      <span className="mono">
                        {numero(rueda.inscritos)} / {numero(rueda.cupos)}
                      </span>
                    </div>
                    <div
                      style={{ height: 6, background: "var(--piedra-200)", borderRadius: 3, marginTop: 6 }}
                      role="progressbar"
                      aria-valuenow={rueda.inscritos}
                      aria-valuemin={0}
                      aria-valuemax={rueda.cupos}
                      aria-label={`Cupos ocupados: ${porcentaje(rueda.inscritos / rueda.cupos, 0)}`}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${(rueda.inscritos / rueda.cupos) * 100}%`,
                          background: "var(--verde-500)",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Tarjeta>
            ))}
          </div>
        )}
      </EstadoConsulta>
    </div>
  );
};
