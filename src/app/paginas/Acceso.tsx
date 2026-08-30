import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { useAuth } from "../../shared/auth/useAuth";
import { esModoDemostracion, pideCredenciales } from "../../shared/auth/proveedor";
import { useComprobante } from "../../shared/seguridad/useComprobante";
import { ComprobacionSeguridad } from "../../shared/ui/patrones/ComprobacionSeguridad";
import type { Credenciales } from "../../shared/auth/tipos";
import { PERFILES_DEMO } from "../../shared/auth/perfiles";
import { EscenaCadena } from "../../shared/ui/graficos/escena/EscenaCadena";
import { PeliculaTelemedicina } from "../../shared/ui/graficos/telemedicina/PeliculaTelemedicina";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { CampoClave, CampoTexto } from "../../shared/ui/primitivos/Campo";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { iniciales } from "../../shared/i18n/formato";

type EstadoUbicacion = { destino?: string };

type ModoAcceso = "operacion" | "telemedicina";

type Presentacion = {
  rotulo: string;
  titulo: string;
  entrada: string;
};

const CLAVE_DEMOSTRACION = "demo-sicamed";

const PARAMETRO_IPS = "is_ips";

const AFIRMATIVOS = new Set(["true", "1", "si", "sí"]);

const MODOS: readonly { clave: ModoAcceso; nombre: string }[] = [
  { clave: "operacion", nombre: "SICAMED en operación" },
  { clave: "telemedicina", nombre: "Telemedicina" },
];

const PRESENTACIONES: Record<ModoAcceso, Presentacion> = {
  operacion: {
    rotulo: "Acceso de actores habilitados",
    titulo: "Ingresar a la plataforma",
    entrada:
      "Identifícate con el correo de tu organización. La vitrina pública se consulta sin autenticación.",
  },
  telemedicina: {
    rotulo: "Acceso IPS · Telemedicina",
    titulo: "Ingresar a la consulta",
    entrada:
      "Identifícate con el correo de tu IPS habilitada. Son las mismas credenciales de SICAMED: cambia la vista, no la cuenta.",
  },
};

export const modoDesdeParametro = (valor: string | null): ModoAcceso =>
  valor !== null && AFIRMATIVOS.has(valor.trim().toLowerCase()) ? "telemedicina" : "operacion";

export const Acceso = () => {
  const { estado, iniciarSesion, error } = useAuth();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const comprobante = useComprobante();
  const [parametros, fijarParametros] = useSearchParams();
  const modo = modoDesdeParametro(parametros.get(PARAMETRO_IPS));
  const presentacion = PRESENTACIONES[modo];
  const destino = (ubicacion.state as EstadoUbicacion | null)?.destino ?? "/app";
  const [perfil, setPerfil] = useState(PERFILES_DEMO[0]?.clave ?? "");
  const [correo, setCorreo] = useState(esModoDemostracion ? (PERFILES_DEMO[0]?.correo ?? "") : "");
  const [clave, setClave] = useState(esModoDemostracion ? CLAVE_DEMOSTRACION : "");
  const [fallo, setFallo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!pideCredenciales && estado === "anonimo") void iniciarSesion();
  }, [estado, iniciarSesion]);

  if (estado === "autenticado") return <Navigate to={destino} replace />;

  const entrar = async (credenciales?: Credenciales) => {
    setEnviando(true);
    await iniciarSesion(credenciales);
    setEnviando(false);
  };

  const entrarContraElServidor = async () => {
    setEnviando(true);
    try {
      const rechazo = await iniciarSesion({
        usuario: correo,
        clave,
        captcha: await comprobante.consumir(),
      });
      if (rechazo === "transito") navegar("/acceso/clave", { state: { correo } });
    } catch (fallo) {
      setFallo(fallo instanceof Error ? fallo.message : "No fue posible completar la comprobación.");
    }
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
    if (!pideCredenciales) {
      void iniciarSesion();
      return;
    }
    if (!esModoDemostracion) {
      if (!correo.trim() || !clave) {
        setFallo("Escribe tu correo y tu contraseña para continuar.");
        return;
      }
      setFallo(null);
      void entrarContraElServidor();
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
    void entrar({ perfilDemo: encontrado.clave });
  };

  const cambiarModo = (siguiente: ModoAcceso) => {
    const proximos = new URLSearchParams(parametros);
    if (siguiente === "telemedicina") proximos.set(PARAMETRO_IPS, "true");
    else proximos.delete(PARAMETRO_IPS);
    fijarParametros(proximos, { replace: true });
  };

  const mensaje = fallo ?? error;

  return (
    <div className="acceso" data-modo={modo}>
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

          <div className="acceso__modos" role="group" aria-label="Vista de acceso">
            {MODOS.map((opcion) => (
              <button
                key={opcion.clave}
                type="button"
                className="acceso__modo"
                aria-pressed={modo === opcion.clave}
                onClick={() => cambiarModo(opcion.clave)}
              >
                {opcion.nombre}
              </button>
            ))}
          </div>

          <p className="acceso__rotulo">{presentacion.rotulo}</p>
          <h1 className="acceso__titulo">{presentacion.titulo}</h1>
          <p className="acceso__entrada">{presentacion.entrada}</p>

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

            <CampoClave
              etiqueta="Contraseña"
              autoComplete="current-password"
              placeholder="••••••••"
              requerido
              value={clave}
              onChange={(evento) => {
                setClave(evento.target.value);
                setFallo(null);
              }}
            />

            {comprobante.exige ? (
              <ComprobacionSeguridad
                key={comprobante.ronda}
                onToken={comprobante.recibir}
                accion="acceso"
                nota={null}
              />
            ) : null}

            <Boton
              type="submit"
              bloque
              tamano="lg"
              cargando={enviando}
              disabled={comprobante.exige && !comprobante.listo}
            >
              Entrar
            </Boton>
          </form>

          {esModoDemostracion ? (
            <>
              <p className="acceso__separador">
                <span>o continúa con</span>
              </p>

              <Boton
                variante="secundario"
                bloque
                icono="escudo"
                cargando={estado === "cargando"}
                onClick={() => void entrar({ perfilDemo: perfil })}
              >
                Continuar con identidad institucional
              </Boton>
            </>
          ) : null}

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
            <Link to="/registro">Registrar mi organización</Link>
            <Link to="/acceso/clave">Cambiar mi contraseña</Link>
          </p>

          <p className="acceso__pie acceso__pie--tenue">
            <Link to="/vitrina">Consultar la vitrina sin ingresar</Link>
            <Link to="/normativa">Marco normativo</Link>
          </p>
        </div>
      </div>

      <aside className="acceso__escenario" data-modo={modo}>
        {modo === "telemedicina" ? (
          <PeliculaTelemedicina />
        ) : (
          <>
            <div>
              <p className="acceso__rotulo-claro">SICAMED en operación</p>
              <p className="acceso__titular">
                De la finca al laboratorio, a la IPS o al puerto: cada paso deja un evento que nadie
                puede reescribir.
              </p>
            </div>

            <EscenaCadena />

            <p className="acceso__nota-clara">
              Recorre la cadena y elige quién recibe el lote. Es el mismo histórico que verás
              adentro: el que le permite a un actor presentarse ante un comprador con la
              trazabilidad en la mano.
            </p>
          </>
        )}
      </aside>
    </div>
  );
};
