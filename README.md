# SICAMED · Frontend

Aplicación web del Sistema de Información del Cannabis Medicinal.

React 18, TypeScript 5, Vite, TanStack Query, Zustand, Playwright.

## Requisitos

| | Versión |
|---|---|
| Node | 20.19 o superior |
| npm | 9 o superior |

Por debajo de Node 20.19 el proyecto compila, pero Playwright no arranca y `npm run test:e2e` falla. Con nvm:

```bash
nvm install 20.19
nvm use 20.19
```

## Instalación

```bash
git clone https://github.com/erkSoftware/sicamed-frontend.git
cd sicamed-frontend
npm install
cp .env.example .env
npm run dev
```

La aplicación queda en `http://localhost:5173`.

No hace falta backend. Con la configuración de `.env.example` la aplicación arranca en modo de demostración, con datos locales que reproducen las mismas respuestas y los mismos rechazos que dará el servicio real.

## Cómo entrar

En `/acceso` se elige el perfil con el que se abre la sesión.

| Perfil | Qué permite ver |
|---|---|
| Marcela Ospina | Productor habilitado. Recorrido comercial completo, puede publicar en la vitrina |
| Hernán Cifuentes | Productor sin atestación. Al publicar, el sistema rechaza y cita la norma |
| Dra. Alejandra Ríos | Equipo clínico. Pacientes, agenda y teleconsulta |
| Andrés Beltrán | Analista institucional. Solo lectura sobre todo el ecosistema |
| Lida Almeciga | Analista documental. Verifica expedientes de registro |
| Diego Fernando Marín | Super administrador. Ve todo y define la política de verificación |

`VITE_PERFIL_DEMO` fija el perfil que viene precargado. La barra superior de `/app` incluye un conmutador que cambia de perfil sin volver a `/acceso`: con `VITE_MODO_AUTH=mock` lo ve cualquiera, y con identidad real solo quien tenga rol `SUPER_ADMIN` o `ADMIN_INSTITUCIONAL`. Adoptar un perfil no toca la sesión —el token y los permisos reales siguen siendo los tuyos—; cambia el rol con el que se pinta el panel y enciende los datos de demostración, con una cinta que lo recuerda mientras dure.

Con identidad real y sin perfil adoptado, el panel arranca **vacío**: la cuenta que acaba de entrar no es dueña de ninguna de las organizaciones sembradas, y enseñárselas sería mentirle. Lo que esa cuenta cree se queda en su propio almacén y no se mezcla con la demostración.

## Variables de entorno

Ninguna es obligatoria para trabajar en local: todas tienen valor por defecto.

| Variable | Para qué sirve | En local |
|---|---|---|
| `VITE_MODO_API` | `mock` usa datos locales, `http` llama al backend. No cubre el registro de actor, que sigue a `VITE_MODO_AUTH` | `mock` |
| `VITE_URL_API` | Borde del backend. Las tres zonas cuelgan de él (`/api/v1/publico`, `/api/v1/comercial`, `/api/v1/clinica`) | `http://localhost:8080` |
| `VITE_URL_API_ORIGEN` | Solo en desarrollo: a dónde reenvía el proxy de Vite `/auth` y `/api`. Con ella puesta y `VITE_URL_API` vacía, el navegador ve la API en su propio origen y la cookie de refresco sobrevive a una recarga | Vacía, sin proxy |
| `VITE_URL_API_COMERCIAL` | Sobreescribe la base de la zona comercial | No hace falta |
| `VITE_URL_API_CLINICA` | Sobreescribe la base de la zona clínica | No hace falta |
| `VITE_URL_API_PUBLICA` | Sobreescribe la base de la zona pública | No hace falta |
| `VITE_MODO_AUTH` | `servidor`, `mock`, `contrasena`, `cloudflare` u `oidc`. Con `servidor` el acceso ocurre en la pantalla del portal contra `/auth` del backend; con `contrasena`, contra Keycloak por concesión directa; con `oidc` el navegador se va a la pantalla de Keycloak | `servidor` |
| `VITE_URL_API_IDENTIDAD` | Sobreescribe la base de `/auth`, por si la identidad vive en otro borde | No hace falta |
| `VITE_TOKEN_DESARROLLO` | Token que el modo demo manda al backend. Es el que emite `make token` del backend. Sin él, la zona autenticada responde `401` | Vacío |
| `VITE_PERFIL_DEMO` | Perfil precargado en `/acceso` | `SUPER_ADMIN` |
| `VITE_OIDC_AUTORIDAD` | Realm de Keycloak. En producción, `https://auth.sicamed.com.co/realms/sicamed` | Con `oidc` y con `contrasena` |
| `VITE_OIDC_CLIENTE` | Identificador del cliente OIDC. Es público: no lleva secreto | Con `oidc` y con `contrasena` |
| `VITE_OIDC_REDIRECCION` | Ruta de retorno del código de autorización. Tiene que estar registrada en Keycloak | Solo con `oidc` |
| `VITE_TURNSTILE_CLAVE_SITIO` | Clave de sitio de Cloudflare Turnstile. Es pública; el secreto vive en el backend. Vacía, la radicación no exige comprobación y el trámite se puede ejercer sin red. La clave solo funciona en los dominios registrados en el panel de Cloudflare: en `localhost` el widget responde `110200` y no se dibuja | Vacía |
| `VITE_CLOUDFLARE_ACCESS_EQUIPO` | Equipo de Zero Trust | Solo con `cloudflare` |
| `VITE_URL_UBICACION_IP` | Servicio que devuelve la ubicación aproximada por IP para la vista de telemedicina de `/acceso`. Solo se consulta en esa vista y nunca pide permisos de geolocalización al navegador | `https://ipwho.is/` |
| `VITE_URL_PUBLICA` | Dominio usado en canónicas y sitemap. Lo leen la aplicación y el prerenderizado | `https://sicamed.com.co` |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila, genera el bundle, prerenderiza las rutas públicas y el `sitemap.xml` |
| `npm run preview` | Sirve `dist/` como lo hará producción |
| `npm run typecheck` | TypeScript en modo estricto |
| `npm run lint` | ESLint, incluidas las reglas de frontera entre zonas |
| `npm run test` | Vitest: unitarias, de componente y de accesibilidad |
| `npm run test:e2e` | Playwright: flujos críticos y accesibilidad en navegador |
| `npm run format` | Prettier sobre todo el repositorio |
| `npm run check` | Tipos, lint y pruebas. Es lo que debe pasar antes de abrir un PR |

## Compilar y desplegar

```bash
npm run build
npm run preview
```

El resultado queda en `dist/`. El despliegue está configurado en `vercel.json`, sin pasos adicionales:

```bash
npx vercel --prod
```

Las variables de entorno de producción se cargan desde el panel de Vercel.

## Estructura

```
src/
├── app/              rutas, layouts, providers y acceso
├── shared/           api, auth, rbac, i18n, seo y design system
├── features/         zona comercial
├── features-salud/   zona clínica
└── publico/          vitrina pública, sin autenticación
```

Las tres zonas no pueden importarse entre sí. La regla está en `eslint.config.js` y `npm run lint` la hace cumplir.

## Documentación

| Archivo | Qué contiene |
|---|---|
| [README-BACKEND.md](README-BACKEND.md) | Contrato de datos: qué envía el backend, qué envía el frontend, carga de imágenes y seguridad de cada proceso |
| [GUIA-TECNICA-FRONTEND.md](GUIA-TECNICA-FRONTEND.md) | Arquitectura, frontera clínico/comercial, autenticación, errores, accesibilidad y pruebas |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Reglas R1 a R4 y definición de terminado |
| [contracts/README.md](contracts/README.md) | Versionado de los contratos OpenAPI |
| [integracion-con-backend/PENDIENTES-BACKEND.md](integracion-con-backend/PENDIENTES-BACKEND.md) | Qué falta del lado del servidor para cerrar la integración |
| [integracion-con-backend/ESTADO-DE-LA-INTEGRACION.md](integracion-con-backend/ESTADO-DE-LA-INTEGRACION.md) | Qué quedó conectado, dónde vive cada pieza y cómo se enciende |
