import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { GrupoFiltros } from "../../../shared/ui/patrones/GrupoFiltros";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fechaHora, numero } from "../../../shared/i18n/formato";
import { useAmbiente, useConexiones } from "../hooks/useConexiones";

const TONO_CONEXION = {
  OPERATIVA: "exito",
  DEGRADADA: "alerta",
  SIN_RESPUESTA: "peligro",
  NO_CONECTADA: "neutro",
} as const;

const ETIQUETA_CONEXION = {
  OPERATIVA: "Operativa",
  DEGRADADA: "Degradada",
  SIN_RESPUESTA: "Sin respuesta",
  NO_CONECTADA: "Sin interfaz",
} as const;

const ETIQUETA_DIRECCION = {
  CONSULTA: "SICAMED consulta",
  REPORTE: "SICAMED reporta",
  BIDIRECCIONAL: "Doble vía",
} as const;

const TONO_LECTURA = {
  EN_RANGO: "exito",
  FUERA_DE_RANGO: "alerta",
  SIN_SENAL: "neutro",
} as const;

const ETIQUETA_LECTURA = {
  EN_RANGO: "En rango",
  FUERA_DE_RANGO: "Fuera de rango",
  SIN_SENAL: "Sin señal",
} as const;

export const Conexiones = () => {
  const [estadoLectura, setEstadoLectura] = useState("");
  const conexiones = useConexiones();
  const ambiente = useAmbiente({ estado: estadoLectura });

  const registros = conexiones.data ?? [];
  const operativas = registros.filter((conexion) => conexion.estado === "OPERATIVA").length;
  const discrepancias = registros.reduce((suma, conexion) => suma + conexion.discrepancias, 0);
  const conciliados = registros.reduce((suma, conexion) => suma + conexion.conciliados, 0);

  const lecturas = ambiente.data ?? [];
  const alertas = lecturas.filter((lectura) => lectura.estado === "FUERA_DE_RANGO").length;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Conexiones y telemetría"
        subtitulo="SICAMED no es la fuente de la verdad sobre licencias, registros sanitarios ni cupos: los lee de quien los expide. Aquí se ve el estado real de cada conexión y de los sensores en campo."
      />

      <div className="rejilla-kpi">
        <Kpi
          etiqueta="Conexiones declaradas"
          valor={numero(registros.length)}
          icono="cadena"
          nota={`${operativas} operativas`}
        />
        <Kpi etiqueta="Registros conciliados" valor={numero(conciliados)} icono="check" />
        <Kpi
          etiqueta="Discrepancias abiertas"
          valor={numero(discrepancias)}
          icono="alerta"
          nota="Dato del registro externo distinto al declarado"
        />
        <Kpi
          etiqueta="Sensores fuera de rango"
          valor={numero(alertas)}
          icono="reloj"
          nota={`${lecturas.length} lecturas en el período`}
        />
      </div>

      <div className="aviso aviso--info">
        <Icono nombre="mundo" tamano={18} />
        <p>
          Cuando una conexión está degradada o sin interfaz, el dato se toma de lo que declaró el
          actor y queda marcado como no conciliado. El trámite ante el <strong>FNE</strong> no
          tiene interfaz técnica: se surte por fuera y solo regresa como declaración.
        </p>
      </div>

      <EstadoConsulta
        cargando={conexiones.isLoading}
        error={conexiones.error}
        onReintentar={() => void conexiones.refetch()}
      >
        <ul className="conexiones">
          {registros.map((conexion) => (
            <li key={conexion.id} className="conexiones__item" data-estado={conexion.estado}>
              <span className="conexiones__sigla mono">{conexion.sigla}</span>
              <span className="conexiones__cuerpo">
                <strong>{conexion.nombre}</strong>
                <span className="conexiones__entidad">{conexion.entidad}</span>
                <span className="conexiones__proposito">{conexion.proposito}</span>
                <span className="conexiones__mecanismo mono">{conexion.mecanismo}</span>
                <span className="conexiones__norma mono">{conexion.norma}</span>
              </span>
              <span className="conexiones__estado">
                <Insignia tono={TONO_CONEXION[conexion.estado]}>
                  {ETIQUETA_CONEXION[conexion.estado]}
                </Insignia>
                <span className="conexiones__meta">{ETIQUETA_DIRECCION[conexion.direccion]}</span>
                <span className="conexiones__cifras mono">
                  <span>{numero(conexion.conciliados)} conciliados</span>
                  <span data-alerta={conexion.discrepancias > 0 ? "si" : "no"}>
                    {numero(conexion.discrepancias)} discrepancias
                  </span>
                </span>
                <span className="conexiones__meta mono">
                  Última lectura: {fechaHora(conexion.ultimaLectura)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </EstadoConsulta>

      <Tarjeta
        titulo="Telemetría ambiental de los predios"
        descripcion="Temperatura, humedad relativa, conductividad del sustrato e intensidad lumínica por bloque de cultivo"
        sinRelleno
        acciones={
          <GrupoFiltros
            etiqueta="Filtrar por estado"
            valor={estadoLectura}
            onCambiar={setEstadoLectura}
            opciones={[
              { valor: "", etiqueta: "Todas" },
              { valor: "EN_RANGO", etiqueta: "En rango" },
              { valor: "FUERA_DE_RANGO", etiqueta: "Fuera de rango" },
              { valor: "SIN_SENAL", etiqueta: "Sin señal" },
            ]}
          />
        }
        pie={
          <p className="pie-region mono">
            La telemetría respalda el certificado de Buenas Prácticas Agrícolas · no sustituye la
            inspección en campo
          </p>
        }
      >
        <EstadoConsulta
          cargando={ambiente.isLoading}
          error={ambiente.error}
          onReintentar={() => void ambiente.refetch()}
        >
          {lecturas.length === 0 ? (
            <EstadoVacio
              icono="mapa"
              titulo="No hay lecturas con ese estado"
              texto="Cambia el filtro para ver las lecturas registradas por los sensores de campo."
            />
          ) : (
            <RegionDesplazable etiqueta="Lecturas de telemetría ambiental" alto={420}>
              <ul className="telemetria">
                {lecturas.map((lectura) => (
                  <li key={lectura.id} className="telemetria__item" data-estado={lectura.estado}>
                    <span className="telemetria__origen">
                      <strong>{lectura.cultivo}</strong>
                      <span>
                        {lectura.bloque} · {lectura.departamento}
                      </span>
                    </span>
                    <span className="telemetria__medidas mono">
                      <span>
                        <span className="telemetria__rotulo">Temp</span>
                        {lectura.estado === "SIN_SENAL" ? "—" : `${lectura.temperatura.toFixed(1)} °C`}
                      </span>
                      <span>
                        <span className="telemetria__rotulo">HR</span>
                        {lectura.estado === "SIN_SENAL" ? "—" : `${lectura.humedad.toFixed(1)} %`}
                      </span>
                      <span>
                        <span className="telemetria__rotulo">CE</span>
                        {lectura.estado === "SIN_SENAL" ? "—" : `${lectura.conductividad.toFixed(1)} mS`}
                      </span>
                      <span>
                        <span className="telemetria__rotulo">Luz</span>
                        {lectura.estado === "SIN_SENAL" ? "—" : `${numero(lectura.luz)} µmol`}
                      </span>
                    </span>
                    <span className="telemetria__estado">
                      <Insignia tono={TONO_LECTURA[lectura.estado]}>
                        {ETIQUETA_LECTURA[lectura.estado]}
                      </Insignia>
                      <span className="telemetria__fecha mono">{fechaHora(lectura.registro)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </RegionDesplazable>
          )}
        </EstadoConsulta>
      </Tarjeta>
    </div>
  );
};
