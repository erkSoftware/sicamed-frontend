# SICAMED — Guía Técnica del Frontend

**Aplicación web única · Repositorio independiente · React + TypeScript · Dos zonas de datos en un solo navegador**

| | |
|---|---|
| **Documento** | Guía de implementación del frontend (complementa al Blueprint v1.1) |
| **Fecha** | 26 de agosto de 2026 |
| **Repositorio** | `sicamed-frontend` — **el único código fuera del monorepo** |
| **Stack** | React 18 · TypeScript 5 · Vite · TanStack Query · Zustand · Playwright |
| **Accesibilidad** | WCAG 2.1 AA — `[AMB-14]` ✅ decidido, gate bloqueante en CI |
| **Regla de oro** | El frontend oculta. El backend prohíbe. Nunca al revés |

---

## 0. Cómo usar esta guía

El Blueprint v1.1 es la fuente de verdad del dominio y la norma. La Guía Técnica del Backend define el monorepo de servicios. **Este documento define el único repositorio que vive fuera de él.**

Etiquetas, iguales que en el resto del proyecto:

| Etiqueta | Significado |
|---|---|
| `[ON]` | Obligación normativa — no se cambia sin abogado |
| `[DA]` | Decisión arquitectónica — se cambia documentando un ADR |
| `[RF]` | Requisito funcional del cliente |
| `[IT]` | Inferencia técnica — validable |
| `[AMB]` | Ambigüedad — requiere decisión explícita |

Aplican íntegramente las reglas de desarrollo del §8.6 del blueprint: **sin comentarios en el código** (R1), carpeta `decisiones/` gitignored con sincronización a repositorio de documentación (R2, `[AMB-12]` ✅ decidido), convenciones de nombrado (R3), Conventional Commits (R4).

---

## 1. El problema que define esta arquitectura

`[ON]` N-13 (Res. 1241/2026 Art. 24 ¶) exige una frontera dura entre datos clínicos y datos comerciales. En el backend esa frontera se defiende con tres muros independientes: instancias de base de datos separadas, zonas de red distintas y contratos de `import-linter` que rompen el build.

**El frontend no tiene ninguno de esos tres muros.**

```
BACKEND                                FRONTEND
┌──────────────┐  ┌──────────────┐    ┌────────────────────────────┐
│ Zona         │  │ Zona         │    │  UN navegador              │
│ COMERCIAL    │⛔│ CLÍNICA      │    │  UN bundle                 │
│              │  │              │    │  UN espacio de memoria     │
│ BD propia    │  │ BD propia    │    │  UN localStorage           │
│ Red propia   │  │ Red propia   │    │  UN árbol de componentes   │
└──────────────┘  └──────────────┘    └────────────────────────────┘
   Separación estructural                Separación por DISCIPLINA
```

`[RF]` El cliente exige **una sola aplicación web con un solo login**. Eso es legítimo y es buena experiencia de usuario, pero significa que **el frontend es el único punto del sistema donde ambas zonas coexisten en el mismo proceso**.

`[DA]` **Consecuencia:** la separación que el backend obtiene gratis por infraestructura, el frontend tiene que construirla explícitamente. Este documento dedica su §3 completa a eso, y no es opcional.

> **Esto debe declararse al cliente y al auditor.** Un solo frontend es una decisión de producto con un costo de ingeniería concreto. Ocultarlo sería deshonesto; asumirlo y controlarlo es lo correcto.

---

## 2. Estructura del repositorio

```
sicamed-frontend/
│
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml              apunta al backend local o a dev
├── README.md
├── CONTRIBUTING.md                 ⬅ reglas §8.6 del blueprint
│
├── decisiones/                     ⬅ [RF] GITIGNORED + sync (AMB-12 ✅)
│   ├── README.md
│   └── ADR-XXXX-*.md
│
├── contracts/                      ⬅ OpenAPI descargados, VERSIONADOS
│   ├── versiones.json              fija la versión exacta de cada contrato
│   ├── actores-v1.json
│   ├── cumplimiento-v1.json
│   ├── vitrina-v1.json
│   └── ...
│
├── src/
│   │
│   ├── app/                        ⬅ COMPOSICIÓN: rutas, layouts, providers
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── QueryProviderComercial.tsx
│   │   │   └── QueryProviderClinico.tsx      ⬅ deliberadamente separados (§3)
│   │   ├── rutas/
│   │   │   ├── rutasPublicas.tsx
│   │   │   ├── rutasComerciales.tsx
│   │   │   └── rutasClinicas.tsx             ⬅ árbol aparte, carga diferida
│   │   └── layouts/
│   │
│   ├── shared/                     ⬅ TRANSVERSAL — sin lógica de negocio
│   │   ├── api/
│   │   │   ├── generado/           cliente generado, NUNCA escrito a mano
│   │   │   ├── clienteComercial.ts
│   │   │   ├── clienteClinico.ts
│   │   │   └── problemDetails.ts   RFC 9457 → objeto de error tipado
│   │   ├── auth/
│   │   │   ├── oidc.ts             PKCE, refresh silencioso
│   │   │   ├── useAuth.ts
│   │   │   └── GuardaDeRuta.tsx
│   │   ├── rbac/
│   │   │   ├── usePermiso.ts
│   │   │   └── SiTienePermiso.tsx
│   │   ├── ui/                     design system
│   │   │   ├── primitivos/         Boton, Campo, Tabla, Dialogo
│   │   │   ├── patrones/           FormularioCrud, EstadoVacio, ErrorNormativo
│   │   │   └── tokens/
│   │   ├── formularios/
│   │   ├── i18n/
│   │   └── observabilidad/
│   │
│   ├── features/                   ⬅ ZONA COMERCIAL
│   │   ├── organizaciones/
│   │   ├── cumplimiento/
│   │   ├── produccion/
│   │   ├── inventario/
│   │   ├── vitrina/
│   │   ├── ruedas-negocio/
│   │   ├── trazabilidad/
│   │   └── reportes/
│   │
│   ├── features-salud/             ⬅ ZONA CLÍNICA — [ON] N-13
│   │   ├── pacientes/
│   │   ├── agenda/
│   │   └── teleconsulta/
│   │
│   └── publico/                    ⬅ VITRINA PÚBLICA — sin autenticación
│       ├── rutas/
│       └── componentes/
│
├── tests/
│   ├── a11y/                       axe-core, bloqueante
│   ├── e2e/                        Playwright
│   └── contract/                   validación contra OpenAPI
│
└── tools/
    ├── generar-cliente.ts          OpenAPI → TypeScript
    └── verificar-fronteras.ts      ⬅ el equivalente a import-linter (§3.4)
```

### 2.1 Por qué tres carpetas de features y no una

`[DA]` `features/`, `features-salud/` y `publico/` **no son una clasificación temática**. Son tres regímenes distintos de datos, autenticación y riesgo:

| Carpeta | Autenticación | Clasificación de datos | Puede persistir en el navegador |
|---|---|---|---|
| `publico/` | Ninguna `[ON]` N-24 | Solo `PUBLICO` | Sí, es información pública |
| `features/` | OIDC + RBAC | `PUBLICO` y `RESERVADO_COMERCIAL` | Caché en memoria, nunca en disco |
| `features-salud/` | OIDC + RBAC reforzado | `SENSIBLE` `[ON]` Ley 1581 Art. 5 | **Nunca. Ni memoria persistente, ni disco** |

Que sean carpetas hermanas y no subcarpetas de un `features/` común es intencional: hace que la frontera sea **visible en el árbol de archivos** y verificable por herramienta, igual que en el monorepo del backend.

---

## 3. La frontera clínico/comercial en el navegador

Esta sección es la razón de ser del documento. Son seis controles, y ninguno es prescindible.

### 3.1 Control 1 — Dos clientes HTTP, dos `QueryClient`

`[DA]` **Prohibido un `QueryClient` único de TanStack Query para toda la aplicación.** Un caché compartido significa que una respuesta clínica y una comercial viven en la misma estructura de datos, indexadas por claves que un desarrollador podría colisionar.

```typescript
// src/app/providers/QueryProviderClinico.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

const clienteClinico = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  },
});

export const QueryProviderClinico = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={clienteClinico}>{children}</QueryClientProvider>
);
```

`gcTime: 0` es la línea crítica: los datos clínicos se descartan en cuanto el componente se desmonta. No hay caché de historia clínica esperando en memoria a que alguien abra las herramientas de desarrollo.

El cliente comercial sí cachea normalmente, porque su régimen de datos lo permite.

### 3.2 Control 2 — Prohibición absoluta de persistencia clínica

`[ON]` Ley 1581/2012 Art. 5. Los datos de salud son sensibles y no pueden quedar en el dispositivo del usuario.

| Mecanismo | Zona comercial | Zona clínica |
|---|---|---|
| `localStorage` | Preferencias de UI, nunca datos de negocio | **Prohibido para cualquier cosa** |
| `sessionStorage` | Permitido para estado de navegación | **Prohibido** |
| `IndexedDB` | Permitido para caché de catálogos | **Prohibido** |
| Service Worker / caché offline | Permitido para assets | **Prohibido para respuestas de API** |
| Persistencia de TanStack Query | Permitida | **Prohibida** |

### 3.3 Control 3 — Árboles de rutas separados con carga diferida

`[DA]` El bundle clínico **no se descarga** si el usuario no tiene permisos clínicos. No es solo optimización: reduce la superficie de código clínico presente en el navegador de un productor agrícola que nunca lo necesitará.

```typescript
// src/app/rutas/rutasClinicas.tsx
import { lazy } from "react";

const ModuloClinico = lazy(() => import("../../features-salud"));

export const rutasClinicas = [
  {
    path: "/salud/*",
    element: <ModuloClinico />,
    permiso: "clinico:atencion:leer",
  },
];
```

### 3.4 Control 4 — Verificación automática de fronteras

`[DA]` El backend tiene `import-linter`. El frontend necesita su equivalente, y ESLint lo provee con `no-restricted-imports`. **Es bloqueante en CI.**

```javascript
// eslint.config.js
export default [
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/features-salud/**"],
          message:
            "ON N-13 (Res. 1241/2026 Art. 24 parrafo): la zona comercial no " +
            "puede importar de la zona clinica. Si necesitas un dato, pidelo " +
            "por la API de disponibilidad, que ya viene sin PII.",
        }],
      }],
    },
  },
  {
    files: ["src/features-salud/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/features/**"],
          message:
            "ON N-13: la zona clinica no importa de la comercial. El unico " +
            "puente permitido es la API publica de vitrina.",
        }],
      }],
    },
  },
  {
    files: ["src/publico/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/features/**", "**/features-salud/**", "**/shared/auth/**"],
          message:
            "ON N-24: la vitrina publica se sirve sin autenticacion. No puede " +
            "depender de codigo autenticado ni arrastrarlo al bundle publico.",
        }],
      }],
    },
  },
];
```

> El tercer bloque es el más fácil de olvidar y el más caro: si `publico/` importa algo de `shared/auth/`, el bundle público arrastra el cliente OIDC completo, y una página que debe ser indexable por buscadores empieza a comportarse como una aplicación autenticada.

### 3.5 Control 5 — Observabilidad ciega a lo clínico

`[ON]` Ley 1581/2012. Ninguna herramienta de monitoreo, grabación de sesión, mapa de calor o reporte de error puede capturar contenido clínico.

| Regla | Implementación |
|---|---|
| Sin grabación de sesión en `/salud/*` | El SDK se inicializa con la ruta en la lista de exclusión |
| Errores sin cuerpo de respuesta clínica | El interceptor de `clienteClinico` elimina `response.data` antes de reportar |
| Sin PII en breadcrumbs ni en el nombre de las transacciones | Rutas parametrizadas: `/salud/pacientes/:id`, nunca el UUID real |
| Logs de consola prohibidos en producción | `ruff`-equivalente: regla de ESLint `no-console` como error |

### 3.6 Control 6 — Cierre de sesión limpia ambas zonas

Al cerrar sesión, o al expirar el token, se descartan **los dos** `QueryClient` y se limpia todo el estado. Un usuario que cierra sesión en un equipo compartido no deja nada recuperable.

---

## 4. Contratos con el backend — el cliente generado

`[DA]` **El cliente HTTP se genera desde los OpenAPI del backend. Nunca se escribe a mano.** Si el backend cambia un contrato, el build del frontend falla. Esa es exactamente la intención.

### 4.1 Versionado explícito, nunca `latest`

`[DA]` Riesgo R-12 del blueprint: al estar en repositorios separados, un cambio de contrato deja de ser atómico. La mitigación es fijar versiones.

```json
// contracts/versiones.json
{
  "actores":      "v1.4.2",
  "cumplimiento": "v1.7.0",
  "produccion":   "v1.2.1",
  "inventario":   "v1.5.3",
  "vitrina":      "v1.9.0",
  "trazabilidad": "v1.1.0",
  "disponibilidad": "v1.0.4"
}
```

```
make contracts   →  descarga las versiones EXACTAS de versiones.json
                 →  regenera src/shared/api/generado/
                 →  si algo cambió, el diff aparece en el PR
```

> **Actualizar un contrato es un PR consciente**, con su diff visible y su revisión. Nunca una sorpresa en el despliegue.

### 4.2 El tipo que hace que el dominio prohibido no compile

`[ON]` El blueprint prohíbe `Precio`, `OrdenDeCompra`, `Pago`, `Carrito`, `Checkout`. Como el cliente se genera desde OpenAPI y el backend no expone esos campos, **el frontend no puede inventarlos sin que TypeScript se queje**. Esa es la mejor defensa disponible: no es disciplina, es el compilador.

Se refuerza con un test de lenguaje prohibido equivalente al del backend, que recorre `src/` buscando esos términos en identificadores y texto de interfaz.

---

## 5. Autenticación y autorización

### 5.1 OIDC con PKCE

`[DA]` Authorization Code + PKCE. Sin secreto de cliente en el navegador, sin flujo implícito.

| Aspecto | Decisión |
|---|---|
| Almacenamiento del token | **Memoria únicamente.** Nunca `localStorage` |
| Refresh | Silencioso, vía iframe oculto o refresh token rotativo en cookie `HttpOnly` |
| Expiración | El interceptor detecta 401, intenta un refresh, y si falla redirige a login conservando la ruta destino |
| Multi-tenant | El `tenant_id` viaja en el token. **El frontend nunca lo envía como parámetro** — sería manipulable |

### 5.2 El menú se deriva de los permisos, no de una lista fija

```typescript
// src/shared/rbac/useNavegacion.ts
import { useAuth } from "../auth/useAuth";

type ItemNavegacion = {
  ruta: string;
  etiqueta: string;
  permiso: string;
};

const NAVEGACION: readonly ItemNavegacion[] = [
  { ruta: "/organizacion",  etiqueta: "Mi organización",     permiso: "actores:org:leer" },
  { ruta: "/licencias",     etiqueta: "Licencias",           permiso: "cumplimiento:atestacion:leer" },
  { ruta: "/produccion",    etiqueta: "Producción",          permiso: "produccion:cultivo:leer" },
  { ruta: "/inventario",    etiqueta: "Inventario",          permiso: "inventario:lote:leer" },
  { ruta: "/vitrina",       etiqueta: "Vitrina",             permiso: "vitrina:oferta:leer" },
  { ruta: "/trazabilidad",  etiqueta: "Trazabilidad",        permiso: "trazabilidad:evento:leer" },
  { ruta: "/institucional", etiqueta: "Panel institucional", permiso: "institucional:consultar" },
  { ruta: "/salud",         etiqueta: "Telemedicina",        permiso: "clinico:atencion:leer" },
];

export const useNavegacion = (): readonly ItemNavegacion[] => {
  const { permisos } = useAuth();
  return NAVEGACION.filter((item) => permisos.includes(item.permiso));
};
```

### 5.3 La advertencia que no se puede repetir lo suficiente

> ⚠️ **El frontend oculta; el backend prohíbe.**
>
> Ocultar un botón es **usabilidad**, no seguridad. Toda autorización se evalúa **también** en el servidor, y el servidor es el que manda. Un frontend que muestra un botón que el backend rechazará es un bug de UX. Un frontend que oculta un botón que el backend permitiría es un bug de UX. **Un backend que confía en que el frontend ocultó el botón es una vulnerabilidad.**
>
> Esto se declara explícitamente porque es el error más común y más grave en aplicaciones con RBAC en el cliente.

---

## 6. El manejo de errores es el producto

`[DA]` En un sistema regulado, **un rechazo que el usuario no puede explicarle a su abogado es un rechazo mal diseñado**. El backend devuelve RFC 9457 Problem Details con una extensión `norma`. El frontend tiene la obligación de mostrarla.

```typescript
// src/shared/api/problemDetails.ts
export type ProblemDetail = {
  type: string;
  title: string;
  detail: string;
  status: number;
  norma?: string;
};

export const esProblemDetail = (valor: unknown): valor is ProblemDetail =>
  typeof valor === "object" &&
  valor !== null &&
  "type" in valor &&
  "title" in valor;
```

```tsx
// src/shared/ui/patrones/ErrorNormativo.tsx
import type { ProblemDetail } from "../../api/problemDetails";

export const ErrorNormativo = ({ problema }: { problema: ProblemDetail }) => (
  <div role="alert" aria-live="assertive" className="error-normativo">
    <h3>{problema.title}</h3>
    <p>{problema.detail}</p>
    {problema.norma ? (
      <p className="error-normativo__fundamento">
        Fundamento normativo: {problema.norma}
      </p>
    ) : null}
  </div>
);
```

**Lo que el usuario ve al intentar publicar una oferta sin habilitación vigente:**

```
┌────────────────────────────────────────────────────────────┐
│  Publicación rechazada por falta de habilitación vigente    │
│                                                              │
│  La organización no tiene una atestación de licencia         │
│  vigente para el tipo de producto de esta oferta.            │
│                                                              │
│  Fundamento normativo: Res. 1241/2026 Art. 13b               │
│                                                              │
│  [ Ver mis licencias ]                                       │
└────────────────────────────────────────────────────────────┘
```

> **Esta pantalla es la demo.** Es lo que ningún competidor va a mostrar, y es exactamente lo que un funcionario de MinCIT necesita ver para confiar en el sistema. El §19 del blueprint la identifica como el vertical slice que hay que construir primero — y la mitad de esa demo vive aquí, en el frontend.

### 6.1 Validación en el cliente: qué es y qué no es

| Sí es | No es |
|---|---|
| Evitarle al usuario un viaje al servidor por un campo vacío | Un control regulatorio |
| Formato de NIT, rangos numéricos, campos obligatorios | La verificación de habilitación vigente |
| Retroalimentación inmediata mientras escribe | Nada que dependa de estado del servidor |

`[DA]` **Ninguna regla de negocio se reimplementa en el frontend.** Duplicar la lógica de invariantes crea dos fuentes de verdad que divergen en el primer cambio normativo. El frontend valida forma; el backend valida norma.

---

## 7. Accesibilidad — `[AMB-14]` ✅ decidido

`[RF]` Decisión del 26-ago-2026: cumplir **WCAG 2.1 AA desde el inicio**, aunque `[ON]` Res. 1241/2026 Art. 22 ¶ implica que no somos sujeto obligado de la Ley 1712/2014 por vía de función pública delegada.

**Razón de la decisión:** cuesta 10–20% del esfuerzo de frontend ahora frente a 3–5× en retrofit, y suele ser criterio de calificación en licitación pública. La obligación puede llegar igualmente **por contrato** si operamos la vitrina por cuenta de MinCIT.

### 7.1 El gate de CI

`[DA]` No es una recomendación ni una advertencia del linter. **Bloquea el merge.**

| Verificación | Herramienta | Umbral |
|---|---|---|
| Violaciones automáticas de a11y | `axe-core` vía `vitest-axe` en tests de componente | **Cero violaciones críticas o serias** |
| Auditoría de páginas clave | Lighthouse CI | **Puntaje de accesibilidad ≥ 90** |
| Navegación por teclado | Playwright, recorrido completo sin ratón | Todos los flujos críticos |
| Contraste | Verificación de tokens en el design system | AA: 4.5:1 texto normal, 3:1 texto grande |

### 7.2 El piso de calidad, sin anunciarlo

- Foco visible en todo elemento interactivo. Nunca `outline: none` sin reemplazo.
- `prefers-reduced-motion` respetado en toda animación.
- Responsive hasta 320px de ancho.
- Todo formulario con `<label>` real asociado, no `placeholder` como etiqueta.
- Errores anunciados con `role="alert"` y `aria-live`.
- Tablas de datos con encabezados asociados — la trazabilidad y el inventario son tablas densas y son el corazón del producto.
- Idioma declarado: `<html lang="es-CO">`.

> **Nota sobre el público real:** los actores priorizados son pequeños y medianos cultivadores. Muchos accederán desde móviles de gama media con conexión irregular en zonas rurales. La accesibilidad aquí no es un ejercicio de cumplimiento — es la diferencia entre que el sistema se use o no se use.

---

## 8. La vitrina pública

`[ON]` N-24 (Art. 3.7 + Ley 1712/2014): consulta **sin autenticación**, indexable, servida por CDN.

| Requisito | Decisión `[DA]` |
|---|---|
| Renderizado | Pre-renderizado estático o SSR. Una SPA vacía no es indexable ni accesible con conexión pobre |
| Datos expuestos | **Solo campos clasificados `PUBLICO`** `[AMB-05]`: existencia de oferta, tipo de producto, departamento, actor |
| Datos prohibidos | Cantidades exactas, capacidad productiva, datos de contacto — son `RESERVADO_COMERCIAL` `[ON]` Art. 21 |
| Bundle | Independiente del bundle autenticado. Sin OIDC, sin código de `features/` |
| Caché | CDN agresivo con invalidación por evento de publicación/despublicación |

> ⚠️ `[AMB-05]` **sigue pendiente de la Instancia de Coordinación.** La clasificación de tres niveles es nuestra propuesta, no una definición normativa. **Consecuencia para el frontend:** la lista de campos públicos debe ser **configuración, no código**. Si la Instancia decide que el departamento es reservado, no debe requerir un despliegue.

---

## 9. Estado: servidor contra cliente

`[DA]` La confusión entre ambos es la principal fuente de complejidad accidental en aplicaciones React.

| Tipo de estado | Herramienta | Ejemplos |
|---|---|---|
| **Estado del servidor** | TanStack Query | Ofertas, lotes, atestaciones, cultivos. Todo lo que vive en el backend |
| **Estado del cliente** | Zustand | Tema, filtros de tabla, paso del asistente, panel abierto |
| **Estado de formulario** | React Hook Form | Valores en edición antes de enviar |
| **Estado de URL** | React Router | Filtros compartibles, paginación, pestaña activa |

**Regla práctica:** si el dato podría cambiarlo otro usuario, es estado del servidor y no se copia a Zustand. Copiarlo crea una segunda fuente de verdad que se desincroniza.

---

## 10. Estructura interna de una feature

Todas las carpetas de `features/` y `features-salud/` tienen la misma forma:

```
src/features/vitrina/
├── index.ts                    superficie pública de la feature
├── rutas.tsx
├── paginas/
│   ├── ListaOfertas.tsx
│   ├── DetalleOferta.tsx
│   └── CrearOferta.tsx
├── componentes/
│   ├── TarjetaOferta.tsx
│   └── FormularioOferta.tsx
├── hooks/
│   ├── useOfertas.ts           envuelve el cliente generado
│   ├── usePublicarOferta.ts
│   └── useManifestarInteres.ts
├── modelo/
│   ├── tipos.ts                tipos de vista, derivados del contrato
│   └── mapeo.ts                contrato → modelo de vista
└── __tests__/
```

| Regla | Detalle |
|---|---|
| F-1 | Una feature **solo** se importa por su `index.ts`. Nunca `features/vitrina/hooks/useOfertas` desde fuera |
| F-2 | Una feature **no importa de otra feature**. Lo común sube a `shared/` |
| F-3 | Los hooks envuelven el cliente generado. Los componentes **nunca** llaman a `fetch` |
| F-4 | `modelo/mapeo.ts` traduce el contrato del backend al modelo de vista. Si el contrato cambia, el impacto queda contenido en un archivo |

`[DA]` **F-4 es lo que hace tolerable el riesgo R-12.** Un cambio de contrato rompe la compilación en un punto conocido, no en cuarenta componentes.

---

## 11. Pruebas

| Nivel | Herramienta | Qué cubre | Bloqueante |
|---|---|---|---|
| Unitaria | Vitest | Lógica de `modelo/mapeo.ts`, hooks puros, utilidades | Sí |
| Componente | Testing Library | Renderizado por permiso, estados de carga, error y vacío | Sí |
| Accesibilidad | `vitest-axe` | Cero violaciones críticas o serias | **Sí** `[AMB-14]` |
| Contrato | Validación contra OpenAPI | Que los mocks correspondan al contrato real | Sí |
| E2E | Playwright | Los flujos críticos del §19 del blueprint | Sí, en `main` |
| Fronteras | ESLint `no-restricted-imports` | `[ON]` N-13 clínico ⇸ comercial | **Sí** |

### 11.1 El test E2E que importa más que los demás

```typescript
// tests/e2e/publicacion-sin-habilitacion.spec.ts
import { test, expect } from "@playwright/test";

test("no se publica una oferta sin atestacion vigente y se cita la norma", async ({ page }) => {
  await iniciarSesionComo(page, "PRODUCTOR_SIN_ATESTACION");
  await page.goto("/vitrina/ofertas/nueva");
  await diligenciarOfertaValida(page);
  await page.getByRole("button", { name: "Publicar" }).click();

  const alerta = page.getByRole("alert");
  await expect(alerta).toContainText("falta de habilitación vigente");
  await expect(alerta).toContainText("Res. 1241/2026 Art. 13b");
  await expect(page.getByRole("link", { name: "Ver mis licencias" })).toBeVisible();
});
```

> Este test verifica algo que ningún test de backend puede verificar solo: que la razón normativa **llegó hasta los ojos del usuario**. Es el cierre del circuito entre la invariante del agregado y la persona que tiene que entenderla.

---

## 12. Orden de construcción

### Paso 0 — Andamiaje

| # | Entregable | Criterio de terminado |
|---|---|---|
| 0.1 | Vite + TS estricto + ESLint + Prettier | `pnpm check` verde |
| 0.2 | Reglas de frontera del §3.4 | Probadas **en rojo** antes de continuar |
| 0.3 | Gate de accesibilidad en CI | Un componente inaccesible rompe el build |
| 0.4 | Generación de cliente desde OpenAPI | `pnpm contracts` regenera y el diff aparece |
| 0.5 | OIDC PKCE contra el Keycloak local | Login y refresh funcionando |
| 0.6 | Design system mínimo: tokens, Botón, Campo, Tabla, Diálogo | Con tests de a11y |
| 0.7 | `ErrorNormativo` y el manejo de Problem Details | Es infraestructura, va temprano |
| 0.8 | `CONTRIBUTING.md` con R1–R4 | Revisado por el equipo |

> **0.2 y 0.3 deben probarse en rojo.** Un gate que nunca ha fallado no es un control. Escribe un import prohibido, verifica que el build se rompe, revierte.

### Paso 1 — El vertical slice

Sigue el §19 del blueprint. La mitad del recorrido vive en el frontend:

```
1. Registrar organización                  → features/organizaciones
2. Abrir expediente de registro            → features/cumplimiento
3. Registrar atestación con evidencia      → features/cumplimiento
4. Intentar publicar SIN atestación        → features/vitrina + ErrorNormativo  ⬅ LA DEMO
5. Registrar atestación y reintentar       → features/vitrina
6. Ver ambos hechos en el ledger           → features/trazabilidad
```

### Paso 2 en adelante

El orden sigue las fases del blueprint. La zona clínica (`features-salud/`) va en la Fase 6, y **no antes**: construirla temprano tienta a compartir infraestructura entre zonas cuando la disciplina del §3 todavía no está asentada en el equipo.

---

## 13. Los cinco errores que matarían este frontend

| # | Error | Cómo se detecta | Por qué es grave |
|---|---|---|---|
| 1 | **Un `QueryClient` único para las dos zonas** | Revisión + test de fronteras | Datos clínicos y comerciales en el mismo caché. `[ON]` N-13 comprometido |
| 2 | **Token o dato clínico en `localStorage`** | Regla de ESLint + revisión | XSS convierte una vulnerabilidad menor en fuga de datos sensibles |
| 3 | **Reimplementar una regla de negocio en el cliente** | Revisión | Dos fuentes de verdad que divergen en el primer cambio normativo |
| 4 | **Cliente HTTP escrito a mano** | Ausencia de `generado/` en el PR | El contrato deja de ser verificable; los errores aparecen en producción |
| 5 | **`publico/` importando código autenticado** | ESLint | La vitrina pública deja de ser indexable y arrastra OIDC al bundle público |

> El error #1 es el más peligroso porque **no produce ningún síntoma visible**. Todo funciona, las pruebas pasan, el usuario no nota nada — hasta que un auditor pregunta cómo se garantiza la separación de datos clínicos y la respuesta honesta es "por costumbre".

---

## 14. Ambigüedades de esta guía

| ID | Ambigüedad | Alternativas | Recomendación |
|---|---|---|---|
| `F-01` | ¿SSR completo o pre-renderizado estático para la vitrina pública? | A) Astro/Next SSR. B) Pre-render en build + revalidación por evento | **B** mientras el volumen de ofertas sea de miles. Menos infraestructura, mismo SEO. Revisar si supera decenas de miles |
| `F-02` | ¿Un bundle con code-splitting o dos aplicaciones desplegadas aparte? | A) Uno con carga diferida. B) Dos apps bajo el mismo dominio | **A** por `[RF]` (un solo login, una sola app). **B** es más defendible en auditoría — reconsiderar si el auditor lo exige |
| `F-03` | ¿Qué campos son `PUBLICO` en la vitrina? | Depende de `[AMB-05]` | **Bloqueada.** Implementar como configuración, no como código |
| `F-04` | ¿Modo offline para captura en campo? | A) No. B) Cola local de operaciones de producción | **A** por ahora. **B** es tentador para cultivos en zonas sin señal, pero persistencia local de datos de producción abre preguntas de `[ON]` Art. 21 que nadie ha respondido |
| `F-05` | ¿Se muestran datos de contacto tras habilitación en la propia UI? | A) Sí, en la plataforma. B) Notificación por correo fuera de la plataforma | **A**, pero declarando que la habilitación de contacto **no es una transacción** `[ON]` Art. 8c. Verificar con MinCIT si `[AMB-09]` se resuelve en contra |

> `F-03` está bloqueada por `[AMB-05]`, pendiente de la Instancia de Coordinación. `F-04` toca `[AMB-13]` de forma oblicua: si un día se acepta captura fotográfica de cultivo, la cola offline vuelve a ser una pregunta abierta.

---

## 15. Checklist de definición de terminado

Ningún PR se aprueba sin esto:

- [ ] `pnpm check` verde: tipos, lint, fronteras, tests
- [ ] Cero violaciones de `axe` críticas o serias `[AMB-14]`
- [ ] Navegable completo por teclado, con foco visible
- [ ] Cero comentarios en `src/` — `[RF]` R1
- [ ] Sin `any`, sin `@ts-ignore` nuevos sin justificar en el PR
- [ ] Si consume un endpoint nuevo: cliente regenerado, no escrito a mano
- [ ] Si muestra un error del backend: usa `ErrorNormativo` y muestra la cita
- [ ] Si añade una ruta: declara su permiso y su zona
- [ ] Si toca `features-salud/`: revisado contra los seis controles del §3
- [ ] Estados de carga, error y vacío implementados. Un espinner infinito no es un estado
- [ ] PR < 400 líneas modificadas
- [ ] Un aprobador. **Dos** para `features-salud/`, `shared/auth/` y `publico/`

---

*Guía técnica del frontend, complementaria al Blueprint SICAMED v1.1 y a la Guía Técnica del Backend. Las decisiones `[DA]` se cambian documentando un ADR; las `[ON]` no. Las `[AMB]` requieren respuesta antes de implementar la sección correspondiente.*
