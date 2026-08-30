# SICAMED · Contrato de datos con el backend

**Qué debe enviarle el backend al frontend, qué le envía el frontend al backend y qué se verifica en cada paso.**

> **Regla de oro:** el frontend oculta, el backend prohíbe. Nunca al revés.
> Todo lo que este documento describe como control de seguridad se evalúa **en el servidor**. Que el frontend valide un campo, esconda un botón o filtre una lista es usabilidad, no autorización.

| | |
|---|---|
| **Versión del contrato** | 1.0 — 28 de agosto de 2026 |
| **Estado del frontend** | `VITE_MODO_API=mock`. Todo lo que aquí se describe está implementado contra un servidor simulado que ya devuelve estas formas |
| **Fuente de verdad de los tipos** | [src/shared/api/mock/tipos.ts](src/shared/api/mock/tipos.ts) — el backend debe reproducir estas formas en su OpenAPI |
| **Punto de conmutación** | [src/shared/api/transporte.ts](src/shared/api/transporte.ts) · [clienteComercial.ts](src/shared/api/clienteComercial.ts) · [clienteClinico.ts](src/shared/api/clienteClinico.ts) · [clientePublico.ts](src/shared/api/clientePublico.ts) |
| **Blueprint** | `decisiones/SICAMED-BLUEPRINT-v1.2.md` §9 (APIs), §10 (seguridad), §5.8 y §6.7-bis (medios) |

---

## 0. Cómo leer este documento

Cada endpoint se describe con cuatro cosas, siempre en el mismo orden:

1. **Qué pide el frontend** — método, ruta y parámetros exactos que hoy salen del cliente HTTP.
2. **Qué debe devolver el backend** — forma en TypeScript. Es la misma que consume el componente, sin capa de adaptación intermedia.
3. **Quién puede** — permiso RBAC y restricción ABAC que el servidor debe evaluar.
4. **Qué debe rechazar** — la invariante normativa, con su cita.

Las rutas son relativas a la URL base de su zona (§1.1). Los tipos usan la notación de TypeScript porque es la que el frontend consume; su equivalente en OpenAPI es directo.

Cuando una regla nace de la norma y no de una preferencia técnica, va marcada `[ON]` con la cita. **Esas no se negocian en una reunión de ingeniería.**

---

## 1. Transporte

### 1.1 Tres zonas, tres URLs base

El frontend no habla con un solo backend: habla con tres superficies con reglas distintas.

| Zona | Variable de entorno | Base por defecto | Sesión | Caché |
|---|---|---|---|---|
| `publico` | `VITE_URL_API_PUBLICA` | `/api/v1/publico` | ❌ Ninguna. Nunca envía `Authorization` | CDN, 60 s |
| `comercial` | `VITE_URL_API_COMERCIAL` | `/api/comercial` | ✅ Bearer o cookie de Access | Normal |
| `clinico` | `VITE_URL_API_CLINICA` | `/api/clinico` | ✅ Bearer o cookie de Access | ⛔ `no-store` siempre |

La separación no es cosmética. La zona clínica va por otro origen, con otras credenciales y sin caché de ninguna clase `[ON]` N-13. **El backend debe hacer imposible que un token de la zona comercial lea la zona clínica**, aunque el frontend nunca lo intente.

### 1.2 Cabeceras que envía el frontend

```http
Accept: application/json, application/problem+json
Content-Type: application/json
Accept-Language: es-CO
Authorization: Bearer <token>        ← nunca en la zona pública
Cache-Control: no-store              ← solo en la zona clínica
```

Además va `credentials: include`, porque en modo Cloudflare Access la identidad viaja en cookie y no en cabecera.

**Cabeceras que debe devolver el backend, en toda respuesta:**

| Cabecera | Valor | Por qué |
|---|---|---|
| `Content-Type` | `application/json` o `application/problem+json` | El cliente distingue error de dato por el cuerpo, no por adivinanza |
| `X-Request-Id` | UUID de la petición | Es el identificador que el usuario ve en la pantalla de error y reporta a soporte |
| `Cache-Control` | `no-store` en clínico y en todo lo `RESERVADO_COMERCIAL` | `[ON]` N-11 |
| `X-Robots-Tag` | `noindex` fuera de la zona pública | El prerender solo debe indexar la vitrina |
| `Vary` | `Authorization, Accept-Language` | Evita que la CDN sirva una respuesta autenticada a un anónimo |

### 1.3 Autenticación — tres modos, un contrato

`VITE_MODO_AUTH` elige el proveedor; los tres implementan la misma interfaz ([src/shared/auth/tipos.ts](src/shared/auth/tipos.ts)).

| Modo | Cómo llega la identidad | Qué debe hacer el backend |
|---|---|---|
| `mock` | Perfiles de demostración locales | Nada. No se despliega |
| `cloudflare` | Cookie de Cloudflare Access + `GET /cdn-cgi/access/get-identity` | Validar el JWT de Access **en cada servicio**, no solo en el borde |
| `oidc` | Authorization Code + PKCE contra Keycloak. Token **solo en memoria** | Validar firma, `exp`, `aud`, `iss` y los claims de §1.4 |

**El token nunca se guarda en `localStorage` ni en `sessionStorage`.** Vive en memoria y se registra en el transporte con `registrarCredencial`. Si el backend necesita sesión persistente, la da con cookie `HttpOnly; Secure; SameSite=Lax`, no pidiéndole al frontend que guarde el token.

Claims que el frontend lee del `id_token` y que el backend debe emitir:

```jsonc
{
  "sub": "USR-0f12",
  "name": "Marcela Ospina",
  "email": "marcela@...",
  "rol": "Representante legal",              // etiqueta legible
  "rol_plataforma": "REPRESENTANTE_LEGAL",   // enum RolPlataforma
  "organizacion": "Cultivos del Cauca S.A.S.",
  "organizacion_id": "ORG-0006",
  "tenant_id": "sicamed-co",
  "permisos": ["vitrina:oferta:publicar", "inventario:lote:escribir"],
  "exp": 1756224000
}
```

`permisos` usa el vocabulario cerrado de `Permiso` en [src/shared/auth/tipos.ts](src/shared/auth/tipos.ts) (38 permisos). En modo Cloudflare, los permisos se derivan de los grupos `sicamed-productores`, `sicamed-clinico` y `sicamed-institucional`.

### 1.4 Lo que el backend NUNCA debe creerle al cliente

Hoy, en modo simulado, cada mutación viaja con un objeto `autor`:

```ts
type Autor = { usuarioId: string; nombre: string; organizacionId: string; rol: RolPlataforma };
```

Existe para que el servidor simulado pueda sellar el ledger sin sesión real. **En producción es un campo hostil.**

| Campo del cuerpo | Qué debe hacer el backend |
|---|---|
| `autor` | **Ignorarlo por completo.** El actor sale del token. Si llega, se descarta en silencio o se responde `400` |
| `organizacionId` | Aceptarlo solo si coincide con `org_id` del token, salvo rol institucional. Si no coincide: `403`, no `404` filtrado |
| `tenantId` | No se acepta jamás desde el cliente. Sale del token y va a la cláusula `WHERE` de toda consulta `[ON]` N-12 |
| `estado`, `huella`, `fecha`, `secuencia` | Los calcula el servidor. Un cliente que los envía está intentando falsificar evidencia |
| `id` en creaciones | Lo genera el servidor. Excepción: clave de idempotencia (§1.8) |

> Cuando el backend publique su OpenAPI, `autor` desaparece del cuerpo y el cliente generado deja de enviarlo. Hasta entonces, **tratarlo como ruido, nunca como identidad**.

### 1.5 Errores — RFC 9457 con extensión normativa

Toda respuesta de error, sin excepción, es un Problem Details:

```jsonc
{
  "type": "https://sicamed.co/problemas/habilitacion-no-vigente",
  "title": "Publicación rechazada por falta de habilitación vigente",
  "detail": "Cultivos del Cauca S.A.S. no tiene una atestación vigente para Flor seca psicoactiva…",
  "status": 422,
  "instance": "/ofertas",
  "norma": "Res. 1241/2026 Art. 13b",                                  // extensión SICAMED
  "accion": { "etiqueta": "Ir a licencias", "ruta": "/app/licencias" } // extensión SICAMED
}
```

| Campo | Obligatorio | Uso en el frontend |
|---|---|---|
| `type` | ✅ | URI estable. El frontend puede ramificar por él; nunca por el texto |
| `title` | ✅ | Titular del bloque de error |
| `detail` | ✅ | Cuerpo. **Escrito para el usuario, no para el log.** Debe decir qué pasó y qué hacer |
| `status` | ✅ | Coincide con el código HTTP |
| `norma` | Cuando el rechazo nace de la norma | Se pinta como cita al pie: es la diferencia entre "error" y "el sistema te está diciendo por qué la ley no te deja" |
| `accion` | Opcional | Botón que lleva a la pantalla donde se resuelve |

`ErrorNormativo` ([src/shared/ui/patrones/ErrorNormativo.tsx](src/shared/ui/patrones/ErrorNormativo.tsx)) lo renderiza con `role="alert"` y foco automático. **Un `detail` genérico rompe la demo entera**: el rechazo con cita normativa es el argumento de venta del sistema.

### 1.6 Paginación — dos formas, y no son intercambiables

**Zona autenticada: página numerada.**

```ts
type Pagina<T> = { datos: readonly T[]; total: number; pagina: number; porPagina: number };
```

Parámetros: `?busqueda=&estado=&departamento=&tipo=&pagina=1&porPagina=10`. El frontend omite los vacíos: un parámetro ausente significa "sin filtrar", nunca "filtrar por vacío".

**Zona pública: cursor opaco.**

```ts
type PaginaVitrina = {
  ofertas: readonly Oferta[];
  cursorSiguiente: string | null;
  cursorAnterior: string | null;
  desde: number;   // 1-indexado, para "mostrando 21–40"
  hasta: number;
};
```

Parámetros: `?busqueda=&producto_tipo=&departamento=&actor_tipo=&disponibilidad=&orden=&cursor=&limit=20`.

`[DA]` La vitrina usa cursor porque el offset degrada con volumen y porque **un cursor opaco impide enumerar el catálogo completo** (§10.7 del blueprint). El cursor no debe ser el `id` en claro ni un número de página codificado.

### 1.7 Fechas, números e idioma

| Dato | Formato en el cable | Nota |
|---|---|---|
| Fecha y hora | ISO 8601 en UTC con `Z` | El frontend formatea a `es-CO`. **El backend no formatea nunca** |
| Fecha sin hora | `YYYY-MM-DD` | Vigencias, siembras, vencimientos |
| Decimales | `number` JSON, punto decimal | Pesos, hectáreas, THC/CBD. Nada de strings con coma |
| Enums | `MAYUSCULA_CON_GUION_BAJO` | El frontend traduce a etiqueta legible con su diccionario |
| Textos libres | Como los escribió el actor | El frontend no reescribe contenido del actor |

Los enums viajan **en clave, no en etiqueta**. `EN_BODEGA`, no "En bodega". La traducción vive en [src/shared/i18n/diccionarios/](src/shared/i18n/diccionarios/) y hay dos idiomas.

### 1.8 Idempotencia

Toda escritura que crea un hecho en el ledger debe ser idempotente. El frontend enviará:

```http
Idempotency-Key: 018f2c4e-...
```

El backend guarda la clave con el resultado y, ante repetición, **devuelve la misma respuesta sin volver a ejecutar**. Aplica a: publicar oferta, registrar atestación, registrar planta/labor/beneficio/transformación/destrucción, movimiento de inventario, manifestar interés, habilitar contacto, confirmar un medio.

Sin esto, un doble clic o un reintento de red duplica una acta de destrucción. Eso no es un bug de UX: es evidencia falsa.

---

## 2. El listado: qué endpoint alimenta cada pantalla

Este es el índice que pide la pregunta "¿qué me tiene que mandar el backend?". Una pantalla no se puede entregar hasta que todos sus endpoints existan.

| Módulo · pantalla | Ruta en el frontend | Endpoints que consume |
|---|---|---|
| Centro · Tablero | `/app` | `GET /indicadores/nacionales` · `GET /trazabilidad/eventos` |
| Centro · Reportes | `/app/reportes` | `GET /reportes/resumen` |
| Actores · Mi organización | `/app/organizacion` | `GET /organizaciones/actual` · `PATCH /organizaciones/actual` |
| Actores · Directorio | `/app/directorio` | `GET /directorio` · `GET /directorio/medicos` |
| Actores · Solicitudes | `/app/solicitudes` | `GET /actores/solicitudes` · `POST /cumplimiento/expedientes` |
| Cultivo · Producción | `/app/produccion` | `GET /cultivos` · `POST /cultivos` · `PATCH /cultivos/etapa` |
| Cultivo · Plantas | `/app/plantas` | `GET /produccion/plantas` · `GET /produccion/variedades` · `POST /produccion/plantas` |
| Cultivo · Detalle de planta | `/app/plantas/:id` | `GET /produccion/plantas/{id}` · `GET /produccion/agroinsumos` · `POST /produccion/labores` · `PATCH /produccion/plantas/cosecha` |
| Cultivo · Beneficio | `/app/beneficio` | `GET /produccion/beneficios` · `POST /produccion/beneficios` · `PATCH /produccion/beneficios/avance` |
| Cultivo · Cupos | `/app/cupos` | `GET /produccion/cupos` · `POST /produccion/cupos/conciliacion` |
| Inventario · Lotes | `/app/inventario` | `GET /lotes` · `POST /lotes` · `PATCH /lotes/movimiento` · **`GET/POST /lotes/{id}/medios`** |
| Inventario · Transformación | `/app/transformacion` | `GET /produccion/transformaciones` · `POST /produccion/transformaciones` |
| Inventario · Destrucción | `/app/destruccion` | `GET /produccion/destrucciones` · `POST /produccion/destrucciones` |
| Mercado · Vitrina interna | `/app/vitrina` | `GET /ofertas` · `GET /manifestaciones` |
| Mercado · Nueva oferta | `/app/vitrina/nueva` | `POST /ofertas` · **`POST /ofertas/{id}/medios`** |
| Mercado · Detalle de oferta | `/app/vitrina/:id` | `GET /ofertas/{id}` · `POST /vitrina/manifestaciones` · `PATCH /vitrina/manifestaciones/habilitacion` |
| Mercado · Cierre | `/app/cierre` | `GET /vitrina/cierres` · `PATCH /vitrina/cierres` |
| Mercado · Ruedas | `/app/ruedas` | `GET /ruedas-negocio` · `POST /ruedas-negocio/inscripciones` |
| Cumplimiento · Licencias | `/app/licencias` | `GET /atestaciones` · `POST /atestaciones` |
| Cumplimiento · Expedientes | `/app/expedientes` | `GET /cumplimiento/expedientes` · `PATCH .../documentos` · `PATCH .../pasos` |
| Cumplimiento · Política | `/app/politicas` | `GET /cumplimiento/politica-verificacion` · `PUT` la misma |
| Cumplimiento · Trazabilidad | `/app/trazabilidad` | `GET /trazabilidad/eventos` |
| Plataforma · Conexiones | `/app/conexiones` | `GET /interoperabilidad/conexiones` · `GET .../discrepancias` · `PATCH .../discrepancias` · `POST .../conexiones/sincronizacion` |
| Plataforma · Usuarios | `/app/usuarios` | `GET /iam/cuentas` · `POST /iam/cuentas` · `PATCH /iam/cuentas` |
| Clínica · Pacientes | `/app/salud/pacientes` | `GET /pacientes` · `GET /pacientes/{id}` |
| Clínica · Agenda | `/app/salud/agenda` | `GET /agenda` |
| Clínica · Teleconsulta | `/app/salud/teleconsulta` | `GET /teleconsultas` · `GET /indicadores` |
| Pública · Vitrina | `/vitrina` | `GET publico/ofertas` · `GET publico/estadisticas` |
| Pública · Detalle | `/vitrina/:id` | `GET publico/ofertas/{id}` |
| Pública · Registro | `/registro` | `POST /actores/solicitudes` **(escritura sin sesión — §7.1)** |

**Orden de entrega recomendado.** Cada bloque desbloquea pantallas completas, no fragmentos:

1. `iam` + `actores` → acceso, mi organización, directorio.
2. `cumplimiento` → licencias, expedientes, política, solicitudes. *Sin esto no hay rechazo normativo, y el rechazo es la demo.*
3. `produccion` + `inventario` → cultivo, plantas, beneficio, lotes.
4. `medios` → fotos de lote y galería de oferta (§6).
5. `vitrina` + `publico` → mercado y vitrina pública.
6. `trazabilidad` → el ledger que sella todo lo anterior.
7. `interoperabilidad`, `ambiente`, `clinico`.

### 2.1 Divergencia conocida con §9.3 del blueprint

El blueprint define acciones de estado con dos puntos (`POST /ofertas/{id}:publicar`). El cliente actual, escrito antes de que existiera el contrato, usa subrecursos:

| Blueprint §9.3 | Lo que llama el frontend hoy |
|---|---|
| `POST /ofertas/{id}:publicar` | `POST /ofertas` |
| `POST /manifestaciones/{id}:habilitar-contacto` | `PATCH /vitrina/manifestaciones/habilitacion` |
| `POST /cultivos/{id}:cambiar-etapa` | `PATCH /cultivos/etapa` |

**Manda el blueprint.** Cuando llegue el OpenAPI se regenera el cliente y estas rutas se alinean; los hooks de cada feature no se tocan porque el punto de cambio está aislado. Este documento describe las rutas de hoy para que el equipo de backend sepa exactamente qué se está llamando.

---

## 3. Zona pública — sin sesión

`[ON]` N-24 (Res. 1241/2026 Art. 3.7 + Ley 1712/2014). Consulta abierta, indexable, servida por CDN. **Solo campos clasificados `PUBLICO`.**

Base: `VITE_URL_API_PUBLICA`, por defecto `/api/v1/publico`.

### 3.1 `GET /ofertas`

```
?busqueda=&producto_tipo=&departamento=&actor_tipo=&disponibilidad=&orden=&cursor=&limit=20
orden ∈ RECIENTES | TERRITORIO | PRODUCTO
```

Devuelve `PaginaVitrina` (§1.6) con ofertas en estado `PUBLICADA` **y solo esas**. No existe un parámetro de estado: la API pública no sirve borradores, pausadas ni cerradas, y no debe aceptarlos aunque se los pidan.

`Oferta` en su proyección pública:

```ts
type Oferta = {
  id: string;
  titulo: string;
  tipoProducto: string;          // del catálogo cerrado TIPOS_PRODUCTO
  organizacionId: string;
  organizacion: string;
  tipoActor: "CULTIVADOR" | "TRANSFORMADOR" | "DISPENSADOR" | "IPS" | "LABORATORIO";
  departamento: string;
  municipio: string;
  estado: "PUBLICADA";           // en público, siempre este valor
  disponibilidad: "INMEDIATA" | "PROGRAMADA" | "POR_CAMPAÑA";
  publicada: string;             // ISO
  vigencia: string;              // ISO
  descripcion: string;
  certificaciones: readonly string[];
  interesados: number;           // RESERVADO_COMERCIAL: ver abajo
  medios?: readonly Medio[];     // §6 — nuevo
};
```

⛔ **Campos que no deben existir en esta respuesta, jamás:** precio, moneda, cantidad disponible, capacidad productiva, datos de contacto, condiciones económicas. `[ON]` N-04 (Art. 8c, 10b) y Art. 21. Su ausencia es un control, no un pendiente.

`interesados` está clasificado `RESERVADO_COMERCIAL` en [src/shared/config/camposPublicos.ts](src/shared/config/camposPublicos.ts) y hoy el frontend no lo pinta. Recomendación: **no enviarlo en la zona pública**. La clasificación es configurable en runtime (`window.SICAMED_CLASIFICACION_CAMPOS`) porque `[AMB-05]` sigue pendiente de la Instancia de Coordinación, pero `cantidadDisponible`, `capacidadProductiva` y `contacto` son inmutables y no se pueden abrir por configuración.

**Ordenamiento.** Solo tres órdenes, todos neutros. Un ranking de "relevancia" o "destacados" en una vitrina pública roza el Art. 3.5 (libre competencia) y ninguna de las tres opciones lo introduce. El orden por defecto es `publicada DESC`.

### 3.2 `GET /ofertas/{id}`

Devuelve una `Oferta` o `404`. **Revalida la habilitación en tiempo real** (caché máxima 60 s): si la atestación que habilitó la publicación fue revocada, esta ruta deja de servir la oferta aunque el índice todavía la liste. `[ON]` N-06.

### 3.3 `GET /estadisticas`

Acepta los mismos filtros que `/ofertas` (sin `cursor` ni `limit`). Alimenta las facetas con conteo del panel de filtros.

```ts
type EstadisticasVitrina = {
  ofertas: number;         // con los filtros aplicados
  actores: number;
  departamentos: number;
  totales: { ofertas: number; actores: number; departamentos: number };  // sin filtros
  actualizacion: string;   // ISO de la publicación más reciente
  facetas: {
    tipoProducto: Record<string, number>;
    departamento: Record<string, number>;
    tipoActor: Record<string, number>;
    disponibilidad: Record<string, number>;
  };
};
```

**Cada faceta se cuenta ignorando su propio filtro** y aplicando los demás. Es lo que permite que el usuario vea "Cauca (12)" mientras está filtrando por Valle: si se contara con todos los filtros aplicados, cada faceta no seleccionada mostraría cero y el panel sería inútil.

`IPS` no aparece en la faceta de tipo de actor: la frontera clínica no se cruza ni siquiera en un conteo `[ON]` N-13.

### 3.4 Lo que la zona pública **no** tiene

| No existe | Por qué |
|---|---|
| Manifestar interés anónimo | `ManifestacionDeInteres` exige `organizacion_interesada_id`. En público el botón abre un diálogo de ingreso o registro |
| Filtro por estado | La API solo sirve `PUBLICADA` |
| Paginación numerada | Cursor opaco, contra enumeración |
| Cualquier escritura salvo `POST /actores/solicitudes` | Y esa tiene su propio régimen de seguridad (§7.1) |

---

## 4. Zona comercial — con sesión

Base: `VITE_URL_API_COMERCIAL`. Todas las listas devuelven `Pagina<T>` salvo donde se indique **arreglo**.

### 4.1 Actores y organizaciones

| Método | Ruta | Cuerpo / parámetros | Devuelve | Permiso |
|---|---|---|---|---|
| GET | `/organizaciones/actual` | — | `Organizacion` | `actores:org:leer` |
| GET | `/organizaciones` | filtros estándar | `Pagina<Organizacion>` | `actores:org:leer` |
| GET | `/organizaciones/{id}` | — | `Organizacion` | `actores:org:leer` |
| PATCH | `/organizaciones/actual` | `{ id, representante, correo, telefono, municipio }` | `Organizacion` | `actores:org:escribir` |
| GET | `/directorio` | `?busqueda=` | **objeto**, ver abajo | `directorio:actor:leer` |
| GET | `/directorio/medicos` | filtros estándar | `Pagina<Medico>` | `directorio:actor:leer` |

```ts
type Organizacion = {
  id: string; nit: string; nombre: string;
  tipo: TipoActor;
  departamento: string; municipio: string;
  estado: "HABILITADA" | "EN_TRAMITE" | "SUSPENDIDA" | "VENCIDA";
  registro: string;                       // ISO
  representante: string; correo: string; telefono: string;
  cultivos: number; lotes: number; ofertas: number;   // contadores derivados
};

type RespuestaDirectorio = {
  proveedores: readonly Organizacion[];    // CULTIVADOR + TRANSFORMADOR
  dispensadores: readonly Organizacion[];
  prestadores: readonly Organizacion[];    // IPS + LABORATORIO
  medicos: readonly Medico[];
  totales: { proveedores: number; dispensadores: number; ips: number; medicos: number; pacientes: number };
};
```

**ABAC:** `PATCH /organizaciones/actual` solo sobre `org_id == token.org_id`. Los contadores (`cultivos`, `lotes`, `ofertas`) los calcula el servidor; si llegan en el cuerpo, se ignoran.

### 4.2 Cumplimiento

| Método | Ruta | Cuerpo | Devuelve | Permiso |
|---|---|---|---|---|
| GET | `/atestaciones` | filtros | `Pagina<Atestacion>` | `cumplimiento:atestacion:leer` |
| POST | `/atestaciones` | ver abajo | `Atestacion` | `cumplimiento:atestacion:escribir` |
| GET | `/cumplimiento/expedientes` | filtros | `Pagina<Expediente>` | `cumplimiento:expediente:leer` |
| PATCH | `/cumplimiento/expedientes/documentos` | `{ expedienteId, documentoId, decision, observacion }` | `Expediente` | `cumplimiento:expediente:verificar` |
| PATCH | `/cumplimiento/expedientes/pasos` | `{ expedienteId, pasoId, veredicto, observacion }` | `Expediente` | `cumplimiento:expediente:verificar` |
| GET | `/cumplimiento/politica-verificacion` | — | `{ reglas: ReglaVerificacion[]; version: string }` | `cumplimiento:expediente:leer` |
| PUT | `/cumplimiento/politica-verificacion` | `{ reglas: [{ id, obligatorio, modo }] }` | `{ reglas, version }` | `admin:politica:gestionar` |
| GET | `/actores/solicitudes` | filtros | `Pagina<SolicitudRegistro>` | `cumplimiento:solicitud:tramitar` |
| POST | `/actores/solicitudes` | ver §7.1 | `SolicitudRegistro` | **sin sesión** |
| POST | `/cumplimiento/expedientes` | `{ solicitudId }` | `Expediente` | `cumplimiento:solicitud:tramitar` |

Cuerpo de `POST /atestaciones`:

```ts
{
  organizacionId: string;
  tipo: "CULTIVO_NO_PSICOACTIVO" | "CULTIVO_PSICOACTIVO" | "FABRICACION_DERIVADOS" | "DISPENSACION" | "EXPORTACION";
  acto: string;          // número del acto administrativo
  autoridad: string;     // quién lo expidió
  expedicion: string;    // YYYY-MM-DD
  vencimiento: string;   // YYYY-MM-DD
  evidencia: string;     // referencia al soporte documental
  expedienteId: string | null;
}
```

**Invariantes que el servidor debe imponer:**

- Si `expedienteId` viene y ese expediente **no está `APROBADO`** → `422` con `norma: "Res. 1241/2026 Art. 13b · origen DOCUMENTAL_VERIFICADA"`. Una atestación no puede nacer de evidencia sin verificar.
- El estado (`VIGENTE`, `POR_VENCER`, `VENCIDA`) se **deriva** de `vencimiento`, nunca se acepta del cliente.
- `huella` es el sello del ledger. La calcula el servidor.

**Separación de funciones en la verificación documental** — cuatro rechazos obligatorios, todos `403`:

| Situación | `type` | `norma` |
|---|---|---|
| El `SUPER_ADMIN` intenta verificar | `separacion-de-funciones` | Blueprint §5.3-bis |
| El expediente es de la propia organización | `expediente-propio` | Blueprint §5.3-bis · invariante 2 |
| El rol no participa del trámite | `rol-sin-verificacion` | Blueprint §5.3-bis · roles del trámite |
| La misma persona resuelve dos pasos | `doble-control` | Blueprint §5.3-bis · `exige_doble_control` |

Y dos más de proceso: `paso-fuera-de-orden` (`409`, política SECUENCIAL) y `devolucion-sin-motivo` (`422`, debido proceso administrativo — devolver sin observación no es devolver, es abandonar).

`politicaVersion` queda **congelada dentro del expediente** al abrirlo. Cambiar la política no reescribe expedientes en curso: se verifican con las reglas vigentes al momento de radicar.

### 4.3 Producción

| Método | Ruta | Cuerpo | Devuelve |
|---|---|---|---|
| GET | `/cultivos` | filtros | `Pagina<Cultivo>` |
| POST | `/cultivos` | `{ nombre, organizacionId, departamento, municipio, variedad, areaHectareas, plantas, siembra, cosechaEstimada }` | `Cultivo` |
| PATCH | `/cultivos/etapa` | `{ id, estado }` | `Cultivo` |
| GET | `/produccion/variedades` | — | **arreglo** `Variedad[]` |
| GET | `/produccion/agroinsumos` | — | **arreglo** `Agroinsumo[]` |
| GET | `/produccion/plantas` | filtros | `Pagina<Planta>` |
| GET | `/produccion/plantas/{id}` | — | `{ planta, labores, madre, clones }` |
| POST | `/produccion/plantas` | `{ cultivoId, variedadId, origen, madre, bloque, siembra }` | `Planta` |
| POST | `/produccion/labores` | `{ plantaId, tipo, agroinsumoId, dosis, responsable }` | `Labor` |
| PATCH | `/produccion/plantas/cosecha` | `{ id }` | `Planta` |
| GET | `/produccion/beneficios` | filtros | `Pagina<Beneficio>` |
| POST | `/produccion/beneficios` | `{ cultivoId, plantas, pesoHumedo, responsable }` | `Beneficio` |
| PATCH | `/produccion/beneficios/avance` | `{ id, estado, peso, humedad }` | `Beneficio` |
| GET | `/produccion/cupos` | filtros | `Pagina<CupoMicc>` |
| POST | `/produccion/cupos/conciliacion` | `{}` | **arreglo** `CupoMicc[]` |
| GET | `/ambiente/lecturas` | `?estado=&departamento=` | **arreglo** `LecturaAmbiente[]` |

**Las cinco invariantes duras de producción.** Son las que convierten al sistema en un OTA y no en un CRUD:

| Regla | Rechazo | `norma` |
|---|---|---|
| Sembrar sin cupo asignado por el MICC | `422 sin-cupo-asignado` | Dec. 1138/2025 Art. 3 |
| Sembrar por encima del cupo | `422 cupo-excedido` | Dec. 1138/2025 Art. 3 · el cupo opera por número de plantas |
| Registrar un clon sin planta madre, o con madre que no viene de semilla | `422 madre-inexistente` / `madre-invalida` | Res. 1241/2026 Art. 12 y 20 |
| Cosechar dentro del periodo de carencia de un agroinsumo | `422 carencia-activa` | Res. 1241/2026 Art. 20 · BPA/GACP |
| Peso seco > peso húmedo, o acondicionado > seco | `422 balance-de-masa` | Res. 1241/2026 Art. 20 · balance de masa |

El campo `aptaDesde` de una `Planta` lo calcula el servidor a partir de `carenciaDias` del agroinsumo aplicado. El frontend lo muestra; **no lo decide**.

`ambiente` es telemetría, no evidencia regulatoria: sus lecturas **no se publican al ledger de trazabilidad** (blueprint §5.4-ter).

### 4.4 Inventario

| Método | Ruta | Cuerpo | Devuelve |
|---|---|---|---|
| GET | `/lotes` | filtros | `Pagina<Lote>` |
| POST | `/lotes` | `{ organizacionId, cultivoId, tipo, cantidad, unidad, thc, cbd, bodega, departamento, vencimiento }` | `Lote` |
| PATCH | `/lotes/movimiento` | `{ id, estado, bodega, motivo }` | `Lote` |
| GET | `/produccion/transformaciones` | filtros | `Pagina<Transformacion>` |
| POST | `/produccion/transformaciones` | `{ loteOrigenId, producto, formula, entradaKg, salida, unidadSalida, registroInvima, responsable }` | `Transformacion` |
| GET | `/produccion/destrucciones` | filtros | `Pagina<ActaDestruccion>` |
| POST | `/produccion/destrucciones` | `{ entidad, entidadId, cantidad, causal, metodo, testigo, cargoTestigo }` | `ActaDestruccion` |
| GET | `/lotes/{id}/medios` | — | **arreglo** `Medio[]` · §6 |
| POST | `/lotes/{id}/medios` | `{ medioId, rol, alt, orden }` · §6 | `Medio` |

```ts
type Lote = {
  id: string; codigo: string;
  cultivoId: string; organizacionId: string; organizacion: string;
  tipo: "FLOR_SECA" | "BIOMASA" | "EXTRACTO" | "ACEITE" | "FORMULA_MAGISTRAL";
  cantidad: number; unidad: string;
  estado: "EN_BODEGA" | "EN_TRANSITO" | "DISPENSADO" | "RETENIDO" | "DESTRUIDO";
  thc: number; cbd: number;
  bodega: string; departamento: string;
  fecha: string; vencimiento: string;
  medios?: readonly Medio[];              // §6 — nuevo
};
```

Invariantes:

- Un lote `DESTRUIDO` no se mueve: `409 lote-destruido`, `norma: "Dec. 1138/2025 Art. 11 · disposición final"`.
- La entrada de una transformación no puede superar las existencias del lote origen: `422 balance-de-masa`, `Res. 1241/2026 Art. 9`.
- Producto terminado sin registro sanitario INVIMA: `422 sin-registro-sanitario`, `Dec. 1138/2025 Art. 1 núm. 38`.
- Acta de destrucción sin testigo identificado: `422 acta-sin-testigo`, `Dec. 1138/2025 Art. 11`.
- `existencia >= 0` y `existencia <= cantidad_inicial` como *constraint de base de datos*, no solo de dominio.

### 4.5 Vitrina y encadenamiento

| Método | Ruta | Cuerpo | Devuelve |
|---|---|---|---|
| GET | `/ofertas` | filtros | `Pagina<Oferta>` (con todos los estados que el actor puede ver) |
| GET | `/ofertas/{id}` | — | `Oferta` |
| POST | `/ofertas` | `{ organizacionId, tipoProducto, titulo, departamento, municipio, disponibilidad, descripcion }` | `Oferta` |
| GET | `/manifestaciones` | — | **arreglo** `ManifestacionInteres[]` |
| POST | `/vitrina/manifestaciones` | `{ ofertaId, solicitante, departamento }` | `ManifestacionInteres` |
| PATCH | `/vitrina/manifestaciones/habilitacion` | `{ id }` | `ManifestacionInteres` |
| GET | `/vitrina/cierres` | filtros | **arreglo** `CierreExterno[]` |
| PATCH | `/vitrina/cierres` | `{ id, movimiento }` | `CierreExterno` |
| GET | `/ruedas-negocio` | — | **arreglo** `RuedaNegocio[]` |
| POST | `/ruedas-negocio/inscripciones` | `{ id }` | `RuedaNegocio` |

**La invariante central del sistema entero.** Publicar exige atestación vigente para el tipo de producto:

```
POST /ofertas  sin habilitación vigente
→ 422
  type:  https://sicamed.co/problemas/habilitacion-no-vigente
  title: Publicación rechazada por falta de habilitación vigente
  norma: Res. 1241/2026 Art. 13b
  accion: { etiqueta: "Ir a licencias", ruta: "/app/licencias" }
```

El servidor debe además **persistir cuál atestación habilitó la publicación** (`atestacion_habilitante_id`) y **cuándo se verificó** (`verificada_en`). Si esa atestación se revoca, corre la saga de despublicación (blueprint §7.5) y la oferta sale de la vitrina pública sin intervención humana.

Otros rechazos: manifestar interés sobre una oferta no divulgada → `409 oferta-no-divulgada` (`Art. 8`); inscribirse en una rueda cerrada o llena → `409`.

**Habilitar contacto** es el único momento en que se revelan datos de contacto, y es una decisión del oferente, no del sistema. Genera un `CierreExterno` que documenta que **la operación se cierra fuera de SICAMED** (FNE, contrato directo o exportación, según el producto). Declarar el movimiento es voluntario y autodeclarado `[AMB-09]`: el sistema no lo exige, no lo valida y lo etiqueta como declarado por el usuario.

### 4.6 Trazabilidad

| Método | Ruta | Parámetros | Devuelve |
|---|---|---|---|
| GET | `/trazabilidad/eventos` | `?busqueda=&tipo=&pagina=&porPagina=12` | `Pagina<EventoTrazabilidad>` |

```ts
type EventoTrazabilidad = {
  id: string;
  secuencia: number;          // monótona por tenant
  tipo: string;               // ORGANIZACION_REGISTRADA, OFERTA_PUBLICADA, MEDIO_ADJUNTADO…
  descripcion: string;
  entidad: string; entidadId: string;
  actor: string;
  organizacionId: string;
  fecha: string;              // ISO del servidor, nunca del cliente
  huella: string;             // sha-256 del evento canónico
  huellaPrevia: string;       // encadenamiento
};
```

`[ON]` N-03: append-only. El backend debe impedir `UPDATE` y `DELETE` a nivel de base de datos (reglas o WORM), no solo de código. **El ledger no es blockchain y el documento no debe decir que lo es**; es una cadena de hashes con anclaje diario.

### 4.7 Interoperabilidad

| Método | Ruta | Cuerpo | Devuelve |
|---|---|---|---|
| GET | `/interoperabilidad/conexiones` | — | **arreglo** `Conexion[]` |
| GET | `/interoperabilidad/discrepancias` | filtros | **arreglo** `Discrepancia[]` |
| PATCH | `/interoperabilidad/discrepancias` | `{ id, resolucion }` | `Discrepancia` |
| POST | `/interoperabilidad/conexiones/sincronizacion` | `{ id }` | `Conexion` |

Sincronizar una conexión marcada `NO_CONECTADA` devuelve **`501`**, no `200`:

```
type:  https://sicamed.co/problemas/sin-interfaz-tecnica
title: MICC no expone interfaz técnica
detail: …No hay nada que sincronizar, y declararlo operativo sería una degradación silenciosa.
```

Es una decisión de diseño explícita: **el sistema declara lo que no garantiza**. Un `200` mentiroso ante una entidad que no tiene API es peor que un error honesto.

### 4.8 Plataforma e IAM

| Método | Ruta | Cuerpo | Devuelve | Permiso |
|---|---|---|---|---|
| GET | `/iam/cuentas` | filtros | `Pagina<CuentaUsuario>` | `admin:usuario:gestionar` |
| POST | `/iam/cuentas` | `{ nombre, correo, rol, organizacionId }` | `CuentaUsuario` | `admin:usuario:gestionar` |
| PATCH | `/iam/cuentas` | `{ id, estado?, rol? }` | `CuentaUsuario` | `admin:usuario:gestionar` |

Invitar una cuenta **no crea una identidad activa**: crea estado `INVITADA` y dispara el flujo del IdP. La contraseña, el MFA y la federación viven en Keycloak, nunca en SICAMED.

### 4.9 Tablero y reportes

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/indicadores/nacionales` | ver abajo |
| GET | `/reportes/resumen` | ver abajo |

```ts
type IndicadoresNacionales = {
  totales: { proveedores: number; dispensadores: number; ips: number; medicos: number; pacientes: number };
  departamentos: readonly {
    codigo: string;      // DIVIPOLA de dos dígitos
    nombre: string;
    proveedores: number; dispensadores: number; ips: number; medicos: number; pacientes: number;
  }[];
  etapas: readonly { clave: string; etiqueta: string; valor: number; unidad: string; detalle: string }[];
  serie: readonly { etiqueta: string; valor: number; rechazos: number }[];   // 12 meses
  atestacionesPorVencer: number;
  ofertasPublicadas: number;
  rechazosNormativos: number;
  eventosLedger: number;
};

type ResumenReportes = {
  serie: readonly { etiqueta: string; valor: number; rechazos: number }[];
  departamentos: readonly Departamento[];
  etapas: readonly EtapaProceso[];
  porTipoActor: readonly { etiqueta: string; valor: number }[];
  cumplimiento: readonly { etiqueta: string; valor: number }[];
};
```

Los agregados institucionales **se calculan en el backend**. El frontend no suma listas paginadas para producir un total: eso daría cifras que dependen de la página que el usuario esté mirando.

`codigo` es DIVIPOLA y es lo que enlaza con el mapa de [MapaColombia.tsx](src/shared/ui/graficos/MapaColombia.tsx). Si llega un código que no existe en el atlas, el departamento no se pinta y no se rompe nada, pero el mapa queda incompleto.

---

## 5. Zona clínica — frontera dura

Base: `VITE_URL_API_CLINICA`. **Otro servicio, otra base de datos, otra red** `[ON]` N-13.

| Método | Ruta | Parámetros | Devuelve |
|---|---|---|---|
| GET | `/indicadores` | — | `{ pacientesActivos, citasHoy, teleconsultasSemana, formulasVigentes }` |
| GET | `/pacientes` | `?busqueda=&estado=&departamento=&pagina=&porPagina=8` | `Pagina<Paciente>` |
| GET | `/pacientes/{id}` | — | `{ paciente, citas, prescripciones, notas }` |
| GET | `/agenda` | `?busqueda=&estado=&tipo=` | **arreglo** `Cita[]` ordenado por fecha |
| GET | `/teleconsultas` | — | **arreglo** `Cita[]` con `modalidad: "TELECONSULTA"` |

Obligaciones específicas de esta zona, todas del backend:

| Control | Implementación |
|---|---|
| `Cache-Control: no-store` en **toda** respuesta | El frontend ya usa `gcTime: 0` y `staleTime: 0`, pero eso es una cortesía del cliente |
| Cifrado a nivel de campo para lo `SENSIBLE` | Envelope encryption con CMEK, antes de llegar a la base de datos |
| Auditoría individual de cada acceso | Quién leyó qué historia y con qué motivo |
| Autorización de tratamiento vigente | `[ON]` Ley 1581/2012 Art. 5-6. **Verificada en cada caso de uso**, no solo al registrar |
| Cero exportación hacia la zona comercial | El puente entre zonas transporta disponibilidad agregada, nunca pacientes `[AMB-15]` |

El frontend defiende la frontera con seis controles propios (dos `QueryClient`, ESLint de fronteras, chunk aparte, `noindex`, sin grabación de sesión, cierre que limpia ambas zonas). **Ninguno de esos seis es un control de seguridad del sistema**; son controles de higiene del navegador. La frontera real la impone el backend.

---

## 6. Medios — fotos de lote, galería de oferta y contenido de la vitrina

> **Nuevo en esta versión del contrato.** Hasta hoy la vitrina no tenía imágenes reales: las tarjetas usan un visual generado por categoría, rotulado *"Imagen de categoría, no del lote publicado"*, precisamente para no fabricar una representación del producto. Al abrir la carga de fotografías, ese rótulo deja de ser suficiente y aparecen obligaciones nuevas.
>
> Decisión de alcance: `[AMB-16]` en el blueprint §3. **La carga manual de imágenes por parte del actor se habilita; la captura fotográfica automatizada del cultivo `[AMB-13]` sigue fuera de alcance.** No son lo mismo y no comparten régimen: una la aporta un humano que responde por ella, la otra la produce una cámara que vigila a un trabajador.

### 6.1 Qué se puede fotografiar y qué no

| Permitido | Prohibido, y el servidor debe rechazarlo |
|---|---|
| Lote de producto terminado, envasado, etiqueta con código de lote | Cualquier persona identificable `[ON]` Ley 1581/2012 |
| Planta individual con su etiqueta, bloque de cultivo, evidencia de labor cultural | Imágenes que muestren condiciones económicas o listados de cantidades `[ON]` N-04 |
| Estado del secado, curado y acondicionamiento | Sellos, logos o textos que sugieran que SICAMED verificó, certificó o aprobó el producto `[ON]` N-05 (Art. 13a) |
| Acta y proceso de destrucción, con el testigo **de espaldas o fuera de cuadro** | Documentos de terceros, cédulas, historias clínicas |
| Instalaciones y equipos | Ubicación exacta del predio por metadatos GPS |

**Sobre las personas.** La prohibición se impone por política y declaración, no por reconocimiento facial: detectar rostros automáticamente sería, en sí mismo, tratamiento de dato biométrico y agravaría el problema en vez de resolverlo. El régimen es:

1. Al cargar, el actor **declara** que la imagen no contiene personas identificables. La declaración se persiste con su usuario, fecha y huella.
2. Hay un canal de reporte y un procedimiento de retiro (§6.7).
3. El retiro borra los bytes y las derivadas, y **conserva en el ledger el hash y el hecho del retiro**. Esa es la forma de conciliar el derecho de supresión con la trazabilidad inmutable (crypto-shredding, blueprint §10.4).

### 6.2 El modelo `Medio`

```ts
type EntidadMedio = "LOTE" | "PLANTA" | "CULTIVO" | "BENEFICIO" | "OFERTA" | "DESTRUCCION" | "EXPEDIENTE";
type RolMedio     = "PORTADA" | "GALERIA" | "EVIDENCIA" | "DOCUMENTO";
type EstadoMedio  = "PENDIENTE" | "PROCESANDO" | "EN_REVISION" | "DISPONIBLE" | "RECHAZADO" | "RETIRADO";
type ClasificacionMedio = "PUBLICO" | "RESERVADO_COMERCIAL";

type VarianteMedio = {
  etiqueta: "miniatura" | "tarjeta" | "detalle";
  url: string;        // absoluta; firmada y de vida corta si la clasificación es RESERVADO_COMERCIAL
  ancho: number;
  alto: number;
  bytes: number;
  formato: "avif" | "webp" | "jpeg";
};

type Medio = {
  id: string;
  organizacionId: string;
  entidad: EntidadMedio;
  entidadId: string;
  rol: RolMedio;
  clasificacion: ClasificacionMedio;
  estado: EstadoMedio;

  alt: string;                 // OBLIGATORIO. Ver 6.6
  titulo: string | null;
  orden: number;               // 0 = portada

  mime: string;                // el que determinó el servidor, no el que declaró el cliente
  bytes: number;
  ancho: number;
  alto: number;
  hash: string;                // sha-256 del original, sellado en el ledger
  color: string;               // "#1E5B3A" — color dominante para el hueco mientras carga
  lqip: string | null;         // data URI ~24px, opcional

  variantes: readonly VarianteMedio[];

  capturado: string | null;    // ISO, declarado por quien carga
  cargado: string;             // ISO del servidor
  cargadoPor: string;
  sinPersonas: boolean;        // la declaración de 6.1
  motivoRechazo: string | null;
  huella: string;
};
```

**Por qué cada campo existe:**

- `variantes` con `ancho` y `alto` reales permiten `srcset` y `aspect-ratio` en CSS. Sin las dimensiones, la página salta al cargar la imagen y eso es una regresión de Core Web Vitals medible.
- `color` y `lqip` evitan el hueco blanco. El frontend pinta el color plano mientras descarga.
- `hash` es lo que hace de la fotografía evidencia: prueba que la imagen que hoy se ve es la que se cargó.
- `alt` no es opcional en ningún caso. `[AMB-14]` fija WCAG 2.1 AA como gate bloqueante de CI: una imagen sin alternativa textual **rompe el build del frontend**, no solo la accesibilidad.
- `estado` incluye `EN_REVISION` solo para lo que va a ser público. Revisar que una imagen no viole una prohibición **no es certificar el producto** `[ON]` N-05, y la interfaz lo dice con esas palabras.

### 6.3 Flujo de carga en tres pasos

`[DA]` Los bytes **no pasan por la API de negocio**. Se sube directo al almacenamiento con una URL firmada de vida corta.

```
1. POST /medios:preparar          → el backend valida cuota, permiso y límites
   { entidad, entidadId, rol, clasificacion, mime, bytes, nombre }
   ← { medioId, subida: { url, metodo, expira, cabeceras }, restricciones }

2. PUT <subida.url>               → el navegador sube el archivo al almacenamiento
   (sin token de SICAMED; la URL firmada es la autorización)

3. POST /medios/{medioId}:confirmar
   { alt, titulo?, capturado?, sinPersonas: true, orden? }
   ← Medio { estado: "PROCESANDO" | "EN_REVISION" }
```

Entre 2 y 3 el backend **no sabe todavía qué se subió**. Todo el trabajo real ocurre después de confirmar:

```
confirmar
  → verificar que el objeto existe y su tamaño coincide con lo declarado
  → leer los bytes mágicos y determinar el MIME real
  → antivirus
  → medir dimensiones y número de píxeles
  → re-codificar: se descarta el archivo original y se generan derivadas limpias
  → extraer color dominante y LQIP
  → calcular sha-256
  → EN_REVISION si clasificacion === PUBLICO, si no DISPONIBLE
  → evento MEDIO_ADJUNTADO al ledger
```

**El original nunca se sirve.** Se conserva cifrado como evidencia y se entregan siempre derivadas re-codificadas. Ese solo paso elimina de golpe los metadatos EXIF, el GPS, los perfiles de color maliciosos y la mayoría de los vectores de archivo malformado.

Alternativa para despliegues pequeños: `POST /medios` con `multipart/form-data`. Mismo contrato de validación, mismos límites, peor comportamiento con archivos grandes y con reintentos. Se documenta como camino B, no como el recomendado.

### 6.4 Endpoints

| Método | Ruta | Cuerpo | Devuelve | Permiso |
|---|---|---|---|---|
| POST | `/medios:preparar` | `{ entidad, entidadId, rol, clasificacion, mime, bytes, nombre }` | `{ medioId, subida, restricciones }` | escritura sobre la entidad padre |
| POST | `/medios/{id}:confirmar` | `{ alt, titulo?, capturado?, sinPersonas, orden? }` | `Medio` | idem |
| GET | `/medios/{id}` | — | `Medio` | lectura sobre la entidad padre |
| DELETE | `/medios/{id}` | — | `204` | escritura sobre la entidad padre |
| GET | `/lotes/{id}/medios` | — | `Medio[]` | `inventario:lote:leer` |
| POST | `/lotes/{id}/medios` | `{ medioId, rol, orden }` | `Medio` | `inventario:lote:escribir` |
| PATCH | `/lotes/{id}/medios` | `{ orden: [medioId, …] }` | `Medio[]` | `inventario:lote:escribir` |
| GET/POST/PATCH | `/produccion/plantas/{id}/medios` | idem | idem | `produccion:planta:*` |
| GET/POST/PATCH | `/cultivos/{id}/medios` | idem | idem | `produccion:cultivo:*` |
| GET/POST/PATCH | `/produccion/beneficios/{id}/medios` | idem | idem | `produccion:beneficio:*` |
| GET/POST/PATCH | `/produccion/destrucciones/{id}/medios` | idem | idem | `produccion:destruccion:*` |
| GET/POST/PATCH | `/ofertas/{id}/medios` | idem | idem | `vitrina:oferta:publicar` |

`[DA]` **La asociación va como subrecurso de la entidad padre, no como campo suelto del medio.** Razón: la comprobación ABAC nace del padre — "¿es tuyo este lote?" — y así no hay una segunda ruta por la que colgarle una foto a un lote ajeno.

`restricciones` que devuelve `:preparar`, para que el frontend valide antes de subir y no después:

```ts
{
  mimes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  bytesMaximos: 12_582_912,        // 12 MB
  ladoMaximo: 8000,                // px
  pixelesMaximos: 40_000_000,      // contra bombas de descompresión
  cantidadMaxima: 12,              // por entidad
  restantes: 9
}
```

### 6.5 Qué devuelve el backend para que el frontend pinte una imagen

Todo lo necesario para renderizar sin una segunda petición y sin salto de layout:

```jsonc
{
  "id": "MED-0f31",
  "alt": "Frascos ámbar del lote LT-2026-0031 con etiqueta visible",
  "color": "#274A33",
  "ancho": 4032, "alto": 3024,
  "variantes": [
    { "etiqueta": "miniatura", "url": "https://cdn…/MED-0f31/240.avif",  "ancho": 240,  "alto": 180, "formato": "avif", "bytes": 9210 },
    { "etiqueta": "tarjeta",   "url": "https://cdn…/MED-0f31/720.avif",  "ancho": 720,  "alto": 540, "formato": "avif", "bytes": 48120 },
    { "etiqueta": "detalle",   "url": "https://cdn…/MED-0f31/1600.avif", "ancho": 1600, "alto": 1200, "formato": "avif", "bytes": 184900 }
  ]
}
```

| Clasificación | Cómo se sirve | Caché |
|---|---|---|
| `PUBLICO` | Prefijo público del CDN, URL estable con el hash en la ruta | `public, max-age=31536000, immutable` |
| `RESERVADO_COMERCIAL` | URL firmada, TTL ≤ 10 minutos, o cookie firmada por sesión | `private, no-store` en el JSON que la transporta |

Las URL firmadas **caducan**: el frontend no las guarda en caché de larga vida ni las persiste. Si una imagen reservada falla con `403`, se vuelve a pedir el `Medio`.

### 6.6 Validaciones obligatorias del servidor

Ninguna de estas es opcional. Una carga de archivos es la superficie de ataque más rentable de cualquier sistema web.

| # | Control | Detalle |
|---|---|---|
| 1 | **No confiar en `Content-Type` ni en la extensión** | Determinar el tipo por bytes mágicos. Un `.jpg` puede ser un ejecutable |
| 2 | **Rechazar SVG sin excepción** | Un SVG es un documento con script. No hay saneamiento que valga la pena mantener |
| 3 | **Re-codificar siempre** | Se descarta el archivo entrante. Se sirven solo derivadas generadas por el servidor |
| 4 | **Eliminar todo metadato** | EXIF, GPS, IPTC, XMP. La ubicación del predio es dato reservado, y viaja gratis en cualquier foto de celular |
| 5 | **Límite de píxeles, no solo de bytes** | 40 MP máximo. Una imagen de 100 KB puede declarar 60 000 × 60 000 y tumbar el proceso al decodificarla |
| 6 | **Antivirus antes de `DISPONIBLE`** | ClamAV o equivalente. Un medio infectado nunca alcanza estado servible |
| 7 | **URL firmada de un solo uso** | TTL ≤ 5 min, con condición de `content-length` y `content-type` exactos |
| 8 | **Bucket privado por defecto** | El original jamás es público. Las derivadas públicas van a otro prefijo, con clave opaca |
| 9 | **Clave opaca, sin secuencia** | Nada de `/lote/1/foto/1.jpg`: eso es un catálogo enumerable de la producción nacional |
| 10 | **Cuota por organización** | Por número de medios y por bytes totales. Sin cuota, el almacenamiento es un vector de costo |
| 11 | **`alt` no vacío** | `422` si falta. WCAG 2.1 AA es gate de CI `[AMB-14]` |
| 12 | **`sinPersonas` declarado en `true`** | `422` si falta. La declaración es el control primario de habeas data |
| 13 | **Revisión de contenido para lo público** | Automática por reglas + cola manual. **Nunca se comunica como verificación del producto** `[ON]` N-05 |
| 14 | **Hash duplicado en la misma entidad** | `409`. Evita galerías con la misma foto doce veces |
| 15 | **Cabeceras al servir** | `X-Content-Type-Options: nosniff`, `Content-Disposition: inline` con nombre saneado, CSP que impida ejecución |
| 16 | **Evento al ledger** | `MEDIO_ADJUNTADO`, `MEDIO_RECHAZADO`, `MEDIO_RETIRADO`, con hash y actor |

**Documentos del expediente (PDF)** siguen otro camino: `Content-Disposition: attachment`, servidos siempre por URL firmada, nunca embebidos en un visor propio, y contados aparte de las imágenes. El asistente de registro ya valida formato y peso en el navegador ([CampoArchivo.tsx](src/shared/ui/primitivos/CampoArchivo.tsx), 10 MB, `.pdf`) — **y eso no libera al servidor de validar lo mismo**.

### 6.7 Retiro de un medio

`DELETE /medios/{id}` no borra un registro: cambia el estado a `RETIRADO`, elimina bytes y derivadas del almacenamiento, conserva `hash`, `alt`, actor y fechas, y sella `MEDIO_RETIRADO` en el ledger.

Motivos que obligan al retiro: reporte fundado de persona identificable, contenido que sugiere verificación oficial, contenido con condiciones económicas, orden de autoridad, o solicitud del titular. El actor recibe el motivo con su cita normativa, igual que cualquier otro rechazo.

### 6.8 Contenido editorial de la oferta

Además de las imágenes, la vitrina guarda texto que escribe el actor. El backend lo trata como contenido no confiable:

| Campo | Límite | Regla del servidor |
|---|---|---|
| `titulo` | 8–200 caracteres | Se rechaza vocabulario transaccional (§6.9) |
| `descripcion` | 30–4000 caracteres | Idem. Texto plano; si en el futuro admite formato, lista blanca de etiquetas y saneamiento en el servidor |
| `fichaTecnica` | ≤ 12 pares `{ rotulo, valor }` | Vocabulario controlado. **Sin cantidades ni capacidad productiva** `[ON]` Art. 21 |
| `certificaciones` | ≤ 8 entradas | Referencias a atestaciones registradas, no texto libre. La tarjeta dice "N atestaciones con evidencia registrada", nunca "N certificaciones verificadas" |
| `medios` | ≤ 12 | §6.2 |

El frontend valida longitudes antes de enviar; **el servidor las valida otra vez** y devuelve `422` con `type: https://sicamed.co/problemas/contenido-invalido` y el campo en `detail`.

### 6.9 Vocabulario prohibido — también en el servidor

El frontend tiene una prueba que rompe el build si aparece vocabulario transaccional en el código ([src/lenguaje-prohibido.test.ts](src/lenguaje-prohibido.test.ts)). **El backend necesita el equivalente sobre el contenido que escriben los actores**, porque una descripción con una lista de tarifas convierte a la vitrina en lo que la norma dice que no puede ser.

Términos que el servidor debe rechazar en `titulo`, `descripcion` y `fichaTecnica`, con `422` y cita `[ON]` Res. 1241/2026 Art. 8c y 10b:

```
precio · tarifa · cotización · descuento · promoción · pago · factura
orden de compra · carrito · comprar · vender · venta · checkout · pasarela
```

Y como test de arquitectura del backend: **ninguna clase, tabla ni columna del servicio `vitrina` puede llamarse** `Precio`, `Orden`, `Pago`, `Factura`, `Carrito` ni `Comision`. Su ausencia es un control de cumplimiento protegido por CI, no una decisión de estilo.

---

## 7. Seguridad, proceso por proceso

Un resumen no sirve: cada flujo tiene su propio conjunto de controles y su propio modo de fallar.

### 7.1 Registro de un actor — escritura sin sesión

Es el único endpoint autenticado por nada: `POST /actores/solicitudes`, desde `/registro`.

```ts
{
  nit: string; organizacion: string; tipoActor: TipoActor;
  departamento: string; municipio: string;
  representante: string; correo: string; telefono: string;
  documentos?: readonly { tipo: TipoDocumento; nombre: string; peso: number }[];
}
```

| Control | Obligatorio |
|---|---|
| reCAPTCHA Enterprise o equivalente | ✅ Es el endpoint que va a recibir el abuso |
| Rate limit por IP: 3 radicaciones / hora | ✅ |
| Verificación del correo antes de abrir expediente | ✅ El expediente crea organización y cuenta; no se abre sobre un correo no probado |
| Unicidad del NIT | ✅ `409 nit-ya-registrado`, `Res. 1241/2026 Art. 7 · unicidad del actor registrado` |
| Los documentos aquí son **metadatos**, no bytes | ✅ El archivo se sube con el flujo de §6.3, ligado a la solicitud |
| Ningún dato de la respuesta revela si un NIT existe con más detalle del necesario | ✅ El mensaje dice "solicita una invitación a su administrador", no quién es |

Radicar **no** habilita nada. Crea una solicitud en estado `RECIBIDA`. Abrir expediente es un acto de un analista, y de ahí en adelante todo está autenticado.

### 7.2 Ingreso

| Control | Dónde |
|---|---|
| Authorization Code + PKCE, sin secreto de cliente, **sin implicit flow** | Keycloak / Cloudflare Access |
| Token en memoria, nunca en almacenamiento del navegador | [proveedorOidc.ts](src/shared/auth/proveedorOidc.ts) |
| `code_verifier` en `sessionStorage` solo entre la redirección y el canje, y se borra al usarlo | idem |
| 5 intentos / 15 min, luego backoff exponencial | Backend |
| Token de acceso 15 min, refresh 8 h | Backend |
| El JWT se valida **en cada servicio**, no solo en el gateway | Backend `[ON]` Zero Trust |
| Cerrar sesión limpia las dos zonas de caché | [AuthProvider.tsx](src/app/providers/AuthProvider.tsx) |

### 7.3 Toda lectura

```
token válido → tenant_id del token en el WHERE → RBAC por permiso → ABAC por recurso → deny by default
```

- **Multi-tenancy es una cláusula obligatoria, no un filtro opcional.** `[ON]` N-12. Con RLS de PostgreSQL como segunda capa.
- Un recurso de otro tenant responde `404`, no `403`: un `403` confirma que el recurso existe.
- Un recurso de otra organización dentro del mismo tenant responde `403` si el rol podría en principio verlo, y `404` si no.
- El rol `AUTORIDAD_COMPETENTE` filtra por competencia declarada y **exige motivo de consulta**, que se audita `[ON]` N-07, Art. 12 ¶2.

### 7.4 Toda escritura

```
1. permiso RBAC presente en el token
2. ABAC: org_id del token == organizacion_id del recurso
3. invariante de dominio (§4)  ← aquí vive la norma
4. clave de idempotencia
5. transición de estado válida en la máquina de estados
6. evento al ledger, firmado
7. respuesta con el recurso completo actualizado
```

Los pasos 3 y 6 son los que hacen a SICAMED un operador tecnológico y no un formulario. **Si una escritura no queda en el ledger, no ocurrió.**

Operaciones que exigen firma de no repudio con clave en KMS (blueprint §10.6): `oferta.publicada`, `atestacion.registrada`, `atestacion.revocada`, `contacto.habilitado`, `inventario.ajuste`, `organizacion.suspendida`, y ahora también **`medio.adjuntado`** y **`medio.retirado`**.

### 7.5 Publicar en la vitrina

Es el flujo con más controles del sistema, y con razón:

| Paso | Control |
|---|---|
| 1 | Permiso `vitrina:oferta:publicar` |
| 2 | La organización es la titular de la oferta |
| 3 | La organización está `HABILITADA`, no suspendida |
| 4 | **Existe atestación vigente para ese tipo de producto** `[ON]` N-06, Art. 13b |
| 5 | Se persiste cuál atestación habilitó y cuándo se verificó |
| 6 | El contenido pasa el filtro de vocabulario prohibido (§6.9) |
| 7 | Los medios adjuntos están en estado `DISPONIBLE` y clasificados `PUBLICO` |
| 8 | La proyección pública se construye por lista blanca de campos, **no quitando campos de la interna** |
| 9 | Evento firmado al ledger |

El punto 8 importa más de lo que parece: proyectar por lista negra significa que el día que alguien añada un campo al modelo, ese campo se publica solo.

### 7.6 Manifestar interés y habilitar contacto

| Control | Regla |
|---|---|
| Nunca anónimo | Exige `organizacion_interesada_id`. `[ON]` N-04 |
| La oferta debe estar divulgada | `409 oferta-no-divulgada` |
| Una manifestación por oferta y organización | `UNIQUE (oferta_id, organizacion_interesada_id)` |
| El contacto se revela **solo** tras la decisión del oferente | El dato de contacto no viaja antes, ni siquiera enmascarado |
| Expira a los 15 días sin decisión | Política, no limpieza manual |
| Declarar resultado es voluntario y autodeclarado | `[AMB-09]`. Sin efectos. Etiquetado como declaración del usuario |

### 7.7 Verificación documental

Cuatro rechazos de separación de funciones y dos de proceso (§4.2). El principio detrás: **quien define las reglas no las aplica, y nadie verifica su propia evidencia**. Sin eso, el registro documental no tiene valor probatorio y el sistema deja de servir para lo único que importa.

### 7.8 Carga de archivos e imágenes

Los 16 controles de §6.6. El resumen de por qué cada uno existe cabe en una línea: **un archivo subido por un tercero es código hostil hasta que el servidor demuestra lo contrario**, y la única demostración que vale es re-generarlo.

### 7.9 Zona clínica

§5. Y una regla que no admite matices: **ningún dato de paciente cruza hacia la zona comercial**, ni agregado ni anonimizado, sin que `[AMB-15]` se decida con concepto jurídico.

### 7.10 Consulta institucional

Solo lectura `[AMB-08]`. Filtrada por competencia. Con motivo obligatorio. Cada acceso genera evento de auditoría. Un panel institucional que no audita sus propias consultas es un panel de vigilancia.

---

## 8. Catálogo de errores — implementarlos con este `type` exacto

El frontend ya distingue por `type`. Cambiar una URI rompe la ramificación; cambiar un `title` o un `detail` no rompe nada.

| `type` (bajo `https://sicamed.co/problemas/`) | HTTP | Cuándo | `norma` |
|---|---|---|---|
| `recurso-no-encontrado` | 404 | No existe, o no tienes permiso para verlo | — |
| `nit-ya-registrado` | 409 | Radicar con NIT existente | Res. 1241/2026 Art. 7 · unicidad del actor |
| `solicitud-ya-tramitada` | 409 | Abrir expediente sobre solicitud no `RECIBIDA` | — |
| `atestacion-sin-origen-probatorio` | 422 | Atestación desde expediente no aprobado | Res. 1241/2026 Art. 13b · origen `DOCUMENTAL_VERIFICADA` |
| `habilitacion-no-vigente` | 422 | **Publicar sin atestación vigente** | Res. 1241/2026 Art. 13b |
| `sin-cupo-asignado` | 422 | Sembrar sin cupo del MICC | Dec. 1138/2025 Art. 3 |
| `cupo-excedido` | 422 | Sembrar por encima del cupo | Dec. 1138/2025 Art. 3 |
| `madre-inexistente` | 422 | Clon sin planta madre | Res. 1241/2026 Art. 12 |
| `madre-invalida` | 422 | Madre que no proviene de semilla | Res. 1241/2026 Art. 12 y 20 |
| `planta-fuera-de-ciclo` | 409 | Labor sobre planta cosechada o destruida | Res. 1241/2026 Art. 20 |
| `carencia-activa` | 422 | Cosechar en periodo de carencia | Res. 1241/2026 Art. 20 · BPA/GACP |
| `balance-de-masa` | 422 | Pesos incoherentes o entrada > existencias | Res. 1241/2026 Art. 20 y Art. 9 |
| `sin-registro-sanitario` | 422 | Producto terminado sin INVIMA | Dec. 1138/2025 Art. 1 núm. 38 |
| `lote-destruido` | 409 | Mover un lote ya destruido | Dec. 1138/2025 Art. 11 |
| `acta-sin-testigo` | 422 | Destrucción sin testigo identificado | Dec. 1138/2025 Art. 11 |
| `oferta-no-divulgada` | 409 | Manifestar interés sobre oferta no publicada | Res. 1241/2026 Art. 8 |
| `convocatoria-cerrada` / `sin-cupos` | 409 | Rueda cerrada o llena | — |
| `devolucion-sin-motivo` | 422 | Devolver documento o paso sin observación | Res. 1241/2026 Art. 7 · debido proceso |
| `paso-de-otro-rol` | 403 | Resolver un paso que no te corresponde | Blueprint §5.3-bis |
| `paso-fuera-de-orden` | 409 | Hay un paso anterior sin resolver | Blueprint §5.3-bis · SECUENCIAL |
| `doble-control` | 403 | La misma persona resuelve dos pasos | Blueprint §5.3-bis |
| `separacion-de-funciones` | 403 | El super administrador intenta verificar | Blueprint §5.3-bis |
| `expediente-propio` | 403 | Verificar el expediente de la propia organización | Blueprint §5.3-bis · invariante 2 |
| `rol-sin-verificacion` | 403 | Rol sin paso asignado en la política | Blueprint §5.3-bis |
| `politica-restringida` | 403 | Guardar política sin ser super administrador | Blueprint §5.3-bis |
| `alta-restringida` | 403 | Crear o cambiar cuentas sin ser super administrador | Res. 1241/2026 Art. 24 |
| `correo-ya-usado` | 409 | Invitar un correo con cuenta existente | — |
| `ultimo-super-admin` | 409 | Degradar al único super administrador | — |
| `fuente-autoritativa` | 409 | Resolver a favor del dato local contra un registro externo autoritativo | Res. 1241/2026 Art. 7 · jerarquía probatoria |
| `sin-interfaz-tecnica` | 501 | Sincronizar contra una entidad sin API | La de la conexión |
| `contenido-invalido` | 422 | Texto o ficha técnica fuera de norma (§6.8, §6.9) | Res. 1241/2026 Art. 8c y 10b |
| `medio-no-admitido` | 422 | Formato, tamaño o dimensiones fuera de límite | — |
| `medio-sin-alternativa` | 422 | Falta `alt` | Res. 1519/2020 · WCAG 2.1 AA |
| `medio-sin-declaracion` | 422 | Falta la declaración de ausencia de personas | Ley 1581/2012 |
| `medio-duplicado` | 409 | Mismo hash ya adjunto a la entidad | — |
| `cuota-de-medios-agotada` | 429 | Cuota de la organización superada | — |
| `error-inesperado` | 500 | Cualquier otra cosa. **Con `X-Request-Id` en la respuesta** | — |

---

## 9. Límites, cuotas y protección perimetral

| Perfil | Límite | Ventana |
|---|---|---|
| Anónimo — vitrina pública | 60 peticiones | 1 min por IP |
| Anónimo — radicar solicitud | 3 | 1 hora por IP, más captcha |
| Usuario autenticado | 600 | 1 min por usuario |
| Escritura sensible (publicar, atestaciones, destrucciones) | 20 | 1 min por usuario |
| Preparar carga de medio | 30 | 1 hora por organización |
| Cuenta de integración | Negociado | 1 min por `client_id` |
| Autenticación | 5 intentos | 15 min, luego backoff |

Cuotas de almacenamiento: por organización, en número de medios y bytes totales, con aviso al 80 % y `429 cuota-de-medios-agotada` al superarla.

**CORS.** Origen explícito, nunca `*` en zonas autenticadas. `Access-Control-Allow-Credentials: true` solo para los orígenes del frontend. La zona pública puede ser `*` porque no lleva credenciales.

**Cabeceras de seguridad.** El frontend ya sirve HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy` desde [vercel.json](vercel.json). El backend debe replicarlas en sus propias respuestas: el navegador no hereda las de otro origen.

---

## 10. Cómo se enchufa el frontend

Hoy:

```bash
VITE_MODO_API=mock     # servidor simulado en src/shared/api/mock/
```

El día del cambio:

```bash
VITE_MODO_API=http
VITE_URL_API_COMERCIAL=https://api.sicamed.co/comercial
VITE_URL_API_CLINICA=https://api.sicamed.co/clinico
VITE_URL_API_PUBLICA=https://api.sicamed.co/v1/publico
VITE_MODO_AUTH=oidc          # o cloudflare
```

No hay ningún otro paso en el frontend. `transporte.ts` decide entre datos locales y `fetch` en un solo punto, y los hooks de cada feature no cambian.

Cuando el backend publique sus OpenAPI:

1. Los archivos `*-vX.Y.Z.json` se colocan en [contracts/](contracts/).
2. Se fija la versión exacta en [contracts/versiones.json](contracts/versiones.json) — **nunca `latest`**. Al añadirse el servicio de medios, entra ahí como `"medios": "vX.Y.Z"`.
3. `npm run contracts` regenera `src/shared/api/generado/`.
4. Si el contrato cambió, el build del frontend falla. **Esa es la idea.**

---

## 11. Checklist de aceptación del backend

Un endpoint no está terminado hasta que las once líneas se cumplen.

- [ ] Responde exactamente la forma documentada, sin campos extra en las zonas pública y clínica.
- [ ] Devuelve `Pagina<T>` o cursor según §1.6, con los mismos nombres de campo.
- [ ] Todos los errores son Problem Details con `type` del catálogo de §8.
- [ ] Los rechazos normativos llevan `norma` con su cita, y `accion` cuando hay a dónde ir.
- [ ] Ignora `autor`, `tenantId`, `huella`, `estado` y `fecha` que vengan del cliente.
- [ ] Aplica RBAC por permiso **y** ABAC por organización, con deny by default.
- [ ] Filtra por `tenant_id` en la cláusula `WHERE`, con RLS como segunda capa.
- [ ] Escribe el evento correspondiente en el ledger, firmado si está en la lista de §7.4.
- [ ] Es idempotente si crea un hecho.
- [ ] Fechas en ISO 8601 UTC, enums en clave, decimales como número.
- [ ] Tiene prueba de contrato que falla si la forma cambia.

Y tres pruebas de arquitectura que deben existir en el monorepo del backend:

1. Ninguna clase, tabla o columna con vocabulario transaccional en el servicio `vitrina`.
2. Ninguna ruta de la API pública proyecta un campo `RESERVADO_COMERCIAL`.
3. Ningún módulo de la zona comercial importa de la zona clínica, ni al revés.

---

## Documentación relacionada

- [README.md](README.md) — puesta en marcha, arquitectura del frontend, despliegue
- [GUIA-TECNICA-FRONTEND.md](GUIA-TECNICA-FRONTEND.md) — la guía que define esta arquitectura
- `decisiones/SICAMED-BLUEPRINT-v1.2.md` — §5.8 y §6.7-bis (medios), §9.3 (APIs), §10 (seguridad), §16 (frontend)
- `decisiones/PROCESO-REAL-SICAMED.md` — el proceso real tramo por tramo
- [contracts/README.md](contracts/README.md) — versionado de contratos
