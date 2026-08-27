import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../shared/auth/useAuth";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { MapaColombia } from "../../../shared/ui/graficos/MapaColombia";
import { BarrasHorizontales } from "../../../shared/ui/graficos/BarrasHorizontales";
import { FlujoProceso } from "../../../shared/ui/graficos/FlujoProceso";
import { LineaTendencia } from "../../../shared/ui/graficos/LineaTendencia";
import { compacto, numero } from "../../../shared/i18n/formato";
import { PanelBienvenida } from "../componentes/PanelBienvenida";
import { ActividadReciente } from "../componentes/ActividadReciente";
import { useEventosRecientes, useIndicadores } from "../hooks/useIndicadores";
import { FichaDepartamento } from "../../../shared/ui/patrones/FichaDepartamento";
import { sonar } from "../../../shared/ui/sonido/almacen";
import { InterruptorSonido } from "../../../shared/ui/sonido/InterruptorSonido";

type Dimension = "proveedores" | "dispensadores" | "ips" | "medicos" | "pacientes";

const DIMENSIONES: readonly { clave: Dimension; etiqueta: string; icono: "hoja" | "vitrina" | "edificio" | "medico" | "pacientes" }[] = [
  { clave: "proveedores", etiqueta: "Proveedores", icono: "hoja" },
  { clave: "dispensadores", etiqueta: "Dispensadores", icono: "vitrina" },
  { clave: "ips", etiqueta: "IPS", icono: "edificio" },
  { clave: "medicos", etiqueta: "Médicos", icono: "medico" },
  { clave: "pacientes", etiqueta: "Pacientes", icono: "pacientes" },
];

const DIMENSIONES_RESPALDO = DIMENSIONES[0] as (typeof DIMENSIONES)[number];

export const Tablero = () => {
  const { sesion } = useAuth();
  const consulta = useIndicadores();
  const eventos = useEventosRecientes();
  const [dimension, setDimension] = useState<Dimension>("proveedores");
  const [departamentoAbierto, setDepartamentoAbierto] = useState<string | null>(null);

  const datos = consulta.data;
  const dimensionActual =
    DIMENSIONES.find((item) => item.clave === dimension) ?? DIMENSIONES_RESPALDO;

  return (
    <div className="pagina">
      <PanelBienvenida
        etiqueta="Centro de operación"
        titulo="CANNABIS MEDICINAL"
        texto={`Hola ${sesion?.usuario.nombre.split(" ")[0] ?? ""}. Este es el estado del ecosistema en tiempo real: actores registrados, cadena de custodia y cumplimiento normativo, todo en un solo lugar.`}
        acciones={[
          { etiqueta: "Vitrina", ruta: "/app/vitrina", icono: "vitrina", activa: true },
          { etiqueta: "Mis licencias", ruta: "/app/licencias", icono: "licencias" },
          { etiqueta: "Ledger de trazabilidad", ruta: "/app/trazabilidad", icono: "trazabilidad" },
        ]}
      />

      <EstadoConsulta cargando={consulta.isLoading} error={consulta.error} onReintentar={() => void consulta.refetch()}>
        {datos ? (
          <>
            <div className="rejilla-kpi">
              {DIMENSIONES.map((item) => (
                <Kpi
                  key={item.clave}
                  etiqueta={item.etiqueta}
                  cifra={datos.totales[item.clave]}
                  nota={item.clave === "pacientes" ? "Cobertura nacional estimada" : "Registrados en SICAMED"}
                  icono={item.icono}
                  delta={{ valor: item.clave === "medicos" ? "3,4%" : "1,8%", sube: true }}
                />
              ))}
            </div>

            <div className="rejilla rejilla--mapa">
              <Tarjeta
                titulo="Distribución territorial"
                descripcion={`Concentración de ${dimensionActual.etiqueta.toLowerCase()} por departamento`}
                acciones={
                  <div className="mapa__mandos">
                    <div className="grupo-filtros" role="group" aria-label="Dimensión del mapa">
                      {DIMENSIONES.map((item, orden) => (
                        <button
                          key={item.clave}
                          type="button"
                          aria-pressed={dimension === item.clave}
                          onClick={() => {
                            setDimension(item.clave);
                            sonar(orden);
                          }}
                        >
                          {item.etiqueta}
                        </button>
                      ))}
                    </div>
                    <InterruptorSonido />
                  </div>
                }
              >
                <MapaColombia
                  unidad={dimensionActual.etiqueta.toLowerCase()}
                  puntos={datos.departamentos.map((departamento) => ({
                    codigo: departamento.codigo,
                    nombre: departamento.nombre,
                    valor: departamento[dimension],
                  }))}
                  onAbrirFicha={setDepartamentoAbierto}
                  sinRanking
                />
              </Tarjeta>

              <Tarjeta
                titulo={`Por departamento`}
                descripcion={`Total nacional: ${numero(datos.totales[dimension])} ${dimensionActual.etiqueta.toLowerCase()}`}
                sinRelleno
                pie={
                  <p className="pie-region mono">
                    {datos.departamentos.length} departamentos · desplaza dentro del panel
                  </p>
                }
              >
                <RegionDesplazable
                  etiqueta={`${dimensionActual.etiqueta} por departamento`}
                  className="tabla-envoltura"
                  alto={396}
                >
                  <BarrasHorizontales
                    titulo={`${dimensionActual.etiqueta} por departamento`}
                    unidad={dimensionActual.etiqueta}
                    datos={[...datos.departamentos]
                      .sort((a, b) => b[dimension] - a[dimension])
                      .map((departamento) => ({
                        etiqueta: departamento.nombre,
                        valor: departamento[dimension],
                      }))}
                  />
                </RegionDesplazable>
              </Tarjeta>
            </div>

            <Tarjeta
              titulo="Proceso"
              descripcion="Del cultivo a la entrega al paciente, con el volumen registrado en cada etapa"
            >
              <FlujoProceso etapas={datos.etapas} activa="dispensario" />
            </Tarjeta>

            <div className="rejilla rejilla--2">
              <Tarjeta
                titulo="Publicaciones y rechazos normativos"
                descripcion="Últimos 12 meses. Un rechazo citado es un rechazo entendido"
              >
                <LineaTendencia serie={datos.serie} titulo="Ofertas publicadas y rechazos por norma" />
              </Tarjeta>

              <Tarjeta
                titulo="Cumplimiento"
                descripcion="Estado de la habilitación en el ecosistema"
                acciones={
                  <Link to="/app/licencias" className="boton boton--secundario boton--sm">
                    Ver licencias
                  </Link>
                }
              >
                <div className="pila" style={{ gap: "var(--e4)" }}>
                  <div className="fila" style={{ gap: "var(--e3)", justifyContent: "space-between" }}>
                    <span>Atestaciones por vencer en 45 días</span>
                    <Insignia tono="alerta">{numero(datos.atestacionesPorVencer)}</Insignia>
                  </div>
                  <div className="fila" style={{ gap: "var(--e3)", justifyContent: "space-between" }}>
                    <span>Ofertas publicadas vigentes</span>
                    <Insignia tono="exito">{numero(datos.ofertasPublicadas)}</Insignia>
                  </div>
                  <div className="fila" style={{ gap: "var(--e3)", justifyContent: "space-between" }}>
                    <span>Rechazos normativos del período</span>
                    <Insignia tono="peligro">{numero(datos.rechazosNormativos)}</Insignia>
                  </div>
                  <div className="fila" style={{ gap: "var(--e3)", justifyContent: "space-between" }}>
                    <span>Eventos sellados en el ledger</span>
                    <Insignia tono="info">{compacto(datos.eventosLedger)}</Insignia>
                  </div>
                  <div className="aviso aviso--info">
                    <Icono nombre="escudo" tamano={18} />
                    <p>
                      Todo rechazo de publicación cita la norma que lo fundamenta. La cadena de
                      eventos es verificable y no admite reescritura.
                    </p>
                  </div>
                </div>
              </Tarjeta>
            </div>

            <Tarjeta
              titulo="Actividad reciente"
              descripcion="Últimos hechos sellados en la cadena de trazabilidad"
              acciones={
                <Link to="/app/trazabilidad" className="boton boton--secundario boton--sm">
                  Ver ledger completo
                </Link>
              }
            >
              <EstadoConsulta cargando={eventos.isLoading} error={eventos.error}>
                <ActividadReciente eventos={eventos.data?.datos ?? []} />
              </EstadoConsulta>
            </Tarjeta>
          </>
        ) : null}
      </EstadoConsulta>

      <FichaDepartamento codigo={departamentoAbierto} onCerrar={() => setDepartamentoAbierto(null)} />
    </div>
  );
};
