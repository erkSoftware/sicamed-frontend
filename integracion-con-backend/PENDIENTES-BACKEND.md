# SICAMED · Lo que falta para cerrar la integración

Para el equipo de backend e infraestructura. Escrito contra
[README-FRONTEND.md](README-FRONTEND.md) y
[README-FRONTEND-PRODUCCION.md](../README-FRONTEND-PRODUCCION.md), verificado
contra el cliente que ya está en el repositorio del portal.

**El portal ya habla el contrato.** Las 126 operaciones del §9 están
transcritas, los sobres de paginación, `problem+json`, los dos regímenes de CORS
y la subida en tres pasos están implementados y con pruebas. Encender la
integración es cambiar una variable:

```env
VITE_MODO_API=http
VITE_URL_API=http://localhost:8080
```

Todo lo que sigue está **medido**, no supuesto. El contrato y los datos, contra
el backend local del 29 de agosto de 2026 con `make seed` y un token de
`SUPER_ADMIN`, llamando desde el cliente real del portal y no con `curl`. La
infraestructura del §1, contra `https://api.sicamed.com.co` y
`https://auth.sicamed.com.co` el 30 de agosto. Lo que decimos que falla, falla;
lo que decimos que funciona, lo vimos llegar y mapearse.

Dos cosas cambiaron desde el 29 y las dos importan: el `redirect_uri` de
Keycloak dejó de estar restringido, pero quedó abierto de par en par (§1.1); y
producción ya exige captcha en la radicación, con una cabecera que su propio
CORS no permite (§1.3).

Está ordenado por lo que bloquea antes.

---

## 1. Bloqueantes de infraestructura

Sin esto no hay demo, independientemente del código de ambos lados.

### 1.1 Keycloak acepta **cualquier** `redirect_uri` — es una redirección abierta

Esto ya no es el bloqueante que reportamos: es peor, y cambia de categoría.

El día 29 el cliente sólo aceptaba `http://localhost:5173/callback`. Hoy, 30 de
agosto, acepta todo lo que le pidamos. Comprobado contra el emisor real:

```bash
curl -s "https://auth.sicamed.com.co/realms/sicamed/protocol/openid-connect/auth\
?client_id=sicamed-frontend&response_type=code&scope=openid\
&redirect_uri=http%3A%2F%2Fevil.example.com%2Facceso\
&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256"
```

Devuelve `200` con `<title>Sign in to SICAMED</title>`: la pantalla de acceso,
no `Invalid parameter: redirect_uri`. Lo mismo con
`https://sicamed.com.co/acceso`, con `http://localhost:5173/acceso` y con
`http://localhost:5173/callback`. Los cuatro pasan, y uno de ellos no es
nuestro.

Parece que se resolvió el bloqueo poniendo `*` en *Valid redirect URIs*. Eso
desbloquea el portal y abre una redirección abierta en el emisor de identidad:
cualquiera puede armar un enlace de acceso legítimo, con el dominio y el
certificado de `auth.sicamed.com.co`, que después de autenticar a la persona le
entrega el código de autorización a un servidor ajeno. PKCE evita que ese código
se canjee sin el verificador, así que no es un robo de sesión inmediato; sigue
siendo una plataforma de phishing con la marca y el dominio del sistema, y un
hallazgo que cualquier auditoría marca.

**Lo que pedimos es la lista explícita**, no el comodín:

| Entorno | URI a registrar |
|---|---|
| Local | `http://localhost:5173/acceso` |
| Previsualización | `http://localhost:4173/acceso` |
| Producción | `https://sicamed.com.co/acceso` y `https://www.sicamed.com.co/acceso` |

Los mismos en *Post logout redirect URIs*, y en *Web origins* los orígenes sin
ruta ni comodín. Quitar las de `localhost` cuando el portal esté en producción.

**Importante:** el portal ya no depende de esto para entrar. El acceso se hace
desde nuestra propia pantalla, no desde la de Keycloak (§1.2), así que el
comodín no nos bloquea. Lo reportamos porque sigue siendo una redirección
abierta en el emisor de identidad, y eso hay que cerrarlo igual.

### 1.2 Mantener la concesión directa habilitada en `sicamed-frontend`

El acceso al portal ocurre **en la pantalla del portal**, no en la de Keycloak.
Es una decisión de producto: la pantalla de `/acceso` es parte del sistema y no
queremos que el usuario salte a una interfaz ajena a mitad del ingreso.

Eso se apoya en `grant_type=password` sobre el cliente público
`sicamed-frontend`, que hoy **ya funciona** y que comprobamos así:

```bash
curl -s -X POST "https://auth.sicamed.com.co/realms/sicamed/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=sicamed-frontend&username=prueba&password=prueba"
→ {"error":"invalid_grant","error_description":"Invalid user credentials"}
```

`invalid_grant` y no `unauthorized_client`: la concesión está habilitada. El
`OPTIONS` del token endpoint también devuelve nuestro origen, así que el
formulario puede llamarlo desde el navegador.

Lo único que pedimos es que **no se desactive** *Direct access grants* en ese
cliente sin avisarnos, porque el día que se apague el ingreso deja de funcionar
en el acto.

Somos conscientes del contrapeso y lo decimos nosotros mismos: en este flujo el
portal ve la contraseña, cosa que con la redirección no pasaría, y OAuth 2.1 lo
desaconseja por eso. La contrapartida es que el ingreso no sale de nuestra
interfaz. El cliente sigue siendo público y sin secreto, el token vive solo en
memoria y la renovación nunca se guarda en el navegador. Si más adelante se
decide volver al flujo con redirección, del lado del portal es cambiar una
variable.

### 1.3 ~~El CORS del borde no permite la cabecera del captcha~~ · RESUELTO el 30 de agosto de 2026

Era el bloqueante más caro de los que quedaban, porque **rompía el único
trámite que un desconocido puede ejercer**: registrarse. Ya no: el borde admite
la cabecera. Medido contra producción, con el origen de desarrollo:

```bash
curl -X OPTIONS https://api.sicamed.com.co/api/v1/comercial/actores/soportes:preparar \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type,cf-turnstile-response'
→ 200 OK
```

La lista definitiva la publica `README-FRONTEND-CONEXION.md` §6 y es cerrada:
`Accept`, `Accept-Language`, `Authorization`, `CF-Turnstile-Response`,
`Content-Type`, `Idempotency-Key`, `X-Correlation-Id`, `X-Motivo-Consulta`,
`X-Request-Id`. Lo que queda de esta sección es el registro de lo que pasaba, y
un rescoldo que sigue abierto: los dominios del widget.

Producción ya exige el captcha, y lo exige bien:

```
POST https://api.sicamed.com.co/api/v1/comercial/actores/solicitudes
→ 403 https://sicamed.co/problemas/captcha-invalido
   "Falta la comprobación de seguridad"
```

El backend lee el comprobante de la cabecera `CF-Turnstile-Response`
(`sicamed_platform/seguridad/captcha.py`, constante `CABECERA_CAPTCHA`), y
`exigir_captcha` no acepta ninguna alternativa por cuerpo. Correcto.

El problema es que esa cabecera **no está en la lista de CORS**:

```
access-control-allow-headers: Accept, Accept-Language, Authorization,
  Content-Language, Content-Type, Idempotency-Key, X-Correlation-Id,
  X-Motivo-Consulta, X-Request-Id
```

Y la precomprobación que la pide se rechaza:

```bash
curl -i -X OPTIONS "https://api.sicamed.com.co/api/v1/comercial/actores/solicitudes" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,cf-turnstile-response"
→ HTTP/2 400
```

Con `curl` la petición pasa porque `curl` no respeta CORS. Desde un navegador no
pasa nunca: el `OPTIONS` falla y el `POST` no llega a salir. Radicar queda
imposible con captcha y con la cabecera correcta, que es exactamente el camino
que el propio backend definió.

**Añadir `CF-Turnstile-Response` a `Access-Control-Allow-Headers`.** Es una
línea, y sin ella el registro no existe en producción.

Afecta a las dos rutas que llevan `Depends(exigir_captcha)`:
`POST /actores/solicitudes` y
`POST /actores/solicitudes/{id}/verificacion`.

**Nuestro lado ya está hecho.** El portal monta el widget de Turnstile en el
paso de revisión del asistente, no deja radicar sin comprobante, manda el token
en `CF-Turnstile-Response` y renueva el widget tras cada rechazo, porque el
comprobante es de un solo uso. La clave de sitio va en
`VITE_TURNSTILE_CLAVE_SITIO`. En cuanto la cabecera esté permitida, funciona sin
tocar nada más.

**Y hay un segundo detalle, este del panel de Cloudflare.** La clave de sitio
`0x4AAAAAAEhkrb1nAez7dCTA` solo tiene registrados los dominios de producción.
Medido con un navegador real el 30 de agosto de 2026:

| Dominio de la página | Respuesta del widget |
| --- | --- |
| `localhost` | error `110200` — dominio no permitido, el widget no se dibuja |
| `127.0.0.1` | error `110200` |
| `sicamed.com.co` | el widget carga y lanza el desafío |

`110200` es «unknown domain». Por eso en desarrollo no aparece nada donde debería
estar la casilla: no es un fallo del portal ni de la red. Para poder probar el
trámite completo contra el ambiente real hace falta añadir `localhost` a la lista
de dominios del widget en el panel de Cloudflare, que es lo que Cloudflare
recomienda para entornos de desarrollo. Si prefieren no tocar esa lista, la
alternativa es una segunda clave de sitio solo para desarrollo. Mientras tanto,
dejar `VITE_TURNSTILE_CLAVE_SITIO` vacía en el `.env` local desactiva la
exigencia y el asistente se puede recorrer entero.

### 1.4 ~~El captcha de `/auth` arrastra el mismo bloqueo~~ · RESUELTO el 30 de agosto de 2026

`README-FRONTEND-INTEGRACION.md` exige `CF-Turnstile-Response` en cuatro rutas
más de las que contemplaba el §1.3: `POST /auth/login`,
`POST /auth/cambiar-clave` y las dos de soportes del registro. El portal ya las
manda; si la cabecera sigue fuera de `Access-Control-Allow-Headers`, **la
precomprobación falla y no se puede entrar desde el navegador**, no solo
registrarse.

Es el mismo arreglo del §1.3 —una línea— pero conviene decirlo aparte porque el
alcance cambió: antes bloqueaba el alta, ahora bloquea también el acceso.

Las cuatro precomprobaciones responden `200` con `cf-turnstile-response` en la
lista, así que `VITE_TURNSTILE_CLAVE_SITIO` ya está rellena en `.env.local` y el
captcha está encendido en las seis rutas anónimas. No hizo falta tocar código:
`exigeComprobacion()` lo enciende sola.

Lo que sí hizo falta fue **quitar una cabecera nuestra**. El transporte mandaba
`Cache-Control: no-store` en las zonas clínica y de identidad, y `Cache-Control`
no está en la lista cerrada del §6: la precomprobación del login moría con `400
Disallowed CORS headers` antes de salir el `POST`. El navegador lo reporta como
«error de CORS» sin decir qué cabecera fue, que es justo el síntoma que no
señala a su causa. Ahora el no-store se pide por la opción `cache` de `fetch`,
que consigue lo mismo sin cabecera de petición, y `cabecerasCors.test.ts` fija
la lista para que no vuelva a colarse ninguna.

El CORS con credenciales está bien resuelto: `/auth` devuelve
`access-control-allow-credentials: true` y el origen explícito, nunca `*`.

Lo que sí muerde es el `SameSite`. Medido el 30 de agosto de 2026:

```
set-cookie: sicamed_refresco=""; HttpOnly; Max-Age=0; Path=/auth;
            SameSite=strict; Secure
```

`SameSite=strict` significa que el navegador **no manda la cookie en ninguna
petición entre sitios**. En producción no hay problema, porque `sicamed.com.co` y
`api.sicamed.com.co` son el mismo sitio registrable y la cookie viaja. Pero un
portal servido desde otro sitio —`localhost:5173`, o una URL de *preview* de
Vercel— nunca la recupera: el acceso funciona, y a la primera recarga
`POST /auth/refresh` responde `401` y el usuario vuelve al login. Eso no lo
arregla el CORS.

Del lado del portal se resuelve sin pedirles nada: el servidor de desarrollo
reenvía `/auth` y `/api` a la API, así que el navegador la ve en su propio origen
y la cookie es de primera parte (`VITE_URL_API_ORIGEN`). Si en algún momento el
portal tiene que vivir en un sitio distinto al de la API de verdad —y no solo en
desarrollo—, entonces sí hace falta `SameSite=None; Secure`, con la advertencia
de que eso la convierte en cookie de terceros y Safari y Firefox la bloquean por
su cuenta. La salida buena es la que ya tiene producción: un solo sitio
registrable.

### 1.5 CORS del portal

Parcialmente resuelto. `http://localhost:5173` **sí** está permitido en
producción, con `access-control-allow-credentials: true` y el origen devuelto de
forma explícita, que es como debe ser. Podemos desarrollar contra el ambiente
real.

Falta lo de siempre: confirmar y añadir a `SICAMED_ORIGENES_PERMITIDOS` **el
origen definitivo del portal antes del día del despliegue**, incluidos los de
previsualización de Vercel si el despliegue va a pasar por ahí. Y quitar
`localhost` cuando eso ocurra.

### 1.6 CORS del almacén de objetos

El §6 dice que el navegador sube el archivo **directo a `subida.url`**. Eso es
una petición de origen cruzado desde el portal hacia
`objetos.sicamed.com.co`, y el informe de producción no la cubre. Hace falta:

- Que el bucket responda al `OPTIONS` de precomprobación desde el origen del
  portal, admitiendo `POST` y las cabeceras que vengan en `subida.cabeceras`.
- Que `subida.url` salga siempre en `https`. Si sale en `http`, el navegador la
  bloquea como contenido mixto y **no queda rastro en los logs del backend**.

### 1.7 Lista blanca de rutas del borde

§4.1. Cada ruta que integramos tiene que estar en
`deployment/nginx/sicamed-comun.conf`. Pedimos una confirmación puntual de que
las 126 del inventario están en el mapa, no solo las de la semilla: un 404 en
producción con el prefijo correcto nos cuesta media jornada de depuración cada
vez.

---

## 2. Operaciones que el portal necesita y el contrato no publica

Hoy estas seis acciones existen en la interfaz y, con `VITE_MODO_API=http`,
fallan con un `501` legible en vez de golpear una ruta inexistente. No están
inventadas: cada una tiene una pantalla construida.

| Qué hace el usuario | Ruta que necesitamos | Por qué no la suplimos |
|---|---|---|
| **Ver sus plantas, sus beneficios, sus transformaciones y sus actas de destrucción** | `GET /comercial/{plantas,beneficios,transformaciones,actas-destruccion}?organizacionId=` | **Cuatro pantallas completas sin ruta.** El contrato solo ofrece las anidadas: `/cultivos/{id}/plantas`, `/cultivos/{id}/beneficios`, `/lotes/{id}/transformaciones`. Un productor con 4 cultivos y 4 lotes no puede ver su propio inventario sin recorrer padre por padre. Hoy `GET /beneficios` y `GET /transformaciones` responden **405** y `GET /plantas` responde **404** |
| Avanzar la etapa de un cultivo | `PATCH /comercial/cultivos/{id}` con `{estado}` | El contrato crea y lee cultivos, pero no los mueve. `CultivoApi.estado` es de solo lectura |
| Conciliar todos los cupos de la organización | `POST /comercial/cupos/conciliacion` | Solo existe `POST /cupos/{id}/conciliacion`. Podemos iterar, pero son N escrituras contra un límite de 5 r/s |
| Elegir la variedad al sembrar | `GET /comercial/variedades` → `{id, nombre, psicoactiva, registroIca}` | **El más urgente.** `RegistrarCultivoApi.variedadId` y `RegistrarPlantaApi.variedadId` son obligatorios y no hay de dónde sacarlos. Sin esto no se puede registrar un cultivo ni una planta |
| Elegir el agroinsumo al registrar una labor | `GET /comercial/agroinsumos` → `{id, nombre, categoria, diasCarencia}` | `RegistrarLaborApi.agroinsumoId` es un id libre y la carencia la calcula el servidor. El operario no puede escribir un UUID a mano |
| Ver lecturas de ambiente | El contexto `ambiente` completo | §8 dice que está vacío. Necesitamos saber si entra en el alcance o retiramos la pantalla |
| Ver indicadores clínicos | `GET /clinica/indicadores` | No hay equivalente. Podemos derivarlos de `/clinica/agenda` y `/clinica/pacientes` si nos confirman qué se quiere medir |

Los dos catálogos son la diferencia entre «la operación se puede registrar» y
«no se puede». Si solo pueden entregar una cosa de esta tabla, que sean esos
dos.

### 2.1 No hay forma documentada de bajar el soporte que adjuntó quien radicó

La ficha de una solicitud ya está construida: `GET /actores/solicitudes/{id}`
trae `documentosDeclarados` con `tipo`, `nombre` y `soporteId`, y la pantalla los
lista, los enseña a pantalla completa y los deja descargar. Lo que no existe es
**la ruta que convierte ese `soporteId` en el archivo**.

Lo que hay en el §9 es `GET /medios/{medio_id}` → `MedioApi`, y el detalle del
expediente sí trae `documentos[].medioId` rotulado «para descargarlo». Pero un
soporte de radicación no es un medio: nace en `POST /actores/soportes:preparar`,
en otro contexto y sin sesión. **No sabemos si `soporteId` sirve como
`medio_id`.** El portal lo intenta por ahí porque es lo único publicado, y
cuando el servidor no contesta una URL la pantalla lo dice tal cual —«el
servidor no publicó una dirección para este soporte», con el identificador a la
vista— en lugar de dejar un visor roto.

Lo que pedimos es cualquiera de estas dos, no las dos:

| Opción | Ruta | Qué devolvería |
|---|---|---|
| **A** (preferida) | `GET /actores/soportes/{soporte_id}` | `SoporteApi` con `nombre`, `mime`, `bytes` y una `url` firmada de lectura, con su vencimiento |
| **B** | Que `documentosDeclarados[]` traiga ya `url`, `mime` y `bytes` | Ahorra N peticiones por ficha, que es lo que hoy cuesta pintar tres soportes |

Dos cosas del lado de ustedes que importan más que la forma:

- **La URL tiene que servir dentro de un `<img>` y un `<object>`**, es decir,
  firmada en la propia URL. Si exige la cabecera `Authorization`, el navegador
  no la manda en esas etiquetas y no hay visor posible sin descargar el archivo
  a memoria antes.
- **El almacén tiene que permitir el origen del portal en `GET`.** El §1.6 ya
  pide esto para la subida; la lectura tiene el mismo problema.

Mientras tanto el simulador sirve la ficha completa —PDF, imagen y un `.docx`
para ejercitar el caso sin vista previa—, así que la pantalla se puede revisar
entera sin backend.

---

## 3. Campos que faltan en esquemas que ya existen

No son adornos: son columnas que hoy se pintan y quedarían vacías, o datos que
nos obligan a una petición por fila.

| Esquema | Campo | Para qué |
|---|---|---|
| `CupoApi` | `modalidad` (el tipo de atestación que ampara el cupo) | Es una columna de la tabla de cupos. Hoy asumimos `CULTIVO_NO_PSICOACTIVO`, que es una suposición que puede ser falsa |
| `Pagina<T>` | `total` **obligatorio** en el esquema | El servidor ya lo manda —lo verificamos en los diez listados— pero el contrato lo marca opcional, así que el cliente tiene que estimarlo por si acaso. Fijarlo como obligatorio elimina esa rama muerta |
| `PlantaApi` | `huella`, y una forma de consultar los clones (`GET /plantas/{id}/clones` o `?madreId=`) | La ficha de planta muestra el linaje. `madreId` sube, pero no hay forma de bajar |
| `BeneficioApi` | `codigo` legible, `cultivo` (nombre), `departamento`, fechas de inicio y cierre | Solo hay `registro`. La lista de beneficios se pinta con UUID |
| `TransformacionApi`, `ActaDestruccionApi` | `codigo`/`acta` legible y `departamento` | Igual |
| `ExpedienteApi` | `tipoActor`, `departamento`, analista asignado | Son los tres filtros de la bandeja de expedientes |
| `PasoApi` | `slaHoras` o vencimiento del paso | La bandeja ordena por lo que está por vencer |
| `DocumentoApi` | `cargado`, `vence`, `huella` | Hoy usamos `decididoEn` como fecha de carga, que es otra cosa |
| `CierreApi` | contraparte, tipo de producto, organización, departamento | La tabla de cierres solo tiene ids |
| `RuedaApi` | `modalidad` (presencial/virtual/mixta) y sede | Hoy asumimos presencial |
| `MedicoApi` | IPS a la que pertenece | El directorio la muestra |

Para los nombres de organización ya resolvimos con
`GET /organizaciones/resumen?ids=`, que es exactamente lo que hacía falta y está
bien pensado. **Lo que pedimos es lo mismo para variedad, cultivo y lote**: o el
nombre en la proyección, o un `resumen?ids=` equivalente.

### Sobre la unión de `organizaciones`

La proyección doble de `Pagina<OrganizacionApi | OrganizacionPublicaApi>` está
resuelta en el portal: detectamos la ausencia de `representante`, `correo` y
`telefono` y ocultamos el bloque de contacto en vez de pintar `undefined`.
Funciona, pero depende de olfatear campos. Un discriminante explícito
(`proyeccion: "COMPLETA" | "SIN_CONTACTO"`) haría el contrato honesto en vez de
adivinable. No es bloqueante.

---

## 4. Valores de enum y de parámetro por confirmar

| Dónde | Qué |
|---|---|
| `tipoProducto` de `PublicarOfertaApi` | No hay valor para **semilla certificada**, y el formulario de publicación la ofrece. O se añade al enum, o confirmamos que la semilla no se publica en vitrina y la retiramos |
| `orden` de `GET /publico/ofertas` | El §9 lista el parámetro pero no sus valores. Estamos mandando `RECIENTES`, `TERRITORIO` y `PRODUCTO`. ¿Cuáles admite? |
| `type` del 404 de «cuenta sin organización» | §3 dice «distinguir por el `type`» y no da el valor. Asumimos que termina en `/organizacion-no-asociada`. **Si es otro, el usuario ve «no existe» cuando lo que pasa es que su cuenta no está vinculada** |
| `entidad` de `GET /trazabilidad/{entidad}/{id}` | ¿Va en singular y mayúsculas (`LOTE`) como en `PrepararApi`, o en plural minúscula como el segmento de ruta? |
| Rutas de medios de `produccion/` | La galería de lotes cuelga de `/lotes/{id}/medios`, pero la de plantas de `/produccion/plantas/{id}/medios`. ¿Es deliberado o es una inconsistencia del generador? |
| `entidad` y `entidadId` de `GET /actas-destruccion` | El §9 dice que los parámetros de consulta son opcionales «salvo que el contrato diga otra cosa». Estos dos son **obligatorios**: sin ellos la ruta responde 422. O se hacen opcionales, o hay que corregir el documento |

### El departamento llega de dos formas distintas

Es el hallazgo que más rompe pantallas, y no es un campo que falte: es el mismo
campo con dos codificaciones.

| Esquema | Qué manda hoy |
|---|---|
| `OrganizacionApi`, `OfertaApi`, `SolicitudApi` | `"Cauca"` — el nombre |
| `CultivoApi`, `LoteApi` | `"19"` — el código DIVIPOLA |
| `PacienteEnListaApi` y toda la zona clínica | `"19"` — el código |
| `municipio`, en todos | `"19001"` — siempre el código |

El portal filtra y agrupa por departamento en una sola lista de nombres. Con
esto, la tabla de cultivos muestra «19», el filtro de departamento no cruza con
el de ofertas, y el mapa no encuentra el territorio. Necesitamos **una sola
codificación** para el mismo concepto. Nuestra preferencia: `departamento` y
`municipio` con el código DIVIPOLA, y `departamentoNombre` /
`municipioNombre` al lado, que es lo que ya hace `DepartamentoApi` en los
indicadores y funciona bien.

### La semilla tiene un cupo con la vigencia invertida

`GET /cupos` devuelve un cupo con `vigenciaDesde: 2026-12-31` y
`vigenciaHasta: 2026-01-01`. No es un problema de contrato, pero cualquier
pantalla que calcule «vence en N días» sale en negativo. Vale la pena una
validación en el agregado además de arreglar el dato.

---

## 5. Límite de tasa de `/iam/`

10 por minuto, compartido por IP y por toda la oficina detrás de la misma NAT.
El portal llama `GET /iam/sesion` al restaurar la sesión para pintar el menú con
permisos del servidor, como pide el §2. Dos preguntas:

1. ¿Ese `GET` cuenta contra el límite de autenticación? Si es así, con seis
   personas recargando la página el límite se agota en un minuto.
2. Si cuenta, ¿pueden excluir los `GET` de `/iam/` y dejar el límite estrecho
   para el canje de token?

Del lado del portal ya está puesto lo que nos toca: sin bucle de reintento en
`401`, `403`, `422` ni `429`, y respeto de `ratelimit-reset` (§7).

---

## 6. Los contratos OpenAPI

El README apunta a `contratos/` como fuente de verdad, y tiene razón. En el
repositorio del portal, `contracts/` solo tiene `versiones.json`: **los `*.json`
no llegaron nunca**.

Consecuencia: los tipos del cliente están transcritos **a mano** desde las
tablas del §9. Funciona hoy y tiene pruebas, pero cada cambio del contrato es
una transcripción manual más, y el propio documento avisa de que la tabla queda
obsoleta cuando el contrato cambia.

Lo que pedimos, por orden de preferencia:

1. Publicar los `*.json` de `contratos/` en un artefacto versionado que podamos
   consumir en CI (un release de GitHub o un paquete sirven).
2. O, como mínimo, exponer el esquema en la propia API
   (`GET /api/v1/openapi.json`) para poder regenerar contra el servidor vivo.

Con eso el cliente se genera y esta clase de deriva desaparece.

---

## 7. Lo que ya no hace falta pedirnos

Para que nadie lo levante como pendiente en la próxima reunión, esto ya está
hecho y probado del lado del portal:

| Del README | Estado |
|---|---|
| Prefijo `/api/v1/<zona>` por zona, con `clinica` y no `clinico` en la URL | Hecho |
| `problem+json` como manejador único, con `norma` y `accion` pintados | Hecho. `accion` se pinta como botón y `norma` como fundamento |
| `errores[]` del 422 anclados campo a campo | Hecho en el asistente de registro, que es la escritura sin sesión: el motivo aparece bajo su campo y el asistente devuelve al paso que lo contiene. En el resto de formularios se listan campo y motivo; anclarlos uno a uno está en nuestra lista |
| Los dos esquemas de paginación, con la clave `ofertas` de la vitrina | Hecho. Cursor opaco y «cargar más» en público, paginador numerado en la zona autenticada |
| `porPagina` ≤ 100 y `pagina` ≤ 10 000 | Recortados en el cliente antes de salir |
| CORS: `credentials: omit` y sin `Authorization` en la zona pública | Hecho |
| Subida en tres pasos, con `campos` antes del archivo y `file` al final | Hecho |
| `alt` y `sinPersonas` obligatorios, sin valor por defecto | Hecho. `sinPersonas` lo declara el actor |
| Menú pintado desde `GET /iam/sesion`, sin matriz de permisos codificada | Hecho |
| Decimales que llegan como cadena, y `date` como fecha de calendario | Hecho. No se convierten a hora local |
| Proyección sin datos de contacto para auditor y autoridad | Hecho |
| `X-Request-Id` visible en la pantalla de error | Hecho. Se lee de la cabecera y se muestra seleccionable |
| Backoff y ausencia de bucle de reintento | Hecho |
| Estados vacíos antes que las tablas | Hecho. La vitrina con cero ofertas y facetas vacías es un estado pintado, no un fallo |
| Objetos incrustados en `<iframe>` (§5.1 del informe de producción) | **No hay ninguno.** Verificado en todo el código del portal. El cambio de CSP del almacén no rompe ninguna pantalla |

---

## 8. Qué haremos nosotros cuando llegue lo anterior

Para que se vea que la lista no es de un solo lado. Está pendiente en el portal,
y no depende de ustedes:

- Consumir las rutas ya publicadas que todavía no usamos: el trámite completo de
  radicación (`PATCH /actores/solicitudes/{id}`, `/verificacion`,
  `/organizacion`), las galerías de medios por entidad, prescripciones y notas
  clínicas, `GET /cumplimiento/habilitacion`, los movimientos y
  transformaciones de un lote, `GET /trazabilidad/verificacion` y el puente de
  disponibilidad.
- Pedir en los formularios los campos que el contrato exige y hoy no
  recogemos: `cupoId` al registrar un cultivo, `codigo` al crear un lote y al
  registrar una planta.
- Rehacer el detalle clínico contra lo que el contrato sí manda. Las pantallas
  de hoy muestran diagnóstico, aseguradora y médico tratante, y `PacienteApi` no
  trae ninguno de los tres. **Damos por hecho que la ausencia es deliberada**
  —son datos sensibles y el contrato modela en su lugar las autorizaciones por
  finalidad, que es el control de habeas data—. Confírmenlo y rediseñamos
  alrededor de las autorizaciones. Si no lo es, dígannos qué falta.
- Sustituir los tipos escritos a mano por un cliente generado, en cuanto exista
  el artefacto del punto 6.

---

## Anexo · Lo que respondió el backend local el 29 de agosto de 2026

Medido con `make up`, `make seed` y `ROL=SUPER_ADMIN make token`, llamando desde
el cliente del portal con `VITE_MODO_API=http`. Sirve como punto de partida
común: si algo de esto cambia, la lista de arriba cambia con ello.

**Funciona de punta a punta**, contrato leído y mapeado a la interfaz:

| Zona | Rutas verificadas | Datos sembrados |
|---|---|---|
| Pública | `estadisticas`, `ofertas`, `ofertas/{id}` | 8 ofertas, 2 actores, 2 departamentos |
| Identidad | `iam/sesion`, `iam/cuentas` | 4 cuentas |
| Registro | `organizaciones`, `organizaciones/actual`, `atestaciones`, `actores/solicitudes`, `cumplimiento/expedientes`, `cumplimiento/politica-verificacion`, `directorio` | 7 organizaciones, 5 atestaciones, 7 solicitudes, 2 expedientes |
| Operación | `cupos`, `cultivos`, `lotes` | 3 cupos, 7 cultivos, 9 lotes |
| Mercado | `ofertas`, `manifestaciones`, `vitrina/cierres`, `ruedas-negocio`, `indicadores/nacionales`, `reportes/resumen` | 8 ofertas, 1 manifestación; cierres y ruedas vacíos |
| Evidencia | `trazabilidad/eventos`, `interoperabilidad/conexiones`, `interoperabilidad/discrepancias` | 78 eventos, 4 conexiones, 0 discrepancias |
| Clínica | `pacientes`, `profesionales`, `agenda`, `teleconsultas`, `prescripciones`, `disponibilidad/senales` | Pacientes sintéticos, 1 señal `RETENIDA` con `conteo: 25` |

**No responde**, con el código exacto:

| Llamada | Respuesta |
|---|---|
| `GET /comercial/beneficios` | 405 |
| `GET /comercial/transformaciones` | 405 |
| `GET /comercial/plantas` | 404 |
| `GET /comercial/actas-destruccion` sin `entidad` ni `entidadId` | 422 |

**Dos observaciones menores**, ambas coherentes con el informe de producción:

- El `x-request-id` viene duplicado en la respuesta, como anuncia su §5.3.
- El límite de tasa de la zona pública en local es `ratelimit-limit: 60`, no los
  600 del ejemplo del §5. Solo para que nadie calibre el backoff contra el
  número del documento.


---

## Zona de dispensación, credencial y liquidación — nuevo, 2 de septiembre de 2026

El portal ya tiene las pantallas y las reglas en modo simulado. Para encenderlas contra el backend
hacen falta los servicios que siguen. El detalle del reparto de datos y su justificación normativa
está en [AMB-17](../decisiones/AMB-17-ZONA-DE-DISPENSACION.md).

**La regla que no se puede romper:** el punto de dispensación recibe el seudónimo de la credencial,
nunca el nombre, el documento ni el diagnóstico. Si un endpoint de esta zona devuelve identidad, el
frontend rompe su propia prueba de frontera y no se despliega.

### Zona clínica — nuevos endpoints

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/clinico/credenciales` | Página de credenciales con `seudonimo`, `estado`, `nivelVerificacion`, `vence`, `entregasEnVentana` |
| `GET` | `/clinico/credenciales/{id}` | Credencial, fórmulas del paciente y entregas asociadas |
| `POST` | `/clinico/credenciales` | Emite. Rechaza con `409` si el paciente ya tiene una activa |
| `PATCH` | `/clinico/credenciales/{id}/estado` | Suspende o revoca. Motivo obligatorio de diez caracteres |
| `POST` | `/clinico/credenciales/{id}/rotacion` | Rota el código de presentación |
| `GET` | `/clinico/prescripciones` | Página de fórmulas |
| `POST` | `/clinico/prescripciones` | Emite. Valida los catorce campos del Dec. 2200/2005 Art. 17 |
| `POST` | `/clinico/prescripciones/{id}/anulacion` | Anula. Rechaza `409` si ya fue dispensada por completo |

### Zona de dispensación — nuevos endpoints

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/dispensacion/puntos` | Puntos con licencia y vigencia |
| `POST` | `/dispensacion/verificaciones` | Seudónimo, nivel, vigencia y **proyección** de las fórmulas dispensables, sin identidad |
| `POST` | `/dispensacion/actos` | Registra la entrega, descuenta saldo, sella el evento y devuelve el cargo |
| `GET` | `/dispensacion/actos` | Página de actos registrados |

### Zona comercial — nuevos endpoints

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/liquidacion/cargos` | Página de cargos, filtrable por flujo, periodo y estado |
| `GET` | `/liquidacion/corte` | Totales por flujo, periodos disponibles y **cargos sin evento de origen** |

`cargos sin evento de origen` debe ser siempre cero. Es la métrica que hace auditable el corte: todo
cargo B2B apunta al evento del ledger que lo originó.

### Zona pública — nuevo endpoint

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/publico/credenciales/{codigo}` | Estado de la credencial por su código rotatorio. **Sin nombre y sin documento** |

Este endpoint necesita límite de intentos por IP: es el único de la zona pública que consulta por un
código adivinable. El mensaje de error no debe confirmar si un código existió antes.

### Eventos nuevos en el ledger de trazabilidad

`CREDENCIAL_VERIFICADA` · `DISPENSACION_REGISTRADA` · `RECOMPRA_BLOQUEADA` · `VERIFICACION_FALLIDA`

Los cuatro se sellan contra el seudónimo en `entidadId`. Ninguno lleva identidad en la descripción.

### Errores nuevos del catálogo

```
credencial-ya-activa · credencial-no-encontrada · credencial-no-activa
paciente-sin-credencial · prescripcion-incompleta · prescripcion-ya-dispensada
prescripcion-no-dispensable · prescripcion-vencida · ventana-de-recompra
saldo-insuficiente · punto-sin-licencia-vigente · motivo-insuficiente
```

`prescripcion-incompleta` debe traer `errores[]` con un campo por numeral faltante y `norma` con la
cita del Decreto 2200. Es lo que la pantalla de emisión usa para marcar los catorce numerales.

### Interoperabilidad

Dos conexiones nuevas quedan declaradas en el portal, ambas sin interfaz real todavía:

- **SICAMED central del MinCIT** (`REPORTE`, `NO_CONECTADA`) — el anexo técnico del Art. 13 no ha
  salido. El adaptador vive tras el ACL para que su forma final no toque el dominio (`R-01`).
- **POS de farmacia** (`BIDIRECCIONAL`, `DEGRADADA`) — con los dos modos de adopción: servicio REST
  contra el POS existente, o la pantalla del punto de dispensación para quien no tenga integración.
  Ninguna farmacia queda obligada a cambiar de sistema.

### Analítica

Los cortes territoriales del módulo de reportes pasan por supresión de celdas pequeñas con k = 5
antes de publicarse. **El backend necesita el mismo control en el origen**: si el servicio devuelve
las celdas crudas, la supresión del cliente es cosmética y el Art. 21 sigue incumplido.
