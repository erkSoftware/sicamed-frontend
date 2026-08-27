import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { GrupoFiltros } from "../../../shared/ui/patrones/GrupoFiltros";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { fechaCorta, numero } from "../../../shared/i18n/formato";
import type { NombreIcono } from "../../../shared/ui/primitivos/Icono";
import type { ViaCierre } from "../../../shared/api/mock/tipos";
import { useCierres } from "../hooks/useCierres";

const PASOS = [
  { clave: "oferta", etiqueta: "Oferta publicada", detalle: "El actor habilitado la publica en la vitrina", dentro: true },
  { clave: "interes", etiqueta: "Interés manifestado", detalle: "Otro actor deja constancia de su interés", dentro: true },
  { clave: "contacto", etiqueta: "Contacto habilitado", detalle: "El oferente decide revelar sus datos", dentro: true },
  { clave: "fuera", etiqueta: "Se cierra por fuera", detalle: "Ante el FNE o por acuerdo directo entre las partes", dentro: false },
  { clave: "regreso", etiqueta: "Movimiento declarado", detalle: "Vuelve como salida de inventario y evento de trazabilidad", dentro: true },
] as const;

const RUTAS: readonly {
  via: ViaCierre;
  titulo: string;
  icono: NombreIcono;
  entidad: string;
  norma: string;
  cuando: string;
  detalle: string;
}[] = [
  {
    via: "FNE",
    titulo: "Cannabis psicoactivo",
    icono: "candado",
    entidad: "Fondo Nacional de Estupefacientes",
    norma: "Dec. 1138/2025 Art. 10 · Res. 1478/2006",
    cuando: "Flor psicoactiva, extractos y derivados con THC por encima del límite",
    detalle:
      "Hay que agotar el trámite ante el FNE, que asigna los cupos y autoriza la transferencia. Ahí se formaliza la operación entre las partes, no dentro de SICAMED.",
  },
  {
    via: "CONTRATO_DIRECTO",
    titulo: "No psicoactivo terminado",
    icono: "edificio",
    entidad: "Acuerdo privado entre las partes",
    norma: "Dec. 1138/2025 Art. 9",
    cuando: "Producto terminado no psicoactivo, semilla certificada y biomasa",
    detalle:
      "Puede transferirse a quien tenga autorización sanitaria, aunque no sea licenciatario ni esté inscrito ante el FNE. El acuerdo es privado y SICAMED no lo conoce.",
  },
  {
    via: "EXPORTACION",
    titulo: "Salida internacional",
    icono: "mundo",
    entidad: "DIAN · INVIMA · autoridad del país de destino",
    norma: "Dec. 1138/2025 Art. 5 · Res. 1241/2026 Art. 10b",
    cuando: "Cualquier modalidad habilitada para exportar",
    detalle:
      "El cierre ocurre en el contrato internacional y el trámite aduanero, con registro sanitario y certificado de origen. El MinCIT acompaña la promoción, no la operación.",
  },
];

const TONO_ESTADO = {
  CONTACTO_HABILITADO: "info",
  TRAMITE_EXTERNO: "acento",
  MOVIMIENTO_DECLARADO: "exito",
  SIN_DECLARAR: "neutro",
} as const;

const ETIQUETA_ESTADO = {
  CONTACTO_HABILITADO: "Contacto habilitado",
  TRAMITE_EXTERNO: "En trámite externo",
  MOVIMIENTO_DECLARADO: "Movimiento declarado",
  SIN_DECLARAR: "Sin declarar",
} as const;

const ETIQUETA_VIA = {
  FNE: "FNE",
  CONTRATO_DIRECTO: "Acuerdo directo",
  EXPORTACION: "Exportación",
} as const;

export const CierreOperacion = () => {
  const [via, setVia] = useState("");
  const [declarados, setDeclarados] = useState<readonly string[]>([]);
  const consulta = useCierres({ tipo: via });

  const cierres = consulta.data ?? [];
  const psicoactivos = cierres.filter((cierre) => cierre.via === "FNE").length;
  const conMovimiento = cierres.filter(
    (cierre) => cierre.estado === "MOVIMIENTO_DECLARADO" || declarados.includes(cierre.id),
  ).length;

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Cierre de la operación"
        subtitulo="Dónde termina lo que SICAMED puede registrar y dónde empieza lo que ocurre por fuera. La vitrina no constituye canal de transacción."
      />

      <div className="aviso aviso--alerta">
        <Icono nombre="escudo" tamano={18} />
        <p>
          La Resolución 1241 de 2026 lo dice dos veces, en el artículo 8c y en el artículo 10b: la
          vitrina <strong>no es un canal de transacción</strong>. El último acto que ocurre dentro
          del sistema es la habilitación de contacto. Lo que pase después solo entra si alguien lo
          declara.
        </p>
      </div>

      <Tarjeta
        titulo="Hasta dónde llega el sistema"
        descripcion="Los tres primeros pasos ocurren dentro de SICAMED. El cuarto, no."
      >
        <ol className="cierre-flujo">
          {PASOS.map((paso, indice) => (
            <li key={paso.clave} className="cierre-flujo__paso" data-dentro={paso.dentro ? "si" : "no"}>
              <span className="cierre-flujo__orden mono">{String(indice + 1).padStart(2, "0")}</span>
              <span className="cierre-flujo__cuerpo">
                <strong>{paso.etiqueta}</strong>
                <span>{paso.detalle}</span>
              </span>
              <span className="cierre-flujo__zona">
                {paso.dentro ? "Dentro de SICAMED" : "Fuera de SICAMED"}
              </span>
            </li>
          ))}
        </ol>
      </Tarjeta>

      <div className="rejilla rejilla--3">
        {RUTAS.map((ruta) => (
          <Tarjeta key={ruta.via} titulo={ruta.titulo} descripcion={ruta.cuando}>
            <div className="ruta-cierre">
              <span className="ruta-cierre__icono" aria-hidden="true">
                <Icono nombre={ruta.icono} tamano={20} />
              </span>
              <p className="ruta-cierre__entidad">{ruta.entidad}</p>
              <p className="ruta-cierre__detalle">{ruta.detalle}</p>
              <p className="ruta-cierre__norma mono">{ruta.norma}</p>
            </div>
          </Tarjeta>
        ))}
      </div>

      <div className="rejilla-kpi">
        <Kpi etiqueta="Contactos habilitados" valor={numero(cierres.length)} icono="cadena" />
        <Kpi
          etiqueta="Requieren trámite ante el FNE"
          valor={numero(psicoactivos)}
          icono="candado"
          nota="Cannabis psicoactivo"
        />
        <Kpi
          etiqueta="Con movimiento declarado"
          valor={numero(conMovimiento)}
          icono="inventario"
          nota="Declaración voluntaria del oferente"
        />
        <Kpi
          etiqueta="Sin información de retorno"
          valor={numero(cierres.length - conMovimiento)}
          icono="reloj"
          nota="El sistema no puede exigirla"
        />
      </div>

      <Tarjeta
        titulo="Contactos habilitados y su ruta de cierre"
        descripcion="Para cada contacto, la vía por la que legalmente debe formalizarse la operación"
        sinRelleno
        acciones={
          <GrupoFiltros
            etiqueta="Filtrar por vía"
            valor={via}
            onCambiar={setVia}
            opciones={[
              { valor: "", etiqueta: "Todas" },
              { valor: "FNE", etiqueta: "FNE" },
              { valor: "CONTRATO_DIRECTO", etiqueta: "Directo" },
              { valor: "EXPORTACION", etiqueta: "Exportación" },
            ]}
          />
        }
        pie={
          <p className="pie-region mono">
            Declarar el movimiento es voluntario · exigirlo convertiría la vitrina en un registro de
            operaciones y chocaría con el Art. 8c
          </p>
        }
      >
        <EstadoConsulta
          cargando={consulta.isLoading}
          error={consulta.error}
          onReintentar={() => void consulta.refetch()}
        >
          {cierres.length === 0 ? (
            <EstadoVacio
              icono="vitrina"
              titulo="No hay contactos con esa vía"
              texto="Cambia el filtro para ver los contactos habilitados por otra ruta de cierre."
            />
          ) : (
            <RegionDesplazable etiqueta="Contactos habilitados" alto={460}>
              <ul className="cierre-lista">
                {cierres.map((cierre) => {
                  const declarado =
                    cierre.estado === "MOVIMIENTO_DECLARADO" || declarados.includes(cierre.id);
                  return (
                    <li key={cierre.id} className="cierre-lista__item" data-via={cierre.via}>
                      <span className="cierre-lista__cuerpo">
                        <strong>{cierre.oferta}</strong>
                        <span className="cierre-lista__meta">
                          {cierre.organizacion} → {cierre.contraparte}
                        </span>
                        <span className="cierre-lista__meta">
                          Contacto habilitado el {fechaCorta(cierre.habilitado)} ·{" "}
                          {cierre.tipoProducto}
                        </span>
                        <span className="cierre-lista__entidad">
                          Se formaliza ante: <strong>{cierre.entidad}</strong>
                        </span>
                        <span className="cierre-lista__meta mono">{cierre.norma}</span>
                      </span>
                      <span className="cierre-lista__estado">
                        <Insignia tono={cierre.via === "FNE" ? "alerta" : "neutro"}>
                          {ETIQUETA_VIA[cierre.via]}
                        </Insignia>
                        <Insignia
                          tono={declarado ? "exito" : TONO_ESTADO[cierre.estado]}
                        >
                          {declarado
                            ? ETIQUETA_ESTADO.MOVIMIENTO_DECLARADO
                            : ETIQUETA_ESTADO[cierre.estado]}
                        </Insignia>
                        {declarado ? (
                          <span className="cierre-lista__meta mono">
                            {cierre.movimiento ?? "MOV pendiente de numerar"}
                          </span>
                        ) : (
                          <Boton
                            variante="secundario"
                            tamano="sm"
                            icono="inventario"
                            onClick={() =>
                              setDeclarados((previos) => [...previos, cierre.id])
                            }
                          >
                            Declarar movimiento
                          </Boton>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </RegionDesplazable>
          )}
        </EstadoConsulta>
      </Tarjeta>
    </div>
  );
};
