# SICAMED — Guía de integración para el frontend

Cómo hablar con esta API: qué rutas hay, qué exige cada una y qué devuelve
cuando algo va mal. Escrito contra el backend que corre hoy, no contra el que
queremos tener.

**Los contratos OpenAPI de [`contratos/`](contratos/) son la fuente de verdad de
los cuerpos y los esquemas.** Están verificados en CI (`make contratos`), así que
un cliente generado desde ahí no miente. Este documento cubre lo que el OpenAPI
no dice: autenticación, errores, paginación, límites y el orden de los pasos.

---

## 1. Lo primero: la forma de las URLs

Todo entra por `/api/v1/<zona>/`. **Lo que no encaje con ese formato muere en el
gateway con un 404 y no llega a ningún proceso.**

| Zona | Prefijo | Sesión | Notas |
|---|---|---|---|
| Pública | `/api/v1/publico/` | No | Anónima por diseño. CORS abierto. |
| Comercial | `/api/v1/comercial/` | Sí | Todo el negocio. Dos excepciones abajo. |
| Clínica | `/api/v1/clinica/` | Sí | Otra base de datos, otras credenciales. |

En desarrollo el gateway está en `http://localhost:8080`. En producción,
`https://api.sicamed.com.co`.

Un detalle que ahorra media hora de depuración: **el middleware de sesión corre
antes de resolver la ruta**. Una ruta que no existe, pedida sin token, responde
`401` y no `404`. Si estás probando una ruta nueva y te da 401, puede que la ruta
no exista — manda el token antes de concluir nada.

---

## 2. Autenticación

### En desarrollo: token firmado localmente

El backend arranca en modo `hs256_local`, que no necesita Keycloak. Para emitir
un token:

```bash
make token                      # SUPER_ADMIN, ve todo
ROL=PRODUCTOR make token        # un productor
ROL=COMPRADOR make token        # un comprador
```

Sale un JWT por stdout. Va en cada petición:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El token se emite atado a la **primera organización sembrada**, y eso importa:
casi todos los listados de operación se leen desde una organización, y un token
sin `org_id` recibe un `404` legítimo —«su cuenta no está asociada a ninguna
organización»— que se confunde con el 404 de una ruta que no existe.

### En producción: Keycloak

El emisor es el realm `sicamed` y el flujo es OIDC estándar (Authorization Code
+ PKCE). `make token` se niega a emitir fuera de `hs256_local` en vez de imprimir
un token que ningún servicio va a aceptar. **El frontend no debe asumir que el
token se obtiene igual en los dos entornos**: aísla la obtención del token detrás
de una función y cambia solo esa.

### Roles y permisos

Doce roles, con permisos granulares del tipo `produccion:cultivo:escribir`:

| Rol | Permisos | Para qué |
|---|---|---|
| `SUPER_ADMIN` | 52 | Todo. Solo para desarrollo y soporte. |
| `REPRESENTANTE_LEGAL` | 31 | Firma por la organización. |
| `PRODUCTOR` | 31 | El actor típico del sistema. |
| `ADMIN_INSTITUCIONAL` | 25 | Vista institucional. |
| `OPERADOR` | 21 | Operación diaria. |
| `ANALISTA_CUMPLIMIENTO` | 20 | Revisa expedientes y solicitudes. |
| `AUDITOR` | 17 | Solo lectura, amplia. |
| `SERVICIO_INTERNO` | 11 | Llamadas entre procesos. |
| `COMPRADOR` | 9 | Vitrina y manifestaciones. |
| `PROFESIONAL_SALUD` | 9 | Zona clínica. |
| `AUTORIDAD_COMPETENTE` | 6 | Consulta regulatoria. |
| `INTEGRACION` | 5 | Sistemas externos. |

`GET /api/v1/comercial/iam/roles/{rol}` devuelve los permisos de un rol, y
`GET /api/v1/comercial/iam/sesion` los de la sesión actual. **Úsalos para pintar
el menú**: no codifiques la matriz de permisos en el frontend, se desincroniza.

### Las dos rutas comerciales que NO exigen sesión

```
POST /api/v1/comercial/actores/solicitudes
POST /api/v1/comercial/actores/solicitudes/{id}/verificacion
```

Radicar el registro y probar el correo. Las hace alguien que todavía no tiene
cuenta — pedirla es justo el trámite. Tienen su propio límite por IP, más
estrecho que el resto.

---

## 3. Errores: siempre `application/problem+json`

Todo error trae el mismo cuerpo (RFC 7807). No hay respuestas de error con otra
forma, así que **un solo manejador vale para toda la aplicación**.

```jsonc
{
  "type": "https://sicamed.co/problemas/permiso-denegado",
  "title": "Acceso denegado",
  "detail": "La operación exige el permiso 'produccion:cultivo:escribir'",
  "status": 403,
  "instance": "/api/v1/comercial/cultivos",
  "norma": null,          // el artículo que lo obliga, cuando aplica
  "accion": null,         // { etiqueta, ruta } — a dónde mandar al usuario
  "errores": null         // solo en 422
}
```

`detail` está redactado para mostrarse tal cual al usuario. `title` sirve de
encabezado. **No construyas tus propios mensajes de error a partir del código
HTTP**: el backend ya explicó qué pasó, y con más contexto del que tienes.

Dos campos que casi nadie usa y deberías:

- **`accion`** trae `{etiqueta, ruta}` cuando el error tiene salida. Píntalo como
  botón. Es la diferencia entre «Acceso denegado» y «Acceso denegado — *Solicitar
  habilitación*».
- **`norma`** trae el artículo que obliga la regla. En un sistema regulado, decir
  *por qué* no se puede vale más que decir que no se puede.

### `422` trae los campos, uno por uno

```jsonc
{
  "type": "https://sicamed.co/problemas/contenido-invalido",
  "title": "La petición no cumple el contrato",
  "detail": "Revise estos campos: nit (es más corto de lo admitido), ...",
  "status": 422,
  "errores": [
    { "campo": "nit", "motivo": "Es más corto de lo admitido." },
    { "campo": "organizacion", "motivo": "Es obligatorio y no vino en la petición." }
  ]
}
```

Mapea `errores[].campo` a tus campos de formulario y pinta `motivo` debajo de
cada uno. `detail` es el resumen para cuando no puedas anclarlo a un campo.

### Los códigos y qué hacer con cada uno

| Código | Qué pasó | Qué hace el frontend |
|---|---|---|
| `401` | Sin token, o token vencido/inválido | Renovar o mandar a login. **Ojo:** también sale en rutas inexistentes sin token. |
| `403` | El rol no tiene el permiso | Mostrar `detail`. No reintentar. |
| `404` | No existe, o tu token no tiene `org_id` | Distinguir por el `type`. |
| `409` | Conflicto de estado del agregado | Recargar y reintentar. |
| `422` | El cuerpo no cumple el contrato | Pintar `errores[]` en el formulario. |
| `429` | Límite de tasa | Respetar `ratelimit-reset`. No reintentar antes. |

---

## 4. Paginación: dos esquemas distintos

**No son intercambiables.** La zona autenticada pagina por número; la pública,
por cursor opaco.

### Zona autenticada — página numerada

Petición: `?pagina=1&porPagina=10`. `porPagina` admite hasta **100**; `pagina`,
hasta 10.000. El borde rechaza cualquier cosa fuera de rango con un `422`.

```jsonc
{
  "datos": [ /* ... */ ],
  "total": 42,
  "pagina": 1,
  "porPagina": 10
}
```

Sirve para pintar un paginador con números de página.

### Zona pública — cursor opaco

Petición: `?cursor=<opaco>&porPagina=10`

```jsonc
{
  "ofertas": [ /* ... */ ],
  "cursorSiguiente": "…",
  "cursorAnterior": "…",
  "desde": 0,
  "hasta": 10
}
```

Fíjate en que **la clave del arreglo es `ofertas`, no `datos`**. Y no hay `total`:
es deliberado — el cursor opaco existe justamente para que no se pueda enumerar
el catálogo completo. Pinta «cargar más», no un paginador numerado.

### Filtros comunes

Casi todos los listados autenticados aceptan: `busqueda`, `estado`,
`departamento`, `tipo`.

---

## 5. Límites de tasa

Cada respuesta trae las cabeceras estándar:

```
ratelimit-limit: 600
ratelimit-remaining: 598
ratelimit-reset: 60
```

Los límites del gateway, por IP:

| Perfil | Límite | Aplica a |
|---|---|---|
| Público | 10 r/s (ráfaga 40) | `/api/v1/publico/` |
| Autenticado | 20 r/s (ráfaga 60) | El resto |
| Escritura | 5 r/s (ráfaga 10) | `POST`, `PUT`, `PATCH`, `DELETE` |
| Autenticación | 10 r/**min** | `/api/v1/comercial/iam/` |
| Medios | 2 r/s | Subida de archivos |

El de autenticación es 10 por **minuto**: si el frontend reintenta el login en
bucle, se bloquea solo. Pon backoff.

---

## 6. Subir un archivo: tres pasos, no uno

El backend **nunca recibe el archivo**. Va directo al almacenamiento de objetos
con una URL firmada de vida corta. Saltarse un paso deja el medio a medias.

### Paso 1 — pedir autorización

```http
POST /api/v1/comercial/medios:preparar
{
  "entidad": "LOTE",              // LOTE|PLANTA|CULTIVO|BENEFICIO|OFERTA|DESTRUCCION|EXPEDIENTE
  "entidadId": "uuid-del-padre",
  "nombre": "foto-lote.jpg",
  "mime": "image/jpeg",
  "bytes": 482910,
  "clasificacion": "PUBLICO"      // o RESERVADO_COMERCIAL
}
```

Responde:

```jsonc
{
  "medioId": "…",
  "subida": {
    "metodo": "POST",
    "url": "https://…",
    "campos": { /* política firmada */ },
    "cabeceras": { },
    "expira": "2026-08-29T20:00:00Z"
  },
  "restricciones": { /* tamaño y tipos admitidos */ }
}
```

**El permiso lo determina la entidad padre, no el medio.** Si el usuario puede
escribir en el lote, puede subirle fotos.

### Paso 2 — subir al almacenamiento

Directo a `subida.url`, sin pasar por la API. Cuando `metodo` es `POST`, los
`campos` van en el `multipart/form-data` **antes** del archivo, y el archivo va
siempre en el campo `file` y **en último lugar**. Si inviertes el orden, el
almacenamiento rechaza la subida.

### Paso 3 — confirmar

```http
POST /api/v1/comercial/medios/{medioId}:confirmar
{
  "alt": "Lote 83035d en secado",   // obligatorio, accesibilidad
  "sinPersonas": true,              // obligatorio, habeas data
  "titulo": null,
  "orden": 0
}
```

Aquí es donde ocurren el antivirus, el análisis, la re-codificación y el hash.
**Es un paso lento**: pinta un estado de «procesando», no un spinner que
bloquee.

`sinPersonas` no tiene valor por defecto a propósito: la declaración de habeas
data la hace el actor explícitamente o no se hace. No la rellenes tú.

### Galerías

La galería de una entidad cuelga de su padre: `GET /api/v1/comercial/lotes/{id}/medios`.
`PATCH` sobre esa misma ruta reordena. El original nunca se sirve — solo
variantes derivadas.

---

## 7. CORS y desarrollo local

El backend ya viene configurado para Vite:

```
SICAMED_ORIGENES_PERMITIDOS=http://localhost:5173,http://localhost:4173
```

Dos regímenes distintos, y conviene saberlo:

- **Zona pública**: `allow_origins=["*"]`, `allow_credentials=false`, solo
  `GET/HEAD/OPTIONS/POST`. No mandes cookies aquí.
- **Zona autenticada**: origen explícito y `allow_credentials=true`. **El comodín
  no se admite** — si el frontend corre en otro puerto, añádelo a
  `SICAMED_ORIGENES_PERMITIDOS` y reinicia los procesos.

Levantar el backend:

```bash
make up          # toda la pila
make seed        # datos de ejemplo
make humo        # comprobar que responde
make token       # tu token
```

---

## 8. Lo que está vacío, para que no lo descubras pintando pantallas

Honestidad por delante: no todos los contextos tienen datos.

- **`ambiente` e `interoperabilidad` están prácticamente vacíos.** `ambiente` no
  tiene ni tabla de eventos procesados; de `interoperabilidad` solo hay
  `conexiones`. Las rutas responden, pero devuelven listas vacías. No son un
  buen primer sprint.
- **La zona clínica tiene pocos datos** y vive en otra base. Los pacientes
  sembrados antes de agosto de 2026 quedaron ilegibles por una rotación de clave
  de cifrado: aparecen con sus campos cifrados marcados como suprimidos, que es
  el comportamiento correcto ante una supresión, no un error. Los nuevos se leen
  bien.
- **El puente de disponibilidad exige 20 pacientes distintos** por k-anonimato
  antes de emitir una señal. Hoy la semilla tiene una sola señal, en estado
  `RETENIDA` y con `conteo: 25`; los grupos por debajo del umbral se descartan y
  no aparecen — eso es correcto, no un fallo. `make carga-clinica` genera más
  volumen si necesitas varias.

---

## 9. Inventario de rutas y esquemas

126 operaciones en nueve procesos, con lo que devuelve cada una. Generado desde
[`contratos/`](contratos/) — si el contrato cambia, esta tabla queda obsoleta;
regenérala antes de discutirla.

### Cómo leer las tablas

| Columna | Qué es |
|---|---|
| **Query** | Parámetros de consulta. Todos opcionales salvo que el contrato diga otra cosa. |
| **Cuerpo** | El esquema que espera en el `body`. `—` = no lleva cuerpo. |
| **→** | Código de la respuesta buena. `201` en creaciones, `204` sin cuerpo. |
| **Devuelve** | El esquema de la respuesta. |

Notación de los tipos:

- `Tipo[]` — arreglo. `Tipo?` — admite `null`.
- `Pagina<X>` — el sobre paginado de §4: `{ datos: X[], total, pagina, porPagina }`.
- `PaginaCursor<X>` — el sobre por cursor de §4. **Ojo: la clave del arreglo no es
  `datos`**, es el nombre del recurso (`ofertas`). Sin `total`.
- `A \| B` — unión: **el mismo endpoint devuelve una forma u otra según quién
  pregunte**, y el frontend tiene que tolerar las dos. El caso vivo es
  `Pagina<OrganizacionApi \| OrganizacionPublicaApi>`: un **auditor** o una
  **autoridad competente** reciben la proyección *sin datos de contacto* —le
  faltan `representante`, `correo` y `telefono`— por el Art. 21; los demás roles
  reciben la completa. No es que vean menos filas: ven los mismos registros con
  menos campos. Si el frontend lee `organizacion.correo` a pelo, con un token de
  auditor obtiene `undefined`.
- `map<string, T>` — objeto con claves libres. Las facetas de la vitrina son así:
  `{"Cauca": 12, "Antioquia": 5}`.
- Los enums vienen listados con sus valores. No los adivines ni los traduzcas en
  el frontend sin mapearlos: son los que el backend valida.

Un apunte sobre fechas: `string (date-time)` es ISO 8601 en **UTC** con sufijo
`Z` (`2026-08-29T18:59:21.634225Z`). `string (date)` es solo `YYYY-MM-DD`, sin
zona — es una fecha de calendario, no un instante, y convertirla a hora local la
puede correr un día.

Los esquemas de cada proceso están plegados debajo de su tabla.

### `publico` — Zona pública

3 operaciones. Anónima. Cursor opaco, sin `total`.

| Método | Ruta | Query | Cuerpo | → | Devuelve |
|---|---|---|---|---|---|
| `GET` | `/api/v1/publico/estadisticas` | `busqueda`, `producto_tipo`, `departamento`, `actor_tipo`, `disponibilidad` | — | 200 | `EstadisticasVitrinaApi` |
| `GET` | `/api/v1/publico/ofertas` | `busqueda`, `producto_tipo`, `departamento`, `actor_tipo`, `disponibilidad`, `orden` … (+2) | — | 200 | `PaginaCursor<OfertaPublicaApi>` |
| `GET` | `/api/v1/publico/ofertas/{oferta_id}` | — | — | 200 | `OfertaPublicaApi` |

<details>
<summary><b>Esquemas de <code>publico</code></b> (7)</summary>

**`EstadisticasVitrinaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `actores` | `integer` | sí |
| `actualizacion` | `string` (date-time)? | sí |
| `departamentos` | `integer` | sí |
| `facetas` | `FacetasApi` | sí |
| `ofertas` | `integer` | sí |
| `totales` | `TotalesVitrinaApi` | sí |

**`FacetasApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `departamento` | map<string, `integer`> | sí |
| `disponibilidad` | map<string, `integer`> | sí |
| `tipoActor` | map<string, `integer`> | sí |
| `tipoProducto` | map<string, `integer`> | sí |

**`MedioApi`**

Lo necesario para pintar la imagen sin segunda petición ni salto de layout.

| Campo | Tipo | Obl. |
|---|---|---|
| `alt` | `string` | sí |
| `alto` | `integer` | sí |
| `ancho` | `integer` | sí |
| `color` | `string` | sí |
| `id` | `string` | sí |
| `lqip` | `string`? | no |
| `variantes` | `VarianteMedioApi`[] | no |

**`OfertaPublicaApi`**

Proyección de la zona pública. Solo campos clasificados `PUBLICO`.

| Campo | Tipo | Obl. |
|---|---|---|
| `certificaciones` | `string`[] | no |
| `departamento` | `string` | sí |
| `descripcion` | `string` | sí |
| `disponibilidad` | `INMEDIATA` \| `PROGRAMADA` \| `POR_CAMPAÑA` | sí |
| `estado` | `string` | sí |
| `id` | `string` | sí |
| `medios` | `MedioApi`[] | no |
| `municipio` | `string` | sí |
| `organizacion` | `string` | sí |
| `organizacionId` | `string` | sí |
| `publicada` | `string` (date-time) | sí |
| `tipoActor` | `CULTIVADOR` \| `TRANSFORMADOR` \| `DISPENSADOR` \| `IPS` \| `LABORATORIO` | sí |
| `tipoProducto` | `string` | sí |
| `titulo` | `string` | sí |
| `vigencia` | `string` (date) | sí |

**`PaginaCursor<OfertaPublicaApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `desde` | `integer` | no |
| `hasta` | `integer` | no |
| `ofertas` | `OfertaPublicaApi`[] | sí |

**`TotalesVitrinaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `actores` | `integer` | sí |
| `departamentos` | `integer` | sí |
| `ofertas` | `integer` | sí |

**`VarianteMedioApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `alto` | `integer` | sí |
| `ancho` | `integer` | sí |
| `bytes` | `integer` | sí |
| `etiqueta` | `miniatura` \| `tarjeta` \| `detalle` | sí |
| `formato` | `avif` \| `webp` \| `jpeg` | sí |
| `url` | `string` | sí |

</details>

### `identidad` — Sesión y cuentas

5 operaciones. De aquí sale el menú del usuario.

| Método | Ruta | Query | Cuerpo | → | Devuelve |
|---|---|---|---|---|---|
| `GET` | `/api/v1/comercial/iam/cuentas` | `busqueda`, `estado`, `rol`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<CuentaApi>` |
| `POST` | `/api/v1/comercial/iam/cuentas` | — | `InvitarCuentaApi` | 201 | `CuentaApi` |
| `PATCH` | `/api/v1/comercial/iam/cuentas` | — | `ModificarCuentaApi` | 200 | `CuentaApi` |
| `GET` | `/api/v1/comercial/iam/roles/{rol}` | — | — | 200 | `PermisosDeRolApi` |
| `GET` | `/api/v1/comercial/iam/sesion` | — | — | 200 | `SesionApi` |

<details>
<summary><b>Esquemas de <code>identidad</code></b> (6)</summary>

**`CuentaApi`**

Proyección de una cuenta. No lleva contraseña, ni hash, ni token.

| Campo | Tipo | Obl. |
|---|---|---|
| `correo` | `string` | sí |
| `creada` | `string` (date-time) | sí |
| `estado` | `INVITADA` \| `ACTIVA` \| `SUSPENDIDA` \| `INACTIVA` | sí |
| `id` | `string` | sí |
| `nombre` | `string` | sí |
| `organizacionId` | `string` | sí |
| `rol` | `SUPER_ADMIN` \| `ADMIN_INSTITUCIONAL` \| `ANALISTA_CUMPLIMIENTO` \| `REPRESENTANTE_LEGAL` \| `PRODUCTOR` \| `COMPRADOR` \| `OPERADOR` \| `AUDITOR` \| `AUTORIDAD_COMPETENTE` \| `PROFESIONAL_SALUD` \| `INTEGRACION` | sí |
| `ultimoAcceso` | `string` (date-time)? | no |
| `vinculadaAlIdp` | `boolean` | sí |

**`InvitarCuentaApi`**

Cuerpo de `POST /iam/cuentas`. Invitar no crea una identidad activa.

| Campo | Tipo | Obl. |
|---|---|---|
| `correo` | `string` | sí |
| `nombre` | `string` | sí |
| `organizacionId` | `string` (uuid)? | no |
| `rol` | `SUPER_ADMIN` \| `ADMIN_INSTITUCIONAL` \| `ANALISTA_CUMPLIMIENTO` \| `REPRESENTANTE_LEGAL` \| `PRODUCTOR` \| `COMPRADOR` \| `OPERADOR` \| `AUDITOR` \| `AUTORIDAD_COMPETENTE` \| `PROFESIONAL_SALUD` \| `INTEGRACION` | sí |

**`ModificarCuentaApi`**

Cuerpo de `PATCH /iam/cuentas`.

| Campo | Tipo | Obl. |
|---|---|---|
| `estado` | `INVITADA` \| `ACTIVA` \| `SUSPENDIDA` \| `INACTIVA`? | no |
| `id` | `string` (uuid) | sí |
| `rol` | `SUPER_ADMIN` \| `ADMIN_INSTITUCIONAL` \| `ANALISTA_CUMPLIMIENTO` \| `REPRESENTANTE_LEGAL` \| `PRODUCTOR` \| `COMPRADOR` \| `OPERADOR` \| `AUDITOR` \| `AUTORIDAD_COMPETENTE` \| `PROFESIONAL_SALUD` \| `INTEGRACION`? | no |

**`Pagina<CuentaApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `CuentaApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`PermisosDeRolApi`**

Qué concede un rol. El token trae el rol; el servidor deriva los permisos.

| Campo | Tipo | Obl. |
|---|---|---|
| `permisos` | `string`[] | sí |
| `rol` | `SUPER_ADMIN` \| `ADMIN_INSTITUCIONAL` \| `ANALISTA_CUMPLIMIENTO` \| `REPRESENTANTE_LEGAL` \| `PRODUCTOR` \| `COMPRADOR` \| `OPERADOR` \| `AUDITOR` \| `AUTORIDAD_COMPETENTE` \| `PROFESIONAL_SALUD` \| `INTEGRACION` | sí |

**`SesionApi`**

Quién es el portador del token, según el servidor y no según el cliente.

| Campo | Tipo | Obl. |
|---|---|---|
| `correo` | `string` | sí |
| `nombre` | `string` | sí |
| `organizacionId` | `string`? | sí |
| `permisos` | `string`[] | sí |
| `roles` | `string`[] | sí |
| `sujeto` | `string` | sí |
| `tenantId` | `string` | sí |
| `zonaClinica` | `boolean` | sí |

</details>

### `registro` — Actores, cumplimiento y directorio

26 operaciones. El trámite de radicación empieza sin sesión.

| Método | Ruta | Query | Cuerpo | → | Devuelve |
|---|---|---|---|---|---|
| `GET` | `/api/v1/comercial/actores/solicitudes` | `busqueda`, `estado`, `departamento`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<SolicitudApi>` |
| `POST` | `/api/v1/comercial/actores/solicitudes` | — | `RadicarSolicitudApi` | 201 | `RadicacionAceptadaApi` |
| `GET` | `/api/v1/comercial/actores/solicitudes/{solicitud_id}` | — | — | 200 | `SolicitudDetalleApi` |
| `PATCH` | `/api/v1/comercial/actores/solicitudes/{solicitud_id}` | — | `TramitarSolicitudApi` | 200 | `SolicitudDetalleApi` |
| `POST` | `/api/v1/comercial/actores/solicitudes/{solicitud_id}/organizacion` | — | — | 201 | `InscripcionApi` |
| `POST` | `/api/v1/comercial/actores/solicitudes/{solicitud_id}/verificacion` | — | `VerificarCorreoApi` | 200 | `VerificacionApi` |
| `GET` | `/api/v1/comercial/atestaciones` | `busqueda`, `estado`, `tipo`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<AtestacionApi>` |
| `POST` | `/api/v1/comercial/atestaciones` | — | `RegistrarAtestacionApi` | 201 | `AtestacionApi` |
| `POST` | `/api/v1/comercial/atestaciones/revocacion` | — | `RevocarAtestacionApi` | 200 | `AtestacionApi` |
| `GET` | `/api/v1/comercial/cumplimiento/expedientes` | `busqueda`, `estado`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<ExpedienteApi>` |
| `POST` | `/api/v1/comercial/cumplimiento/expedientes` | — | `AbrirExpedienteApi` | 201 | `ExpedienteApi` |
| `PATCH` | `/api/v1/comercial/cumplimiento/expedientes/documentos` | — | `DecidirDocumentoApi` | 200 | `ExpedienteApi` |
| `PATCH` | `/api/v1/comercial/cumplimiento/expedientes/pasos` | — | `ResolverPasoApi` | 200 | `ExpedienteApi` |
| `GET` | `/api/v1/comercial/cumplimiento/expedientes/{expediente_id}` | — | — | 200 | `ExpedienteApi` |
| `GET` | `/api/v1/comercial/cumplimiento/habilitacion` | `organizacionId`, `tipoProducto` | — | 200 | `HabilitacionApi` |
| `GET` | `/api/v1/comercial/cumplimiento/politica-verificacion` | — | — | 200 | `PoliticaApi` |
| `PUT` | `/api/v1/comercial/cumplimiento/politica-verificacion` | — | `GuardarPoliticaApi` | 200 | `PoliticaApi` |
| `GET` | `/api/v1/comercial/directorio` | `busqueda`, `porGrupo` | — | 200 | `RespuestaDirectorioApi` |
| `GET` | `/api/v1/comercial/organizaciones` | `busqueda`, `estado`, `departamento`, `tipo`, `pagina`, `porPagina` … (+1) | — | 200 | `Pagina<OrganizacionApi \| OrganizacionPublicaApi>` |
| `GET` | `/api/v1/comercial/organizaciones/actual` | — | — | 200 | `OrganizacionApi` |
| `PATCH` | `/api/v1/comercial/organizaciones/actual` | — | `ActualizarOrganizacionApi` | 200 | `OrganizacionApi` |
| `POST` | `/api/v1/comercial/organizaciones/caracterizacion` | — | `CaracterizarApi` | 200 | `OrganizacionApi` |
| `POST` | `/api/v1/comercial/organizaciones/reactivacion` | — | `ReactivarApi` | 200 | `OrganizacionApi` |
| `GET` | `/api/v1/comercial/organizaciones/resumen` | `ids` | — | 200 | `ResumenOrganizacionApi`[] |
| `POST` | `/api/v1/comercial/organizaciones/suspension` | — | `SuspenderApi` | 200 | `OrganizacionApi` |
| `GET` | `/api/v1/comercial/organizaciones/{organizacion_id}` | — | — | 200 | `OrganizacionApi` \| `OrganizacionPublicaApi` |

<details>
<summary><b>Esquemas de <code>registro</code></b> (38)</summary>

**`AbrirExpedienteApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `solicitudId` | `string` (uuid) | sí |

**`ActualizarOrganizacionApi`**

Cuerpo de `PATCH /organizaciones/actual`.

| Campo | Tipo | Obl. |
|---|---|---|
| `correo` | `string` | sí |
| `id` | `string`? | no |
| `municipio` | `string`? | no |
| `representante` | `string` | sí |
| `telefono` | `string` | sí |

**`AtestacionApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `acto` | `string` | sí |
| `autoridad` | `string` | sí |
| `estado` | `VIGENTE` \| `POR_VENCER` \| `VENCIDA` \| `REVOCADA` | sí |
| `evidencia` | `string` | sí |
| `expedicion` | `string` (date) | sí |
| `expedienteId` | `string`? | sí |
| `huella` | `string` | sí |
| `id` | `string` | sí |
| `organizacionId` | `string` | sí |
| `origen` | `DOCUMENTAL_VERIFICADA` \| `REGISTRO_EXTERNO` \| `DECLARACION_ACTOR` | sí |
| `registrada` | `string` (date-time) | sí |
| `tipo` | `CULTIVO_NO_PSICOACTIVO` \| `CULTIVO_PSICOACTIVO` \| `FABRICACION_DERIVADOS` \| `DISPENSACION` \| `EXPORTACION` | sí |
| `vencimiento` | `string` (date) | sí |

**`CaracterizarApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `clasificacion` | `PEQUENO_CULTIVADOR` \| `MEDIANO_CULTIVADOR` \| `MICROEMPRESA_NACIONAL` \| `EMPRESA_GRANDE` \| `ENTIDAD_PUBLICA` | sí |
| `evidenciaRues` | `string` | sí |
| `organizacionId` | `string` (uuid) | sí |

**`DecidirDocumentoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `decision` | `ACEPTADO` \| `DEVUELTO` \| `RECHAZADO` | sí |
| `documentoId` | `string` (uuid) | sí |
| `expedienteId` | `string` (uuid) | sí |
| `observacion` | `string` | no |

**`DocumentoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `decididoEn` | `string` (date-time)? | no |
| `decididoPor` | `string` | no |
| `decision` | `ACEPTADO` \| `DEVUELTO` \| `RECHAZADO`? | no |
| `id` | `string` | sí |
| `medioId` | `string`? | no |
| `nombre` | `string` | sí |
| `observacion` | `string` | no |
| `tipo` | `string` | sí |

**`DocumentoDeclaradoApi`**

Documento tal como lo declaró quien radicó. Sin peso: nadie lo necesita fuera.

| Campo | Tipo | Obl. |
|---|---|---|
| `nombre` | `string` | sí |
| `tipo` | `string` | sí |

**`DocumentoSolicitudApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `nombre` | `string` | sí |
| `peso` | `integer` | sí |
| `tipo` | `string` | sí |

**`ExpedienteApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `abierto` | `string` (date-time) | sí |
| `documentos` | `DocumentoApi`[] | sí |
| `estado` | `ABIERTO` \| `EN_VERIFICACION` \| `DEVUELTO` \| `APROBADO` \| `RECHAZADO` | sí |
| `id` | `string` | sí |
| `modo` | `SECUENCIAL` \| `PARALELO` | sí |
| `motivoCierre` | `string` | sí |
| `organizacionId` | `string` | sí |
| `pasos` | `PasoApi`[] | sí |
| `politicaVersion` | `string` | sí |
| `solicitudId` | `string` | sí |

**`GuardarPoliticaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `reglas` | `ReglaEntranteApi`[] | sí |

**`HabilitacionApi`**

Lo mínimo que otro contexto necesita para decidir, sin ver la atestación entera.

| Campo | Tipo | Obl. |
|---|---|---|
| `atestacionId` | `string` | sí |
| `tipo` | `string` | sí |
| `vigente` | `boolean` | sí |

**`InscripcionApi`**

La ficha del padrón que constituye admitir la solicitud a trámite.

| Campo | Tipo | Obl. |
|---|---|---|
| `estado` | `HABILITADA` \| `EN_TRAMITE` \| `SUSPENDIDA` \| `VENCIDA` \| `INACTIVA` | sí |
| `nit` | `string` | sí |
| `organizacionId` | `string` | sí |

**`MedicoApi`**

Profesional del directorio. La zona clínica no expone pacientes `[ON]` N-13.

| Campo | Tipo | Obl. |
|---|---|---|
| `departamento` | `string` | sí |
| `especialidad` | `string` | sí |
| `estado` | `ACTIVO` \| `INACTIVO` | sí |
| `id` | `string` | sí |
| `municipio` | `string` | sí |
| `nombre` | `string` | sí |
| `registro` | `string` | sí |

**`OrganizacionApi`**

Proyección interna de una organización, con contadores derivados.

| Campo | Tipo | Obl. |
|---|---|---|
| `correo` | `string` | sí |
| `cultivos` | `integer` | no |
| `departamento` | `string` | sí |
| `estado` | `HABILITADA` \| `EN_TRAMITE` \| `SUSPENDIDA` \| `VENCIDA` \| `INACTIVA` | sí |
| `id` | `string` | sí |
| `lotes` | `integer` | no |
| `municipio` | `string` | sí |
| `nit` | `string` | sí |
| `nombre` | `string` | sí |
| `ofertas` | `integer` | no |
| `registro` | `string` (date-time) | sí |
| `representante` | `string` | sí |
| `telefono` | `string` | sí |
| `tipo` | `CULTIVADOR` \| `TRANSFORMADOR` \| `DISPENSADOR` \| `IPS` \| `LABORATORIO` | sí |

**`OrganizacionPublicaApi`**

Proyección sin datos de contacto, para roles que no deben verlos.

| Campo | Tipo | Obl. |
|---|---|---|
| `cultivos` | `integer` | no |
| `departamento` | `string` | sí |
| `estado` | `HABILITADA` \| `EN_TRAMITE` \| `SUSPENDIDA` \| `VENCIDA` \| `INACTIVA` | sí |
| `id` | `string` | sí |
| `lotes` | `integer` | no |
| `municipio` | `string` | sí |
| `nit` | `string` | sí |
| `nombre` | `string` | sí |
| `ofertas` | `integer` | no |
| `registro` | `string` (date-time) | sí |
| `tipo` | `CULTIVADOR` \| `TRANSFORMADOR` \| `DISPENSADOR` \| `IPS` \| `LABORATORIO` | sí |

**`Pagina<AtestacionApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `AtestacionApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<ExpedienteApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `ExpedienteApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<SolicitudApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `SolicitudApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<OrganizacionApi \| OrganizacionPublicaApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `OrganizacionApi` \| `OrganizacionPublicaApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`PasoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `etiqueta` | `string` | sí |
| `exigeDobleControl` | `boolean` | sí |
| `id` | `string` | sí |
| `observacion` | `string` | no |
| `orden` | `integer` | sí |
| `reglaId` | `string` | sí |
| `resueltoEn` | `string` (date-time)? | no |
| `resueltoPor` | `string` | no |
| `rolResponsable` | `string` | sí |
| `veredicto` | `APROBADO` \| `DEVUELTO` \| `RECHAZADO`? | no |

**`PoliticaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `reglas` | `ReglaApi`[] | sí |
| `version` | `string` | sí |

**`RadicacionAceptadaApi`**

Respuesta de la radicación. No confirma ni desmiente la existencia de un NIT.

| Campo | Tipo | Obl. |
|---|---|---|
| `estado` | `string` | sí |
| `id` | `string` | sí |
| `mensaje` | `string` | sí |
| `radicada` | `string` (date-time) | sí |
| `tokenVerificacion` | `string`? | no |

**`RadicarSolicitudApi`**

Cuerpo de la única escritura sin sesión del sistema.

| Campo | Tipo | Obl. |
|---|---|---|
| `correo` | `string` | sí |
| `departamento` | `string` | sí |
| `documentos` | `DocumentoSolicitudApi`[] | no |
| `municipio` | `string` | sí |
| `nit` | `string` | sí |
| `organizacion` | `string` | sí |
| `representante` | `string` | sí |
| `telefono` | `string` | sí |
| `tipoActor` | `CULTIVADOR` \| `TRANSFORMADOR` \| `DISPENSADOR` \| `IPS` \| `LABORATORIO` | sí |

**`ReactivarApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `motivo` | `string` | sí |
| `organizacionId` | `string` (uuid) | sí |

**`RegistrarAtestacionApi`**

Cuerpo de `POST /atestaciones`.

| Campo | Tipo | Obl. |
|---|---|---|
| `acto` | `string` | sí |
| `autoridad` | `string` | sí |
| `evidencia` | `string` | sí |
| `expedicion` | `string` (date) | sí |
| `expedienteId` | `string` (uuid)? | no |
| `organizacionId` | `string` (uuid)? | no |
| `tipo` | `CULTIVO_NO_PSICOACTIVO` \| `CULTIVO_PSICOACTIVO` \| `FABRICACION_DERIVADOS` \| `DISPENSACION` \| `EXPORTACION` | sí |
| `vencimiento` | `string` (date) | sí |

**`ReglaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `etiqueta` | `string` | sí |
| `exigeDobleControl` | `boolean` | sí |
| `id` | `string` | sí |
| `modo` | `SECUENCIAL` \| `PARALELO` | sí |
| `obligatorio` | `boolean` | sí |
| `orden` | `integer` | sí |
| `rolResponsable` | `string` | sí |

**`ReglaEntranteApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `id` | `string` | sí |
| `modo` | `SECUENCIAL` \| `PARALELO` | sí |
| `obligatorio` | `boolean` | sí |

**`ResolverPasoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `expedienteId` | `string` (uuid) | sí |
| `observacion` | `string` | no |
| `pasoId` | `string` (uuid) | sí |
| `veredicto` | `APROBADO` \| `DEVUELTO` \| `RECHAZADO` | sí |

**`RespuestaDirectorioApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `dispensadores` | `OrganizacionApi`[] | sí |
| `medicos` | `MedicoApi`[] | sí |
| `prestadores` | `OrganizacionApi`[] | sí |
| `proveedores` | `OrganizacionApi`[] | sí |
| `totales` | `TotalesDirectorioApi` | sí |

**`ResumenOrganizacionApi`**

Cómo se llama un actor y qué es. Nada más.

| Campo | Tipo | Obl. |
|---|---|---|
| `id` | `string` | sí |
| `nombre` | `string` | sí |
| `tipo` | `CULTIVADOR` \| `TRANSFORMADOR` \| `DISPENSADOR` \| `IPS` \| `LABORATORIO` | sí |

**`RevocarAtestacionApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `id` | `string` (uuid) | sí |
| `motivo` | `string` | sí |

**`SolicitudApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `correo` | `string` | sí |
| `correoVerificado` | `boolean` | no |
| `departamento` | `string` | sí |
| `documentos` | `integer` | no |
| `estado` | `RECIBIDA` \| `EN_TRAMITE` \| `APROBADA` \| `RECHAZADA` | sí |
| `expedienteId` | `string`? | no |
| `id` | `string` | sí |
| `motivoRechazo` | `string` | no |
| `municipio` | `string` | sí |
| `nit` | `string` | sí |
| `organizacion` | `string` | sí |
| `radicada` | `string` (date-time) | sí |
| `representante` | `string` | sí |
| `telefono` | `string` | sí |
| `tipoActor` | `CULTIVADOR` \| `TRANSFORMADOR` \| `DISPENSADOR` \| `IPS` \| `LABORATORIO` | sí |

**`SolicitudDetalleApi`**

Vista de una solicitud para el contexto que le abre expediente.

| Campo | Tipo | Obl. |
|---|---|---|
| `correo` | `string` | sí |
| `correoVerificado` | `boolean` | no |
| `departamento` | `string` | sí |
| `documentos` | `integer` | no |
| `documentosDeclarados` | `DocumentoDeclaradoApi`[] | no |
| `estado` | `RECIBIDA` \| `EN_TRAMITE` \| `APROBADA` \| `RECHAZADA` | sí |
| `expedienteId` | `string`? | no |
| `id` | `string` | sí |
| `motivoRechazo` | `string` | no |
| `municipio` | `string` | sí |
| `nit` | `string` | sí |
| `organizacion` | `string` | sí |
| `organizacionId` | `string`? | no |
| `radicada` | `string` (date-time) | sí |
| `representante` | `string` | sí |
| `telefono` | `string` | sí |
| `tipoActor` | `CULTIVADOR` \| `TRANSFORMADOR` \| `DISPENSADOR` \| `IPS` \| `LABORATORIO` | sí |

**`SuspenderApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `motivo` | `string` | sí |
| `organizacionId` | `string` (uuid) | sí |

**`TotalesDirectorioApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `dispensadores` | `integer` | sí |
| `ips` | `integer` | sí |
| `medicos` | `integer` | sí |
| `pacientes` | `integer` | sí |
| `proveedores` | `integer` | sí |

**`TramitarSolicitudApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `estado` | `string` | sí |
| `expedienteId` | `string` (uuid) | sí |

**`VerificacionApi`**

Respuesta del enlace de verificación. No proyecta la solicitud: es pública.

| Campo | Tipo | Obl. |
|---|---|---|
| `correoVerificado` | `boolean` | sí |
| `id` | `string` | sí |
| `mensaje` | `string` | sí |

**`VerificarCorreoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `token` | `string` | sí |

</details>

### `mercado` — Ofertas, vitrina e indicadores

13 operaciones. La cara comercial del sistema.

| Método | Ruta | Query | Cuerpo | → | Devuelve |
|---|---|---|---|---|---|
| `GET` | `/api/v1/comercial/indicadores/nacionales` | — | — | 200 | `IndicadoresNacionalesApi` |
| `GET` | `/api/v1/comercial/institucional/indicadores` | — | — | 200 | `IndicadoresNacionalesApi` |
| `GET` | `/api/v1/comercial/manifestaciones` | — | — | 200 | `ManifestacionApi`[] |
| `GET` | `/api/v1/comercial/ofertas` | `busqueda`, `estado`, `departamento`, `tipo`, `pagina`, `porPagina` … (+1) | — | 200 | `Pagina<OfertaApi>` |
| `POST` | `/api/v1/comercial/ofertas` | — | `PublicarOfertaApi` | 201 | `OfertaApi` |
| `GET` | `/api/v1/comercial/ofertas/{oferta_id}` | — | — | 200 | `OfertaApi` |
| `GET` | `/api/v1/comercial/reportes/resumen` | — | — | 200 | `ResumenReportesApi` |
| `GET` | `/api/v1/comercial/ruedas-negocio` | — | — | 200 | `RuedaApi`[] |
| `POST` | `/api/v1/comercial/ruedas-negocio/inscripciones` | — | `InscribirRuedaApi` | 200 | `RuedaApi` |
| `GET` | `/api/v1/comercial/vitrina/cierres` | — | — | 200 | `CierreApi`[] |
| `PATCH` | `/api/v1/comercial/vitrina/cierres` | — | `DeclararMovimientoApi` | 200 | `CierreApi` |
| `POST` | `/api/v1/comercial/vitrina/manifestaciones` | — | `ManifestarInteresApi` | 201 | `ManifestacionApi` |
| `PATCH` | `/api/v1/comercial/vitrina/manifestaciones/habilitacion` | — | `HabilitarContactoApi` | 200 | `ManifestacionApi` |

<details>
<summary><b>Esquemas de <code>mercado</code></b> (20)</summary>

**`CierreApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `abierto` | `string` (date-time) | sí |
| `autodeclarado` | `boolean` | sí |
| `canal` | `FNE` \| `CONTRATO_DIRECTO` \| `EXPORTACION` | sí |
| `declaradoEn` | `string` (date-time)? | no |
| `id` | `string` | sí |
| `manifestacionId` | `string` | sí |
| `movimiento` | `NO_DECLARADO` \| `SE_CONCRETO` \| `NO_SE_CONCRETO` \| `EN_CONVERSACION` | sí |
| `ofertaId` | `string` | sí |

**`DeclararMovimientoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `id` | `string` (uuid) | sí |
| `movimiento` | `NO_DECLARADO` \| `SE_CONCRETO` \| `NO_SE_CONCRETO` \| `EN_CONVERSACION` | sí |

**`DepartamentoApi`**

`codigo` es DIVIPOLA y es lo que enlaza con el mapa del frontend.

| Campo | Tipo | Obl. |
|---|---|---|
| `codigo` | `string` | sí |
| `dispensadores` | `integer` | sí |
| `ips` | `integer` | sí |
| `medicos` | `integer` | sí |
| `nombre` | `string` | sí |
| `pacientes` | `integer` | sí |
| `proveedores` | `integer` | sí |

**`EtapaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `clave` | `string` | sí |
| `detalle` | `string` | sí |
| `etiqueta` | `string` | sí |
| `unidad` | `string` | sí |
| `valor` | `integer` | sí |

**`HabilitarContactoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `id` | `string` (uuid) | sí |

**`IndicadoresNacionalesApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `atestacionesPorVencer` | `integer` | sí |
| `departamentos` | `DepartamentoApi`[] | sí |
| `etapas` | `EtapaApi`[] | sí |
| `eventosLedger` | `integer` | sí |
| `ofertasPublicadas` | `integer` | sí |
| `rechazosNormativos` | `integer` | sí |
| `serie` | `PuntoSerieApi`[] | sí |
| `totales` | `TotalesApi` | sí |

**`InscribirRuedaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `id` | `string` (uuid) | sí |

**`ManifestacionApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cierreId` | `string`? | no |
| `contacto` | map<string, `string`>? | no |
| `departamento` | `string` | sí |
| `estado` | `RECIBIDA` \| `CONTACTO_HABILITADO` \| `DECLINADA` \| `EXPIRADA` | sí |
| `expira` | `string` (date-time) | sí |
| `fecha` | `string` (date-time) | sí |
| `id` | `string` | sí |
| `oferta` | `string` | sí |
| `ofertaId` | `string` | sí |
| `organizacionInteresadaId` | `string` | sí |
| `solicitante` | `string` | sí |

**`ManifestarInteresApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `departamento` | `string` | sí |
| `ofertaId` | `string` (uuid) | sí |
| `solicitante` | `string` | sí |

**`MedioApi`**

Lo necesario para pintar la imagen sin segunda petición ni salto de layout.

| Campo | Tipo | Obl. |
|---|---|---|
| `alt` | `string` | sí |
| `alto` | `integer` | sí |
| `ancho` | `integer` | sí |
| `color` | `string` | sí |
| `id` | `string` | sí |
| `lqip` | `string`? | no |
| `variantes` | `VarianteMedioApi`[] | no |

**`OfertaApi`**

Proyección de la zona autenticada, para el propio oferente y lo institucional.

| Campo | Tipo | Obl. |
|---|---|---|
| `atestacionHabilitanteId` | `string`? | no |
| `certificaciones` | `string`[] | no |
| `departamento` | `string` | sí |
| `descripcion` | `string` | sí |
| `disponibilidad` | `INMEDIATA` \| `PROGRAMADA` \| `POR_CAMPAÑA` | sí |
| `estado` | `BORRADOR` \| `PUBLICADA` \| `PAUSADA` \| `DESPUBLICADA` \| `CERRADA` | sí |
| `id` | `string` | sí |
| `interesados` | `integer` | no |
| `medios` | `MedioApi`[] | no |
| `motivoDespublicacion` | `string` | no |
| `municipio` | `string` | sí |
| `organizacion` | `string` | sí |
| `organizacionId` | `string` | sí |
| `publicada` | `string` (date-time)? | sí |
| `tipoActor` | `CULTIVADOR` \| `TRANSFORMADOR` \| `DISPENSADOR` \| `IPS` \| `LABORATORIO` | sí |
| `tipoProducto` | `FLOR_SECA` \| `FLOR_SECA_NO_PSICOACTIVA` \| `BIOMASA` \| `EXTRACTO` \| `ACEITE` \| `FORMULA_MAGISTRAL` | sí |
| `titulo` | `string` | sí |
| `verificadaEn` | `string` (date-time)? | no |
| `vigencia` | `string` (date)? | sí |

**`Pagina<OfertaApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `OfertaApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`ParApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `etiqueta` | `string` | sí |
| `valor` | `integer` | sí |

**`ParFichaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `rotulo` | `string` | sí |
| `valor` | `string` | sí |

**`PublicarOfertaApi`**

Cuerpo de `POST /ofertas`. `estado` y `publicada` los calcula el servidor.

| Campo | Tipo | Obl. |
|---|---|---|
| `certificaciones` | `string` (uuid)[] | no |
| `departamento` | `string` | sí |
| `descripcion` | `string` | sí |
| `disponibilidad` | `INMEDIATA` \| `PROGRAMADA` \| `POR_CAMPAÑA` | sí |
| `fichaTecnica` | `ParFichaApi`[] | no |
| `medios` | `string` (uuid)[] | no |
| `municipio` | `string` | sí |
| `organizacionId` | `string` (uuid)? | no |
| `tipoProducto` | `FLOR_SECA` \| `FLOR_SECA_NO_PSICOACTIVA` \| `BIOMASA` \| `EXTRACTO` \| `ACEITE` \| `FORMULA_MAGISTRAL` | sí |
| `titulo` | `string` | sí |
| `vigencia` | `string` (date)? | no |

**`PuntoSerieApi`**

`rechazos` es una métrica de valor: mide la norma aplicándose, no fallos.

| Campo | Tipo | Obl. |
|---|---|---|
| `etiqueta` | `string` | sí |
| `rechazos` | `integer` | sí |
| `valor` | `integer` | sí |

**`ResumenReportesApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cumplimiento` | `ParApi`[] | sí |
| `departamentos` | `DepartamentoApi`[] | sí |
| `etapas` | `EtapaApi`[] | sí |
| `porTipoActor` | `ParApi`[] | sí |
| `serie` | `PuntoSerieApi`[] | sí |

**`RuedaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cupos` | `integer` | sí |
| `cuposDisponibles` | `integer` | sí |
| `departamento` | `string` | sí |
| `estado` | `CONVOCATORIA` \| `INSCRIPCIONES` \| `CERRADA` \| `REALIZADA` | sí |
| `fecha` | `string` (date) | sí |
| `id` | `string` | sí |
| `inscrito` | `boolean` | no |
| `municipio` | `string` | sí |
| `nombre` | `string` | sí |

**`TotalesApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `dispensadores` | `integer` | sí |
| `ips` | `integer` | sí |
| `medicos` | `integer` | sí |
| `pacientes` | `integer` | sí |
| `proveedores` | `integer` | sí |

**`VarianteMedioApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `alto` | `integer` | sí |
| `ancho` | `integer` | sí |
| `bytes` | `integer` | sí |
| `etiqueta` | `miniatura` \| `tarjeta` \| `detalle` | sí |
| `formato` | `avif` \| `webp` \| `jpeg` | sí |
| `url` | `string` | sí |

</details>

### `operacion` — Cupos, cultivos, plantas e inventario

26 operaciones. El grueso del negocio.

| Método | Ruta | Query | Cuerpo | → | Devuelve |
|---|---|---|---|---|---|
| `GET` | `/api/v1/comercial/actas-destruccion` | `entidad`, `entidadId`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<ActaDestruccionApi>` |
| `POST` | `/api/v1/comercial/actas-destruccion` | — | `LevantarActaApi` | 201 | `ActaDestruccionApi` |
| `GET` | `/api/v1/comercial/actas-destruccion/{acta_id}` | — | — | 200 | `ActaDestruccionApi` |
| `POST` | `/api/v1/comercial/beneficios` | — | `RegistrarBeneficioApi` | 201 | `BeneficioApi` |
| `GET` | `/api/v1/comercial/beneficios/{beneficio_id}` | — | — | 200 | `BeneficioApi` |
| `POST` | `/api/v1/comercial/beneficios/{beneficio_id}/avances` | — | `AvanzarBeneficioApi` | 200 | `BeneficioApi` |
| `GET` | `/api/v1/comercial/cultivos` | `organizacionId`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<CultivoApi>` |
| `POST` | `/api/v1/comercial/cultivos` | — | `RegistrarCultivoApi` | 201 | `CultivoApi` |
| `GET` | `/api/v1/comercial/cultivos/{cultivo_id}` | — | — | 200 | `CultivoApi` |
| `GET` | `/api/v1/comercial/cultivos/{cultivo_id}/beneficios` | `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<BeneficioApi>` |
| `GET` | `/api/v1/comercial/cultivos/{cultivo_id}/plantas` | `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<PlantaApi>` |
| `POST` | `/api/v1/comercial/cultivos/{cultivo_id}/plantas` | — | `RegistrarPlantaApi` | 201 | `PlantaApi` |
| `GET` | `/api/v1/comercial/cupos` | `organizacionId`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<CupoApi>` |
| `POST` | `/api/v1/comercial/cupos` | — | `RegistrarCupoApi` | 201 | `CupoApi` |
| `GET` | `/api/v1/comercial/cupos/{cupo_id}` | — | — | 200 | `CupoApi` |
| `POST` | `/api/v1/comercial/cupos/{cupo_id}/conciliacion` | — | `ConciliarCupoApi` | 200 | `CupoApi` |
| `GET` | `/api/v1/comercial/lotes` | `organizacionId`, `estado`, `publicables`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<LoteApi>` |
| `POST` | `/api/v1/comercial/lotes` | — | `CrearLoteApi` | 201 | `LoteApi` |
| `GET` | `/api/v1/comercial/lotes/{lote_id}` | — | — | 200 | `LoteApi` |
| `GET` | `/api/v1/comercial/lotes/{lote_id}/movimientos` | — | — | 200 | `MovimientoApi`[] |
| `POST` | `/api/v1/comercial/lotes/{lote_id}/movimientos` | — | `MoverLoteApi` | 200 | `LoteApi` |
| `GET` | `/api/v1/comercial/lotes/{lote_id}/transformaciones` | `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<TransformacionApi>` |
| `GET` | `/api/v1/comercial/plantas/{planta_id}` | — | — | 200 | `PlantaApi` |
| `POST` | `/api/v1/comercial/plantas/{planta_id}/cosecha` | — | — | 200 | `PlantaApi` |
| `POST` | `/api/v1/comercial/plantas/{planta_id}/labores` | — | `RegistrarLaborApi` | 201 | `LaborApi` |
| `POST` | `/api/v1/comercial/transformaciones` | — | `RegistrarTransformacionApi` | 201 | `TransformacionApi` |

<details>
<summary><b>Esquemas de <code>operacion</code></b> (27)</summary>

**`ActaDestruccionApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cantidad` | `string` | sí |
| `cargoTestigo` | `string` | sí |
| `causal` | `string` | sí |
| `entidad` | `string` | sí |
| `entidadId` | `string` | sí |
| `fecha` | `string` (date) | sí |
| `id` | `string` | sí |
| `metodo` | `string` | sí |
| `organizacionId` | `string` | sí |
| `registro` | `string` (date-time) | sí |
| `responsable` | `string` | sí |
| `testigo` | `string` | sí |
| `unidad` | `g` \| `kg` \| `t` \| `ml` \| `l` \| `und` \| `planta` \| `ha` | sí |

**`AvanzarBeneficioApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `estado` | `SECADO` \| `CURADO` \| `ACONDICIONADO` \| `CERRADO` | sí |
| `humedad` | `number` \| `string`? | no |
| `pesoKg` | `number` \| `string` | sí |

**`BeneficioApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cultivoId` | `string` | sí |
| `estado` | `SECADO` \| `CURADO` \| `ACONDICIONADO` \| `CERRADO` | sí |
| `humedad` | `string`? | sí |
| `id` | `string` | sí |
| `merma` | `string`? | sí |
| `organizacionId` | `string` | sí |
| `pesoAcondicionadoKg` | `string`? | sí |
| `pesoHumedoKg` | `string` | sí |
| `pesoSecoKg` | `string`? | sí |
| `plantas` | `integer` | sí |
| `registro` | `string` (date-time) | sí |
| `responsable` | `string` | sí |

**`ConciliarCupoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `plantasReportadasMicc` | `integer` | sí |

**`CrearLoteApi`**

`[ON]` Dec. 1138/2025 Art. 1 núm. 38 — el producto terminado exige INVIMA.

| Campo | Tipo | Obl. |
|---|---|---|
| `bodega` | `string` | sí |
| `cantidad` | `number` \| `string` | sí |
| `cbd` | `number` \| `string` | sí |
| `codigo` | `string` | sí |
| `cultivoId` | `string` (uuid)? | no |
| `departamento` | `string` | sí |
| `fecha` | `string` (date) | sí |
| `organizacionId` | `string` (uuid)? | no |
| `registroInvima` | `string` | no |
| `thc` | `number` \| `string` | sí |
| `tipo` | `FLOR_SECA` \| `BIOMASA` \| `EXTRACTO` \| `ACEITE` \| `FORMULA_MAGISTRAL` | sí |
| `unidad` | `g` \| `kg` \| `t` \| `ml` \| `l` \| `und` \| `planta` \| `ha` | sí |
| `vencimiento` | `string` (date) | sí |

**`CultivoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `areaHectareas` | `string` | sí |
| `cosechaEstimada` | `string` (date) | sí |
| `cupoId` | `string` | sí |
| `departamento` | `string` | sí |
| `estado` | `PLANIFICADO` \| `SIEMBRA` \| `VEGETATIVO` \| `FLORACION` \| `COSECHA` \| `CERRADO` | sí |
| `id` | `string` | sí |
| `municipio` | `string` | sí |
| `nombre` | `string` | sí |
| `organizacionId` | `string` | sí |
| `plantas` | `integer` | sí |
| `plantasVivas` | `integer` | sí |
| `registro` | `string` (date-time) | sí |
| `siembra` | `string` (date) | sí |
| `variedadId` | `string` | sí |

**`CupoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `acto` | `string` | sí |
| `estado` | `ASIGNADO` \| `CONCILIADO` \| `DISCREPANTE` \| `VENCIDO` | sí |
| `id` | `string` | sí |
| `organizacionId` | `string` | sí |
| `plantasAsignadas` | `integer` | sí |
| `plantasDisponibles` | `integer` | sí |
| `plantasReportadasMicc` | `integer`? | sí |
| `plantasUsadas` | `integer` | sí |
| `vigenciaDesde` | `string` (date) | sí |
| `vigenciaHasta` | `string` (date) | sí |

**`LaborApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `agroinsumoId` | `string` | sí |
| `carenciaHasta` | `string` (date)? | sí |
| `dosis` | `string` | sí |
| `fecha` | `string` (date-time) | sí |
| `id` | `string` | sí |
| `responsable` | `string` | sí |
| `tipo` | `RIEGO` \| `FERTILIZACION` \| `FITOSANITARIA` \| `PODA` \| `TRASPLANTE` \| `MONITOREO` | sí |

**`LevantarActaApi`**

`[ON]` Dec. 1138/2025 Art. 11 — sin testigo identificado el acta no prueba nada.

| Campo | Tipo | Obl. |
|---|---|---|
| `cantidad` | `number` \| `string` | sí |
| `cargoTestigo` | `string` | sí |
| `causal` | `string` | sí |
| `entidad` | `LOTE` \| `PLANTA` \| `CULTIVO` | sí |
| `entidadId` | `string` (uuid) | sí |
| `fecha` | `string` (date) | sí |
| `metodo` | `string` | sí |
| `organizacionId` | `string` (uuid)? | no |
| `responsable` | `string` | sí |
| `testigo` | `string` | sí |
| `unidad` | `g` \| `kg` \| `t` \| `ml` \| `l` \| `und` \| `planta` \| `ha` | sí |

**`LoteApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `bodega` | `string` | sí |
| `cantidadInicial` | `string` | sí |
| `cbd` | `string` | sí |
| `codigo` | `string` | sí |
| `cultivoId` | `string`? | sí |
| `departamento` | `string` | sí |
| `estado` | `EN_BODEGA` \| `EN_TRANSITO` \| `DISPENSADO` \| `RETENIDO` \| `DESTRUIDO` \| `CONGELADO` | sí |
| `existencia` | `string` | sí |
| `fecha` | `string` (date) | sí |
| `id` | `string` | sí |
| `motivoEstado` | `string` | sí |
| `organizacionId` | `string` | sí |
| `psicoactivo` | `boolean` | sí |
| `registro` | `string` (date-time) | sí |
| `registroInvima` | `string` | sí |
| `thc` | `string` | sí |
| `tipo` | `FLOR_SECA` \| `BIOMASA` \| `EXTRACTO` \| `ACEITE` \| `FORMULA_MAGISTRAL` | sí |
| `unidad` | `g` \| `kg` \| `t` \| `ml` \| `l` \| `und` \| `planta` \| `ha` | sí |
| `vencimiento` | `string` (date) | sí |

**`MoverLoteApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `bodega` | `string` | no |
| `destino` | `EN_BODEGA` \| `EN_TRANSITO` \| `DISPENSADO` \| `RETENIDO` \| `DESTRUIDO` \| `CONGELADO` | sí |
| `motivo` | `string` | sí |

**`MovimientoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `actor` | `string` | sí |
| `bodega` | `string` | sí |
| `estadoAnterior` | `EN_BODEGA` \| `EN_TRANSITO` \| `DISPENSADO` \| `RETENIDO` \| `DESTRUIDO` \| `CONGELADO` | sí |
| `estadoNuevo` | `EN_BODEGA` \| `EN_TRANSITO` \| `DISPENSADO` \| `RETENIDO` \| `DESTRUIDO` \| `CONGELADO` | sí |
| `loteId` | `string` | sí |
| `momento` | `string` (date-time) | sí |
| `motivo` | `string` | sí |

**`Pagina<ActaDestruccionApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `ActaDestruccionApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<BeneficioApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `BeneficioApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<CultivoApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `CultivoApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<CupoApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `CupoApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<LoteApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `LoteApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<PlantaApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `PlantaApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<TransformacionApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `TransformacionApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`PlantaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `aptaDesde` | `string` (date)? | sí |
| `bloque` | `string` | sí |
| `codigo` | `string` | sí |
| `cosechadaEn` | `string` (date)? | sí |
| `cultivoId` | `string` | sí |
| `enCarencia` | `boolean` | sí |
| `estado` | `VIVA` \| `COSECHADA` \| `DESTRUIDA` | sí |
| `id` | `string` | sí |
| `labores` | `LaborApi`[] | no |
| `madreId` | `string`? | sí |
| `organizacionId` | `string` | sí |
| `origen` | `SEMILLA` \| `CLON` | sí |
| `siembra` | `string` (date) | sí |
| `variedadId` | `string` | sí |

**`RegistrarBeneficioApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cultivoId` | `string` (uuid) | sí |
| `organizacionId` | `string` (uuid)? | no |
| `pesoHumedoKg` | `number` \| `string` | sí |
| `plantas` | `integer` | sí |
| `responsable` | `string` | sí |

**`RegistrarCultivoApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `areaHectareas` | `number` \| `string` | sí |
| `cosechaEstimada` | `string` (date) | sí |
| `cupoId` | `string` (uuid) | sí |
| `departamento` | `string` | sí |
| `municipio` | `string` | sí |
| `nombre` | `string` | sí |
| `organizacionId` | `string` (uuid)? | no |
| `plantas` | `integer` | sí |
| `siembra` | `string` (date) | sí |
| `variedadId` | `string` | sí |

**`RegistrarCupoApi`**

`[ON]` Dec. 1138/2025 Art. 3 — el cupo lo asigna el MICC; aquí se registra.

| Campo | Tipo | Obl. |
|---|---|---|
| `acto` | `string` | sí |
| `organizacionId` | `string` (uuid)? | no |
| `plantasAsignadas` | `integer` | sí |
| `vigenciaDesde` | `string` (date) | sí |
| `vigenciaHasta` | `string` (date) | sí |

**`RegistrarLaborApi`**

`aptaDesde` no se acepta del cliente: sale de la carencia del agroinsumo.

| Campo | Tipo | Obl. |
|---|---|---|
| `agroinsumoId` | `string` | no |
| `dosis` | `string` | no |
| `responsable` | `string` | sí |
| `tipo` | `RIEGO` \| `FERTILIZACION` \| `FITOSANITARIA` \| `PODA` \| `TRASPLANTE` \| `MONITOREO` | sí |

**`RegistrarPlantaApi`**

`[ON]` Art. 12 — `madreId` es obligatorio cuando el origen es clon.

| Campo | Tipo | Obl. |
|---|---|---|
| `bloque` | `string` | no |
| `codigo` | `string` | sí |
| `madreId` | `string` (uuid)? | no |
| `organizacionId` | `string` (uuid)? | no |
| `origen` | `SEMILLA` \| `CLON` | sí |
| `siembra` | `string` (date) | sí |
| `variedadId` | `string` | sí |

**`RegistrarTransformacionApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `codigoLoteResultante` | `string` | no |
| `entradaKg` | `number` \| `string` | sí |
| `fecha` | `string` (date) | sí |
| `formula` | `string` | no |
| `loteOrigenId` | `string` (uuid) | sí |
| `organizacionId` | `string` (uuid)? | no |
| `producto` | `string` | sí |
| `registroInvima` | `string` | sí |
| `responsable` | `string` | sí |
| `salida` | `number` \| `string` | sí |
| `unidadSalida` | `g` \| `kg` \| `t` \| `ml` \| `l` \| `und` \| `planta` \| `ha` | sí |

**`TransformacionApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `entradaKg` | `string` | sí |
| `fecha` | `string` (date) | sí |
| `formula` | `string` | sí |
| `id` | `string` | sí |
| `loteOrigenId` | `string` | sí |
| `loteResultanteId` | `string`? | sí |
| `organizacionId` | `string` | sí |
| `producto` | `string` | sí |
| `registro` | `string` (date-time) | sí |
| `registroInvima` | `string` | sí |
| `rendimiento` | `string` | sí |
| `responsable` | `string` | sí |
| `salida` | `string` | sí |
| `unidadSalida` | `g` \| `kg` \| `t` \| `ml` \| `l` \| `und` \| `planta` \| `ha` | sí |

</details>

### `evidencia` — Trazabilidad e interoperabilidad

8 operaciones. `interoperabilidad` está casi vacío.

| Método | Ruta | Query | Cuerpo | → | Devuelve |
|---|---|---|---|---|---|
| `GET` | `/api/v1/comercial/interoperabilidad/conexiones` | — | — | 200 | `ConexionApi`[] |
| `POST` | `/api/v1/comercial/interoperabilidad/conexiones/sincronizacion` | — | `SincronizarApi` | 200 | `ConexionApi` |
| `GET` | `/api/v1/comercial/interoperabilidad/discrepancias` | `conexionId`, `resolucion`, `entidad` | — | 200 | `DiscrepanciaApi`[] |
| `PATCH` | `/api/v1/comercial/interoperabilidad/discrepancias` | — | `ResolverApi` | 200 | `DiscrepanciaApi` |
| `GET` | `/api/v1/comercial/interoperabilidad/rues/{nit}` | — | — | 200 | `InscripcionMercantilApi` |
| `GET` | `/api/v1/comercial/trazabilidad/eventos` | `busqueda`, `tipo`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<EventoTrazabilidadApi>` |
| `GET` | `/api/v1/comercial/trazabilidad/verificacion` | — | — | 200 | `VerificacionApi` |
| `GET` | `/api/v1/comercial/trazabilidad/{entidad}/{entidad_id}` | — | — | 200 | `EventoTrazabilidadApi`[] |

<details>
<summary><b>Esquemas de <code>evidencia</code></b> (8)</summary>

**`ConexionApi`**

Enlace con un sistema externo, con su estado declarado honestamente.

| Campo | Tipo | Obl. |
|---|---|---|
| `descripcion` | `string` | sí |
| `discrepanciasAbiertas` | `integer` | no |
| `entidad` | `string` | sí |
| `estado` | `CONECTADA` \| `DEGRADADA` \| `NO_CONECTADA` | sí |
| `id` | `string` | sí |
| `nombre` | `string` | sí |
| `norma` | `string` | sí |
| `registrosSincronizados` | `integer` | no |
| `ultimaSincronizacion` | `string` (date-time)? | no |

**`DiscrepanciaApi`**

Diferencia entre el dato local y el del registro externo.

| Campo | Tipo | Obl. |
|---|---|---|
| `campo` | `string` | sí |
| `conexionId` | `string` | sí |
| `detectada` | `string` (date-time) | sí |
| `entidad` | `string` | sí |
| `entidadId` | `string` | sí |
| `id` | `string` | sí |
| `observacion` | `string` | sí |
| `resolucion` | `PENDIENTE` \| `ACEPTA_EXTERNO` \| `ESCALADA` \| `SUBSANADA` | sí |
| `resuelta` | `string` (date-time)? | no |
| `resueltaPor` | `string` | sí |
| `valorExterno` | `string` | sí |
| `valorLocal` | `string` | sí |

**`EventoTrazabilidadApi`**

Un hecho sellado. `huella` y `huellaPrevia` son la cadena, no adornos.

| Campo | Tipo | Obl. |
|---|---|---|
| `actor` | `string` | sí |
| `descripcion` | `string` | sí |
| `entidad` | `string` | sí |
| `entidadId` | `string` | sí |
| `fecha` | `string` (date-time) | sí |
| `huella` | `string` | sí |
| `huellaPrevia` | `string` | sí |
| `id` | `string` | sí |
| `organizacionId` | `string`? | sí |
| `secuencia` | `integer` | sí |
| `tipo` | `string` | sí |

**`InscripcionMercantilApi`**

Respuesta de la consulta puntual al RUES.

| Campo | Tipo | Obl. |
|---|---|---|
| `estado` | `string` | sí |
| `nit` | `string` | sí |
| `razonSocial` | `string` | sí |

**`Pagina<EventoTrazabilidadApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `EventoTrazabilidadApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`ResolverApi`**

Cuerpo de `PATCH /interoperabilidad/discrepancias`.

| Campo | Tipo | Obl. |
|---|---|---|
| `id` | `string` (uuid) | sí |
| `observacion` | `string` | no |
| `resolucion` | `PENDIENTE` \| `ACEPTA_EXTERNO` \| `ESCALADA` \| `SUBSANADA` | sí |

**`SincronizarApi`**

Cuerpo de `POST /interoperabilidad/conexiones/sincronizacion`.

| Campo | Tipo | Obl. |
|---|---|---|
| `id` | `string` (uuid) | sí |

**`VerificacionApi`**

Resultado de recalcular la cadena completa.

| Campo | Tipo | Obl. |
|---|---|---|
| `eventos` | `integer` | sí |
| `integra` | `boolean` | sí |
| `primeraSecuenciaRota` | `integer`? | no |

</details>

### `medios` — Archivos y galerías

27 operaciones. Subida en tres pasos, ver §6.

| Método | Ruta | Query | Cuerpo | → | Devuelve |
|---|---|---|---|---|---|
| `GET` | `/api/v1/comercial/cultivos/{entidad_id}/medios` | — | — | 200 | `MedioApi`[] |
| `POST` | `/api/v1/comercial/cultivos/{entidad_id}/medios` | — | `AsociarApi` | 200 | `MedioApi` |
| `PATCH` | `/api/v1/comercial/cultivos/{entidad_id}/medios` | — | `ReordenarApi` | 200 | `MedioApi`[] |
| `GET` | `/api/v1/comercial/cumplimiento/expedientes/{entidad_id}/medios` | — | — | 200 | `MedioApi`[] |
| `POST` | `/api/v1/comercial/cumplimiento/expedientes/{entidad_id}/medios` | — | `AsociarApi` | 200 | `MedioApi` |
| `PATCH` | `/api/v1/comercial/cumplimiento/expedientes/{entidad_id}/medios` | — | `ReordenarApi` | 200 | `MedioApi`[] |
| `GET` | `/api/v1/comercial/lotes/{entidad_id}/medios` | — | — | 200 | `MedioApi`[] |
| `POST` | `/api/v1/comercial/lotes/{entidad_id}/medios` | — | `AsociarApi` | 200 | `MedioApi` |
| `PATCH` | `/api/v1/comercial/lotes/{entidad_id}/medios` | — | `ReordenarApi` | 200 | `MedioApi`[] |
| `GET` | `/api/v1/comercial/medios/revision` | `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<MedioApi>` |
| `GET` | `/api/v1/comercial/medios/{medio_id}` | — | — | 200 | `MedioApi` |
| `DELETE` | `/api/v1/comercial/medios/{medio_id}` | `motivo` | — | 204 | — (sin cuerpo) |
| `POST` | `/api/v1/comercial/medios/{medio_id}:confirmar` | — | `ConfirmarApi` | 200 | `MedioApi` |
| `POST` | `/api/v1/comercial/medios/{medio_id}:revisar` | — | `RevisarApi` | 200 | `MedioApi` |
| `POST` | `/api/v1/comercial/medios:preparar` | — | `PrepararApi` | 201 | `PreparacionApi` |
| `GET` | `/api/v1/comercial/ofertas/{entidad_id}/medios` | — | — | 200 | `MedioApi`[] |
| `POST` | `/api/v1/comercial/ofertas/{entidad_id}/medios` | — | `AsociarApi` | 200 | `MedioApi` |
| `PATCH` | `/api/v1/comercial/ofertas/{entidad_id}/medios` | — | `ReordenarApi` | 200 | `MedioApi`[] |
| `GET` | `/api/v1/comercial/produccion/beneficios/{entidad_id}/medios` | — | — | 200 | `MedioApi`[] |
| `POST` | `/api/v1/comercial/produccion/beneficios/{entidad_id}/medios` | — | `AsociarApi` | 200 | `MedioApi` |
| `PATCH` | `/api/v1/comercial/produccion/beneficios/{entidad_id}/medios` | — | `ReordenarApi` | 200 | `MedioApi`[] |
| `GET` | `/api/v1/comercial/produccion/destrucciones/{entidad_id}/medios` | — | — | 200 | `MedioApi`[] |
| `POST` | `/api/v1/comercial/produccion/destrucciones/{entidad_id}/medios` | — | `AsociarApi` | 200 | `MedioApi` |
| `PATCH` | `/api/v1/comercial/produccion/destrucciones/{entidad_id}/medios` | — | `ReordenarApi` | 200 | `MedioApi`[] |
| `GET` | `/api/v1/comercial/produccion/plantas/{entidad_id}/medios` | — | — | 200 | `MedioApi`[] |
| `POST` | `/api/v1/comercial/produccion/plantas/{entidad_id}/medios` | — | `AsociarApi` | 200 | `MedioApi` |
| `PATCH` | `/api/v1/comercial/produccion/plantas/{entidad_id}/medios` | — | `ReordenarApi` | 200 | `MedioApi`[] |

<details>
<summary><b>Esquemas de <code>medios</code></b> (11)</summary>

**`AsociarApi`**

Cuerpo de `POST /{entidad}/{id}/medios`.

| Campo | Tipo | Obl. |
|---|---|---|
| `medioId` | `string` (uuid) | sí |
| `orden` | `integer`? | no |
| `rol` | `PORTADA` \| `GALERIA` \| `EVIDENCIA` \| `DOCUMENTO`? | no |

**`ConfirmarApi`**

Cuerpo de `POST /medios/{id}:confirmar`.

| Campo | Tipo | Obl. |
|---|---|---|
| `alt` | `string` | sí |
| `capturado` | `string`? | no |
| `orden` | `integer` | no |
| `sinPersonas` | `boolean` | sí |
| `titulo` | `string`? | no |

**`MedioApi`**

Proyección de un medio. El original nunca aparece aquí.

| Campo | Tipo | Obl. |
|---|---|---|
| `alt` | `string` | sí |
| `alto` | `integer` | sí |
| `ancho` | `integer` | sí |
| `bytes` | `integer` | sí |
| `capturado` | `string`? | no |
| `cargado` | `string` (date-time) | sí |
| `cargadoPor` | `string` | sí |
| `clasificacion` | `PUBLICO` \| `RESERVADO_COMERCIAL` | sí |
| `color` | `string` | sí |
| `entidad` | `LOTE` \| `PLANTA` \| `CULTIVO` \| `BENEFICIO` \| `OFERTA` \| `DESTRUCCION` \| `EXPEDIENTE` | sí |
| `entidadId` | `string` | sí |
| `estado` | `PENDIENTE` \| `PROCESANDO` \| `EN_REVISION` \| `DISPONIBLE` \| `RECHAZADO` \| `RETIRADO` \| `EXPIRADO` | sí |
| `hash` | `string` | sí |
| `huella` | `string` | sí |
| `id` | `string` | sí |
| `lqip` | `string`? | no |
| `mime` | `string` | sí |
| `motivoRechazo` | `string`? | no |
| `orden` | `integer` | no |
| `organizacionId` | `string` | sí |
| `rol` | `PORTADA` \| `GALERIA` \| `EVIDENCIA` \| `DOCUMENTO` | sí |
| `sinPersonas` | `boolean` | sí |
| `titulo` | `string`? | no |
| `variantes` | `VarianteApi`[] | no |

**`Pagina<MedioApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `MedioApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`PreparacionApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `medioId` | `string` | sí |
| `restricciones` | `RestriccionesApi` | sí |
| `subida` | `SubidaApi` | sí |

**`PrepararApi`**

Cuerpo de `POST /medios:preparar`.

| Campo | Tipo | Obl. |
|---|---|---|
| `bytes` | `integer` | sí |
| `clasificacion` | `PUBLICO` \| `RESERVADO_COMERCIAL`? | no |
| `entidad` | `LOTE` \| `PLANTA` \| `CULTIVO` \| `BENEFICIO` \| `OFERTA` \| `DESTRUCCION` \| `EXPEDIENTE` | sí |
| `entidadId` | `string` (uuid) | sí |
| `mime` | `string` | sí |
| `nombre` | `string` | sí |
| `rol` | `PORTADA` \| `GALERIA` \| `EVIDENCIA` \| `DOCUMENTO` | no |

**`ReordenarApi`**

Cuerpo de `PATCH /{entidad}/{id}/medios`. La posición 0 es la portada.

| Campo | Tipo | Obl. |
|---|---|---|
| `orden` | `string` (uuid)[] | sí |

**`RestriccionesApi`**

Lo que el cliente necesita para validar antes de subir, no después.

| Campo | Tipo | Obl. |
|---|---|---|
| `bytesMaximos` | `integer` | sí |
| `cantidadMaxima` | `integer` | sí |
| `ladoMaximo` | `integer` | sí |
| `mimes` | `string`[] | sí |
| `pixelesMaximos` | `integer` | sí |
| `restantes` | `integer` | sí |

**`RevisarApi`**

Revisión de prohibiciones. Nunca es verificación del producto `[ON]` N-05.

| Campo | Tipo | Obl. |
|---|---|---|
| `aprobado` | `boolean` | sí |
| `motivo` | `string`? | no |

**`SubidaApi`**

Autorización de subida directa al almacenamiento, acotada y de vida corta.

| Campo | Tipo | Obl. |
|---|---|---|
| `cabeceras` | map<string, `string`> | no |
| `campos` | map<string, `string`> | no |
| `expira` | `string` (date-time) | sí |
| `metodo` | `string` | sí |
| `url` | `string` | sí |

**`VarianteApi`**

Derivada servible. `ancho` y `alto` reales evitan el salto de layout.

| Campo | Tipo | Obl. |
|---|---|---|
| `alto` | `integer` | sí |
| `ancho` | `integer` | sí |
| `bytes` | `integer` | sí |
| `etiqueta` | `string` | sí |
| `formato` | `string` | sí |
| `url` | `string` | sí |

</details>

### `telemedicina` — Zona clínica

16 operaciones. Otra base de datos, otras credenciales.

| Método | Ruta | Query | Cuerpo | → | Devuelve |
|---|---|---|---|---|---|
| `GET` | `/api/v1/clinica/agenda` | `profesionalId`, `pacienteId`, `estado`, `tipo`, `desde`, `hasta` | — | 200 | `CitaApi`[] |
| `POST` | `/api/v1/clinica/agenda` | — | `ProgramarCitaApi` | 201 | `CitaApi` |
| `PATCH` | `/api/v1/clinica/agenda` | — | `CambiarEstadoCitaApi` | 200 | `CitaApi` |
| `POST` | `/api/v1/clinica/notas` | — | `RegistrarNotaApi` | 201 | `NotaApi` |
| `GET` | `/api/v1/clinica/pacientes` | `busqueda`, `estado`, `departamento`, `pagina`, `porPagina`, `cursor` | — | 200 | `Pagina<PacienteEnListaApi>` |
| `POST` | `/api/v1/clinica/pacientes` | — | `RegistrarPacienteApi` | 201 | `PacienteApi` |
| `POST` | `/api/v1/clinica/pacientes/autorizaciones` | — | `OtorgarAutorizacionApi` | 200 | `PacienteApi` |
| `PATCH` | `/api/v1/clinica/pacientes/autorizaciones` | — | `RevocarAutorizacionApi` | 200 | `PacienteApi` |
| `GET` | `/api/v1/clinica/pacientes/{paciente_id}` | `finalidad` | — | 200 | `PacienteApi` |
| `GET` | `/api/v1/clinica/pacientes/{paciente_id}/notas` | — | — | 200 | `NotaApi`[] |
| `GET` | `/api/v1/clinica/prescripciones` | `pacienteId`, `soloVigentes` | — | 200 | `PrescripcionApi`[] |
| `POST` | `/api/v1/clinica/prescripciones` | — | `PrescribirApi` | 201 | `PrescripcionApi` |
| `PATCH` | `/api/v1/clinica/prescripciones/dispensacion` | — | `DispensarApi` | 200 | `PrescripcionApi` |
| `GET` | `/api/v1/clinica/profesionales` | `busqueda`, `especialidad`, `departamento`, `estado`, `pagina`, `porPagina` … (+1) | — | 200 | `Pagina<ProfesionalApi>` |
| `GET` | `/api/v1/clinica/profesionales/{profesional_id}` | — | — | 200 | `ProfesionalApi` |
| `GET` | `/api/v1/clinica/teleconsultas` | `desde`, `hasta` | — | 200 | `CitaApi`[] |

<details>
<summary><b>Esquemas de <code>telemedicina</code></b> (17)</summary>

**`AutorizacionApi`**

Autorización con su prueba. Toda finalidad se autoriza por separado.

| Campo | Tipo | Obl. |
|---|---|---|
| `canal` | `string` | sí |
| `evidencia` | `string` | sí |
| `finalidad` | `ATENCION_ASISTENCIAL` \| `TELECONSULTA` \| `PRESCRIPCION` \| `INVESTIGACION` | sí |
| `otorgada` | `string` (date-time) | sí |
| `revocada` | `string` (date-time)? | no |
| `vigente` | `boolean` | sí |

**`CambiarEstadoCitaApi`**

Cuerpo de `PATCH /agenda`. La transición la valida el agregado.

| Campo | Tipo | Obl. |
|---|---|---|
| `accion` | `CONFIRMAR` \| `ATENDER` \| `CANCELAR` | sí |
| `id` | `string` (uuid) | sí |
| `motivo` | `string` | no |

**`CitaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `duracionMinutos` | `integer` | sí |
| `enlaceTeleconsulta` | `string` | sí |
| `estado` | `PROGRAMADA` \| `CONFIRMADA` \| `ATENDIDA` \| `CANCELADA` \| `NO_ASISTIO` | sí |
| `fin` | `string` (date-time) | sí |
| `id` | `string` | sí |
| `inicio` | `string` (date-time) | sí |
| `modalidad` | `PRESENCIAL` \| `TELECONSULTA` | sí |
| `motivo` | `string` | sí |
| `pacienteId` | `string` | sí |
| `profesionalId` | `string` | sí |

**`DispensarApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `id` | `string` (uuid) | sí |

**`NotaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `citaId` | `string`? | sí |
| `contenido` | `string` | sí |
| `id` | `string` | sí |
| `momento` | `string` (date-time) | sí |
| `pacienteId` | `string` | sí |
| `profesionalId` | `string` | sí |

**`OtorgarAutorizacionApi`**

Una autorización sin evidencia de haberse otorgado no es una autorización.

| Campo | Tipo | Obl. |
|---|---|---|
| `canal` | `string` | sí |
| `evidencia` | `string` | sí |
| `finalidad` | `ATENCION_ASISTENCIAL` \| `TELECONSULTA` \| `PRESCRIPCION` \| `INVESTIGACION` | sí |
| `pacienteId` | `string` (uuid) | sí |

**`PacienteApi`**

Proyección completa. Solo la ve quien tiene autorización vigente.

| Campo | Tipo | Obl. |
|---|---|---|
| `autorizaciones` | `AutorizacionApi`[] | sí |
| `departamento` | `string` | sí |
| `documento` | `string` | sí |
| `edad` | `integer` | sí |
| `estado` | `ACTIVO` \| `INACTIVO` \| `EGRESADO` | sí |
| `fechaNacimiento` | `string` (date) | sí |
| `id` | `string` | sí |
| `municipio` | `string` | sí |
| `nombre` | `string` | sí |
| `registrado` | `string` (date-time) | sí |

**`PacienteEnListaApi`**

Proyección del listado: sin documento ni fecha de nacimiento.

| Campo | Tipo | Obl. |
|---|---|---|
| `autorizacionesVigentes` | `ATENCION_ASISTENCIAL` \| `TELECONSULTA` \| `PRESCRIPCION` \| `INVESTIGACION`[] | sí |
| `departamento` | `string` | sí |
| `edad` | `integer` | sí |
| `estado` | `ACTIVO` \| `INACTIVO` \| `EGRESADO` | sí |
| `id` | `string` | sí |
| `municipio` | `string` | sí |
| `nombre` | `string` | sí |

**`Pagina<PacienteEnListaApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `PacienteEnListaApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`Pagina<ProfesionalApi>`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cursorAnterior` | `string`? | no |
| `cursorSiguiente` | `string`? | no |
| `datos` | `ProfesionalApi`[] | sí |
| `pagina` | `integer` | sí |
| `porPagina` | `integer` | sí |
| `total` | `integer`? | no |

**`PrescribirApi`**

Cuerpo de `POST /prescripciones`. La fecha de expedición la pone el servidor.

| Campo | Tipo | Obl. |
|---|---|---|
| `cantidad` | `number` \| `string` | sí |
| `concentracion` | `string` | sí |
| `pacienteId` | `string` (uuid) | sí |
| `posologia` | `string` | sí |
| `presentacion` | `string` | sí |
| `profesionalId` | `string` (uuid) | sí |
| `unidad` | `string` | sí |
| `vigencia` | `string` (date) | sí |

**`PrescripcionApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `cantidad` | `string` | sí |
| `concentracion` | `string` | sí |
| `estado` | `VIGENTE` \| `DISPENSADA` \| `VENCIDA` \| `ANULADA` | sí |
| `expedida` | `string` (date) | sí |
| `id` | `string` | sí |
| `pacienteId` | `string` | sí |
| `posologia` | `string` | sí |
| `presentacion` | `string` | sí |
| `profesionalId` | `string` | sí |
| `unidad` | `string` | sí |
| `vigencia` | `string` (date) | sí |

**`ProfesionalApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `departamento` | `string` | sí |
| `especialidad` | `string` | sí |
| `estado` | `ACTIVO` \| `INACTIVO` | sí |
| `id` | `string` | sí |
| `municipio` | `string` | sí |
| `nombre` | `string` | sí |
| `registro` | `string` | sí |

**`ProgramarCitaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `duracionMinutos` | `integer` | sí |
| `enlaceTeleconsulta` | `string` | no |
| `inicio` | `string` (date-time) | sí |
| `modalidad` | `PRESENCIAL` \| `TELECONSULTA` | sí |
| `motivo` | `string` | sí |
| `pacienteId` | `string` (uuid) | sí |
| `profesionalId` | `string` (uuid) | sí |

**`RegistrarNotaApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `citaId` | `string` (uuid)? | no |
| `contenido` | `string` | sí |
| `pacienteId` | `string` (uuid) | sí |
| `profesionalId` | `string` (uuid) | sí |

**`RegistrarPacienteApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `departamento` | `string` | sí |
| `documento` | `string` | sí |
| `fechaNacimiento` | `string` (date) | sí |
| `municipio` | `string` | sí |
| `nombre` | `string` | sí |

**`RevocarAutorizacionApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `finalidad` | `ATENCION_ASISTENCIAL` \| `TELECONSULTA` \| `PRESCRIPCION` \| `INVESTIGACION` | sí |
| `pacienteId` | `string` (uuid) | sí |

</details>

### `puente` — Puente de disponibilidad

2 operaciones. Agregados con k-anonimato de 20.

| Método | Ruta | Query | Cuerpo | → | Devuelve |
|---|---|---|---|---|---|
| `GET` | `/api/v1/clinica/disponibilidad/senales` | `periodo` | — | 200 | `SenalApi`[] |
| `POST` | `/api/v1/clinica/disponibilidad/senales/calculo` | — | `CalcularSenalesApi` | 200 | `ResultadoCalculoApi` |

<details>
<summary><b>Esquemas de <code>puente</code></b> (3)</summary>

**`CalcularSenalesApi`**

Cuerpo de `POST /disponibilidad/senales/calculo`. Solo el periodo a contar.

| Campo | Tipo | Obl. |
|---|---|---|
| `periodo` | `string` | sí |

**`ResultadoCalculoApi`**

Qué se retuvo y cuánto se descartó, sin decir qué se descartó.

| Campo | Tipo | Obl. |
|---|---|---|
| `bajoUmbral` | `integer` | sí |
| `descartadasPorForma` | `integer` | sí |
| `periodo` | `string` | sí |
| `retenidas` | `SenalApi`[] | sí |

**`SenalApi`**

| Campo | Tipo | Obl. |
|---|---|---|
| `conteo` | `integer` | sí |
| `departamento` | `string` | sí |
| `emitida` | `string` (date-time) | sí |
| `estado` | `RETENIDA` \| `EMITIDA` | sí |
| `periodo` | `string` | sí |
| `presentacion` | `string` | sí |

</details>

## 10. Por dónde empezar

Un orden que funciona, de menos a más dependencias:

1. **Zona pública** (`publico`, 3 rutas). Sin auth, sin permisos, con datos
   sembrados. Sirve para validar el cliente HTTP, el manejo de `problem+json` y
   la paginación por cursor.
2. **Sesión** (`identidad`, 5 rutas). `GET /iam/sesion` te da los permisos con
   los que pintar el menú.
3. **Registro y directorio** (`registro`, 26 rutas). El trámite de radicación es
   el flujo más completo del sistema y el único que empieza sin sesión.
4. **Operación** (`operacion`, 26 rutas) y **mercado** (`mercado`, 13). El grueso
   del negocio.
5. **Medios** (27 rutas) cuando ya tengas entidades padre a las que colgarlas.
6. **Evidencia** (8) y **clínica** (16 + 2) al final.

Deja `ambiente` e `interoperabilidad` para cuando tengan datos.
