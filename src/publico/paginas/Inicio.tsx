import { useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import {
  organizacionJsonLd,
  preguntasJsonLd,
  sitioWebJsonLd,
} from "../../shared/seo/datosEstructurados";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { CadenaViva } from "../../shared/ui/graficos/CadenaViva";
import { LaminaBotanica } from "../../shared/ui/graficos/LaminaBotanica";
import { GloboColombia } from "../../shared/ui/graficos/GloboColombia";
import { RelatoTrazabilidad } from "../../shared/ui/graficos/RelatoTrazabilidad";
import { MapaInstitucional } from "../../shared/ui/graficos/MapaInstitucional";
import { TitularMarca } from "../componentes/TitularMarca";
import { FichaDepartamento } from "../../shared/ui/patrones/FichaDepartamento";
import { MapaColombia } from "../../shared/ui/graficos/MapaColombia";
import { DEPARTAMENTOS, ETAPAS_PROCESO } from "../../shared/api/mock/catalogos";
import { OFERTAS_PUBLICAS } from "../../shared/api/mock/datos";

const PREGUNTAS = [
  {
    pregunta: "¿Qué es SICAMED?",
    respuesta:
      "SICAMED es el sistema de información del cannabis medicinal en Colombia. Registra los actores del ecosistema, sus habilitaciones vigentes, la trazabilidad del producto desde el cultivo hasta la entrega al paciente, y publica una vitrina de consulta abierta.",
  },
  {
    pregunta: "¿La consulta de la vitrina requiere registro?",
    respuesta:
      "No. La vitrina pública se consulta sin autenticación, conforme a la Ley 1712 de 2014 de transparencia y acceso a la información pública.",
  },
  {
    pregunta: "¿Qué información es pública y cuál es reservada?",
    respuesta:
      "Es pública la existencia de la oferta, el tipo de producto, el departamento y la identidad del actor habilitado. Son reservadas las cantidades exactas, la capacidad productiva y los datos de contacto, por su carácter comercial.",
  },
  {
    pregunta: "¿SICAMED permite comprar o vender cannabis?",
    respuesta:
      "No. SICAMED no es un canal transaccional: no hay precios, órdenes de compra, pagos ni carrito. La plataforma habilita el contacto entre actores habilitados; la transacción ocurre fuera del sistema.",
  },
  {
    pregunta: "¿Cómo se protegen los datos de los pacientes?",
    respuesta:
      "Los datos clínicos viven en una zona separada, con base de datos y red propias. En la aplicación web no se cachean, no se persisten en el dispositivo y no son observables por herramientas de monitoreo, conforme a la Ley 1581 de 2012.",
  },
];

const VALORES = [
  {
    icono: "escudo" as const,
    titulo: "El cumplimiento se verifica, no se declara",
    texto:
      "Publicar una oferta exige una atestación de licencia vigente para ese tipo de producto. Si falta, el sistema rechaza la publicación y cita el artículo que la fundamenta.",
  },
  {
    icono: "cadena" as const,
    titulo: "Cada hecho queda sellado",
    texto:
      "Registro, habilitación, traslado de lote y dispensación generan eventos encadenados por huella criptográfica. Reescribir el pasado rompería toda la cadena posterior.",
  },
  {
    icono: "mundo" as const,
    titulo: "Información pública, de verdad pública",
    texto:
      "La vitrina se sirve sin autenticación, es indexable por buscadores y funciona con conexión limitada. Transparencia que se puede consultar desde un móvil rural.",
  },
  {
    icono: "candado" as const,
    titulo: "Frontera clínica infranqueable",
    texto:
      "Los datos de salud nunca comparten caché, almacenamiento ni telemetría con los datos comerciales. La separación es una decisión de arquitectura, no una costumbre.",
  },
];

export const Inicio = () => {
  const [departamentoAbierto, setDepartamentoAbierto] = useState<string | null>(null);

  return (
  <>
    <Seo
      titulo="SICAMED — Sistema de Información del Cannabis Medicinal"
      descripcion="Plataforma nacional de trazabilidad, cumplimiento normativo y vitrina pública del cannabis medicinal en Colombia. Consulta abierta, sin registro."
      ruta="/"
      palabrasClave={[
        "cannabis medicinal Colombia",
        "trazabilidad cannabis",
        "vitrina cannabis medicinal",
        "licencias cannabis Colombia",
        "SICAMED",
      ]}
      datosEstructurados={[organizacionJsonLd(), sitioWebJsonLd(), preguntasJsonLd(PREGUNTAS)]}
    />

    <section className="heroe">
      <div className="contenedor heroe__interior">
        <div className="heroe__texto-bloque">
          <div data-entrada="2">
            <TitularMarca />
          </div>
          <div className="heroe__acciones" data-entrada="4">
            <Link to="/vitrina" className="boton boton--acento boton--lg">
              Explorar la vitrina
            </Link>
            <Link to="/normativa" className="boton boton--secundario boton--lg">
              Marco normativo
            </Link>
          </div>
        </div>

        <div className="heroe__globo" data-entrada="3">
          <GloboColombia
            unidad="proveedores"
            marcas={DEPARTAMENTOS.map((departamento) => ({
              codigo: departamento.codigo,
              nombre: departamento.nombre,
              valor: departamento.proveedores,
            }))}
            onAbrirFicha={setDepartamentoAbierto}
          />
        </div>
      </div>
    </section>

    <section className="seccion">
      <div className="contenedor">
        <div className="seccion__encabezado seccion__encabezado--ancho">
          <p className="seccion__etiqueta">La planta</p>
          <h2 className="seccion__titulo">Lo que se registra empieza aquí</h2>
          <p className="seccion__texto">
            Cada lote del sistema nace de una planta identificada por variedad, predio y licencia. La
            morfología no es un adorno: el margen aserrado, la bráctea y el viraje del pistilo son los
            rasgos que sustentan la inspección y la fecha de cosecha reportada.
          </p>
        </div>
        <div data-revelar>
          <LaminaBotanica />
        </div>
      </div>
    </section>

    <section className="seccion seccion--alt">
      <div className="contenedor">
        <div className="seccion__encabezado seccion__encabezado--ancho">
          <p className="seccion__etiqueta">El recorrido</p>
          <h2 className="seccion__titulo">De la mano que siembra a quien lo necesita</h2>
          <p className="seccion__texto">
            Seis escenas para entender qué registra el sistema y quién responde en cada una. El
            producto no termina siempre en el mismo lugar: droguerías y cadenas de farmacia, IPS y
            hospitales, laboratorios que transforman o exportan, y el paciente con fórmula. SICAMED
            registra el recorrido y publica la oferta; el acuerdo se cierra fuera del sistema.
          </p>
        </div>
        <div data-revelar>
          <RelatoTrazabilidad />
        </div>

        <div className="seccion__encabezado seccion__encabezado--ancho instituciones__intro">
          <p className="seccion__etiqueta">Quién responde</p>
          <h3 className="seccion__titulo seccion__titulo--menor">
            Cuatro ministerios y tres autoridades técnicas sobre la misma cadena
          </h3>
          <p className="seccion__texto">
            Ninguna entidad ve el recorrido completo por su cuenta. La Instancia de Coordinación
            reúne a MinCIT, MinAgricultura, MinJusticia y MinSalud, con el apoyo técnico del ICA, el
            INVIMA y el FNE. SICAMED no reemplaza a ninguna: registra lo que cada una ya declaró.
          </p>
        </div>

        <div data-revelar>
          <MapaInstitucional />
        </div>
      </div>
    </section>

    <section className="seccion">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <p className="seccion__etiqueta">Por qué existe</p>
          <h2 className="seccion__titulo">Un registro que sirve de prueba, no de vitrina decorativa</h2>
          <p className="seccion__texto">
            SICAMED convierte el cumplimiento normativo en algo verificable: quién está habilitado,
            para qué producto, hasta cuándo, y qué pasó con cada lote.
          </p>
        </div>

        <div className="tarjetas-valor" data-revelar>
          {VALORES.map((valor) => (
            <article key={valor.titulo} className="valor">
              <span className="valor__icono" aria-hidden="true">
                <Icono nombre={valor.icono} tamano={20} />
              </span>
              <h3 className="valor__titulo">{valor.titulo}</h3>
              <p className="valor__texto">{valor.texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="seccion seccion--alt">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <p className="seccion__etiqueta">La cadena</p>
          <h2 className="seccion__titulo">Las mismas escenas, ahora con cifras</h2>
          <p className="seccion__texto">
            Cinco etapas, cada una con su registro verificable y su responsable identificado. Sigue
            el recorrido de un lote: cada parada sella un evento con la huella del anterior, hasta
            el destino que corresponda.
          </p>
        </div>
        <div data-revelar>
          <CadenaViva etapas={ETAPAS_PROCESO} />
        </div>
      </div>
    </section>


    <section className="seccion seccion--tinta">
      <div className="contenedor">
        <div className="seccion__encabezado seccion__encabezado--ancho">
          <p className="seccion__etiqueta">Cobertura</p>
          <h2 className="seccion__titulo">Presencia en todo el territorio</h2>
          <p className="seccion__texto">
            Distribución de proveedores registrados por departamento sobre el mapa oficial del DANE.
            Los actores priorizados son pequeños y medianos cultivadores, muchos en zonas con
            conexión irregular.
          </p>
        </div>
        <div data-revelar>
          <MapaColombia
            unidad="proveedores"
            puntos={DEPARTAMENTOS.map((departamento) => ({
              codigo: departamento.codigo,
              nombre: departamento.nombre,
              valor: departamento.proveedores,
            }))}
            onAbrirFicha={setDepartamentoAbierto}
          />
        </div>
      </div>
    </section>

    <section className="seccion">
      <div className="contenedor">
        <div className="seccion__encabezado seccion__encabezado--fila">
          <div>
            <p className="seccion__etiqueta">Vitrina</p>
            <h2 className="seccion__titulo">Ofertas publicadas recientemente</h2>
          </div>
          <Link to="/vitrina" className="boton boton--secundario">
            Ver todas las ofertas
          </Link>
        </div>
        <div className="rejilla-ofertas" data-revelar>
          {OFERTAS_PUBLICAS.slice(0, 6).map((oferta) => (
            <Link key={oferta.id} to={`/vitrina/${oferta.id}`} className="oferta">
              <div className="oferta__cabecera">
                <h3 className="oferta__titulo">{oferta.tipoProducto}</h3>
                <Icono nombre="flecha" tamano={18} />
              </div>
              <p className="oferta__actor">
                {oferta.organizacion} · {oferta.municipio}, {oferta.departamento}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>

    <section className="seccion seccion--alt">
      <div className="contenedor">
        <div className="seccion__encabezado">
          <p className="seccion__etiqueta">Preguntas frecuentes</p>
          <h2 className="seccion__titulo">Lo que suelen preguntar</h2>
        </div>
        <div className="prosa" style={{ maxWidth: "none" }}>
          {PREGUNTAS.map((item) => (
            <details
              key={item.pregunta}
              style={{
                background: "var(--superficie)",
                border: "1px solid var(--borde)",
                borderRadius: "var(--radio-md)",
                padding: "var(--e4)",
                marginBottom: "var(--e3)",
              }}
            >
              <summary style={{ fontWeight: 600, cursor: "pointer", color: "var(--texto)" }}>
                {item.pregunta}
              </summary>
              <p style={{ marginTop: "var(--e3)" }}>{item.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
    <FichaDepartamento codigo={departamentoAbierto} onCerrar={() => setDepartamentoAbierto(null)} />
    </>
  );
};
