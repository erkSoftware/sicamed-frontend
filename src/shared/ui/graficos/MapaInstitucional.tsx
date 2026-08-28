import { useEffect, useRef, useState } from "react";
import { Icono } from "../primitivos/Icono";
import type { NombreIcono } from "../primitivos/Icono";
import { useRevelado } from "../movimiento/useRevelado";

const COMPAS = 7200;

type ClaveEtapa = "semilla" | "cultivo" | "cosecha" | "producto" | "vitrina" | "destino";

const ETAPAS: readonly { clave: ClaveEtapa; rotulo: string }[] = [
  { clave: "semilla", rotulo: "Semilla" },
  { clave: "cultivo", rotulo: "Cultivo" },
  { clave: "cosecha", rotulo: "Cosecha" },
  { clave: "producto", rotulo: "Producto terminado" },
  { clave: "vitrina", rotulo: "Vitrina" },
  { clave: "destino", rotulo: "Destino" },
];

type Entidad = {
  clave: string;
  sigla: string;
  nombre: string;
  papel: string;
  icono: NombreIcono;
  texto: string;
  norma: string;
  etapas: readonly ClaveEtapa[];
};

const ENTIDADES: readonly Entidad[] = [
  {
    clave: "mincit",
    sigla: "MinCIT",
    nombre: "Ministerio de Comercio, Industria y Turismo",
    papel: "Entidad rectora",
    icono: "reportes",
    texto:
      "Administra el SICAMED y define las medidas de apoyo y fomento para la comercialización. La información consolidada aquí es insumo del Registro de Productores de Bienes de Producción Nacional.",
    norma: "Res. 1241/2026 · Art. 11, 16 y 19",
    etapas: ["vitrina", "destino"],
  },
  {
    clave: "minjusticia",
    sigla: "MinJusticia",
    nombre: "Ministerio de Justicia y del Derecho",
    papel: "Licenciamiento",
    icono: "licencias",
    texto:
      "Otorga las licencias de cultivo de plantas de cannabis y administra el MICC. El SICAMED no lo sustituye ni lo modifica: se apoya en lo que esa autoridad ya declaró.",
    norma: "Dec. 1138/2025 Art. 3 · Res. 1241/2026 Art. 7",
    etapas: ["semilla", "cultivo"],
  },
  {
    clave: "minsalud",
    sigla: "MinSalud",
    nombre: "Ministerio de Salud y Protección Social",
    papel: "Marco sanitario",
    icono: "medico",
    texto:
      "Fija el límite de THC a partir del cual un producto es de control especial y define los lineamientos bajo los cuales el SICAMED podría integrar información del sector salud.",
    norma: "Dec. 1138/2025 Art. 11 · Res. 1241/2026 Art. 14 ¶",
    etapas: ["producto", "destino"],
  },
  {
    clave: "minagricultura",
    sigla: "MinAgricultura",
    nombre: "Ministerio de Agricultura y Desarrollo Rural",
    papel: "Desarrollo rural",
    icono: "hoja",
    texto:
      "Integra la Instancia de Coordinación del SICAMED y, junto con la ADR y el SENA, sostiene la formación y el fortalecimiento de los pequeños y medianos cultivadores.",
    norma: "Res. 1241/2026 · Art. 6 y 20",
    etapas: ["cultivo", "cosecha"],
  },
  {
    clave: "ica",
    sigla: "ICA",
    nombre: "Instituto Colombiano Agropecuario",
    papel: "Apoyo técnico",
    icono: "produccion",
    texto:
      "Responde por la sanidad vegetal y por el registro de los agroinsumos aplicados en campo. Ese registro es el que sustenta las buenas prácticas agrícolas del lote.",
    norma: "Res. 1241/2026 · Art. 12 y 20",
    etapas: ["semilla", "cultivo", "cosecha"],
  },
  {
    clave: "invima",
    sigla: "INVIMA",
    nombre: "Instituto Nacional de Vigilancia de Medicamentos y Alimentos",
    papel: "Apoyo técnico",
    icono: "escudo",
    texto:
      "Otorga la autorización sanitaria del producto terminado. Sin ella la flor no alcanza esa condición y no puede divulgarse en la vitrina.",
    norma: "Dec. 1138/2025 Art. 1 núm. 38 · Res. 1241/2026 Art. 13b",
    etapas: ["producto", "vitrina"],
  },
  {
    clave: "fne",
    sigla: "FNE",
    nombre: "Fondo Nacional de Estupefacientes",
    papel: "Apoyo técnico",
    icono: "candado",
    texto:
      "Asigna los cupos de cannabis psicoactivo y tramita su transferencia. Ahí se formaliza la operación entre las partes, no dentro del SICAMED.",
    norma: "Dec. 780/2016 art. 2.8.11.5.1 · Res. 1478/2006",
    etapas: ["cosecha", "destino"],
  },
];

export const MapaInstitucional = () => {
  const { referencia, visible, enPantalla } = useRevelado<HTMLDivElement>("0px 0px -12% 0px", {
    seguir: true,
  });
  const [indice, setIndice] = useState(0);
  const [detenido, setDetenido] = useState(false);
  const sobrio = useRef(false);

  useEffect(() => {
    sobrio.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!visible || !enPantalla || detenido) return undefined;
    const reloj = window.setTimeout(
      () => setIndice((anterior) => (anterior + 1) % ENTIDADES.length),
      sobrio.current ? COMPAS + 2800 : COMPAS,
    );
    return () => window.clearTimeout(reloj);
  }, [visible, enPantalla, detenido, indice]);

  const entidad = ENTIDADES[indice] ?? ENTIDADES[0]!;
  const corriendo = visible && enPantalla && !detenido;

  return (
    <div
      className="instituciones"
      ref={referencia}
      data-fuera-de-vista={enPantalla ? "no" : "si"}
      onMouseEnter={() => setDetenido(true)}
      onMouseLeave={() => setDetenido(false)}
    >
      <div className="instituciones__cabecera">
        <p className="instituciones__rotulo rotulo">Instancia de Coordinación</p>
        <p className="instituciones__nota mono">Res. 1241/2026 · Art. 20</p>
      </div>

      <ul className="instituciones__fichas">
        {ENTIDADES.map((item, orden) => (
          <li key={item.clave}>
            <button
              type="button"
              className="instituciones__ficha"
              data-grupo={item.papel === "Apoyo técnico" ? "tecnico" : "ministerio"}
              aria-pressed={orden === indice}
              onClick={() => {
                setIndice(orden);
                setDetenido(true);
              }}
            >
              <span className="instituciones__ficha-icono" aria-hidden="true">
                <Icono nombre={item.icono} tamano={16} />
              </span>
              <span className="instituciones__ficha-sigla">{item.sigla}</span>
            </button>
          </li>
        ))}
      </ul>

      <article className="instituciones__panel" aria-live="polite">
        <span className="instituciones__emblema" aria-hidden="true">
          <Icono nombre={entidad.icono} tamano={26} />
        </span>
        <div className="instituciones__cuerpo">
          <p className="instituciones__papel rotulo">{entidad.papel}</p>
          <h3 className="instituciones__nombre">{entidad.nombre}</h3>
          <p className="instituciones__texto">{entidad.texto}</p>
          <p className="instituciones__norma mono">{entidad.norma}</p>
        </div>
        <span className="instituciones__compas" aria-hidden="true">
          <span key={indice} className="instituciones__avance" data-corriendo={corriendo ? "si" : "no"} />
        </span>
      </article>

      <div className="instituciones__cadena">
        <p className="instituciones__cadena-titulo rotulo">Dónde interviene</p>
        <ol className="instituciones__etapas">
          {ETAPAS.map((etapa, orden) => (
            <li
              key={etapa.clave}
              className="instituciones__etapa"
              data-activa={entidad.etapas.includes(etapa.clave) ? "si" : "no"}
              style={{ transitionDelay: `${orden * 70}ms` }}
            >
              <span className="instituciones__etapa-punto" aria-hidden="true" />
              <span className="instituciones__etapa-rotulo">{etapa.rotulo}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
