# SICAMED · Lo que el backend debe implementar para que AURORA actúe

Para el equipo de backend. Escrito contra el cliente que ya está en el
repositorio del portal, no contra una idea de cómo debería ser.

---

## Contexto: qué existe ya y qué no

AURORA es el asistente de voz del panel. El armazón está terminado del lado del
portal y en producción: `POST /asistente/sesiones`, la conexión WebRTC directa
del navegador al proveedor, el canal de datos, el tope de llamada con aviso
hablado, el cierre con motivo por `sendBeacon`, la configuración por entidad y
los bloqueos por persona. Todo eso funciona y no hay que tocarlo.

Lo que AURORA **no puede hacer hoy** es actuar sobre el sistema. El motor
clasifica las herramientas en tres clases —`ui`, `consulta`, `negocio`— y solo
resuelve las de clase `ui`, que son las que ejecuta la pantalla. Las otras dos
mueren en una sola línea de `src/shared/ui/aurora/voz/motor.ts`:

```
{ ok: false, motivo: "esa herramienta se ejecuta en el servidor y aún no tiene ruta publicada" }
```

No hay ruta publicada porque no existe. Eso es lo que hay que construir.

**El resultado neto de hoy:** AURORA conversa sobre el sistema y navega por él.
No consulta ni escribe nada. Para dimensionar el hueco: 29 rutas en el menú, 54
llamadas en el cliente comercial, 33 de ellas escrituras.

---

## Lo que NO hay que hacer

Antes de la lista, tres fronteras. Están decididas y no se negocian sin
conversación previa, porque moverlas rompe cosas que hoy funcionan.

**`navigate_to` se queda en el navegador.** Llega como herramienta de clase `ui`
con un solo argumento, `destino`, que trae lo que la persona dijo sin traducir
—«cumplimiento», «el cultivo», «llévame a la vitrina»—. Quien lo convierte en
ruta es `shared/ui/aurora/destinos.ts`, contra el menú real recortado por los
permisos de quien habla. El backend no tiene el menú y no puede tenerlo sin
copiarlo, y una copia se desincroniza. No publiquen una herramienta de
navegación de clase `consulta` o `negocio`.

**No cambien la forma de `SesionAsistente`, solo agréguenle campos.** El portal
lee `id`, `clientSecret`, `expiraEn`, `modelo`, `urlWebrtc`, `herramientas[]`,
`llamadaId`, `duracionMaximaSegundos`, `avisoEnSegundos`, `mensajeAviso`,
`restanteDiarioSegundos` y `demostracion`. Todo lo nuevo es aditivo.

**La zona clínica no se toca en esta entrega.** El habeas data exige que cada
consulta clínica declare su finalidad —para eso existe `X-Motivo-Consulta` en la
lista blanca de CORS—. Un modelo de lenguaje no puede declarar una finalidad
legítima por su cuenta. Si más adelante AURORA entra a `/api/v1/clinica`, será
con un diseño aparte. Por ahora: cero herramientas clínicas en el catálogo.

---

## Fase 1 · El catálogo con esquema y la ejecución de consultas

Es la fase que desbloquea la mitad del valor y no toca ninguna escritura. Si solo
hacen una fase, hagan esta.

### 1.1 `herramientas[]` necesita el esquema de sus parámetros

Hoy cada entrada de `herramientas[]` en la respuesta de `POST /asistente/sesiones`
trae cuatro campos:

```json
{
  "nombre": "navigate_to",
  "clase": "ui",
  "descripcion": "Lleva a la persona a otra pantalla del panel",
  "confirmacionPrevia": false
}
```

Falta el esquema de los argumentos. Sin él, el navegador recibe del modelo un
JSON arbitrario y lo único que puede hacer es `JSON.parse` y confiar. Para
navegar da igual; para escribir un acta de transformación, no.

Agreguen `parametros` con un subconjunto de JSON Schema —`type: "object"`,
`properties`, `required`, y por propiedad `type`, `enum`, `format`, `minimum`,
`maximum`, `maxLength`, `description`—:

```json
{
  "nombre": "consultar_lotes_por_vencer",
  "clase": "consulta",
  "descripcion": "Lista los lotes de producto terminado que vencen en una ventana de días",
  "confirmacionPrevia": false,
  "parametros": {
    "type": "object",
    "properties": {
      "dias": { "type": "integer", "minimum": 1, "maximum": 365, "description": "Ventana hacia adelante" },
      "establecimientoId": { "type": "string", "format": "uuid" }
    },
    "required": ["dias"]
  }
}
```

Es el mismo esquema que ustedes le pasan al proveedor al abrir la sesión. Mándenlo
también al navegador: así el portal valida antes de salir a la red y el modelo no
puede provocar un `422` que se podía evitar.

**El catálogo se recorta por rol en el servidor.** El permiso
`asistente:sesion:abrir` lo tienen siete roles —`SUPER_ADMIN`,
`ADMIN_INSTITUCIONAL`, `ANALISTA_CUMPLIMIENTO`, `REPRESENTANTE_LEGAL`,
`PRODUCTOR`, `COMPRADOR`, `OPERADOR`—, pero abrir el micrófono no es lo mismo que
poder hacer cualquier cosa con él. Un `COMPRADOR` no debe ver en su catálogo una
herramienta de cultivo. Recórtenlo contra los permisos reales de la persona, no
contra la lista de quien puede hablar.

### 1.2 La ruta de ejecución

```
POST /api/v1/comercial/asistente/herramientas/{nombre}
```

Zona comercial, autenticada con el `Bearer` de la sesión del usuario. **No** con
la credencial del asistente: la herramienta actúa como la persona, no como el
sistema, y todo lo que haga debe quedar atribuido a ella.

Cuerpo:

```json
{
  "llamadaId": "cll_01H...",
  "callId": "call_abc123",
  "argumentos": { "dias": 30 }
}
```

`llamadaId` es el que ustedes mismos devolvieron al abrir la sesión; `callId` es
el identificador que el proveedor le da a esa invocación de función concreta. Los
dos van para que la auditoría del §2.3 pueda encadenar la frase hablada con el
efecto que produjo.

Respuesta `200`:

```json
{
  "ok": true,
  "resumen": "Cuatro lotes vencen en los próximos 30 días. El más cercano, LT-2291, el 14 de septiembre.",
  "datos": { "total": 4, "lotes": [] }
}
```

**`resumen` no es decorativo y no es opcional.** El portal se lo devuelve al
modelo por el canal de datos y el modelo lo lee en voz alta. Si mandan solo
`datos`, el modelo improvisa la redacción a partir del JSON crudo y dirá números
que no están o se los inventará. Redáctenlo ustedes, en español, en una o dos
frases, con las cifras ya resueltas. Es la parte de esta entrega que más se nota
en la calidad percibida y la que más fácil se descuida.

`datos` es opcional y sirve para que la pantalla pueda pintar el resultado además
de decirlo.

### 1.3 Los fallos, en `problem+json` como todo lo demás

El portal ya tiene el lector de `ProblemDetail` con `type`, `title`, `detail`,
`status`, `errores[]`, `reintentarEn` y `solicitudId`. Úsenlo. Tipos nuevos que
hacen falta, bajo `https://sicamed.co/problemas/`:

| `type` | `status` | Cuándo |
| --- | --- | --- |
| `asistente-herramienta-desconocida` | 404 | El modelo inventó un nombre que no está en el catálogo |
| `asistente-herramienta-no-permitida` | 403 | Existe, pero no para el rol de quien habla |
| `asistente-argumentos-invalidos` | 422 | No cumple el esquema. **Con `errores[]` campo a campo** |
| `asistente-confirmacion-requerida` | 428 | Escritura sin token de confirmación (§2.1) |
| `asistente-confirmacion-invalida` | 409 | Token vencido, ya usado, o de otra operación |
| `asistente-herramienta-agotada` | 429 | Tope por herramienta consumido (§2.4). Con `reintentarEn` |

Los `errores[]` del `422` importan más de lo normal aquí: el portal se los
devuelve al modelo, y un modelo que recibe «el campo `dias` debe ser un entero
entre 1 y 365» corrige y reintenta solo. Uno que recibe «argumentos inválidos» se
queda atascado repitiendo lo mismo.

### 1.4 Las primeras herramientas de consulta

Empiecen por tres, no por treinta. Las que la gente pregunta en voz alta y hoy
obligan a navegar y leer la pantalla:

- Lotes por vencer en una ventana de días.
- Estado del cupo de plantas de la organización: asignado, ocupado, disponible.
- Documentación pendiente del expediente: qué falta y desde cuándo.

Con esas tres, el ciclo completo queda probado de punta a punta y las siguientes
son repetición.

---

## Fase 2 · La escritura

Esta fase va entera o no va. Media escritura segura es escritura insegura, y las
cuatro piezas que siguen se sostienen unas a otras.

### 2.1 Confirmación con token de un solo uso

Hoy `confirmacionPrevia` es una bandera booleana que el navegador respeta
enseñando un `window.confirm`. Eso protege contra un malentendido, no contra
nada más: quien salte la interfaz escribe igual, y el servidor no se entera.

Hacen falta dos pasos.

```
POST /api/v1/comercial/asistente/herramientas/{nombre}/confirmacion
```

Recibe los mismos `argumentos` y devuelve la previsualización más el token:

```json
{
  "tokenConfirmacion": "cnf_01H...",
  "expiraEn": "2026-09-02T15:04:05Z",
  "previsualizacion": {
    "titulo": "Registrar lote de producto terminado",
    "entidad": "Lote LT-2291",
    "cambios": [
      { "campo": "Cantidad", "antes": "—", "despues": "12,5 kg" },
      { "campo": "Establecimiento", "antes": "—", "despues": "Planta Norte" }
    ],
    "advertencias": ["El acta de transformación queda pendiente de firma"]
  }
}
```

El portal pinta eso como una hoja del panel —qué entidad se toca, con qué valores,
qué queda pendiente— y solo si la persona acepta manda la ejecución con el token
en el cuerpo. Un token: una operación, un uso, y vencimiento corto —dos minutos
bastan—.

La previsualización la arma el servidor porque es el único que sabe cuál es el
estado «antes». El navegador no puede componer un diff honesto de algo que no
tiene.

**Ninguna escritura se ejecuta sin token.** Si llega sin él, `428`. No lo dejen
como cortesía que el cliente puede omitir.

### 2.2 Idempotencia

Cada ejecución lleva `Idempotency-Key`. La cabecera **ya está en la lista blanca
de CORS**, así que no hay nada que abrir; el portal la manda y ustedes la
respetan.

No es una precaución teórica. Un modelo que no entiende la respuesta reintenta la
llamada de función: es su comportamiento normal, no un fallo. Sin idempotencia,
«registra el lote» dicho una vez crea dos lotes.

La clave la genera el navegador y es estable por invocación —misma `callId`,
misma clave, aunque se reintente—. Guarden el resultado y devuélvanlo igual ante
una repetición, con el mismo `status`.

### 2.3 Auditoría por llamada de función

Hoy solo se registra el cierre de la llamada de voz completa, con
`POST /asistente/llamadas/{id}/cierre` y su motivo. Eso dice que alguien habló
cinco minutos. No dice qué hizo.

Cada invocación de herramienta debe quedar en trazabilidad, con la misma
inmutabilidad que el resto del ledger: actor, organización, `llamadaId`, `callId`,
nombre de la herramienta, argumentos, token de confirmación si lo hubo, resultado
y sello de tiempo.

El criterio es simple: **si una escritura hecha por voz no se puede reconstruir
después, no se puede permitir**. Un auditor que pregunte por qué se creó ese lote
tiene que poder llegar hasta la frase que lo originó.

### 2.4 Topes por herramienta

Los límites de hoy son de tiempo: `duracionMaximaSegundos`, `limiteDiarioSegundos`,
`intentosMaximos`, `ventanaIntentosHoras`, `bloqueoAutomaticoDias`. Todos miden
cuánto se habla.

Para escritura hace falta medir cuánto se hace. Agreguen a la configuración del
asistente un tope por herramienta y por ventana —«máximo 5 lotes por hora por
persona»— y devuelvan `asistente-herramienta-agotada` con `reintentarEn` cuando
se consuma. La pantalla `/app/aurora/configuracion` ya sabe pintar límites
numéricos con rango; sumar una sección más es trabajo nuestro y es menor.

---

## Fase 3 · Que AURORA empiece sabiendo

Detalle pequeño, efecto grande.

Hoy `POST /asistente/sesiones` recibe `contexto` con `{ ruta }` y devuelve una
sesión que no sabe nada de la organización. Cada conversación empieza a ciegas y
la persona tiene que contarle a AURORA cosas que el sistema ya sabe.

Agreguen a la respuesta un `resumenEntidad`: texto plano, corto, que ustedes
inyectan también en el prompt del sistema. Cupo vigente, licencias por vencer,
trámites en curso, alertas abiertas. Cuatro o cinco frases.

Así, en vez de «¿cuál es tu organización?», AURORA abre con «tienes una licencia
que vence en once días». Que es, por cierto, exactamente la frase que la acción
`alerta` del personaje ya tiene escrita como ejemplo, y que hoy no puede decir
porque no tiene de dónde sacarla.

---

## Resumen operativo

| # | Qué | Fase | Bloquea a |
| --- | --- | --- | --- |
| 1 | `parametros` (JSON Schema) en cada entrada de `herramientas[]` | 1 | Todo |
| 2 | Catálogo recortado por permisos reales, no por `asistente:sesion:abrir` | 1 | Todo |
| 3 | `POST /asistente/herramientas/{nombre}` con `resumen` redactado | 1 | Todo |
| 4 | Los seis `problem+json` nuevos, con `errores[]` en el 422 | 1 | Todo |
| 5 | Tres herramientas de consulta | 1 | — |
| 6 | `POST .../{nombre}/confirmacion` con previsualización y token | 2 | Escritura |
| 7 | `Idempotency-Key` respetada (la cabecera ya pasa CORS) | 2 | Escritura |
| 8 | Cada `tool call` en trazabilidad | 2 | Escritura |
| 9 | Topes por herramienta en la configuración | 2 | Escritura |
| 10 | `resumenEntidad` en la respuesta de sesión | 3 | — |

**Lo que hacemos nosotros en paralelo, y no depende de ustedes:** el despachador
que llama a la ruta del §1.2, la validación de argumentos contra el esquema del
§1.1, la hoja de confirmación que pinta la previsualización del §2.1, el bus de
acciones de pantalla para que AURORA pueda abrir formularios y prellenar campos,
el contexto vivo por el canal de datos —pantalla, filtros, fila seleccionada— y
la bitácora de sesión con lo que hizo.

**Dos garantías que damos y sobre las que pueden diseñar:** el portal responde
*siempre* a una llamada de función, también cuando falla —si no contestara, la
conversación se cuelga en esa llamada—; y valida los argumentos contra el esquema
antes de salir a la red, así que un `422` suyo será por reglas de negocio, no por
formas.

Empiecen por el §1.1 y el §1.3. Son media tarde de trabajo y con ellos podemos
construir el despachador contra el contrato real en vez de contra una suposición.
