import { SITIO } from "./Seo";

export const organizacionJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "GovernmentOrganization",
  name: SITIO.nombreLargo,
  alternateName: SITIO.nombre,
  url: SITIO.url,
  logo: `${SITIO.url}/marca/isotipo.svg`,
  description: SITIO.descripcion,
  areaServed: { "@type": "Country", name: "Colombia" },
  knowsLanguage: "es-CO",
});

export const sitioWebJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITIO.nombreLargo,
  url: SITIO.url,
  inLanguage: "es-CO",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITIO.url}/vitrina?busqueda={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export const migasJsonLd = (items: readonly { nombre: string; ruta: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, indice) => ({
    "@type": "ListItem",
    position: indice + 1,
    name: item.nombre,
    item: `${SITIO.url}${item.ruta}`,
  })),
});

export const ofertaJsonLd = (oferta: {
  id: string;
  titulo: string;
  descripcion: string;
  tipoProducto: string;
  organizacion: string;
  departamento: string;
  municipio: string;
  publicada: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: oferta.titulo,
  description: oferta.descripcion,
  category: oferta.tipoProducto,
  url: `${SITIO.url}/vitrina/${oferta.id}`,
  brand: { "@type": "Organization", name: oferta.organizacion },
  releaseDate: oferta.publicada,
  areaServed: {
    "@type": "AdministrativeArea",
    name: `${oferta.municipio}, ${oferta.departamento}, Colombia`,
  },
});

export const preguntasJsonLd = (preguntas: readonly { pregunta: string; respuesta: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: preguntas.map((item) => ({
    "@type": "Question",
    name: item.pregunta,
    acceptedAnswer: { "@type": "Answer", text: item.respuesta },
  })),
});

export const listaOfertasJsonLd = (
  ofertas: readonly { id: string; titulo: string }[],
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  numberOfItems: ofertas.length,
  itemListElement: ofertas.map((oferta, indice) => ({
    "@type": "ListItem",
    position: indice + 1,
    name: oferta.titulo,
    url: `${SITIO.url}/vitrina/${oferta.id}`,
  })),
});
