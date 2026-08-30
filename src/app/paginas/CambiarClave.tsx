import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { cambiarClave } from "../../shared/api/rest/identidad";
import { CLAVE_MINIMA } from "../../shared/api/rest/actores";
import { erroresPorCampo } from "../../shared/api/problemDetails";
import { aProblema } from "../../shared/api/problemDetails";
import { mensajeDelRechazo } from "../../shared/auth/rechazos";
import { useComprobante } from "../../shared/seguridad/useComprobante";
import { ComprobacionSeguridad } from "../../shared/ui/patrones/ComprobacionSeguridad";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { CampoClave, CampoTexto } from "../../shared/ui/primitivos/Campo";
import { Icono } from "../../shared/ui/primitivos/Icono";

type EstadoUbicacion = { correo?: string };

type Formulario = {
  correo: string;
  claveActual: string;
  claveNueva: string;
  claveRepetida: string;
};

export const validarCambio = (valores: Formulario): Readonly<Record<string, string>> => {
  const errores: Record<string, string> = {};
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valores.correo.trim()))
    errores.correo = "Escribe el correo con el que entras a SICAMED.";
  if (valores.claveActual.length === 0)
    errores.claveActual = "Escribe la contraseña que te entregaron.";
  if (valores.claveNueva.length < CLAVE_MINIMA)
    errores.claveNueva = `La contraseña nueva debe tener al menos ${CLAVE_MINIMA} caracteres.`;
  else if (valores.claveNueva === valores.claveActual)
    errores.claveNueva = "La contraseña nueva no puede ser igual a la anterior.";
  if (valores.claveRepetida !== valores.claveNueva)
    errores.claveRepetida = "Las dos contraseñas no coinciden.";
  return errores;
};

export const CambiarClave = () => {
  const ubicacion = useLocation();
  const comprobante = useComprobante();
  const [valores, setValores] = useState<Formulario>({
    correo: (ubicacion.state as EstadoUbicacion | null)?.correo ?? "",
    claveActual: "",
    claveNueva: "",
    claveRepetida: "",
  });
  const [errores, setErrores] = useState<Readonly<Record<string, string>>>({});
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState(false);

  const escribir = (campo: keyof Formulario) => (valor: string) => {
    setValores((previos) => ({ ...previos, [campo]: valor }));
    setFallo(null);
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const encontrados = validarCambio(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    try {
      await cambiarClave({
        correo: valores.correo.trim(),
        claveActual: valores.claveActual,
        claveNueva: valores.claveNueva,
        captcha: await comprobante.consumir(),
      });
      setHecho(true);
    } catch (error) {
      const problema = aProblema(error);
      setErrores(erroresPorCampo(problema));
      setFallo(mensajeDelRechazo(error));
    }
    setEnviando(false);
  };

  return (
    <div className="acceso" data-modo="operacion">
      <Seo
        titulo="Cambiar la contraseña"
        descripcion="Sustituye la contraseña provisional que te entregó un administrador."
        ruta="/acceso/clave"
        noIndexar
      />

      <div className="acceso__panel">
        <div className="acceso__caja">
          <Link to="/" className="marca acceso__marca">
            <img src="/marca/isotipo.svg" alt="" width={38} height={38} />
            <span className="marca__bloque">
              <span className="marca__texto">
                SICA<span>MED</span>
              </span>
              <span className="marca__lema">Sistema de Información del Cannabis Medicinal</span>
            </span>
          </Link>

          <p className="acceso__rotulo">Contraseña de tránsito</p>
          <h1 className="acceso__titulo">Cambiar la contraseña</h1>
          <p className="acceso__entrada">
            La contraseña que te entregó un administrador no abre sesión: sirve una sola vez, aquí,
            para que elijas la tuya. Nadie más debe conocerla.
          </p>

          {hecho ? (
            <div role="status" className="acceso__aviso">
              <Icono nombre="check" tamano={17} />
              <p>
                Tu contraseña quedó cambiada. <Link to="/acceso">Entra con la nueva</Link>.
              </p>
            </div>
          ) : null}

          {fallo ? (
            <div role="alert" className="acceso__aviso">
              <Icono nombre="alerta" tamano={17} />
              <p>{fallo}</p>
            </div>
          ) : null}

          {hecho ? null : (
            <form className="acceso__formulario" onSubmit={(evento) => void enviar(evento)}>
              <CampoTexto
                etiqueta="Correo institucional"
                type="email"
                inputMode="email"
                autoComplete="username"
                requerido
                value={valores.correo}
                error={errores.correo}
                onChange={(evento) => escribir("correo")(evento.target.value)}
              />
              <CampoClave
                etiqueta="Contraseña actual"
                autoComplete="current-password"
                requerido
                value={valores.claveActual}
                error={errores.claveActual}
                onChange={(evento) => escribir("claveActual")(evento.target.value)}
              />
              <CampoClave
                etiqueta="Contraseña nueva"
                autoComplete="new-password"
                requerido
                ayuda={`Mínimo ${CLAVE_MINIMA} caracteres.`}
                value={valores.claveNueva}
                error={errores.claveNueva}
                onChange={(evento) => escribir("claveNueva")(evento.target.value)}
              />
              <CampoClave
                etiqueta="Repite la contraseña nueva"
                autoComplete="new-password"
                requerido
                value={valores.claveRepetida}
                error={errores.claveRepetida}
                onChange={(evento) => escribir("claveRepetida")(evento.target.value)}
              />

              {comprobante.exige ? (
                <ComprobacionSeguridad
                  key={comprobante.ronda}
                  onToken={comprobante.recibir}
                  accion="cambio-de-clave"
                />
              ) : null}

              <Boton
                type="submit"
                bloque
                tamano="lg"
                cargando={enviando}
                disabled={comprobante.exige && !comprobante.listo}
              >
                Cambiar la contraseña
              </Boton>
            </form>
          )}

          <p className="acceso__pie">
            <Link to="/acceso">Volver al ingreso</Link>
            <Link to="/registro">Registrar mi organización</Link>
          </p>
        </div>
      </div>

      <aside className="acceso__escenario" data-modo="operacion">
        <div>
          <p className="acceso__rotulo-claro">Por qué esta pantalla existe</p>
          <p className="acceso__titular">
            Una contraseña que conoce quien la asignó no puede servir para entrar: se cambia antes
            del primer acceso.
          </p>
        </div>
        <p className="acceso__nota-clara">
          El cambio no devuelve una sesión. Cuando termines, entra con la contraseña nueva desde la
          pantalla de acceso.
        </p>
      </aside>
    </div>
  );
};
