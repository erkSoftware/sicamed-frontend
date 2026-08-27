# SICAMED · Frontend

**Sistema de Información del Cannabis Medicinal — aplicación web**

React 18 · TypeScript 5 · Vite · TanStack Query · Zustand · Playwright · WCAG 2.1 AA

> **Regla de oro:** el frontend oculta, el backend prohíbe. Nunca al revés.

---

## Puesta en marcha

Requiere **Node 20.19 o superior** (Playwright no arranca por debajo de esa versión).

```bash
npm install
cp .env.example .env
npm run dev
```

La aplicación queda en `http://localhost:5173` con datos de demostración.

### Perfiles de demostración

En `/acceso` se elige el perfil con el que se entra:

| Perfil | Para qué sirve |
|---|---|
| **Marcela Ospina** — productor habilitado | Recorrido completo comercial. Puede publicar en la vitrina |
| **Hernán Cifuentes** — productor sin atestación | **La demo:** al publicar, el sistema rechaza y cita `Res. 1241/2026 Art. 13b` |
| **Dra. Alejandra Ríos** — equipo clínico | Zona clínica: pacientes, agenda y teleconsulta |
| **Andrés Beltrán** — analista institucional | Panel de solo lectura sobre todo el ecosistema |

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila, genera el bundle y **prerenderiza** las rutas públicas + `sitemap.xml` |
| `npm run preview` | Sirve `dist/` como lo hará producción |
| `npm run typecheck` | TypeScript en modo estricto |
| `npm run lint` | ESLint, incluidas las **reglas de frontera entre zonas** |
| `npm run test` | Vitest: unitarias, de componente y de accesibilidad con `axe-core` |
| `npm run test:e2e` | Playwright: flujos críticos y accesibilidad en navegador |
| `npm run check` | Todo lo anterior. Es lo que debe pasar antes de un PR |

---

## Despliegue en Vercel

El repositorio está listo para desplegar sin configuración adicional.

```bash
npx vercel --prod
```

O conectando el repositorio en el panel de Vercel. `vercel.json` ya define:

- `buildCommand: npm run build` — incluye el prerender de las rutas públicas.
- Reescritura SPA para las rutas autenticadas, sin tocar los archivos estáticos ya prerenderizados.
- Cabeceras de seguridad: `HSTS`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- `Cache-Control: no-store` y `X-Robots-Tag: noindex` para todo `/app/salud/*`.
- Caché inmutable de un año para `/assets/*`.

**Variables de entorno en Vercel** (ninguna es obligatoria para la demo):

| Variable | Valor en demo | Valor en producción |
|---|---|---|
| `VITE_MODO_API` | `mock` | `http` |
| `VITE_URL_API_COMERCIAL` | — | URL del servicio comercial |
| `VITE_URL_API_CLINICA` | — | URL del servicio clínico |
| `VITE_MODO_AUTH` | `mock` | `cloudflare` u `oidc` |
| `VITE_URL_PUBLICA` | `https://sicamed.co` | dominio real, usado en canónicas y sitemap |

---

## La frontera clínico / comercial

El backend separa las zonas con tres muros: bases de datos, redes y contratos de `import-linter`. **El frontend no tiene ninguno de los tres**: un navegador, un bundle, un espacio de memoria. La separación se construye aquí de forma explícita, con seis controles.

| # | Control | Dónde vive |
|---|---|---|
| 1 | Dos `QueryClient` independientes; el clínico con `gcTime: 0` y `staleTime: 0` | `src/app/providers/clientesConsulta.ts` |
| 2 | Prohibición de persistencia clínica, verificada por ESLint y por prueba E2E | `eslint.config.js`, `tests/e2e/zonas.spec.ts` |
| 3 | Árbol de rutas clínico aparte, con carga diferida en su propio chunk | `src/app/rutas/rutasClinicas.tsx` |
| 4 | Verificación automática de fronteras, bloqueante en CI | `eslint.config.js` |
| 5 | Observabilidad ciega: `noindex`, `no-store` y sin grabación en `/app/salud/*` | `vercel.json`, `rutasClinicas.tsx` |
| 6 | El cierre de sesión limpia **las dos** zonas | `src/app/providers/AuthProvider.tsx` |

Las tres reglas de frontera fueron **probadas en rojo** antes de darse por buenas: un import prohibido rompe el lint.

```
src/features/        →  zona comercial     (no puede importar de features-salud)
src/features-salud/  →  zona clínica       (no puede importar de features)
src/publico/         →  vitrina pública    (no puede importar de ninguna, ni de shared/auth)
```

---

## Estructura

```
src/
├── app/                  composición: rutas, layouts, providers, acceso
├── shared/               transversal, sin lógica de negocio
│   ├── api/              clientes por zona, Problem Details, datos mock
│   ├── auth/             proveedores mock / Cloudflare Access / OIDC PKCE
│   ├── rbac/             permisos y navegación derivada
│   ├── seo/              metadatos y datos estructurados
│   └── ui/               design system: tokens, primitivos, patrones, gráficos
├── features/             ZONA COMERCIAL
├── features-salud/       ZONA CLÍNICA
└── publico/              VITRINA PÚBLICA, sin autenticación
```

Cada feature tiene la misma forma: `index.ts` como única superficie pública, `paginas/`, `componentes/`, `hooks/` y `modelo/mapeo.ts`. Una feature nunca importa de otra: lo común sube a `shared/`.

---

## Autenticación

El proveedor se elige con `VITE_MODO_AUTH` y los tres implementan la misma interfaz:

| Modo | Implementación | Estado |
|---|---|---|
| `mock` | Perfiles de demostración | Activo |
| `cloudflare` | Cloudflare Access: identidad desde `/cdn-cgi/access/get-identity`, permisos derivados de los grupos, salida por `/cdn-cgi/access/logout` | Listo para conectar |
| `oidc` | Authorization Code + PKCE, sin secreto de cliente, token solo en memoria | Listo para conectar |

**El token nunca se guarda en el almacenamiento del navegador.** Vive en memoria y se registra en el transporte HTTP mediante `registrarCredencial`.

Para conectar Cloudflare Access hay que crear la aplicación en Zero Trust apuntando a `/app/*` y `/acceso`, dejando públicas las rutas de la vitrina, y nombrar los grupos `sicamed-productores`, `sicamed-clinico` y `sicamed-institucional`.

---

## SEO

La vitrina pública **no es una SPA vacía**: `npm run build` prerenderiza cada ruta pública a HTML completo.

- Títulos y descripciones únicos por página, con canónica absoluta.
- Open Graph y Twitter Card con imagen propia.
- Datos estructurados JSON-LD: `GovernmentOrganization`, `WebSite` con `SearchAction`, `BreadcrumbList`, `ItemList`, `Product` y `FAQPage`.
- `sitemap.xml` generado en cada build con las 28 rutas públicas.
- `robots.txt` que bloquea `/app/` y `/acceso`.
- `<html lang="es-CO">` y contenido íntegramente en español.

Verificable tras el build: `dist/vitrina/index.html` pesa unos 25 kB de HTML real, no un `<div>` vacío.

---

## Conexión con el backend

Hoy la aplicación corre con `VITE_MODO_API=mock`. El intercambio ocurre en un solo punto:

```
src/shared/api/transporte.ts     modoMock ? datos locales : fetch al servicio
src/shared/api/clienteComercial.ts
src/shared/api/clienteClinico.ts
```

Los hooks de cada feature envuelven estos clientes y no cambian. La forma de error ya es la definitiva: RFC 9457 Problem Details con la extensión `norma`, que `ErrorNormativo` muestra al usuario con su cita.

Cuando lleguen los OpenAPI, se colocan en `contracts/`, se fija su versión en `versiones.json` y el cliente se **genera**; nunca se escribe a mano.

---

## Accesibilidad

WCAG 2.1 AA como gate bloqueante, no como recomendación.

- Cero violaciones críticas o serias de `axe-core`, verificado en pruebas de componente y en navegador.
- Recorrido completo por teclado con foco visible.
- Todo gráfico tiene alternativa textual: el mapa y las series exponen su tabla equivalente.
- `prefers-reduced-motion` respetado; diseño adaptable hasta 320 px.

El gate ya detectó y bloqueó un defecto real durante esta implementación: controles interactivos anidados dentro del mapa.

---

## Documentación relacionada

- `GUIA-TECNICA-FRONTEND.md` — la guía que define esta arquitectura
- `CONTRIBUTING.md` — reglas R1–R4 y definición de terminado
- `contracts/README.md` — versionado de contratos
- `decisiones/README.md` — ADR (carpeta ignorada por git, sincronizada a documentación)
