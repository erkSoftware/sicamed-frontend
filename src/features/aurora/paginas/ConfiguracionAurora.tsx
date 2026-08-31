import { useEffect, useMemo, useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import type { NombreIcono } from "../../../shared/ui/primitivos/Icono";
import {
  CampoArea,
  CampoClave,
  CampoSelect,
  CampoTexto,
} from "../../../shared/ui/primitivos/Campo";
import { aProblema, erroresPorCampo } from "../../../shared/api/problemDetails";
import { useAutor } from "../../../shared/auth/useAutor";
import { fechaHora, numero } from "../../../shared/i18n/formato";
import {
  CONFIGURACION_ASISTENTE_DE_FABRICA,
  LARGO_MINIMO_CLAVE,
  LIMITES_ASISTENTE,
  PROVEEDORES_ASISTENTE,
  RANGOS_LIMITES,
  VOCES_ASISTENTE,
  borradorDeConfiguracion,
  erroresDeConfiguracion,
  minutos,
} from "../../../shared/api/mock/configuracionAsistente";
import type {
  BorradorConfiguracionAsistente,
  CampoConfiguracionAsistente,
  CampoLimiteAsistente,
} from "../../../shared/api/mock/configuracionAsistente";
import type { ConfiguracionAsistente } from "../../../shared/api/mock/tipos";
import {
  useConfiguracionAurora,
  useGuardarConfiguracionAurora,
  useProbarConexionAurora,
} from "../hooks/useConfiguracionAurora";

type ClaveTarjeta =
  "nombre" | "personalidad" | "aprendizaje" | "encuadre" | "proveedor" | "limites";

type FichaTarjeta = {
  clave: ClaveTarjeta;
  titulo: string;
  descripcion: string;
  icono: NombreIcono;
  campos: number;
};

const TARJETAS: readonly FichaTarjeta[] = [
  {
    clave: "nombre",
    titulo: "Nombre",
    descripcion: "Cómo se llama y con qué nombre se presenta ante quien abre el micrófono.",
    icono: "usuario",
    campos: 1,
  },
  {
    clave: "personalidad",
    titulo: "Personalidad",
    descripcion:
      "Qué dice al abrir, qué contesta cuando la pregunta no es de SICAMED y con qué voz lo dice.",
    icono: "microfono",
    campos: 3,
  },
  {
    clave: "aprendizaje",
    titulo: "Aprendizaje",
    descripcion:
      "Lo propio de esta entidad que AURORA debe saber: territorio, soporte, cómo se llaman las cosas aquí.",
    icono: "capas",
    campos: 1,
  },
  {
    clave: "encuadre",
    titulo: "Encuadre del sistema",
    descripcion:
      "Quién es la asistente y cómo habla. Vacío conserva el encuadre de fábrica; escrito lo reemplaza.",
    icono: "escudo",
    campos: 1,
  },
  {
    clave: "proveedor",
    titulo: "OpenAI Realtime",
    descripcion:
      "El proveedor de voz, el modelo con el que abre cada sesión y la credencial con la que se pide.",
    icono: "mundo",
    campos: 4,
  },
  {
    clave: "limites",
    titulo: "Límites y protección",
    descripcion:
      "Cuánto dura una llamada, cuándo avisa que se acaba, cuánto se puede hablar al día y cuándo se bloquea a quien insiste.",
    icono: "reloj",
    campos: 7,
  },
];

const REGLAS_FIJAS: readonly { titulo: string; detalle: string }[] = [
  {
    titulo: "Alcance temático",
    detalle:
      "AURORA responde sobre la plataforma y el trámite. Fuera de eso devuelve la frase de rechazo configurada en Personalidad.",
  },
  {
    titulo: "Límites de la conversación",
    detalle:
      "No inventa datos, no confirma lo que no se ejecutó y no repite contraseñas ni credenciales en voz alta.",
  },
  {
    titulo: "Confirmación hablada antes de escribir",
    detalle:
      "Toda acción que modifique un registro se lee en voz alta y espera confirmación explícita antes de ejecutarse.",
  },
  {
    titulo: "Ruido y silencios",
    detalle:
      "Qué hacer cuando se cuela un televisor o hay dos voces se calibra por entorno del despliegue, no desde esta pantalla.",
  },
];

const ETIQUETA_CAMPO: Record<CampoConfiguracionAsistente, string> = {
  nombre: "Nombre del asistente",
  saludo: "Saludo de apertura",
  fraseFueraDeAlcance: "Frase para lo que queda fuera de alcance",
  instruccionesExtra: "Indicaciones propias de la entidad",
  promptSistema: "Encuadre del sistema",
  mensajeAviso: "Frase de aviso cuando se acerca el final",
  voz: "Voz",
  modelo: "Modelo",
};

const ETIQUETA_LIMITE: Record<CampoLimiteAsistente, string> = {
  duracionMaximaSegundos: "Duración máxima de una llamada",
  avisoPrevioSegundos: "Aviso antes de que termine",
  limiteDiarioSegundos: "Cupo diario por persona",
  intentosMaximos: "Intentos admitidos en la ventana",
  ventanaIntentosHoras: "Ventana en la que se cuentan",
  bloqueoAutomaticoDias: "Duración del bloqueo automático",
};

const contador = (valor: string, campo: CampoConfiguracionAsistente): string =>
  `${numero(valor.length)} de ${numero(LIMITES_ASISTENTE[campo].maximo)} caracteres`;

const nombreDeVoz = (configuracion: ConfiguracionAsistente): string =>
  configuracion.voz === ""
    ? `La del sistema (${configuracion.vozEfectiva})`
    : (VOCES_ASISTENTE.find((opcion) => opcion.valor === configuracion.voz)?.etiqueta ??
      configuracion.voz);

const aMinutos = (segundos: number): string => (segundos / 60).toString();

const aSegundos = (texto: string): number => Math.round(Number(texto) * 60);

const Dato = ({ rotulo, children }: { rotulo: string; children: string }) => (
  <div>
    <dt className="kpi__etiqueta">{rotulo}</dt>
    <dd className="vista-previa">{children}</dd>
  </div>
);

export const ConfiguracionAurora = () => {
  const consulta = useConfiguracionAurora();
  const guardar = useGuardarConfiguracionAurora();
  const probar = useProbarConexionAurora();
  const autor = useAutor();
  const [abierta, setAbierta] = useState<ClaveTarjeta | null>(null);
  const [restaurando, setRestaurando] = useState(false);
  const [quitandoClave, setQuitandoClave] = useState(false);
  const [borrador, setBorrador] = useState<BorradorConfiguracionAsistente | null>(null);

  const vigente = consulta.data;

  useEffect(() => {
    if (vigente) setBorrador(borradorDeConfiguracion(vigente));
  }, [vigente]);

  const erroresLocales = useMemo(
    () => (borrador ? erroresDeConfiguracion(borrador, vigente?.modelosDisponibles) : {}),
    [borrador, vigente],
  );

  const erroresServidor = guardar.error ? erroresPorCampo(aProblema(guardar.error)) : {};
  const errorDe = (campo: string): string | undefined =>
    erroresLocales[campo] ?? erroresServidor[campo];

  const problemaConsulta = consulta.error ? aProblema(consulta.error) : null;

  if (problemaConsulta?.status === 503) {
    return (
      <div className="pagina">
        <EncabezadoPagina
          titulo="Configurar a AURORA"
          subtitulo="Lo que la guía del sistema dice al abrir sesión, y con qué voz lo dice."
        />
        <EstadoVacio
          icono="silencio"
          titulo="El asistente está desactivado en este despliegue"
          texto="AURORA no está encendida aquí, así que no hay nada que configurar. Cuando el despliegue la habilite, esta pantalla mostrará el saludo vigente."
        />
      </div>
    );
  }

  const cambiar = (campo: CampoConfiguracionAsistente, valor: string) =>
    setBorrador((actual) => (actual ? { ...actual, [campo]: valor } : actual));

  const cambiarLimite = (campo: CampoLimiteAsistente, valor: number) =>
    setBorrador((actual) =>
      actual ? { ...actual, limites: { ...actual.limites, [campo]: valor } } : actual,
    );

  const cerrar = () => {
    if (vigente) setBorrador(borradorDeConfiguracion(vigente));
    setAbierta(null);
    setRestaurando(false);
    setQuitandoClave(false);
    guardar.reset();
  };

  const abrir = (clave: ClaveTarjeta) => {
    if (vigente) setBorrador(borradorDeConfiguracion(vigente));
    guardar.reset();
    probar.reset();
    setAbierta(clave);
  };

  const publicar = () => {
    if (!borrador || Object.keys(erroresLocales).length > 0) return;
    guardar.mutate({ borrador, autor }, { onSuccess: () => setAbierta(null) });
  };

  const restaurar = () =>
    guardar.mutate(
      { borrador: borradorDeConfiguracion(CONFIGURACION_ASISTENTE_DE_FABRICA), autor },
      { onSuccess: () => setRestaurando(false) },
    );

  const quitarClave = () => {
    if (!vigente) return;
    guardar.mutate(
      {
        borrador: { ...borradorDeConfiguracion(vigente), apiKey: "", borrarApiKey: true },
        autor,
      },
      { onSuccess: () => setQuitandoClave(false) },
    );
  };

  const ficha = TARJETAS.find((tarjeta) => tarjeta.clave === abierta);

  const vistaPrevia = (clave: ClaveTarjeta, configuracion: ConfiguracionAsistente) => {
    if (clave === "nombre")
      return (
        <dl className="pila" style={{ gap: "var(--e4)" }}>
          <Dato rotulo="Se presenta como">{configuracion.nombre}</Dato>
        </dl>
      );
    if (clave === "personalidad")
      return (
        <dl className="pila" style={{ gap: "var(--e4)" }}>
          <Dato rotulo="Saludo de apertura">{configuracion.saludo}</Dato>
          <Dato rotulo="Fuera de alcance">{configuracion.fraseFueraDeAlcance}</Dato>
          <Dato rotulo="Voz">{nombreDeVoz(configuracion)}</Dato>
        </dl>
      );
    if (clave === "encuadre")
      return (
        <dl className="pila" style={{ gap: "var(--e4)" }}>
          <Dato rotulo="Encuadre vigente">
            {configuracion.promptSistema === ""
              ? "El de fábrica. Escribir aquí reemplaza quién es la asistente y cómo habla; el alcance temático y los límites se siguen añadiendo siempre."
              : configuracion.promptSistema}
          </Dato>
        </dl>
      );
    if (clave === "proveedor")
      return (
        <dl className="pila" style={{ gap: "var(--e4)" }}>
          <Dato rotulo="Estado en esta entidad">
            {configuracion.habilitado ? "Encendida" : "Apagada para toda la entidad"}
          </Dato>
          <Dato rotulo="Modelo">
            {configuracion.modelo === ""
              ? `Predeterminado (${configuracion.modeloEfectivo})`
              : configuracion.modelo}
          </Dato>
          <Dato rotulo="Credencial">
            {configuracion.apiKey.configurada
              ? `Configurada · ${configuracion.apiKey.enmascarada}`
              : "Sin credencial guardada. AURORA no puede abrir sesión sin ella."}
          </Dato>
        </dl>
      );
    if (clave === "limites")
      return (
        <dl className="pila" style={{ gap: "var(--e4)" }}>
          <Dato rotulo="Cada llamada dura">
            {minutos(configuracion.limites.duracionMaximaSegundos)}
          </Dato>
          <Dato rotulo="Avisa antes de terminar">
            {configuracion.limites.avisoPrevioSegundos === 0
              ? "Sin aviso hablado"
              : minutos(configuracion.limites.avisoPrevioSegundos)}
          </Dato>
          <Dato rotulo="Cupo diario por persona">
            {configuracion.limites.limiteDiarioSegundos === 0
              ? "Sin tope diario"
              : minutos(configuracion.limites.limiteDiarioSegundos)}
          </Dato>
          <Dato rotulo="Bloqueo automático">
            {configuracion.limites.intentosMaximos === 0
              ? "Apagado: ningún volumen de aperturas bloquea"
              : `Pasados ${numero(configuracion.limites.intentosMaximos)} intentos en ${numero(
                  configuracion.limites.ventanaIntentosHoras,
                )} horas, bloqueo de ${numero(configuracion.limites.bloqueoAutomaticoDias)} días`}
          </Dato>
        </dl>
      );
    return (
      <dl className="pila" style={{ gap: "var(--e4)" }}>
        <Dato rotulo="Indicaciones propias">
          {configuracion.instruccionesExtra === ""
            ? "Sin indicaciones propias. AURORA solo sabe lo que el sistema le arma."
            : configuracion.instruccionesExtra}
        </Dato>
        <Dato rotulo="Presupuesto de contexto">
          {contador(configuracion.instruccionesExtra, "instruccionesExtra")}
        </Dato>
      </dl>
    );
  };

  const campoDeTexto = (
    campo: CampoConfiguracionAsistente,
    actual: BorradorConfiguracionAsistente,
    configuracion: ConfiguracionAsistente,
  ) => {
    if (campo === "voz")
      return (
        <CampoSelect
          key={campo}
          etiqueta={ETIQUETA_CAMPO.voz}
          value={actual.voz}
          opciones={VOCES_ASISTENTE}
          vacio={`La del sistema (${configuracion.vozEfectiva})`}
          ayuda={`Hoy suena ${configuracion.vozEfectiva}.`}
          error={errorDe("voz")}
          onChange={(evento) => cambiar("voz", evento.target.value)}
        />
      );
    if (campo === "nombre")
      return (
        <CampoTexto
          key={campo}
          etiqueta={ETIQUETA_CAMPO.nombre}
          requerido
          value={actual.nombre}
          maxLength={LIMITES_ASISTENTE.nombre.maximo}
          ayuda={contador(actual.nombre, "nombre")}
          error={errorDe("nombre")}
          onChange={(evento) => cambiar("nombre", evento.target.value)}
        />
      );
    if (campo === "instruccionesExtra")
      return (
        <CampoArea
          key={campo}
          etiqueta={ETIQUETA_CAMPO.instruccionesExtra}
          rows={9}
          value={actual.instruccionesExtra}
          maxLength={LIMITES_ASISTENTE.instruccionesExtra.maximo}
          ayuda={`Cada carácter viaja en cada apertura de sesión y se paga como contexto: da para las particularidades de una entidad, no para pegar un manual. ${contador(
            actual.instruccionesExtra,
            "instruccionesExtra",
          )}`}
          error={errorDe("instruccionesExtra")}
          onChange={(evento) => cambiar("instruccionesExtra", evento.target.value)}
        />
      );
    if (campo === "promptSistema")
      return (
        <CampoArea
          key={campo}
          etiqueta={ETIQUETA_CAMPO.promptSistema}
          rows={10}
          value={actual.promptSistema}
          maxLength={LIMITES_ASISTENTE.promptSistema.maximo}
          ayuda={`Vacío conserva el encuadre de fábrica. Escrito reemplaza quién es la asistente y cómo habla, y nada más: el alcance temático, los límites, la regla contra el ruido y la confirmación antes de escribir se siguen añadiendo siempre. ${contador(
            actual.promptSistema,
            "promptSistema",
          )}`}
          error={errorDe("promptSistema")}
          onChange={(evento) => cambiar("promptSistema", evento.target.value)}
        />
      );
    return (
      <CampoArea
        key={campo}
        etiqueta={ETIQUETA_CAMPO[campo]}
        requerido={LIMITES_ASISTENTE[campo].obligatorio}
        rows={campo === "saludo" ? 6 : 3}
        value={actual[campo]}
        maxLength={LIMITES_ASISTENTE[campo].maximo}
        ayuda={contador(actual[campo], campo)}
        error={errorDe(campo)}
        onChange={(evento) => cambiar(campo, evento.target.value)}
      />
    );
  };

  const campoDeMinutos = (
    campo: CampoLimiteAsistente,
    actual: BorradorConfiguracionAsistente,
    ayuda: string,
  ) => (
    <CampoTexto
      key={campo}
      type="number"
      inputMode="decimal"
      step={0.5}
      min={RANGOS_LIMITES[campo].minimo / 60}
      max={RANGOS_LIMITES[campo].maximo / 60}
      etiqueta={`${ETIQUETA_LIMITE[campo]} (minutos)`}
      value={aMinutos(actual.limites[campo])}
      ayuda={ayuda}
      error={errorDe(campo)}
      onChange={(evento) => cambiarLimite(campo, aSegundos(evento.target.value))}
    />
  );

  const campoEntero = (
    campo: CampoLimiteAsistente,
    actual: BorradorConfiguracionAsistente,
    ayuda: string,
  ) => (
    <CampoTexto
      key={campo}
      type="number"
      inputMode="numeric"
      step={1}
      min={RANGOS_LIMITES[campo].minimo}
      max={RANGOS_LIMITES[campo].maximo}
      etiqueta={ETIQUETA_LIMITE[campo]}
      value={actual.limites[campo].toString()}
      ayuda={ayuda}
      error={errorDe(campo)}
      onChange={(evento) => cambiarLimite(campo, Math.round(Number(evento.target.value)))}
    />
  );

  const interruptor = (
    etiqueta: string,
    ayuda: string,
    marcado: boolean,
    alCambiar: (valor: boolean) => void,
    opciones: readonly [string, string] = ["Sí", "No"],
  ) => (
    <CampoSelect
      etiqueta={etiqueta}
      ayuda={ayuda}
      value={marcado ? "si" : "no"}
      opciones={[
        { valor: "si", etiqueta: opciones[0] },
        { valor: "no", etiqueta: opciones[1] },
      ]}
      onChange={(evento) => alCambiar(evento.target.value === "si")}
    />
  );

  const contenidoDelDialogo = (
    clave: ClaveTarjeta,
    actual: BorradorConfiguracionAsistente,
    configuracion: ConfiguracionAsistente,
  ) => {
    if (clave === "nombre") return campoDeTexto("nombre", actual, configuracion);
    if (clave === "personalidad")
      return (
        <>
          {campoDeTexto("saludo", actual, configuracion)}
          {campoDeTexto("fraseFueraDeAlcance", actual, configuracion)}
          {campoDeTexto("voz", actual, configuracion)}
        </>
      );
    if (clave === "aprendizaje") return campoDeTexto("instruccionesExtra", actual, configuracion);
    if (clave === "encuadre") return campoDeTexto("promptSistema", actual, configuracion);

    if (clave === "proveedor")
      return (
        <>
          {interruptor(
            "AURORA habla en esta entidad",
            "Apagarla no toca el interruptor del despliegue: si el despliegue está apagado, esto no la enciende.",
            actual.habilitado,
            (valor) =>
              setBorrador((previo) => (previo ? { ...previo, habilitado: valor } : previo)),
          )}
          <CampoSelect
            etiqueta="Proveedor"
            value={actual.proveedor}
            opciones={PROVEEDORES_ASISTENTE}
            error={errorDe("proveedor")}
            onChange={(evento) =>
              setBorrador((previo) =>
                previo ? { ...previo, proveedor: evento.target.value } : previo,
              )
            }
          />
          <CampoSelect
            etiqueta={ETIQUETA_CAMPO.modelo}
            value={actual.modelo}
            opciones={configuracion.modelosDisponibles.map((modelo) => ({
              valor: modelo,
              etiqueta: modelo,
            }))}
            vacio={`Predeterminado (${configuracion.modeloEfectivo})`}
            ayuda="El catálogo lo publica el despliegue. Un modelo fuera de él se rechaza al guardar."
            error={errorDe("modelo")}
            onChange={(evento) =>
              setBorrador((previo) =>
                previo ? { ...previo, modelo: evento.target.value } : previo,
              )
            }
          />
          <CampoClave
            etiqueta="API Key del proveedor"
            value={actual.apiKey}
            autoComplete="off"
            placeholder={
              configuracion.apiKey.configurada
                ? configuracion.apiKey.enmascarada
                : "Sin credencial guardada"
            }
            ayuda={
              configuracion.apiKey.configurada
                ? "Guardar sin escribir nada conserva la que ya hay. La credencial no vuelve nunca del servidor: solo sus cuatro últimos caracteres."
                : `Sin credencial guardada AURORA no abre sesión. Mínimo ${LARGO_MINIMO_CLAVE} caracteres.`
            }
            error={errorDe("apiKey")}
            onChange={(evento) =>
              setBorrador((previo) =>
                previo ? { ...previo, apiKey: evento.target.value } : previo,
              )
            }
          />
          <div className="fila" style={{ gap: "var(--e3)", flexWrap: "wrap" }}>
            <Boton
              variante="secundario"
              tamano="sm"
              icono="mundo"
              cargando={probar.isPending}
              onClick={() => probar.mutate()}
            >
              Probar conexión
            </Boton>
            {configuracion.apiKey.configurada ? (
              <Boton
                variante="fantasma"
                tamano="sm"
                icono="cerrar"
                onClick={() => {
                  setAbierta(null);
                  setQuitandoClave(true);
                }}
              >
                Quitar credencial
              </Boton>
            ) : null}
          </div>
          {probar.isSuccess ? (
            <p className="campo__ayuda" role="status">
              Conexión correcta: el proveedor aceptó la credencial guardada.
            </p>
          ) : null}
          {probar.error ? (
            <p className="campo__error" role="alert">
              {aProblema(probar.error).status === 502
                ? "La API Key no es válida: el proveedor la rechazó."
                : "No se pudo contactar al proveedor. No es la clave."}
            </p>
          ) : null}
          {actual.apiKey.trim() !== "" ? (
            <p className="campo__ayuda">
              La prueba usa la credencial <strong>guardada</strong>. Guarda primero para probar la
              que acabas de escribir.
            </p>
          ) : null}
        </>
      );

    return (
      <>
        {campoDeMinutos(
          "duracionMaximaSegundos",
          actual,
          `Es la vida real de la credencial: cuando se cumple, el proveedor cierra el canal. Entre ${
            RANGOS_LIMITES.duracionMaximaSegundos.minimo / 60
          } y ${RANGOS_LIMITES.duracionMaximaSegundos.maximo / 60} minutos.`,
        )}
        {campoDeMinutos(
          "avisoPrevioSegundos",
          actual,
          "Cuánto antes del final avisa AURORA en voz alta. En 0 no hay aviso, y tiene que caber dentro de la llamada.",
        )}
        {campoDeTexto("mensajeAviso", actual, configuracion)}
        {interruptor(
          "Sin tope diario",
          "El cupo diario en 0 significa que nadie se queda sin minutos por hablar mucho en un día.",
          actual.limites.limiteDiarioSegundos === 0,
          (valor) => cambiarLimite("limiteDiarioSegundos", valor ? 0 : 600),
        )}
        {actual.limites.limiteDiarioSegundos === 0
          ? null
          : campoDeMinutos(
              "limiteDiarioSegundos",
              actual,
              "Lo que cada persona puede hablar en un día, sumando todas sus llamadas.",
            )}
        {interruptor(
          "Sin bloqueo automático",
          "Con 0 intentos máximos nadie queda bloqueado por volumen de aperturas.",
          actual.limites.intentosMaximos === 0,
          (valor) => cambiarLimite("intentosMaximos", valor ? 0 : 10),
        )}
        {actual.limites.intentosMaximos === 0 ? null : (
          <>
            {campoEntero(
              "intentosMaximos",
              actual,
              "Cuántas aperturas se admiten dentro de la ventana. Se cuentan todos los intentos, también los que abrieron llamada: lo que esta regla frena es el volumen de aperturas, no los fallos.",
            )}
            {campoEntero(
              "ventanaIntentosHoras",
              actual,
              "En cuántas horas se cuentan esos intentos.",
            )}
            {campoEntero(
              "bloqueoAutomaticoDias",
              actual,
              "Cuántos días dura el bloqueo que genera pasarse de intentos.",
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Configurar a AURORA"
        subtitulo="Lo que la guía del sistema dice al abrir sesión, cómo se llama, con qué voz habla y cuánto se puede hablar. Se aplica a toda la entidad y solo lo toca el super administrador."
        acciones={
          <div className="fila" style={{ gap: "var(--e3)" }}>
            {vigente?.deFabrica ? (
              <Insignia tono="neutro">Configuración de fábrica</Insignia>
            ) : (
              <Insignia tono="info">Configuración propia</Insignia>
            )}
            {vigente && !vigente.habilitado ? (
              <Insignia tono="alerta">Voz apagada en la entidad</Insignia>
            ) : null}
            {vigente && !vigente.deFabrica ? (
              <Boton variante="secundario" icono="flecha" onClick={() => setRestaurando(true)}>
                Restaurar de fábrica
              </Boton>
            ) : null}
          </div>
        }
      />

      <EstadoConsulta
        cargando={consulta.isPending}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {borrador && vigente ? (
          <>
            <div className="aviso aviso--info">
              <Icono nombre="reloj" tamano={18} />
              <p>
                Guardar gobierna las <strong>aperturas siguientes</strong>: una sesión de voz ya
                abierta nació con las instrucciones pegadas del lado del proveedor y no cambia a
                mitad de conversación.{" "}
                {vigente.deFabrica
                  ? "Nadie ha tocado esta configuración todavía."
                  : `La dejó así ${vigente.actualizadoPor || "una cuenta sin identificar"}${
                      vigente.actualizadoEn ? ` el ${fechaHora(vigente.actualizadoEn)}` : ""
                    }.`}
              </p>
            </div>

            <div className="rejilla rejilla--3">
              {TARJETAS.map((tarjeta) => (
                <Tarjeta
                  key={tarjeta.clave}
                  titulo={tarjeta.titulo}
                  descripcion={tarjeta.descripcion}
                  acciones={
                    <Boton
                      variante="secundario"
                      tamano="sm"
                      icono="documento"
                      onClick={() => abrir(tarjeta.clave)}
                    >
                      Editar
                    </Boton>
                  }
                  pie={
                    <span className="fila" style={{ gap: "var(--e2)" }}>
                      <Icono nombre={tarjeta.icono} tamano={15} />
                      <span className="enlace-fila__meta">
                        {tarjeta.campos === 1
                          ? "1 campo configurable"
                          : `${tarjeta.campos} campos configurables`}
                      </span>
                    </span>
                  }
                >
                  {vistaPrevia(tarjeta.clave, vigente)}
                </Tarjeta>
              ))}
            </div>

            <Tarjeta
              titulo="Reglas fijas del sistema"
              descripcion="Se arman siempre, con configuración o sin ella. No son campos: editarlas sería cambiar la política del sistema por API, y un descuido de redacción pasaría a ser un cambio de reglas."
              acciones={<Insignia tono="neutro">Solo lectura</Insignia>}
            >
              <dl className="rejilla rejilla--2">
                {REGLAS_FIJAS.map((regla) => (
                  <div key={regla.titulo}>
                    <dt className="kpi__etiqueta">{regla.titulo}</dt>
                    <dd>{regla.detalle}</dd>
                  </div>
                ))}
              </dl>
            </Tarjeta>

            <div className="aviso aviso--alerta">
              <Icono nombre="candado" tamano={18} />
              <p>
                No se guarda ni se transcribe nada de lo que los usuarios hablan con AURORA: hay una
                sola fila de configuración por entidad y no existe historial de conversaciones. Es
                una decisión, no un pendiente.
              </p>
            </div>

            {ficha ? (
              <DialogoFormulario
                abierto
                titulo={`Editar ${ficha.titulo.toLowerCase()}`}
                descripcion={ficha.descripcion}
                etiquetaEnviar="Guardar"
                ancho={ficha.clave !== "nombre"}
                cargando={guardar.isPending}
                error={guardar.error}
                onCerrar={cerrar}
                onEnviar={publicar}
                onLimpiarError={() => guardar.reset()}
              >
                {contenidoDelDialogo(ficha.clave, borrador, vigente)}
              </DialogoFormulario>
            ) : null}

            {quitandoClave ? (
              <DialogoFormulario
                abierto
                titulo="Quitar la credencial del proveedor"
                descripcion="Sin API Key, AURORA deja de abrir sesiones de voz en esta entidad hasta que alguien pegue otra. No afecta a las conversaciones ya abiertas."
                etiquetaEnviar="Quitar credencial"
                cargando={guardar.isPending}
                error={guardar.error}
                onCerrar={cerrar}
                onEnviar={quitarClave}
                onLimpiarError={() => guardar.reset()}
              >
                <dl className="pila" style={{ gap: "var(--e4)" }}>
                  <Dato rotulo="Credencial vigente">{vigente.apiKey.enmascarada}</Dato>
                </dl>
              </DialogoFormulario>
            ) : null}

            {restaurando ? (
              <DialogoFormulario
                abierto
                titulo="Restaurar la configuración de fábrica"
                descripcion="Vuelve al nombre, el saludo, la frase de rechazo, la voz y los límites con los que llegó el sistema. La credencial guardada se conserva. Después seguirá contando como configuración propia: alguien sí la tocó. No afecta a las sesiones de voz ya abiertas."
                etiquetaEnviar="Restaurar"
                cargando={guardar.isPending}
                error={guardar.error}
                onCerrar={cerrar}
                onEnviar={restaurar}
                onLimpiarError={() => guardar.reset()}
              >
                <dl className="pila" style={{ gap: "var(--e4)" }}>
                  <Dato rotulo="Saludo de fábrica">
                    {CONFIGURACION_ASISTENTE_DE_FABRICA.saludo}
                  </Dato>
                  <Dato rotulo="Indicaciones propias">
                    Se borran las que tenga escritas esta entidad.
                  </Dato>
                  <Dato rotulo="Límites de fábrica">
                    {`Llamadas de ${minutos(
                      CONFIGURACION_ASISTENTE_DE_FABRICA.limites.duracionMaximaSegundos,
                    )} con cupo diario de ${minutos(
                      CONFIGURACION_ASISTENTE_DE_FABRICA.limites.limiteDiarioSegundos,
                    )}.`}
                  </Dato>
                </dl>
              </DialogoFormulario>
            ) : null}
          </>
        ) : null}
      </EstadoConsulta>
    </div>
  );
};
