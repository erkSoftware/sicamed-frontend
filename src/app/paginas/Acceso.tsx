import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { useAuth } from "../../shared/auth/useAuth";
import { esModoDemostracion } from "../../shared/auth/proveedor";
import { DURACION_SESION_MS, PERFILES_DEMO } from "../../shared/auth/perfiles";
import { EscenaCadena } from "../../shared/ui/graficos/escena/EscenaCadena";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { CampoTexto } from "../../shared/ui/primitivos/Campo";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { iniciales } from "../../shared/i18n/formato";

type EstadoUbicacion = { destino?: string };

const CLAVE_DEMOSTRACION = "demo-sicamed";

const MINUTOS_SESION = Math.round(DURACION_SESION_MS / 60000);

export const Acceso = () => {
  const { estado, iniciarSesion, error } = useAuth();
  const ubicacion = useLocation();
  const destino = (ubicacion.state as EstadoUbicacion | null)?.destino ?? "/app";
  const idClave = useId();
  const [perfil, setPerfil] = useState(PERFILES_DEMO[0]?.clave ?? "");
  const [correo, setCorreo] = useState(esModoDemostracion ? (PERFILES_DEMO[0]?.correo ?? "") : "");
  const [clave, setClave] = useState(esModoDemostracion ? CLAVE_DEMOSTRACION : "");
  const [verClave, setVerClave] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!esModoDemostracion && estado === "anonimo") void iniciarSesion();
  }, [estado, iniciarSesion]);

  if (estado === "autenticado") return <Navigate to={destino} replace />;

  const entrar = async (clavePerfil: string) => {
    setEnviando(true);
    await iniciarSesion(clavePerfil);
    setEnviando(false);
  };

  const elegir = (clavePerfil: string, correoPerfil: string) => {
    setPerfil(clavePerfil);
    setCorreo(correoPerfil);
    setClave(CLAVE_DEMOSTRACION);
    setFallo(null);
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (!esModoDemostracion) {
      void iniciarSesion();
      return;
    }
    const encontrado = PERFILES_DEMO.find(
      (opcion) => opcion.correo.toLowerCase() === correo.trim().toLowerCase(),
    );
    if (!encontrado) {
      setFallo(
        "Ese correo no corresponde a ningún actor registrado en la demostración. Elige uno de los perfiles de abajo.",
      );
      return;
    }
    if (clave.trim().length < 4) {
      setFallo("Escribe la contraseña de tu cuenta para continuar.");
      return;
    }
    setFallo(null);
    void entrar(encontrado.clave);
  };

  const mensaje = fallo ?? error;

  return (
    <div className="acceso">
      <Seo
        titulo="Ingresar a la plataforma"
        descripcion="Acceso de actores habilitados al sistema de información del cannabis medicinal."
        ruta="/acceso"
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

          <p className="acceso__rotulo">Acceso de actores habilitados</p>
          <h1 className="acceso__titulo">Ingresar a la plataforma</h1>
          <p className="acceso__entrada">
            Identifícate con el correo de tu organización. La vitrina pública se consulta sin
            autenticación.
          </p>

          {mensaje ? (
            <div role="alert" className="acceso__aviso">
              <Icono nombre="alerta" tamano={17} />
              <p>{mensaje}</p>
            </div>
          ) : null}

          <form className="acceso__formulario" onSubmit={enviar}>
            <CampoTexto
              etiqueta="Correo institucional"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="nombre@organizacion.co"
              requerido
              value={correo}
              onChange={(evento) => {
                setCorreo(evento.target.value);
                setFallo(null);
              }}
            />

            <div className="campo">
              <div className="acceso__campo-cabecera">
                <label className="campo__etiqueta" htmlFor={idClave}>
                  Contraseña
                  <span className="campo__requerido" aria-hidden="true">
                    *
                  </span>
                </label>
                <button
                  type="button"
                  className="acceso__ver"
                  aria-pressed={verClave}
                  onClick={() => setVerClave((valor) => !valor)}
                >
                  {verClave ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                id={idClave}
                className="campo__control"
                type={verClave ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={clave}
                onChange={(evento) => {
                  setClave(evento.target.value);
                  setFallo(null);
                }}
              />
              <span className="campo__ayuda">
                La restablece el administrador de tu organización.
              </span>
            </div>

            <p className="acceso__opciones">
              <span className="mono">
                <Icono nombre="candado" tamano={13} /> Sesión de {MINUTOS_SESION} minutos
              </span>
              <span className="mono">Token solo en memoria</span>
            </p>

            <Boton type="submit" bloque tamano="lg" cargando={enviando}>
              Entrar
            </Boton>
          </form>

          <p className="acceso__separador">
            <span>o continúa con</span>
          </p>

          <Boton
            variante="secundario"
            bloque
            icono="escudo"
            cargando={estado === "cargando"}
            onClick={() => void entrar(perfil)}
          >
            Continuar con identidad institucional
          </Boton>

          {esModoDemostracion ? (
            <section className="acceso__demo">
              <p className="acceso__demo-titulo">
                <span>Perfiles de demostración</span>
                <span>{PERFILES_DEMO.length} cuentas</span>
              </p>
              <div className="perfiles-demo">
                {PERFILES_DEMO.map((opcion) => (
                  <button
                    key={opcion.clave}
                    type="button"
                    className="perfil-demo"
                    aria-pressed={perfil === opcion.clave}
                    title={opcion.descripcion}
                    onClick={() => elegir(opcion.clave, opcion.correo)}
                  >
                    <span className="avatar" aria-hidden="true">
                      {iniciales(opcion.nombre)}
                    </span>
                    <span className="perfil-demo__cuerpo">
                      <span className="perfil-demo__nombre">{opcion.nombre}</span>
                      <span className="perfil-demo__rol">{opcion.rol}</span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="acceso__nota">
                Al elegir un perfil se completa el formulario con su correo. En la demostración la
                contraseña no se verifica contra ningún directorio. En producción el acceso se
                resuelve con Cloudflare Access u OIDC con PKCE, sin secreto de cliente en el
                navegador.
              </p>
            </section>
          ) : null}

          <p className="acceso__pie">
            <Link to="/vitrina">Consultar la vitrina sin ingresar</Link>
            <Link to="/normativa" className="mono">
              Marco normativo
            </Link>
          </p>
        </div>
      </div>

      <aside className="acceso__escenario">
        <div>
          <p className="acceso__rotulo-claro">SICAMED en operación</p>
          <p className="acceso__titular">
            De la finca al laboratorio, a la IPS o al puerto: cada paso deja un evento que nadie
            puede reescribir.
          </p>
        </div>

        <EscenaCadena />

        <p className="acceso__nota-clara">
          Recorre la cadena y elige quién recibe el lote. Es el mismo histórico que verás adentro:
          el que le permite a un actor presentarse ante un comprador con la trazabilidad en la mano.
        </p>
      </aside>
    </div>
  );
};
