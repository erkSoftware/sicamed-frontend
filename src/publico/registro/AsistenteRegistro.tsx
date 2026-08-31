import { useEffect, useMemo, useState } from "react";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { CampoClave, CampoSelect, CampoTexto } from "../../shared/ui/primitivos/Campo";
import { CampoArchivo, formatearPeso } from "../../shared/ui/primitivos/CampoArchivo";
import { Dialogo } from "../../shared/ui/primitivos/Dialogo";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { ErrorNormativo } from "../../shared/ui/patrones/ErrorNormativo";
import { ComprobacionSeguridad } from "../../shared/ui/patrones/ComprobacionSeguridad";
import { useComprobante } from "../../shared/seguridad/useComprobante";
import { apiComercial } from "../../shared/api/clienteComercial";
import { aProblema, erroresPorCampo } from "../../shared/api/problemDetails";
import {
  CLAVE_MINIMA,
  MIMES_ADMITIDOS,
  aArchivoDeSoporte,
  motivoDeRechazo,
  rechazoDeLaPreparacion,
} from "../../shared/api/rest/actores";
import { DEPARTAMENTOS, esMunicipioDe, municipiosDe } from "../../shared/ubicacion/divipola";
import { revisarNit } from "../../shared/identificacion/nit";
import type { TipoActor } from "../../shared/api/mock/tipos";
import { Lamina } from "./Laminas";
import type { Motivo } from "./Laminas";
import { seContrastaContraRues, useRequisitos } from "./requisitos";
import type { Requisito } from "./requisitos";

export type Formulario = {
  nit: string;
  organizacion: string;
  tipoActor: TipoActor;
  departamento: string;
  municipio: string;
  representante: string;
  correo: string;
  telefono: string;
  clave: string;
  claveRepetida: string;
};

const INICIAL: Formulario = {
  nit: "",
  organizacion: "",
  tipoActor: "CULTIVADOR",
  departamento: "",
  municipio: "",
  representante: "",
  correo: "",
  telefono: "",
  clave: "",
  claveRepetida: "",
};

export const TIPOS: readonly { valor: TipoActor; etiqueta: string; detalle: string }[] = [
  {
    valor: "CULTIVADOR",
    etiqueta: "Cultivador",
    detalle: "Siembra plantas de cannabis con licencia de cultivo",
  },
  {
    valor: "TRANSFORMADOR",
    etiqueta: "Transformador",
    detalle: "Fabrica derivados con licencia de fabricación",
  },
  {
    valor: "LABORATORIO",
    etiqueta: "Laboratorio",
    detalle: "Analiza y certifica con autorización sanitaria",
  },
  {
    valor: "DISPENSADOR",
    etiqueta: "Dispensador",
    detalle: "Dispensa producto terminado al paciente",
  },
  { valor: "IPS", etiqueta: "IPS", detalle: "Presta servicios de salud habilitados" },
];

type Paso = { clave: string; titulo: string; rotulo: string; motivo: Motivo };

const PASOS: readonly Paso[] = [
  {
    clave: "identificacion",
    titulo: "Identifica la organización",
    rotulo: "Identificación",
    motivo: "semilla",
  },
  { clave: "actor", titulo: "¿Qué hace tu organización?", rotulo: "Tipo de actor", motivo: "brote" },
  {
    clave: "contacto",
    titulo: "Dónde estás y quién responde",
    rotulo: "Ubicación",
    motivo: "arraigo",
  },
  { clave: "acceso", titulo: "Tu contraseña de acceso", rotulo: "Acceso", motivo: "sello" },
  { clave: "documentos", titulo: "Carga los soportes", rotulo: "Documentos", motivo: "pliego" },
  { clave: "revision", titulo: "Revisa antes de radicar", rotulo: "Revisión", motivo: "abanico" },
];

type Errores = Partial<Record<keyof Formulario, string>>;

const PASO_DEL_CAMPO: Partial<Record<keyof Formulario, number>> = {
  nit: 0,
  organizacion: 0,
  tipoActor: 1,
  departamento: 2,
  municipio: 2,
  representante: 2,
  correo: 2,
  telefono: 2,
  clave: 3,
};

const esCampoDelFormulario = (campo: string): campo is keyof Formulario => campo in PASO_DEL_CAMPO;

export const anclarEnCampos = (rechazo: unknown): { errores: Errores; paso: number | null } => {
  const errores: Errores = {};
  let paso: number | null = null;
  for (const [campo, motivo] of Object.entries(erroresPorCampo(aProblema(rechazo)))) {
    if (!esCampoDelFormulario(campo)) continue;
    errores[campo] = motivo;
    const propio = PASO_DEL_CAMPO[campo];
    if (propio !== undefined && (paso === null || propio < paso)) paso = propio;
  }
  return { errores, paso };
};

export const validarPaso = (indice: number, valores: Formulario): Errores => {
  const errores: Errores = {};
  if (indice === 0) {
    const revision = revisarNit(valores.nit);
    if (revision?.fallo === "forma")
      errores.nit = "Formato esperado: 900123456-8 (NIT con dígito de verificación).";
    else if (revision?.fallo === "digito")
      errores.nit = `El dígito de verificación no corresponde: para ese NIT es ${revision.esperado}.`;
    if (valores.organizacion.trim().length < 6)
      errores.organizacion = "Indica la razón social completa.";
  }
  if (indice === 2) {
    if (!valores.departamento) errores.departamento = "Selecciona el departamento.";
    if (!valores.municipio) errores.municipio = "Selecciona el municipio.";
    else if (!esMunicipioDe(valores.municipio, valores.departamento))
      errores.municipio = "Ese municipio no pertenece al departamento elegido.";
    if (valores.representante.trim().length < 6)
      errores.representante = "Indica el nombre del representante legal.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valores.correo))
      errores.correo = "Indica un correo de contacto válido.";
    if (valores.telefono.trim().length < 7) errores.telefono = "Indica un teléfono de contacto.";
  }
  if (indice === 3) {
    if (valores.clave.length < CLAVE_MINIMA)
      errores.clave = `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres.`;
    else if (valores.clave !== valores.claveRepetida)
      errores.claveRepetida = "Las dos contraseñas no coinciden.";
  }
  return errores;
};

type Adjunto = {
  archivo: File | null;
  fase: "subiendo" | "listo" | "fallido";
  soporteId?: string;
  motivo?: string;
};

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  onRadicada: (datos: {
    radicado: string;
    correo: string;
    faltantes: number;
    mensaje: string;
  }) => void;
};

export const AsistenteRegistro = ({ abierto, onCerrar, onRadicada }: Props) => {
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});
  const [adjuntos, setAdjuntos] = useState<Record<string, Adjunto>>({});
  const [faltan, setFaltan] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [rechazo, setRechazo] = useState<unknown>(null);

  const comprobante = useComprobante();
  const consulta = useRequisitos(valores.tipoActor, abierto);
  const requisitos: readonly Requisito[] = useMemo(
    () => consulta.data?.documentos ?? [],
    [consulta.data],
  );

  const obligatorios = requisitos.filter((requisito) => requisito.obligatorio);
  const pendientes = obligatorios.filter((requisito) => adjuntos[requisito.tipo]?.fase !== "listo");
  const subiendo = Object.values(adjuntos).some((adjunto) => adjunto.fase === "subiendo");
  const municipios = useMemo(() => municipiosDe(valores.departamento), [valores.departamento]);
  const actual = PASOS[paso];

  useEffect(() => {
    if (!abierto) return;
    setAdjuntos({});
    setFaltan(false);
  }, [abierto, valores.tipoActor]);

  const actualizar = (campo: keyof Formulario) => (valor: string) => {
    setValores((previos) =>
      campo === "departamento"
        ? { ...previos, departamento: valor, municipio: "" }
        : { ...previos, [campo]: valor },
    );
    setErrores((previos) => ({ ...previos, [campo]: undefined }));
  };

  const cargar = async (requisito: Requisito, elegido: File) => {
    const archivo = aArchivoDeSoporte(elegido);
    const local = motivoDeRechazo(archivo);
    if (local) {
      setAdjuntos((previos) => ({
        ...previos,
        [requisito.tipo]: { archivo: elegido, fase: "fallido", motivo: local },
      }));
      return;
    }

    setAdjuntos((previos) => ({
      ...previos,
      [requisito.tipo]: { archivo: elegido, fase: "subiendo" },
    }));

    try {
      const preparacion = await apiComercial.prepararSoporte({
        tipo: requisito.tipo,
        nombre: archivo.nombre,
        mime: archivo.mime,
        bytes: archivo.bytes,
        captcha: await comprobante.consumir(),
      });
      const rechazado = rechazoDeLaPreparacion(preparacion, archivo);
      if (rechazado) throw rechazado;
      await apiComercial.subirSoporte(preparacion, archivo);
      const soporte = await apiComercial.confirmarSoporte({
        soporteId: preparacion.soporteId,
        captcha: await comprobante.consumir(),
      });
      setAdjuntos((previos) => ({
        ...previos,
        [requisito.tipo]: { archivo: elegido, fase: "listo", soporteId: soporte.soporteId },
      }));
    } catch (error) {
      setAdjuntos((previos) => ({
        ...previos,
        [requisito.tipo]: {
          archivo: elegido,
          fase: "fallido",
          motivo: aProblema(error).detail,
        },
      }));
    }
  };

  const quitar = (tipo: string) =>
    setAdjuntos((previos) => {
      const siguiente = { ...previos };
      delete siguiente[tipo];
      return siguiente;
    });

  const avanzar = () => {
    const encontrados = validarPaso(paso, valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    if (paso === 4 && pendientes.length > 0) {
      setFaltan(true);
      return;
    }
    setFaltan(false);
    setPaso((previo) => Math.min(previo + 1, PASOS.length - 1));
  };

  const retroceder = () => {
    setFaltan(false);
    setPaso((previo) => Math.max(previo - 1, 0));
  };

  const radicar = async () => {
    setEnviando(true);
    setRechazo(null);
    try {
      const radicacion = await apiComercial.radicarSolicitud({
        nit: valores.nit.trim(),
        organizacion: valores.organizacion.trim(),
        tipoActor: valores.tipoActor,
        departamento: valores.departamento,
        municipio: valores.municipio,
        representante: valores.representante.trim(),
        correo: valores.correo.trim(),
        telefono: valores.telefono.trim(),
        clave: valores.clave,
        documentos: requisitos
          .filter((requisito) => adjuntos[requisito.tipo]?.soporteId)
          .map((requisito) => ({
            tipo: requisito.tipo,
            soporteId: adjuntos[requisito.tipo]?.soporteId ?? "",
          })),
        captcha: await comprobante.consumir(),
      });
      onRadicada({
        radicado: radicacion.id,
        correo: valores.correo.trim(),
        mensaje: radicacion.mensaje,
        faltantes: requisitos.filter(
          (requisito) => !requisito.obligatorio && !adjuntos[requisito.tipo]?.soporteId,
        ).length,
      });
    } catch (error) {
      const anclados = anclarEnCampos(error);
      setErrores(anclados.errores);
      if (anclados.paso !== null) setPaso(anclados.paso);
      setRechazo(error);
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => {
    setRechazo(null);
    onCerrar();
  };

  if (!actual) return null;

  const puedeRadicar = comprobante.listo && !subiendo && pendientes.length === 0;

  return (
    <Dialogo
      abierto={abierto}
      titulo={actual.titulo}
      onCerrar={cerrar}
      ancho
      pie={
        <div className="asistente__pie">
          <span className="asistente__avance mono">
            Paso {paso + 1} de {PASOS.length}
          </span>
          <div className="fila" style={{ gap: "var(--e3)" }}>
            {paso > 0 ? (
              <Boton variante="secundario" onClick={retroceder}>
                Atrás
              </Boton>
            ) : (
              <Boton variante="secundario" onClick={cerrar}>
                Cancelar
              </Boton>
            )}
            {paso < PASOS.length - 1 ? (
              <Boton onClick={avanzar} disabled={paso === 4 && subiendo}>
                Continuar
              </Boton>
            ) : (
              <Boton onClick={() => void radicar()} cargando={enviando} disabled={!puedeRadicar}>
                Radicar solicitud
              </Boton>
            )}
          </div>
        </div>
      }
    >
      <div className="asistente">
        <aside className="asistente__guia">
          <Lamina motivo={actual.motivo} />
          <ol className="asistente__pasos" aria-label={`Pasos del registro, ${paso + 1} de ${PASOS.length}`}>
            {PASOS.map((definicion, indice) => (
              <li
                key={definicion.clave}
                className="asistente__paso"
                data-estado={indice === paso ? "actual" : indice < paso ? "hecho" : "futuro"}
                aria-current={indice === paso ? "step" : undefined}
              >
                <span className="asistente__marca" aria-hidden="true">
                  {indice < paso ? <Icono nombre="check" tamano={13} /> : indice + 1}
                </span>
                <span className="asistente__rotulo">{definicion.rotulo}</span>
                {indice < paso ? <span className="solo-lectores"> (completado)</span> : null}
              </li>
            ))}
          </ol>
        </aside>

        <div className="asistente__cuerpo">
          <p className="solo-lectores" role="status">
            Paso {paso + 1} de {PASOS.length}: {actual.titulo}
          </p>

          {rechazo ? (
            <ErrorNormativo problema={aProblema(rechazo)} onReintentar={() => setRechazo(null)} />
          ) : null}

          {paso === 0 ? (
            <div className="pila" style={{ gap: "var(--e4)" }}>
              <p className="asistente__intro">
                Empezamos por lo que te identifica ante el sistema. El NIT se contrasta con el RUES,
                así que debe coincidir con tu certificado de existencia y representación legal.
              </p>
              <CampoTexto
                etiqueta="NIT"
                requerido
                value={valores.nit}
                error={errores.nit}
                ayuda="Incluye el guion y el dígito de verificación."
                placeholder="900123456-8"
                onChange={(evento) => actualizar("nit")(evento.target.value)}
              />
              <CampoTexto
                etiqueta="Razón social"
                requerido
                value={valores.organizacion}
                error={errores.organizacion}
                ayuda="Tal como aparece en el certificado del RUES."
                onChange={(evento) => actualizar("organizacion")(evento.target.value)}
              />
            </div>
          ) : null}

          {paso === 1 ? (
            <div className="pila" style={{ gap: "var(--e4)" }}>
              <p className="asistente__intro">
                El tipo de actor decide qué documentos te exige el sistema. Puedes cambiarlo mientras
                no hayas radicado; al cambiarlo se pierden los archivos ya cargados.
              </p>
              <div className="asistente__opciones" role="radiogroup" aria-label="Tipo de actor">
                {TIPOS.map((tipo) => (
                  <button
                    key={tipo.valor}
                    type="button"
                    role="radio"
                    aria-checked={valores.tipoActor === tipo.valor}
                    className="asistente__opcion"
                    data-elegida={valores.tipoActor === tipo.valor ? "si" : "no"}
                    onClick={() => actualizar("tipoActor")(tipo.valor)}
                  >
                    <span className="asistente__opcion-nombre">{tipo.etiqueta}</span>
                    <span className="asistente__opcion-detalle">{tipo.detalle}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {paso === 2 ? (
            <div className="pila" style={{ gap: "var(--e4)" }}>
              <div className="rejilla rejilla--2">
                <CampoSelect
                  etiqueta="Departamento"
                  requerido
                  value={valores.departamento}
                  error={errores.departamento}
                  vacio="Selecciona un departamento"
                  opciones={DEPARTAMENTOS.map((entrada) => ({
                    valor: entrada.codigo,
                    etiqueta: entrada.nombre,
                  }))}
                  onChange={(evento) => actualizar("departamento")(evento.target.value)}
                />
                <CampoSelect
                  etiqueta="Municipio"
                  requerido
                  value={valores.municipio}
                  error={errores.municipio}
                  disabled={!valores.departamento}
                  vacio={
                    valores.departamento
                      ? "Selecciona un municipio"
                      : "Elige primero el departamento"
                  }
                  ayuda="Se envía el código DIVIPOLA de cinco dígitos."
                  opciones={municipios.map((entrada) => ({
                    valor: entrada.codigo,
                    etiqueta: entrada.nombre,
                  }))}
                  onChange={(evento) => actualizar("municipio")(evento.target.value)}
                />
              </div>
              <CampoTexto
                etiqueta="Representante legal"
                requerido
                value={valores.representante}
                error={errores.representante}
                ayuda="Es la persona a cuyo nombre queda la cuenta de la organización."
                onChange={(evento) => actualizar("representante")(evento.target.value)}
              />
              <div className="rejilla rejilla--2">
                <CampoTexto
                  etiqueta="Correo de contacto"
                  requerido
                  type="email"
                  autoComplete="email"
                  value={valores.correo}
                  error={errores.correo}
                  ayuda="Aquí llegan el radicado y el enlace para verificar el correo."
                  onChange={(evento) => actualizar("correo")(evento.target.value)}
                />
                <CampoTexto
                  etiqueta="Teléfono"
                  requerido
                  value={valores.telefono}
                  error={errores.telefono}
                  onChange={(evento) => actualizar("telefono")(evento.target.value)}
                />
              </div>
            </div>
          ) : null}

          {paso === 3 ? (
            <div className="pila" style={{ gap: "var(--e4)" }}>
              <p className="asistente__intro">
                Esta es la contraseña con la que vas a entrar el día que aprueben tu registro. No
                hay correo de invitación ni de «establece tu clave»: la que escribas aquí es la que
                va a funcionar, con el correo <strong>{valores.correo || "de contacto"}</strong>.
              </p>
              <CampoClave
                etiqueta="Contraseña"
                requerido
                autoComplete="new-password"
                value={valores.clave}
                error={errores.clave}
                ayuda={`Mínimo ${CLAVE_MINIMA} caracteres.`}
                onChange={(evento) => actualizar("clave")(evento.target.value)}
              />
              <CampoClave
                etiqueta="Repite la contraseña"
                requerido
                autoComplete="new-password"
                value={valores.claveRepetida}
                error={errores.claveRepetida}
                onChange={(evento) => actualizar("claveRepetida")(evento.target.value)}
              />
              <p className="asistente__intro">
                La contraseña no se guarda en el expediente: viaja al servicio de identidad y la
                credencial queda pendiente hasta que un administrador institucional apruebe el
                trámite.
              </p>
            </div>
          ) : null}

          {paso === 4 ? (
            <div className="pila" style={{ gap: "var(--e4)" }}>
              {consulta.isPending ? (
                <p className="asistente__intro">Consultando los soportes que exige el sistema…</p>
              ) : null}
              {consulta.isError ? (
                <ErrorNormativo
                  problema={aProblema(consulta.error)}
                  onReintentar={() => void consulta.refetch()}
                />
              ) : null}
              {consulta.isSuccess ? (
                <p className="asistente__intro">
                  Estos son los soportes que el sistema exige a un{" "}
                  <strong>{TIPOS.find((tipo) => tipo.valor === valores.tipoActor)?.etiqueta}</strong>
                  . Los marcados con asterisco bloquean la radicación. Cada archivo se sube al
                  guardarlo: PDF, JPG, PNG o WEBP, hasta 10 MB.
                </p>
              ) : null}
              {faltan && pendientes.length > 0 ? (
                <p className="asistente__aviso" role="alert">
                  Falta cargar {pendientes.length}{" "}
                  {pendientes.length === 1 ? "documento obligatorio" : "documentos obligatorios"}.
                </p>
              ) : null}
              <div className="pila" style={{ gap: "var(--e5)" }}>
                {requisitos.map((requisito) => {
                  const adjunto = adjuntos[requisito.tipo];
                  return (
                    <div key={requisito.tipo} className="asistente__requisito">
                      <CampoArchivo
                        etiqueta={requisito.etiqueta}
                        requerido={requisito.obligatorio}
                        acepta={MIMES_ADMITIDOS.join(",")}
                        archivo={adjunto?.archivo ?? null}
                        error={adjunto?.fase === "fallido" ? adjunto.motivo : undefined}
                        ayuda={
                          seContrastaContraRues(requisito.tipo)
                            ? "El sistema además lo contrasta contra el RUES"
                            : undefined
                        }
                        onArchivo={(elegido) => {
                          if (elegido) void cargar(requisito, elegido);
                          else quitar(requisito.tipo);
                        }}
                        onRechazo={(motivo) =>
                          setAdjuntos((previos) => ({
                            ...previos,
                            [requisito.tipo]: { archivo: null, fase: "fallido", motivo },
                          }))
                        }
                      />
                      <div className="asistente__sellos">
                        {adjunto?.fase === "subiendo" ? (
                          <span className="asistente__sello">Subiendo…</span>
                        ) : null}
                        {adjunto?.fase === "listo" ? (
                          <span className="asistente__sello">Soporte disponible</span>
                        ) : null}
                        {requisito.obligatorio ? null : (
                          <span className="asistente__sello asistente__sello--suave">Opcional</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {comprobante.exige ? (
                <ComprobacionSeguridad
                  key={comprobante.ronda}
                  accion="soporte-de-registro"
                  onToken={comprobante.recibir}
                />
              ) : null}
            </div>
          ) : null}

          {paso === 5 ? (
            <div className="pila" style={{ gap: "var(--e4)" }}>
              <p className="asistente__intro">
                Al radicar, tu solicitud queda en validación.{" "}
                <strong>No podrás ingresar al sistema</strong> hasta que un administrador
                institucional valide los soportes.
              </p>
              <dl className="asistente__resumen">
                <div>
                  <dt>NIT</dt>
                  <dd className="mono">{valores.nit}</dd>
                </div>
                <div>
                  <dt>Razón social</dt>
                  <dd>{valores.organizacion}</dd>
                </div>
                <div>
                  <dt>Tipo de actor</dt>
                  <dd>{TIPOS.find((tipo) => tipo.valor === valores.tipoActor)?.etiqueta}</dd>
                </div>
                <div>
                  <dt>Ubicación</dt>
                  <dd>
                    {municipios.find((entrada) => entrada.codigo === valores.municipio)?.nombre}
                    {", "}
                    {DEPARTAMENTOS.find((entrada) => entrada.codigo === valores.departamento)
                      ?.nombre}{" "}
                    <span className="mono">{valores.municipio}</span>
                  </dd>
                </div>
                <div>
                  <dt>Representante</dt>
                  <dd>{valores.representante}</dd>
                </div>
                <div>
                  <dt>Contacto</dt>
                  <dd>
                    {valores.correo} · {valores.telefono}
                  </dd>
                </div>
              </dl>
              <ul className="asistente__adjuntos">
                {requisitos.map((requisito) => {
                  const adjunto = adjuntos[requisito.tipo];
                  const listo = adjunto?.fase === "listo";
                  return (
                    <li key={requisito.tipo} data-cargado={listo ? "si" : "no"}>
                      <span className="asistente__adjunto-marca" aria-hidden="true">
                        <Icono nombre={listo ? "check" : "documento"} tamano={14} />
                      </span>
                      <span className="asistente__adjunto-nombre">{requisito.etiqueta}</span>
                      <span className="asistente__adjunto-dato mono">
                        {listo && adjunto?.archivo
                          ? formatearPeso(adjunto.archivo.size)
                          : "sin cargar"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {comprobante.exige ? (
                <ComprobacionSeguridad
                  key={comprobante.ronda}
                  accion="radicar-solicitud"
                  onToken={comprobante.recibir}
                  nota="Esta comprobación distingue a una persona de un guion automatizado. Es obligatoria para radicar."
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Dialogo>
  );
};
