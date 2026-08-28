import { useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { ErrorNormativo } from "../../shared/ui/patrones/ErrorNormativo";
import { Tarjeta } from "../../shared/ui/primitivos/Tarjeta";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { CampoSelect, CampoTexto } from "../../shared/ui/primitivos/Campo";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { apiComercial } from "../../shared/api/clienteComercial";
import { aProblema } from "../../shared/api/problemDetails";
import { DEPARTAMENTOS } from "../../shared/api/mock/catalogos";
import type { TipoActor } from "../../shared/api/mock/tipos";

type Formulario = {
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

type Errores = Partial<Record<keyof Formulario, string>>;

const TIPOS: readonly { valor: TipoActor; etiqueta: string; detalle: string }[] = [
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

const validar = (valores: Formulario): Errores => {
  const errores: Errores = {};
  if (!/^\d{9,10}-\d$/.test(valores.nit.trim()))
    errores.nit = "Formato esperado: 900123456-7 (NIT con dígito de verificación).";
  if (valores.organizacion.trim().length < 6)
    errores.organizacion = "Indica la razón social completa.";
  if (!valores.departamento) errores.departamento = "Selecciona el departamento.";
  if (valores.municipio.trim().length < 3) errores.municipio = "Indica el municipio.";
  if (valores.representante.trim().length < 6)
    errores.representante = "Indica el nombre del representante legal.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valores.correo))
    errores.correo = "Indica un correo de contacto válido.";
  if (valores.telefono.trim().length < 7) errores.telefono = "Indica un teléfono de contacto.";
  return errores;
};

export const Registro = () => {
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Errores>({});
  const [radicado, setRadicado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [rechazo, setRechazo] = useState<unknown>(null);

  const actualizar = (campo: keyof Formulario) => (valor: string) =>
    setValores((previos) => ({ ...previos, [campo]: valor }));

  const remitir = async (evento: React.FormEvent) => {
    evento.preventDefault();
    const encontrados = validar(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    setRechazo(null);
    try {
      const solicitud = await apiComercial.radicarSolicitud(valores);
      setRadicado(solicitud.id);
    } catch (error) {
      setRechazo(error);
    } finally {
      setEnviando(false);
    }
  };

  if (radicado) {
    return (
      <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
        <Seo
          titulo="Solicitud recibida · SICAMED"
          descripcion="Tu solicitud de vinculación al Sistema de Información del Cannabis Medicinal fue recibida."
          ruta="/registro"
        />
        <div className="registro-exito">
          <span className="registro-exito__marca" aria-hidden="true">
            <Icono nombre="check" tamano={30} />
          </span>
          <h1>Solicitud recibida</h1>
          <p className="registro-exito__radicado mono">{radicado}</p>
          <p>
            Un analista de verificación documental abrirá tu expediente y te invitará por correo a{" "}
            <strong>{valores.correo}</strong> para que cargues los documentos que exige tu tipo de
            actor.
          </p>
          <p className="registro-exito__nota">
            Recibir la solicitud no constituye verificación ni validación de requisitos legales,
            licencias, registros sanitarios ni certificaciones. SICAMED no expide licencias: las
            otorga la autoridad competente según la modalidad.
          </p>
          <div className="fila" style={{ gap: "var(--e3)", justifyContent: "center" }}>
            <Link className="boton boton--primario" to="/">
              Volver al inicio
            </Link>
            <Link className="boton boton--secundario" to="/normativa">
              Consultar la normativa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
      <Seo
        titulo="Registrar mi organización · SICAMED"
        descripcion="Solicita la vinculación de tu organización al Sistema de Información del Cannabis Medicinal. El registro es voluntario y progresivo conforme al plan piloto."
        ruta="/registro"
      />

      <header className="seccion__encabezado">
        <p className="seccion__etiqueta">Vinculación al sistema</p>
        <h1 className="seccion__titulo">Registrar mi organización</h1>
        <p className="seccion__texto">
          La vinculación al sistema es voluntaria y progresiva conforme al plan piloto de la
          Resolución 1241 de 2026. Al enviar este formulario se radica una solicitud: un analista
          abrirá tu expediente y te indicará qué documentos exige tu tipo de actor.
        </p>
      </header>

      <div className="rejilla rejilla--2">
        <Tarjeta
          titulo="Datos de la organización"
          descripcion="Los campos marcados con asterisco son obligatorios"
        >
          <form
            onSubmit={(evento) => void remitir(evento)}
            noValidate
            className="pila"
            style={{ gap: "var(--e4)" }}
          >
            <div className="rejilla rejilla--2">
              <CampoTexto
                etiqueta="NIT"
                requerido
                value={valores.nit}
                error={errores.nit}
                ayuda="Se verifica contra el RUES."
                placeholder="900123456-7"
                onChange={(evento) => actualizar("nit")(evento.target.value)}
              />
              <CampoTexto
                etiqueta="Razón social"
                requerido
                value={valores.organizacion}
                error={errores.organizacion}
                onChange={(evento) => actualizar("organizacion")(evento.target.value)}
              />
            </div>

            <CampoSelect
              etiqueta="Tipo de actor"
              requerido
              value={valores.tipoActor}
              ayuda={TIPOS.find((tipo) => tipo.valor === valores.tipoActor)?.detalle}
              opciones={TIPOS.map((tipo) => ({ valor: tipo.valor, etiqueta: tipo.etiqueta }))}
              onChange={(evento) => actualizar("tipoActor")(evento.target.value)}
            />

            <div className="rejilla rejilla--2">
              <CampoSelect
                etiqueta="Departamento"
                requerido
                vacio="Selecciona un departamento"
                value={valores.departamento}
                error={errores.departamento}
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

            {rechazo ? (
              <ErrorNormativo problema={aProblema(rechazo)} onReintentar={() => setRechazo(null)} />
            ) : null}

            <div className="fila" style={{ gap: "var(--e3)" }}>
              <Boton type="submit" cargando={enviando}>
                Radicar solicitud
              </Boton>
              <Link className="boton boton--secundario" to="/">
                Cancelar
              </Link>
            </div>
          </form>
        </Tarjeta>

        <div className="pila" style={{ gap: "var(--e4)" }}>
          <Tarjeta
            titulo="Qué pasa después"
            descripcion="El trámite tiene pasos y responsables definidos"
          >
            <ol className="pila lista-numerada" style={{ gap: "var(--e3)" }}>
              {[
                "Se radica la solicitud y se crea tu organización en estado EN TRÁMITE.",
                "Se abre un expediente con el checklist de documentos de tu tipo de actor.",
                "Recibes una invitación por correo para cargar cada documento.",
                "Un analista documental verifica completitud, legibilidad e integridad.",
                "Un administrador institucional resuelve el paso final del trámite.",
              ].map((texto) => (
                <li key={texto}>{texto}</li>
              ))}
            </ol>
          </Tarjeta>

          <Tarjeta
            titulo="Lo que este registro no es"
            descripcion="Alcance estrictamente tecnológico"
          >
            <ul className="pila" style={{ gap: "var(--e3)", listStyle: "none", padding: 0 }}>
              {[
                "No es una licencia: las expide MinJusticia o MinSalud según la modalidad.",
                "No es un registro sanitario: lo expide el INVIMA.",
                "No es una habilitación: SICAMED verifica evidencia documental, no autoriza.",
                "No es un canal de transacción: la vitrina divulga, no comercializa.",
              ].map((texto) => (
                <li
                  key={texto}
                  className="fila"
                  style={{ gap: "var(--e3)", alignItems: "flex-start" }}
                >
                  <span style={{ color: "var(--rojo-600)", marginTop: 2 }}>
                    <Icono nombre="cerrar" tamano={16} />
                  </span>
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
};
