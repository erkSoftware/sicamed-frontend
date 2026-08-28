import type { es } from "./es";

export const en: Record<keyof typeof es, string> = {
  "idioma.selector": "Language",
  "idioma.es": "Español",
  "idioma.en": "English",

  "migas.ruta": "Breadcrumb",
  "migas.inicio": "Home",
  "migas.vitrina": "Marketplace",

  "vitrina.seo.titulo": "Public marketplace of medical cannabis offers",
  "vitrina.seo.descripcion":
    "Open consultation of {conteo} offers published by authorised actors of Colombia's medical cannabis ecosystem. No sign-up required.",

  "vitrina.hero.etiqueta": "Public consultation",
  "vitrina.hero.titulo": "Offer marketplace",
  "vitrina.hero.entrada":
    "Browse the offers published by actors holding a current authorisation. Consultation is open and requires no sign-up.",
  "vitrina.hero.actualizacion": "Last updated",
  "vitrina.hero.marca": "Medical cannabis from Colombia",
  "vitrina.hero.promesa": "Browse Colombia's medical cannabis supply",

  "vitrina.atajos.titulo": "Browse by",

  "vitrina.razones.titulo": "Why the Colombian supply",
  "vitrina.razones.franja": "Equatorial belt",
  "vitrina.razones.franjaDetalle":
    "Twelve hours of daylight all year round and high-altitude cultivation along the Andes.",
  "vitrina.razones.marco": "National use and export modality",
  "vitrina.razones.marcoDetalle":
    "Dec. 1138 de 2025 and Res. 1241 de 2026 set the current medical cannabis framework.",
  "vitrina.razones.habilitacion": "Publishing requires authorisation",
  "vitrina.razones.habilitacionDetalle":
    "No offer is published without a current attestation issued by a third party.",
  "vitrina.razones.abierta": "Open consultation",
  "vitrina.razones.abiertaDetalle":
    "Ley 1712 de 2014: anyone may browse the marketplace; the offering actor decides on contact.",

  "vitrina.mando.etiqueta": "Marketplace view",
  "vitrina.mando.buscador": "Search",
  "vitrina.mando.resultados": "Results",
  "vitrina.buscador.etiqueta": "Search the marketplace",
  "vitrina.buscador.marcador": "Search products, actors or territories…",
  "vitrina.buscador.probando": "Search {valor}▌",
  "vitrina.buscador.limpiar": "Clear the search",
  "vitrina.buscador.sugerencias": "Related results",
  "vitrina.buscador.sinSugerencias": "No matches in product, actor or territory.",
  "vitrina.buscador.grupo.producto": "Product",
  "vitrina.buscador.grupo.actor": "Actor",
  "vitrina.buscador.grupo.territorio": "Territory",

  "vitrina.filtros.abrir": "Filters",
  "vitrina.filtros.titulo": "Filter the marketplace",
  "vitrina.filtros.entrada": "Filtering is only possible on fields classified as public.",
  "vitrina.filtros.cerrar": "Close the filters",
  "vitrina.filtros.ver": "Show {conteo} offers",
  "vitrina.filtros.limpiar": "Clear filters",
  "vitrina.filtros.activos": "Active filters",
  "vitrina.filtros.quitar": "Remove the {valor} filter",
  "vitrina.filtros.todos": "All",
  "vitrina.filtros.grupo.producto": "Product type",
  "vitrina.filtros.grupo.territorio": "Department",
  "vitrina.filtros.grupo.actor": "Actor type",
  "vitrina.filtros.grupo.disponibilidad": "Declared availability",

  "vitrina.orden.etiqueta": "Sort by",
  "vitrina.orden.recientes": "Most recently published",
  "vitrina.orden.territorio": "Department (A–Z)",
  "vitrina.orden.producto": "Product type (A–Z)",
  "vitrina.orden.nota": "Neutral ordering: the marketplace neither features nor promotes actors.",

  "vitrina.vista.etiqueta": "Result layout",
  "vitrina.vista.rejilla": "Grid",
  "vitrina.vista.lista": "List",

  "vitrina.resultados.conteo_uno": "{conteo} published offer",
  "vitrina.resultados.conteo_otro": "{conteo} published offers",
  "vitrina.resultados.pagina": "Showing {desde}–{hasta}",
  "vitrina.resultados.cargando": "Loading offers",

  "vitrina.tarjeta.actorHabilitado": "Authorised actor",
  "vitrina.tarjeta.habilitacionAtestada": "Current authorisation attested by a third party",
  "vitrina.tarjeta.publicada": "Published",
  "vitrina.tarjeta.vigente": "Current",
  "vitrina.tarjeta.disponibilidad": "Availability",
  "vitrina.tarjeta.atestaciones_uno": "{conteo} attestation with recorded evidence",
  "vitrina.tarjeta.atestaciones_otro": "{conteo} attestations with recorded evidence",
  "vitrina.tarjeta.ver": "View offer",
  "vitrina.tarjeta.interes": "Express interest",
  "vitrina.tarjeta.ofertasDelActor": "See the offers of {actor}",
  "vitrina.tarjeta.imagenCategoria": "Category artwork, not the published batch",

  "vitrina.paginacion.etiqueta": "Marketplace pagination",
  "vitrina.paginacion.anterior": "Previous",
  "vitrina.paginacion.siguiente": "Next",
  "vitrina.paginacion.porPagina": "Per page",

  "vitrina.vacio.titulo": "We found no offers",
  "vitrina.vacio.texto":
    "Try changing your filters or searching for another product, actor or territory.",
  "vitrina.vacio.territorio": "There are no published offers in this department.",

  "vitrina.clasificacion.abrir": "What information can I consult?",
  "vitrina.clasificacion.titulo": "What the marketplace publishes",
  "vitrina.clasificacion.publico": "Public",
  "vitrina.clasificacion.publicoDetalle":
    "Existence of the offer, product type, territory, actor and status of the publication.",
  "vitrina.clasificacion.reservado": "Restricted",
  "vitrina.clasificacion.reservadoDetalle":
    "Quantities, productive capacity and the actor's contact details.",
  "vitrina.clasificacion.fuera": "Outside the system",
  "vitrina.clasificacion.fueraDetalle":
    "SICAMED is not a transaction channel: it enables contact between actors and records that fact, nothing more.",
  "vitrina.clasificacion.enlace": "Read the open data policy",
  "vitrina.clasificacion.norma":
    "Classification pursuant to Ley 1712 de 2014 and article 21 of Res. 1241 de 2026.",

  "vitrina.acceso.titulo": "Expressing interest requires a registered organisation",
  "vitrina.acceso.texto":
    "An expression of interest is submitted by an identified organisation. The offering actor decides whether to enable contact; SICAMED never discloses contact details on its own.",
  "vitrina.acceso.ingresar": "Sign in",
  "vitrina.acceso.registrar": "Register my organisation",
  "vitrina.acceso.cancelar": "Cancel",

  "detalle.seo.descripcion":
    "Public offer of {producto} published by {actor} in {territorio}. Actor with a current authorisation attested in SICAMED.",
  "detalle.volver": "Back to the marketplace",
  "detalle.etiqueta": "Public offer",
  "detalle.publicado": "Published information",
  "detalle.regulatorio": "Regulatory information",
  "detalle.atestaciones": "Recorded attestations",
  "detalle.atestaciones.nota":
    "Evidence supplied by the actor and issued by third parties. SICAMED records the attestation; it neither verifies nor validates it.",
  "detalle.territorio": "Territory",
  "detalle.actor": "Authorised actor",
  "detalle.actualizacion": "Offer update",
  "detalle.reservado.titulo": "Restricted commercial information",
  "detalle.reservado.texto":
    "Quantities, productive capacity and contact details are not published. To start a commercial conversation, express your interest from a registered organisation.",
  "detalle.noEncontrada.titulo": "This offer is not available",
  "detalle.noEncontrada.texto":
    "The offer was closed, suspended or never existed. Browse the marketplace to see current publications.",

  "producto.Flor seca no psicoactiva": "Non-psychoactive dried flower",
  "producto.Flor seca psicoactiva": "Psychoactive dried flower",
  "producto.Biomasa vegetal": "Plant biomass",
  "producto.Extracto de espectro completo": "Full-spectrum extract",
  "producto.Aceite estandarizado CBD": "Standardised CBD oil",
  "producto.Aceite estandarizado THC:CBD": "Standardised THC:CBD oil",
  "producto.Fórmula magistral": "Compounded formulation",
  "producto.Semilla certificada": "Certified seed",

  "actor.CULTIVADOR": "Authorised cultivator",
  "actor.TRANSFORMADOR": "Authorised processor",
  "actor.DISPENSADOR": "Authorised dispensary",
  "actor.LABORATORIO": "Authorised laboratory",
  "actor.IPS": "Health care provider",

  "disponibilidad.INMEDIATA": "Immediate",
  "disponibilidad.PROGRAMADA": "Scheduled",
  "disponibilidad.POR_CAMPAÑA": "By campaign",
  "origen.boton.rotulo": "The experience",
  "origen.boton.titulo": "Why buy Colombian",
  "origen.invitacion.titulo": "Discover Colombia's medicinal supply",
  "origen.invitacion.ver": "Watch the experience",
  "origen.invitacion.omitir": "Skip",
  "origen.salto": "Skip the experience",
  "origen.tierra": "It all begins in Colombia.",
  "origen.cultivo": "Land. Knowledge. Cultivation.",
  "origen.industria": "A new industry grows out of the crop.",
  "origen.producto": "The Colombian product begins as a plant.",
  "origen.mundo": "From Colombia, to the world.",
  "origen.vitrina":
    "A marketplace that connects Colombian supply with the people looking to buy it.",
  "origen.mercado.oferta": "Colombian supply",
  "origen.mercado.compradores": "Domestic buyers",
  "origen.mercado.mercados": "International markets",
  "origen.elemento.producto": "Product",
  "origen.elemento.actor": "Operator",
  "origen.elemento.territorio": "Territory",
  "origen.elemento.mercado": "Market",
  "origen.razones.titulo": "Why buy Colombian",
  "origen.razones.oferta.titulo": "Colombian supply",
  "origen.razones.oferta.glosa": "Products and operators visible in a single place.",
  "origen.razones.consulta.titulo": "Open consultation",
  "origen.razones.consulta.glosa": "Makes commercial opportunities easier to find.",
  "origen.razones.territorio.titulo": "Colombia",
  "origen.razones.territorio.glosa": "Connects supply with the territory that produces it.",
  "origen.razones.mundo.titulo": "International reach",
  "origen.razones.mundo.glosa": "A marketplace built for overseas buyers as well.",
  "origen.razones.pie":
    "Buying Colombian also means choosing the talent, the territory and the domestic production.",
  "origen.cierre.linea": "Commercial Marketplace",
  "origen.cierre.lema": "From Colombia, to the world.",
  "origen.cierre.glosa": "Discover Colombian medicinal cannabis opportunities.",
};
