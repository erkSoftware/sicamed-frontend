import { useMemo, useState } from "react";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { CampoSelect, CampoTexto } from "../../shared/ui/primitivos/Campo";
import { CampoArchivo, formatearPeso } from "../../shared/ui/primitivos/CampoArchivo";
import { Dialogo } from "../../shared/ui/primitivos/Dialogo";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { ErrorNormativo } from "../../shared/ui/patrones/ErrorNormativo";
import { apiComercial } from "../../shared/api/clienteComercial";
import { aProblema } from "../../shared/api/problemDetails";
import { DEPARTAMENTOS } from "../../shared/api/mock/catalogos";
import type { TipoActor, TipoDocumento } from "../../shared/api/mock/tipos";
import { Lamina } from "./Laminas";
import type { Motivo } from "./Laminas";
import { requisitosDe, vigenciaLegible } from "./requisitos";

export type Formulario = {
  nit: string;
  organizacion: string;
  tipoActor: TipoActor;
  departamento: string;
  municipio: string;
  representante: string;
  correo: string;
  telefono: string;
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
  { clave: "identificacion", titulo: "Identifica la organización", rotulo: "Identificación", motivo: "semilla" },
  { clave: "actor", titulo: "¿Qué hace tu organización?", rotulo: "Tipo de actor", motivo: "brote" },
  { clave: "contacto", titulo: "Dónde estás y quién responde", rotulo: "Ubicación", motivo: "arraigo" },
  { clave: "documentos", titulo: "Carga los soportes", rotulo: "Documentos", motivo: "pliego" },
  { clave: "revision", titulo: "Revisa antes de radicar", rotulo: "Revisión", motivo: "abanico" },
];

type Errores = Partial<Record<keyof Formulario, string>>;

const validarPaso = (indice: number, valores: Formulario): Errores => {
  const errores: Errores = {};
  if (indice === 0) {
    if (!/^\d{9,10}-\d$/.test(valores.nit.trim()))
      errores.nit = "Formato esperado: 900123456-7 (NIT con dígito de verificación).";
    if (valores.organizacion.trim().length < 6)
      errores.organizacion = "Indica la razón social completa.";
  }
  if (indice === 2) {
    if (!valores.departamento) errores.departamento = "Selecciona el departamento.";
    if (valores.municipio.trim().length < 3) errores.municipio = "Indica el municipio.";
    if (valores.representante.trim().length < 6)
      errores.representante = "Indica el nombre del representante legal.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valores.correo))
      errores.correo = "Indica un correo de contacto válido.";
    if (valores.telefono.trim().length < 7) errores.telefono = "Indica un teléfono de contacto.";
  }
  return errores;
};

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  onRadicada: (datos: { radicado: string; correo: string; faltantes: number }) => void;
};

export const AsistenteRegistro = ({ abierto, onCerrar, onRadicada }: Props) => {
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});
  const [archivos, setArchivos] = useState<Partial<Record<TipoDocumento, File>>>({});
  const [rechazos, setRechazos] = useState<Partial<Record<TipoDocumento, string>>>({});
  const [faltan, setFaltan] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [rechazo, setRechazo] = useState<unknown>(null);

  const requisitos = useMemo(() => requisitosDe(valores.tipoActor), [valores.tipoActor]);
  const obligatorios = requisitos.filter((requisito) => requisito.obligatorio);
  const pendientes = obligatorios.filter((requisito) => !archivos[requisito.documento]);
  const actual = PASOS[paso];

  const actualizar = (campo: keyof Formulario) => (valor: string) => {
    setValores((previos) => ({ ...previos, [campo]: valor }));
    setErrores((previos) => ({ ...previos, [campo]: undefined }));
  };

  const avanzar = () => {
    const encontrados = validarPaso(paso, valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    if (paso === 3 && pendientes.length > 0) {
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
      const solicitud = await apiComercial.radicarSolicitud({
        ...valores,
        documentos: requisitos
          .filter((requisito) => archivos[requisito.documento])
          .map((requisito) => {
            const archivo = archivos[requisito.documento];
            return {
              tipo: requisito.documento,
              nombre: archivo ? archivo.name : "",
              peso: archivo ? archivo.size : 0,
            };
          }),
      });
      onRadicada({
        radicado: solicitud.id,
        correo: valores.correo,
        faltantes: requisitos.filter(
          (requisito) => !requisito.obligatorio && !archivos[requisito.documento],
        ).length,
      });
    } catch (error) {
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
              <Boton onClick={avanzar}>Continuar</Boton>
            ) : (
              <Boton onClick={() => void radicar()} cargando={enviando}>
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
          <ol className="asistente__pasos">
            {PASOS.map((definicion, indice) => (
              <li
                key={definicion.clave}
                className="asistente__paso"
                data-estado={indice === paso ? "actual" : indice < paso ? "hecho" : "futuro"}
              >
                <span className="asistente__marca" aria-hidden="true">
                  {indice < paso ? <Icono nombre="check" tamano={13} /> : indice + 1}
                </span>
                {definicion.rotulo}
              </li>
            ))}
          </ol>
        </aside>

        <div className="asistente__cuerpo">
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
                placeholder="900123456-7"
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
                El tipo de actor decide qué documentos te exige la norma. Puedes cambiarlo mientras
                no hayas radicado.
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
                  opciones={DEPARTAMENTOS.map((departamento) => ({
                    valor: departamento.nombre,
                    etiqueta: departamento.nombre,
                  }))}
                  onChange={(evento) => actualizar("departamento")(evento.target.value)}
                />
                <CampoTexto
                  etiqueta="Municipio"
                  requerido
                  value={valores.municipio}
                  error={errores.municipio}
                  onChange={(evento) => actualizar("municipio")(evento.target.value)}
                />
              </div>
              <CampoTexto
                etiqueta="Representante legal"
                requerido
                value={valores.representante}
                error={errores.representante}
                ayuda="Recibirá la invitación para administrar la cuenta de la organización."
                onChange={(evento) => actualizar("representante")(evento.target.value)}
              />
              <div className="rejilla rejilla--2">
                <CampoTexto
                  etiqueta="Correo de contacto"
                  requerido
                  type="email"
                  value={valores.correo}
                  error={errores.correo}
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
                Estos son los soportes que la norma exige a un{" "}
                <strong>{TIPOS.find((tipo) => tipo.valor === valores.tipoActor)?.etiqueta}</strong>.
                Los marcados con asterisco bloquean la radicación hasta que los cargues.
              </p>
              {faltan && pendientes.length > 0 ? (
                <p className="asistente__aviso" role="alert">
                  Falta cargar {pendientes.length}{" "}
                  {pendientes.length === 1 ? "documento obligatorio" : "documentos obligatorios"}.
                </p>
              ) : null}
              <div className="pila" style={{ gap: "var(--e5)" }}>
                {requisitos.map((requisito) => (
                  <div key={requisito.documento} className="asistente__requisito">
                    <CampoArchivo
                      etiqueta={requisito.nombre}
                      requerido={requisito.obligatorio}
                      archivo={archivos[requisito.documento] ?? null}
                      error={rechazos[requisito.documento]}
                      ayuda={
                        requisito.automatico
                          ? `${requisito.norma} · el sistema además lo contrasta contra el RUES`
                          : requisito.norma
                      }
                      onArchivo={(archivo) => {
                        setArchivos((previos) => {
                          const siguiente = { ...previos };
                          if (archivo) siguiente[requisito.documento] = archivo;
                          else delete siguiente[requisito.documento];
                          return siguiente;
                        });
                        setRechazos((previos) => ({ ...previos, [requisito.documento]: undefined }));
                      }}
                      onRechazo={(motivo) =>
                        setRechazos((previos) => ({ ...previos, [requisito.documento]: motivo }))
                      }
                    />
                    <div className="asistente__sellos">
                      {vigenciaLegible(requisito.vigenciaMeses) ? (
                        <span className="asistente__sello">
                          {vigenciaLegible(requisito.vigenciaMeses)}
                        </span>
                      ) : null}
                      {requisito.obligatorio ? null : (
                        <span className="asistente__sello asistente__sello--suave">Opcional</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {paso === 4 ? (
            <div className="pila" style={{ gap: "var(--e4)" }}>
              <p className="asistente__intro">
                Al radicar, tu solicitud queda en validación. <strong>No podrás ingresar al
                sistema</strong> hasta que un administrador institucional valide los soportes.
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
                    {valores.municipio}, {valores.departamento}
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
                  const archivo = archivos[requisito.documento];
                  return (
                    <li key={requisito.documento} data-cargado={archivo ? "si" : "no"}>
                      <span className="asistente__adjunto-marca" aria-hidden="true">
                        <Icono nombre={archivo ? "check" : "documento"} tamano={14} />
                      </span>
                      <span className="asistente__adjunto-nombre">{requisito.nombre}</span>
                      <span className="asistente__adjunto-dato mono">
                        {archivo ? formatearPeso(archivo.size) : "sin cargar"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </Dialogo>
  );
};
