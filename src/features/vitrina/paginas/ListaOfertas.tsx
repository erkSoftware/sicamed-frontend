import { useState } from "react";
import { Link } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { Buscador } from "../../../shared/ui/patrones/Buscador";
import { GrupoFiltros } from "../../../shared/ui/patrones/GrupoFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { Paginacion } from "../../../shared/ui/patrones/Paginacion";
import { Tabla } from "../../../shared/ui/primitivos/Tabla";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { EnlaceBoton } from "../../../shared/ui/primitivos/EnlaceBoton";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { fecha, numero } from "../../../shared/i18n/formato";
import { aOfertaVista } from "../modelo/mapeo";
import type { OfertaVista } from "../modelo/mapeo";
import { useManifestaciones, useOfertas } from "../hooks/useOfertas";

const ESTADOS = [
  { valor: "", etiqueta: "Todas" },
  { valor: "PUBLICADA", etiqueta: "Publicadas" },
  { valor: "BORRADOR", etiqueta: "Borradores" },
  { valor: "RECHAZADA", etiqueta: "Rechazadas" },
  { valor: "CERRADA", etiqueta: "Cerradas" },
];

const COLUMNAS: readonly Columna<OfertaVista>[] = [
  {
    clave: "titulo",
    encabezado: "Oferta",
    render: (oferta) => (
      <Link to={`/app/vitrina/${oferta.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
        {oferta.titulo}
      </Link>
    ),
  },
  { clave: "producto", encabezado: "Tipo de producto", render: (oferta) => oferta.tipoProducto },
  { clave: "ubicacion", encabezado: "Ubicación", render: (oferta) => oferta.ubicacion },
  {
    clave: "estado",
    encabezado: "Estado",
    render: (oferta) => <Insignia tono={oferta.tonoEstado}>{oferta.etiquetaEstado}</Insignia>,
  },
  { clave: "publicada", encabezado: "Publicada", render: (oferta) => fecha(oferta.publicada) },
  { clave: "vigencia", encabezado: "Vigencia", render: (oferta) => fecha(oferta.vigencia) },
  {
    clave: "interesados",
    encabezado: "Interesados",
    numerica: true,
    render: (oferta) => <span className="mono">{numero(oferta.interesados)}</span>,
  },
];

export const ListaOfertas = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const consulta = useOfertas({ busqueda, estado, pagina, porPagina: 10 });
  const manifestaciones = useManifestaciones();

  const filas = (consulta.data?.datos ?? []).map(aOfertaVista);

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Vitrina"
        subtitulo="Ofertas de tu organización publicadas en la vitrina pública. La existencia de la oferta es información pública; las cantidades y la capacidad productiva son reservadas."
        acciones={
          <SiTienePermiso permiso="vitrina:oferta:publicar">
            <EnlaceBoton a="/app/vitrina/nueva" icono="mas">
              Nueva oferta
            </EnlaceBoton>
          </SiTienePermiso>
        }
      />

      <Tarjeta sinRelleno>
        <div className="fila" style={{ gap: "var(--e3)", padding: "var(--e4)", flexWrap: "wrap" }}>
          <Buscador
            valor={busqueda}
            onCambiar={(valor) => {
              setBusqueda(valor);
              setPagina(1);
            }}
            etiqueta="Buscar oferta"
            marcador="Buscar por título u organización"
          />
          <GrupoFiltros
            etiqueta="Filtrar por estado"
            opciones={ESTADOS}
            valor={estado}
            onCambiar={(valor) => {
              setEstado(valor);
              setPagina(1);
            }}
          />
        </div>

        <EstadoConsulta
          cargando={consulta.isLoading}
          error={consulta.error}
          onReintentar={() => void consulta.refetch()}
        >
          <Tabla
            descripcion="Listado de ofertas de la organización"
            columnas={COLUMNAS}
            filas={filas}
            claveFila={(oferta) => oferta.id}
            vacio={
              <EstadoVacio
                icono="vitrina"
                titulo="Todavía no hay ofertas con esos criterios"
                texto="Ajusta los filtros o crea una nueva oferta. Recuerda que publicar requiere una atestación de licencia vigente para el tipo de producto."
                accion={
                  <SiTienePermiso permiso="vitrina:oferta:publicar">
                    <EnlaceBoton a="/app/vitrina/nueva" tamano="sm" icono="mas">
                      Crear oferta
                    </EnlaceBoton>
                  </SiTienePermiso>
                }
              />
            }
          />
          {consulta.data && consulta.data.total > 0 ? (
            <Paginacion
              pagina={consulta.data.pagina}
              porPagina={consulta.data.porPagina}
              total={consulta.data.total}
              onCambiar={setPagina}
              etiqueta="ofertas"
            />
          ) : null}
        </EstadoConsulta>
      </Tarjeta>

      <Tarjeta
        titulo="Manifestaciones de interés"
        descripcion="Actores que solicitaron contacto. La habilitación de contacto no es una transacción comercial"
      >
        <EstadoConsulta cargando={manifestaciones.isLoading} error={manifestaciones.error}>
          <Tabla
            descripcion="Manifestaciones de interés recibidas"
            columnas={[
              { clave: "oferta", encabezado: "Oferta", render: (item) => item.oferta },
              { clave: "solicitante", encabezado: "Solicitante", render: (item) => item.solicitante },
              { clave: "departamento", encabezado: "Departamento", render: (item) => item.departamento },
              { clave: "fecha", encabezado: "Fecha", render: (item) => fecha(item.fecha) },
              {
                clave: "estado",
                encabezado: "Estado",
                render: (item) => (
                  <Insignia
                    tono={
                      item.estado === "HABILITADA"
                        ? "exito"
                        : item.estado === "DESCARTADA"
                          ? "neutro"
                          : "info"
                    }
                  >
                    {item.estado.replace("_", " ")}
                  </Insignia>
                ),
              },
            ]}
            filas={manifestaciones.data ?? []}
            claveFila={(item) => item.id}
            vacio={
              <EstadoVacio
                titulo="Sin manifestaciones de interés"
                texto="Cuando otro actor manifieste interés en una de tus ofertas, aparecerá aquí para que habilites el canal de contacto."
              />
            }
          />
        </EstadoConsulta>
      </Tarjeta>
    </div>
  );
};
