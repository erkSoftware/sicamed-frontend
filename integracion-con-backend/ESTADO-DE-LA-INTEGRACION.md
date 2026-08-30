# Estado de la integración con el backend

Qué quedó conectado contra `README-FRONTEND.md`, dónde vive cada pieza y qué
falta. Escrito contra el código que corre hoy, no contra el que queremos tener.

## Cómo se enciende

```bash
cp .env.example .env
# en .env:
VITE_MODO_API=http
VITE_URL_API=http://localhost:8080
```

Con `VITE_MODO_API=mock` nada de esto se ejecuta: la aplicación sigue hablando
con `src/shared/api/mock/`. El interruptor está en un solo sitio,
`src/shared/api/transporte.ts`, y los hooks de cada feature no se tocaron.

**Los dos interruptores son independientes, y de eso salen tres combinaciones
útiles.** `VITE_MODO_API` decide de dónde salen los datos; `VITE_MODO_AUTH`,
quién autentica:

| `VITE_MODO_API` | `VITE_MODO_AUTH` | Qué se obtiene |
|---|---|---|
| `mock` | `mock` | Todo simulado. No hace falta backend. Es `.env.local-mock` |
| `mock` | `servidor` | **Se entra de verdad y los datos de dentro son simulados.** Es lo que corre hoy en desarrollo |
| `http` | `servidor` | La aplicación completa contra el backend |

La combinación del medio es la que sostiene el trabajo de interfaz: el acceso, los
roles y los permisos son los del servidor —así que el menú de cada persona es el
que tendrá el día del despliegue— y detrás sigue habiendo un simulador que no
depende de que el backend tenga datos.

**El registro de actor sigue a la identidad, no a los datos.** Radicar una
solicitud crea la cuenta con la que después se entra: simularlo mientras el
acceso es real deja una cuenta que el backend no conoce, y el correo de
verificación no llega nunca. Por eso las seis llamadas del asistente público
—`requisitosDeActor`, `prepararSoporte`, `subirSoporte`, `confirmarSoporte`,
`radicarSolicitud` y `verificarCorreo`— miran `modoMockRegistro`, que solo es
cierto cuando *ambos* interruptores están en simulación. Los listados del panel
siguen mirando `modoMock` y no se enteran.

## Dónde vive cada cosa

| Archivo | Qué resuelve |
|---|---|
| `src/shared/api/transporte.ts` | Prefijos por zona, portador, CORS, límites, `problem+json` |
| `src/shared/api/problemDetails.ts` | RFC 7807 con `norma`, `accion` y `errores[]` |
| `src/shared/api/rest/contrato.ts` | Los tipos `*Api` del §9, escritos a mano |
| `src/shared/api/rest/mapeadores.ts` | Contrato → tipos de dominio que ya consumía la interfaz |
| `src/shared/api/rest/peticiones.ts` | Dominio → cuerpos del contrato |
| `src/shared/api/rest/paginacion.ts` | El sobre numerado y los topes de `pagina`/`porPagina` |
| `src/shared/api/rest/medios.ts` | La subida en tres pasos del §6, con sesión |
| `src/shared/api/rest/actores.ts` | La subida en tres pasos del registro, sin sesión |
| `src/shared/ubicacion/divipola.ts` | Los 33 departamentos y los 1.122 municipios con su código |
| `src/shared/api/rest/identidad.ts` | Las cinco llamadas de `/auth`: entrar, refrescar, quién soy, salir, cambiar clave |
| `src/shared/api/rest/sesion.ts` | La sesión del servidor → permisos con los que se pinta el menú |
| `src/shared/auth/proveedorServidor.ts` | Acceso contra `/auth/login`, con renovación serializada entre pestañas |
| `src/shared/auth/permisosDeRol.ts` | Qué ve cada uno de los doce cargos del contrato |
| `src/shared/auth/rechazos.ts` | Enrutado del rechazo por `type`, nunca por `title` ni por `detail` |
| `src/shared/auth/roles.ts` | Quién es administrador y por tanto puede cambiar de perfil |
| `src/app/paginas/CambiarClave.tsx` | La pantalla propia que exige `clave-de-transito` |
| `src/shared/api/rest/catalogo.ts` | Resolución de nombres que el contrato manda como id |
| `src/shared/auth/keycloak.ts` | Reclamaciones y petición de token, compartido por los dos modos de Keycloak |
| `src/shared/auth/proveedorContrasena.ts` | Acceso desde la pantalla del portal, por concesión directa |
| `src/shared/seguridad/turnstile.ts` | Carga de Cloudflare Turnstile y la cabecera del comprobante |
| `src/shared/ui/patrones/ComprobacionSeguridad.tsx` | El widget del captcha en el asistente de registro |

## Lo que el documento advertía y quedó cubierto

- **Las tres zonas cuelgan de `/api/v1/`.** `clinica`, no `clinico`: el prefijo
  de la zona clínica es el del backend, no el nombre interno de la zona.
- **La zona pública va sin portador y sin cookies** (`credentials: "omit"`). La
  autenticada manda `Bearer` y `credentials: "include"`.
- **Un solo manejador de errores.** `ErrorApi` lleva el `ProblemDetail` completo;
  `ErrorNormativo` ya pintaba `title`, `detail`, `norma` y `accion`.
- **El 422 llega por campo.** `erroresPorCampo(problema)` devuelve un objeto
  `{campo: motivo}` listo para anclar debajo de cada control del formulario.
- **El 429 trae su espera.** `ratelimit-reset` se guarda en `reintentarEn`.
- **Dos paginaciones distintas.** La autenticada por número, con `datos`; la
  pública por cursor opaco, con la clave `ofertas` y sin `total`.
- **Los topes del borde se respetan en el cliente**: `porPagina` ≤ 100 y
  `pagina` ≤ 10.000, para no provocar un 422 evitable.
- **La proyección sin contacto del Art. 21.** `OrganizacionApi` declara
  `representante`, `correo` y `telefono` como opcionales, y el mapeador los
  convierte en cadena vacía. Un token de auditor ya no produce `undefined` en la
  vista. `tieneDatosDeContacto()` permite ocultar el bloque en vez de mostrarlo
  vacío.
- **Los decimales llegan como cadena** (`"120.500"`) y se convierten a número en
  el mapeador, no en la vista.
- **`string (date)` no se convierte a hora local.** `soloFecha()` recorta el
  instante antes de enviarlo.
- **La identidad la pone el token.** Ningún cuerpo enviado al backend incluye el
  campo `autor` que el modo de demostración usa para firmar los eventos.
- **La subida de medios respeta el orden del multipart**: los campos de la
  política firmada primero, el archivo en el campo `file` y en último lugar.
- **`sinPersonas` no se rellena solo.** Viaja tal como lo declaró el actor.
- **Los permisos no se codifican en el frontend.** `AuthProvider` consulta
  `GET /iam/sesion` cuando el modo no es mock y sustituye los permisos locales
  por los del servidor. Un permiso que la interfaz no conoce se descarta; nunca
  escala privilegios.

## Traducciones que hubo que hacer

El contrato y el modelo que ya pintaba la interfaz no usan los mismos nombres.
Todas las equivalencias están en un solo sitio y con prueba unitaria:

| Contrato | Vista | Por qué |
|---|---|---|
| `oferta.estado = PAUSADA` | `SUSPENDIDA` | La vista no tiene «pausada» |
| `oferta.estado = DESPUBLICADA` | `RECHAZADA` | Idem |
| `lote.estado = CONGELADO` | `RETENIDO` | La vista no tiene «congelado» |
| `cultivo.estado = PLANIFICADO\|SIEMBRA` | `PREPARACION` | Dos etapas, una sola tarjeta |
| `planta.estado = VIVA` | `VEGETATIVO` | El contrato no distingue etapa |
| `beneficio.estado = CERRADO` | `ACONDICIONADO` | Idem |
| `atestacion.estado = REVOCADA` | `RECHAZADA` | Idem |
| `labor.tipo = FITOSANITARIA` | `FITOSANITARIO` | Nombre distinto del mismo hecho |
| `decision = ACEPTADO` | `APROBADO` | Idem |
| `veredicto = APROBADO` | `VERIFICADO` | Idem |
| Doce roles del backend | Siete de la plataforma | `PRODUCTOR` y `REPRESENTANTE_LEGAL` comparten pantallas; `COMPRADOR`, `AUDITOR`, `AUTORIDAD_COMPETENTE`, `INTEGRACION` y `SERVICIO_INTERNO` sólo observan |

## Lo que falta, y por qué no se inventó

Honestidad por delante: el contrato publicado no cubre todo lo que la interfaz
de demostración muestra hoy.

**Operaciones que no existen en el contrato.** Fallan con un `501` legible
(`sinContrato()`) en vez de pegarle a una ruta inexistente y recibir el `401`
que el documento advierte en su §1:

- cambiar la etapa de un cultivo,
- conciliar todos los cupos de una vez (el contrato concilia uno: `POST /cupos/{id}/conciliacion`),
- el catálogo de variedades y el de agroinsumos,
- las lecturas de ambiente,
- los indicadores clínicos.

**Campos que la vista muestra y el contrato no manda.** El mapeador los deja
vacíos y resuelve por catálogo lo que puede (`Catalogo` traduce id → nombre; sin
catálogo se muestra el id, nunca un nombre inventado):

- `cupo.modalidad`: el contrato no la trae. Por defecto `CULTIVO_NO_PSICOACTIVO`.
- `beneficio.codigo`, `transformacion.codigo`, `acta.acta`: se usa el id.
- `planta.huella`, `labor.huella`, `expediente.analista`, `cierre.contraparte`.
- El detalle de planta no trae madre ni clones: el contrato no expone esa consulta.
- `documentos` de una solicitud: `SolicitudApi` sólo trae el conteo; el detalle
  está en `SolicitudDetalleApi.documentosDeclarados`, que aún no se consume.

**Campos que el formulario todavía no pide y el contrato exige.** Producen un
422 con `errores[]`, que la interfaz sí sabe pintar, pero el trámite no se puede
completar hasta que el formulario los recoja:

- `cupoId` al registrar un cultivo,
- `codigo` al crear un lote y al registrar una planta.

**«Semilla certificada» no tiene equivalente** en el enum `tipoProducto` del
contrato. `aTipoProducto()` rechaza con un 422 anclado al campo del formulario
en vez de publicar la oferta bajo un tipo que no es.

**La zona clínica queda a medias, a propósito.** El contrato modela paciente,
autorizaciones por finalidad, prescripciones y notas; las pantallas actuales
muestran diagnóstico, aseguradora y médico tratante, que el contrato no expone.
Lo que sí manda el contrato —y la interfaz aún no muestra— son las
autorizaciones vigentes por finalidad, que es el control que exige el habeas
data. Rehacer esas pantallas contra el contrato es trabajo aparte.

**El asistente de voz no está construido.** El §3 del documento nuevo describe
una sesión efímera contra `POST /asistente/sesiones` y una conexión WebRTC
directa del navegador a OpenAI. Aurora, hoy, es una guía en 3D sin voz y sin
backend: no hay micrófono que conectar. Lo único que se adelantó es el permiso
`asistente:sesion:abrir` en la tabla de cargos —con los siete roles que el
documento nombra, ni uno más— para que el día que exista el botón, la puerta ya
esté puesta.

**El cliente no está generado.** El §4 de `CONTRIBUTING.md` pide un cliente
generado desde `contratos/`, y `contracts/` sólo tiene el `versiones.json` con
las versiones fijadas: los OpenAPI no están en el repositorio. `rest/contrato.ts`
transcribe a mano las tablas del §9 de `README-FRONTEND.md`. Cuando lleguen los
`*.json`, ese archivo se sustituye por la salida del generador y los mapeadores
siguen valiendo tal cual.

## Pruebas

```bash
npm run test
```

314 pruebas en verde. Las que cubren este trabajo:

| Archivo | Qué cubre |
|---|---|
| `transporte.test.ts` | Prefijos, portador por zona, cabeceras, 422, 429, 204, fallo de red |
| `problemDetails.test.ts` | Errores por campo, 401 contra 404 sin organización, espera del 429 |
| `rest/paginacion.test.ts` | Topes del borde y el sobre numerado sin `total` |
| `rest/mapeadores.test.ts` | Contrato → dominio, con la proyección del Art. 21 y los decimales |
| `rest/peticiones.test.ts` | Dominio → contrato, sin `autor` y con fechas de calendario |
| `rest/medios.test.ts` | Los tres pasos y el orden del multipart |
| `rest/sesion.test.ts` | Permisos del servidor y roles que no escalan privilegios |
| `clientes.http.test.ts` | Las rutas reales de las tres zonas, con `VITE_MODO_API=http` |
| `registroHibrido.test.ts` | Que con `mock` + `servidor` la radicación sale a la red y los listados del panel no |
| `cabecerasCors.test.ts` | Que ninguna zona manda una cabecera fuera de la lista blanca del borde |
| `clientesConsulta.test.ts` | Qué se reintenta, qué no, y la espera declarada por el borde |
| `AsistenteRegistro.test.ts` | El 422 anclado en su campo, el paso al que devuelve y las validaciones que evitan un 422 previsible |
| `ubicacion/divipola.test.ts` | Los conteos del DANE por departamento, sin códigos repetidos |
| `rest/actores.test.ts` | El orden del multipart, los límites que declara la preparación y el rechazo del almacenamiento |
| `auth/keycloak.test.ts` | La credencial equivocada distinguida de la cuenta que aún no está habilitada |
| `seguridad/turnstile.test.ts` | Carga única del guion, fallo de descarga y cuándo se exige la comprobación |
| `i18n/formato.test.ts` | Una fecha ausente se formatea vacía en vez de tumbar la pantalla |
| `auth/proveedorContrasena.test.ts` | La concesión directa, el rechazo del emisor y que la renovación no toque el navegador |
| `rest/identidad.test.ts` | Que `/auth` no cuelgue de `/api/v1`, la cookie del refresco y que el login no acepte rol en el cuerpo |
| `auth/rechazos.test.ts` | Los tres 403 separados, el respaldo por estado y la caída del emisor que no se le achaca al usuario |
| `auth/permisosDeRol.test.ts` | Los doce cargos, la separación de funciones y el vocabulario que no se reconoce |
| `auth/proveedorServidor.test.ts` | El rol que decide el servidor, `expiraEn` en segundos y el margen de renovación |
| `mock/almacen.test.ts` | Que la cuenta propia arranque vacía, no reviente y no se mezcle con la demostración |
| `paginas/Acceso.test.tsx` | La contraseña de tránsito que lleva a cambiarla y el registro en revisión que no |
| `providers/AuthProvider.test.tsx` | Que solo un administrador adopte un perfil, y que soltarlo devuelva la cuenta real |

## El registro de actores, contra el contrato publicado

El trámite que radica un desconocido ya no es un `POST` suelto: son cuatro llamadas
más una subida directa al almacenamiento, y el asistente las hace en ese orden.

| Paso | Llamada | Dónde |
|---|---|---|
| 00 | `GET /actores/requisitos/{tipoActor}` | `useRequisitos`, en `publico/registro/requisitos.ts` |
| 01 | `POST /actores/soportes:preparar` | `apiComercial.prepararSoporte` |
| 02 | `POST <url firmada>` | `apiComercial.subirSoporte` → `rest/actores.ts` |
| 03 | `POST /actores/soportes/{id}:confirmar` | `apiComercial.confirmarSoporte` |
| 04 | `POST /actores/solicitudes` | `apiComercial.radicarSolicitud` |
| 05 | `POST /actores/solicitudes/{id}/verificacion` | `/registro/verificacion`, en `VerificacionCorreo.tsx` |

Lo que cambió respecto a lo que había, y por qué importa:

- **La lista de documentos ya no la lleva la pantalla escrita a mano.** La pintaba
  `POLITICA_VERIFICACION`, que para Cultivador pedía «plano georreferenciado»,
  «BPA» y «cupo FNE» —tres documentos que el servidor no conoce— y se saltaba los
  tres comunes. Ahora la pinta el endpoint, y el mock sirve la misma forma para que
  los dos modos no se separen.
- **`documentos` viaja con `tipo` y `soporteId`, nada más.** Mandaba `nombre` y
  `peso`, que el modelo rechaza como campos de más: la radicación devolvía 422 sin
  que ningún campo del formulario estuviera mal.
- **`departamento` y `municipio` son códigos DIVIPOLA**, de dos y cinco dígitos.
  Iban como nombres. El municipio se elige de una lista acotada al departamento, y
  el asistente comprueba la pertenencia antes de enviar.
- **El formulario pide la contraseña.** Es la que va a funcionar el día que aprueben
  el expediente; no hay correo de «establece tu clave». Se valida el mínimo de doce
  caracteres en el cliente para no gastar una radicación —tres por hora por IP— en
  un `credencial-rechazada`.
- **Cada archivo se sube al elegirlo**, no al radicar, y hasta que el soporte no
  responde `DISPONIBLE` no cuenta como cargado.
- **`Idempotency-Key` en cada radicación**, para que un reintento del navegador no
  abra dos expedientes.

### El comprobante de humanidad es de un solo uso

Las cuatro escrituras sin sesión llevan `CF-Turnstile-Response`, y un token de
Turnstile no se puede reutilizar: subir tres documentos son seis escrituras, seis
comprobantes. `shared/seguridad/useComprobante.ts` mantiene uno vigente, lo
entrega, remonta el widget para pedir otro, y encola a quien llegue mientras no
haya. Si el widget no responde en 45 segundos, la subida falla con un mensaje en
vez de quedarse girando.

El borde ya deja pasar la cabecera —las seis precomprobaciones responden `200`
desde `http://localhost:5173`—, así que `VITE_TURNSTILE_CLAVE_SITIO` está puesta
y el captcha se exige tanto en el registro como en el acceso. Lo que queda
abierto es el panel de Cloudflare: la clave de sitio solo tiene registrados los
dominios de producción, y en `localhost` el widget puede responder `110200`
—dominio desconocido— sin dibujarse. Vaciar la variable vuelve a desactivar la
exigencia entera, que es la salida si hace falta recorrer el trámite sin red.

### La sesión no sobrevivía a una recarga

El refresco viaja en una cookie `HttpOnly` con `SameSite=strict`, y eso quiere
decir que el navegador solo la manda **dentro del mismo sitio**. En producción
sale bien: `sicamed.com.co` y `api.sicamed.com.co` comparten dominio registrable.
En desarrollo no, porque `localhost:5173` es otro sitio. Se entraba, y a la
primera recarga `POST /auth/refresh` respondía `401` sin cookie y el portal
volvía al login. No era un fallo del portal ni de la cookie: era la distancia
entre los dos sitios.

Se resuelve sin tocar el backend ni relajar la cookie. El servidor de desarrollo
reenvía `/auth` y `/api` a la API —`VITE_URL_API_ORIGEN` en `vite.config.ts`— y
`VITE_URL_API` queda vacía, con lo que `baseDeZona` devuelve rutas relativas. El
navegador ve la API en su propio origen, la cookie es de primera parte y el
`SameSite=strict` se cumple. De paso desaparece el CORS entero en desarrollo, que
es donde más estorba.

La alternativa —pedir `SameSite=None`— sería peor: convierte el refresco en
cookie de terceros y Safari y Firefox la bloquean igual.

### La cabecera que no era del captcha

La lista de `Access-Control-Allow-Headers` es cerrada, y `Cache-Control` no está
en ella. El transporte la mandaba en las zonas clínica y de identidad, así que
**la precomprobación del login moría con `400 Disallowed CORS headers`** y el
`POST` no llegaba a salir. El navegador lo llama «error de CORS» sin nombrar la
cabecera culpable. Ahora el no-store se pide por la opción `cache` de `fetch`,
que no viaja como cabecera de petición y consigue lo mismo.

### De dónde salen los municipios

El contrato exige el código DIVIPOLA y no hay endpoint que lo publique, así que el
catálogo vive en el repositorio: `src/shared/ubicacion/divipola.ts`, 33
departamentos y 1.122 municipios. La prueba fija el conteo oficial de cada
departamento, comprueba que ningún código se repite y que todos empiezan por el de
su departamento. Es lo que se puede verificar sin el dato del DANE al lado; un
nombre mal escrito en un municipio pequeño no lo detecta la prueba, lo detecta el
422 del servidor.

## Cómo apuntar a producción

Es lo que trae el `.env` del repositorio hoy:

```env
VITE_MODO_API=http
VITE_URL_API=https://api.sicamed.com.co

VITE_MODO_AUTH=servidor
VITE_OIDC_AUTORIDAD=https://auth.sicamed.com.co/realms/sicamed
VITE_OIDC_CLIENTE=sicamed-frontend

VITE_TURNSTILE_CLAVE_SITIO=0x4AAAAAAEhkrb1nAez7dCTA

VITE_URL_PUBLICA=https://sicamed.com.co
```

Medido el 30 de agosto de 2026 contra el ambiente real:

| | Estado |
|---|---|
| Zona pública | Responde `200`. Sin datos todavía: todos los contadores en cero |
| CORS desde `http://localhost:5173` | Permitido, con `allow-credentials: true` y origen explícito |
| Keycloak | El realm responde y admite concesión directa: el portal autentica desde su propia pantalla |
| Radicación | Exige captcha, y la cabecera que lo lleva no pasa el CORS. Ver §1.3 de [PENDIENTES-BACKEND.md](PENDIENTES-BACKEND.md) |

Las pruebas ya no dependen de este archivo: `vitest.config.ts` fija
`VITE_MODO_API=mock` para que `npm run test` dé lo mismo con cualquier `.env`.
Antes de eso, apuntar el `.env` a producción cambiaba el resultado de la suite,
que es justo lo que una suite no debe hacer.

## La sesión la sirve SICAMED, no el emisor

`README-FRONTEND-INTEGRACION.md` mueve el acceso a `/auth`, servido por el propio
backend, y ahí es donde apunta ahora `VITE_MODO_AUTH=servidor`. Los modos de
Keycloak (`oidc`, `contrasena`) siguen en el árbol y funcionan: cambiar la
variable los devuelve. Lo que cambió es cuál es el camino por defecto.

| Llamada | Quién la usa |
|---|---|
| `POST /auth/login` | `Acceso.tsx` al enviar el formulario |
| `POST /auth/refresh` | Al arrancar la aplicación y un minuto antes de que caduque el token |
| `GET /auth/yo` | `conPermisosDelServidor`, justo después de entrar y de cada renovación |
| `POST /auth/logout` | El botón de salir |
| `POST /auth/cambiar-clave` | `/acceso/clave`, sin sesión |

Cuatro detalles del contrato que condicionan el código y no se ven en la pantalla:

- **El token de acceso vive en una variable del módulo.** Ni `localStorage` ni
  `sessionStorage`: ahí lo lee cualquier guion inyectado. Se pierde al recargar y
  se recupera con el refresco, que es justo lo que se quiere.
- **El refresco anterior deja de valer en el acto.** Dos pestañas renovando a la
  vez dan cierres de sesión aleatorios, así que la renovación se serializa con la
  API de bloqueos web (`navigator.locks`), que es de origen y no de pestaña.
  Donde no exista, se degrada a un cerrojo dentro de la pestaña.
- **Se renueva a los ~60 segundos de margen**, no cuando llega un 401 a media
  operación. Antes la sesión simplemente se cerraba al vencer.
- **`credentials: "include"` en toda la zona.** La cookie del refresco es
  `Path=/auth` y `HttpOnly`; sin eso el refresco responde `401 sesion-invalida`
  sin explicar por qué.

### El rechazo se lee por `type`

`title` y `detail` están redactados para enseñarse y pueden cambiar de redacción
sin aviso; `type` es el contrato. `claseDeRechazo()` separa los tres 403 —que no
son el mismo caso— y la pantalla pinta el `detail` que mandó el servidor.

El que más importa es `clave-de-transito`. Cuando un administrador da de alta una
cuenta y le asigna contraseña, esa contraseña **no abre sesión**: lo único que se
puede hacer con ella es sustituirla. Tratarlo como «credenciales incorrectas»
deja a esa persona fuera para siempre, así que ahora lleva a `/acceso/clave`, que
es una pantalla propia y no un diálogo. El cambio responde 204 y **no** devuelve
token: entrar es un acto aparte.

## Quién puede cambiar de perfil, y por qué el panel arranca vacío

El acceso es real; los datos de dentro siguen siendo los del simulador. Eso deja
una pregunta que el contrato no responde: qué ve una cuenta real, que no tiene
ninguna de las organizaciones sembradas.

La respuesta es: nada, y a propósito. `src/shared/api/mock/almacen.ts` mantiene
dos almacenes tras el mismo objeto —el sembrado y el de la cuenta propia, vacío—
y `fijarAlmacenPropio()` decide cuál está activo. Ninguna de las 2.400 líneas del
simulador se enteró: el intercambio ocurre en un `Proxy`, en un solo sitio. Lo
que la cuenta propia escribe se queda en su almacén y no contamina la
demostración.

Sobre eso van las dos reglas que se pidieron:

- **Quien administra —`SUPER_ADMIN` o `ADMIN_INSTITUCIONAL`— puede adoptar un
  perfil desde dentro.** El selector de la barra deja de ser cosa del modo
  demostración. Adoptar no toca la sesión ni el token: cambia el rol con el que
  se pinta el panel y enciende el almacén sembrado, con una cinta permanente que
  recuerda que lo que se está viendo no es la cuenta propia. `adoptarPerfil()`
  comprueba el rol antes de hacer nada, así que llamarla desde otro sitio no
  sirve de atajo.
- **A los demás se les pinta solo lo suyo.** La navegación ya se filtraba por
  permiso; lo que faltaba era de dónde salen los permisos cuando la sesión es
  real. Salen de `GET /auth/yo`, y `permisosDeRol.ts` cubre el hueco: si el
  servidor manda un vocabulario que el panel no reconoce, se cae a la tabla del
  cargo en vez de quedarse sin menú. Si el servidor no concede **nada**, eso se
  respeta tal cual: una lista vacía es una decisión, no un fallo de traducción.

Una cuenta sin organización asociada ya no cae en una pantalla en blanco: el
simulador devuelve `404 organizacion-no-asociada` —el mismo problema que sirve el
backend— y «Mi organización» lo pinta como estado vacío explicando que el
expediente sigue en trámite.

## El acceso ocurre en nuestra pantalla, no en la de Keycloak

Con `VITE_MODO_AUTH=oidc` el navegador se va a la pantalla de Keycloak, que no es
la nuestra. El modo `contrasena` mantiene la pantalla de `/acceso` tal como está
—el mismo formulario de correo y contraseña— y la hace autenticar de verdad
contra el emisor real.

| Pieza | Dónde |
|---|---|
| Mapeo de reclamaciones y petición de token, compartido por los dos modos | `src/shared/auth/keycloak.ts` |
| Concesión directa contra Keycloak | `src/shared/auth/proveedorContrasena.ts` |
| Selección del modo | `src/shared/auth/proveedor.ts`, con `pideCredenciales` |
| Pantalla | `Acceso.tsx`, sin cambios visuales: el formulario que ya existía ahora envía credenciales reales |

Los rechazos del emisor ya no llegan todos como «Autenticación rechazada».
`mensajeDeRechazo()` separa la credencial equivocada de la cuenta que todavía no
está habilitada —que es exactamente el caso de quien acaba de radicar y prueba a
entrar—, del bloqueo por intentos, del cliente mal configurado y del límite de
tasa. La diferencia no es cosmética: al usuario recién registrado el mensaje
genérico le dice que se equivocó de contraseña cuando lo que pasa es que su
expediente sigue en cola.

Comprobado el 30 de agosto contra `auth.sicamed.com.co`: el cliente
`sicamed-frontend` admite `grant_type=password` (responde `invalid_grant` con
credenciales falsas, no `unauthorized_client`), y el `OPTIONS` del token endpoint
devuelve `access-control-allow-origin: http://localhost:5173`, así que el
formulario puede llamarlo desde el navegador.

Lo que hay que saber de este modo, dicho sin adornos: en la concesión directa el
portal ve la contraseña del usuario, cosa que en el flujo con redirección no
ocurre, y OAuth 2.1 la desaconseja por eso. A cambio, el acceso pasa por nuestra
interfaz. Es una decisión de producto legítima y quedó tomada; lo que no debe
perderse es que el token sigue viviendo solo en memoria, que la renovación nunca
toca `localStorage` ni `sessionStorage`, y que el cliente sigue sin secreto.
Cuando quieran volver al flujo con redirección, es cambiar una variable a `oidc`:
el proveedor sigue ahí y comparte el mismo mapeo.

## La comprobación de humanidad

Radicar una solicitud es la única escritura que un desconocido puede invocar, y
el backend la protege con Cloudflare Turnstile. El portal:

| Pieza | Dónde |
|---|---|
| Carga del guion, en modo explícito y una sola vez | `src/shared/seguridad/turnstile.ts` |
| Widget, con su estado de fallo | `src/shared/ui/patrones/ComprobacionSeguridad.tsx` |
| Puerta del trámite | `AsistenteRegistro`: el botón de radicar no se habilita sin comprobante |
| Envío | `apiComercial.radicarSolicitud` lo manda en `CF-Turnstile-Response`, nunca en el cuerpo |
| Renovación | El comprobante es de un solo uso: tras cada rechazo el widget se remonta y se pide otro |

Sin `VITE_TURNSTILE_CLAVE_SITIO` no se exige nada y el trámite se puede ejercer
sin red, que es lo que hace falta en las pruebas. La clave de sitio es
pública; el secreto vive en el backend y nunca llega al navegador.

## Un fallo que apareció al apuntar a producción

Producción manda `"actualizacion": null` en las estadísticas públicas. El
mapeador lo convierte en `""`, y `fecha("")` construía un `Intl.DateTimeFormat`
sobre una fecha inválida: `RangeError: Invalid time value`. No era una celda
vacía, era la **portada pública entera caída**, y con datos reales hubiera
pasado en el primer despliegue.

`src/shared/i18n/formato.ts` ahora devuelve cadena vacía en vez de reventar, en
las cuatro funciones de fecha y en los 51 sitios que las llaman, y
`RazonesVitrina` oculta la línea cuando no hay fecha en vez de escribir un
rótulo suelto.

## Cómo hablar con el backend local hoy

```bash
cd ../sicamed-backend && make up && make seed
ROL=SUPER_ADMIN make token
```

Y en el `.env` del portal:

```env
VITE_MODO_API=http
VITE_URL_API=http://localhost:8080
VITE_TOKEN_DESARROLLO=<el token que imprimió make token>
```

`VITE_MODO_AUTH` sigue en `mock`: se elige el perfil en `/acceso` como siempre,
pero la credencial que sale hacia el backend es el token de desarrollo. Los
permisos del menú dejan de venir del perfil elegido y pasan a venir de
`GET /iam/sesion`, que es lo que pide el §2 de la guía. Sin
`VITE_TOKEN_DESARROLLO`, la zona pública funciona y todo lo autenticado responde
`401`.

El token de `make token` vence a las ocho horas. Cuando el portal empiece a dar
`401`, es eso.

## Lo que exige producción

`README-FRONTEND-PRODUCCION.md` añadió requisitos que no estaban en la guía de
desarrollo. Lo que tocaba al portal ya está puesto:

| Requisito | Dónde quedó |
|---|---|
| `X-Request-Id` visible en la pantalla de error | `transporte.ts` lo lee de la cabecera; `ErrorNormativo` lo muestra seleccionable |
| Backoff, sin bucle de reintento | `clientesConsulta.ts`: nunca reintenta `401`, `403`, `422` ni `429`; retardo exponencial topado en 30 s y respeto de `ratelimit-reset` |
| Cliente OIDC público sin secreto | `VITE_OIDC_CLIENTE` pasa a `sicamed-frontend`. Con `oidc` va con PKCE `S256`; con `contrasena` va por concesión directa, también sin secreto |
| No quemar el límite de 10 por minuto de `/iam/` | `proveedorOidc` ya no pide un `refresh_token` que nunca tuvo: si no hay renovación en memoria, no llama al emisor |
| Objetos incrustados en `<iframe>` | No hay ninguno en el portal. El endurecimiento de la CSP del almacén no rompe ninguna pantalla |

Lo que no depende de nosotros está en
[PENDIENTES-BACKEND.md](PENDIENTES-BACKEND.md).
