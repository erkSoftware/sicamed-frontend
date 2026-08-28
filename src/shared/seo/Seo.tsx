import { Helmet } from "react-helmet-async";

export const SITIO = {
  nombre: "SICAMED",
  nombreLargo: "SICAMED — Sistema de Información del Cannabis Medicinal",
  url: import.meta.env.VITE_URL_PUBLICA ?? "https://sicamed.co",
  descripcion:
    "Plataforma nacional de trazabilidad, cumplimiento normativo y vitrina pública del cannabis " +
    "medicinal en Colombia.",
  idioma: "es-CO",
  imagen: "/marca/og-sicamed.svg",
} as const;

type Props = {
  titulo: string;
  descripcion: string;
  ruta: string;
  imagen?: string;
  tipo?: "website" | "article";
  noIndexar?: boolean;
  palabrasClave?: readonly string[];
  datosEstructurados?: readonly object[];
  idioma?: string;
  alternativas?: readonly { idioma: string; ruta: string }[];
};

export const Seo = ({
  titulo,
  descripcion,
  ruta,
  imagen = SITIO.imagen,
  tipo = "website",
  noIndexar = false,
  palabrasClave,
  datosEstructurados,
  idioma = SITIO.idioma,
  alternativas,
}: Props) => {
  const tituloCompleto = titulo === SITIO.nombreLargo ? titulo : `${titulo} · ${SITIO.nombre}`;
  const canonica = `${SITIO.url}${ruta}`;
  const imagenAbsoluta = imagen.startsWith("http") ? imagen : `${SITIO.url}${imagen}`;

  return (
    <Helmet prioritizeSeoTags>
      <html lang={idioma} />
      <title>{tituloCompleto}</title>
      <meta name="description" content={descripcion} />
      <link rel="canonical" href={canonica} />
      {(alternativas ?? []).map((alternativa) => (
        <link
          key={alternativa.idioma}
          rel="alternate"
          hrefLang={alternativa.idioma}
          href={`${SITIO.url}${alternativa.ruta}`}
        />
      ))}
      {palabrasClave ? <meta name="keywords" content={palabrasClave.join(", ")} /> : null}
      <meta
        name="robots"
        content={noIndexar ? "noindex, nofollow" : "index, follow, max-image-preview:large"}
      />
      <meta property="og:site_name" content={SITIO.nombre} />
      <meta property="og:type" content={tipo} />
      <meta property="og:locale" content="es_CO" />
      <meta property="og:title" content={tituloCompleto} />
      <meta property="og:description" content={descripcion} />
      <meta property="og:url" content={canonica} />
      <meta property="og:image" content={imagenAbsoluta} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={tituloCompleto} />
      <meta name="twitter:description" content={descripcion} />
      <meta name="twitter:image" content={imagenAbsoluta} />
      {datosEstructurados?.map((dato, indice) => (
        <script key={indice} type="application/ld+json">
          {JSON.stringify(dato)}
        </script>
      ))}
    </Helmet>
  );
};
