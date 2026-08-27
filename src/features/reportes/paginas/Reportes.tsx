import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Donut } from "../../../shared/ui/graficos/Donut";
import { BarrasHorizontales } from "../../../shared/ui/graficos/BarrasHorizontales";
import { LineaTendencia } from "../../../shared/ui/graficos/LineaTendencia";
import { FlujoProceso } from "../../../shared/ui/graficos/FlujoProceso";
import { useReportes } from "../hooks/useReportes";

export const Reportes = () => {
  const consulta = useReportes();
  const datos = consulta.data;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Reportes"
        subtitulo="Cortes agregados del ecosistema. Ninguna cifra de esta pantalla identifica a un paciente ni expone información reservada de carácter comercial."
        acciones={
          <>
            <Boton variante="secundario" icono="descargar">
              Exportar CSV
            </Boton>
            <Boton variante="secundario" icono="documento">
              Generar informe
            </Boton>
          </>
        }
      />

      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {datos ? (
          <>
            <Tarjeta titulo="Publicaciones y rechazos" descripcion="Serie mensual de los últimos 12 meses">
              <LineaTendencia serie={datos.serie} titulo="Ofertas publicadas y rechazos por norma" />
            </Tarjeta>

            <div className="rejilla rejilla--2">
              <Tarjeta titulo="Composición del registro" descripcion="Actores por tipo, sobre la muestra consultable">
                <Donut
                  titulo="Actores por tipo"
                  centroEtiqueta="actores"
                  segmentos={datos.porTipoActor.map((item, indice) => ({
                    etiqueta: item.etiqueta,
                    valor: item.valor,
                    color: ["var(--verde-700)", "var(--verde-500)", "var(--lima-500)", "var(--azul-600)", "var(--tierra-500)"][indice] ?? "var(--verde-500)",
                  }))}
                />
              </Tarjeta>

              <Tarjeta titulo="Estado del cumplimiento" descripcion="Atestaciones por estado de vigencia">
                <Donut
                  titulo="Atestaciones por estado"
                  centroEtiqueta="atestaciones"
                  segmentos={datos.cumplimiento.map((item, indice) => ({
                    etiqueta: item.etiqueta,
                    valor: item.valor,
                    color: ["var(--verde-600)", "var(--ambar-700)", "var(--rojo-600)", "var(--azul-600)"][indice] ?? "var(--piedra-400)",
                  }))}
                />
              </Tarjeta>
            </div>

            <Tarjeta titulo="Volumen por etapa del proceso" descripcion="Del cultivo a la entrega al paciente">
              <FlujoProceso etapas={datos.etapas} />
            </Tarjeta>

            <Tarjeta
              titulo="Concentración territorial"
              descripcion="Proveedores registrados por departamento"
              sinRelleno
              pie={
                <p className="pie-region mono">
                  {datos.departamentos.length} departamentos · desplaza dentro del panel para ver el resto
                </p>
              }
            >
              <RegionDesplazable
                etiqueta="Proveedores por departamento"
                className="tabla-envoltura"
                alto={340}
              >
                <BarrasHorizontales
                  titulo="Proveedores por departamento"
                  unidad="Proveedores"
                  datos={[...datos.departamentos]
                    .sort((a, b) => b.proveedores - a.proveedores)
                    .map((departamento, indice) => ({
                      etiqueta: departamento.nombre,
                      valor: departamento.proveedores,
                      destacada: indice === 0,
                    }))}
                />
              </RegionDesplazable>
            </Tarjeta>
          </>
        ) : null}
      </EstadoConsulta>
    </div>
  );
};
