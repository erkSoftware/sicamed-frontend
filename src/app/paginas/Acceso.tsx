import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { useAuth } from "../../shared/auth/useAuth";
import { esModoDemostracion } from "../../shared/auth/proveedor";
import { PERFILES_DEMO } from "../../shared/auth/perfiles";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { CampoTexto } from "../../shared/ui/primitivos/Campo";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { iniciales } from "../../shared/i18n/formato";

type EstadoUbicacion = { destino?: string };

export const Acceso = () => {
  const { estado, iniciarSesion, error } = useAuth();
  const ubicacion = useLocation();
  const destino = (ubicacion.state as EstadoUbicacion | null)?.destino ?? "/app";
  const [perfil, setPerfil] = useState(PERFILES_DEMO[0]?.clave ?? "");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!esModoDemostracion && estado === "anonimo") void iniciarSesion();
  }, [estado, iniciarSesion]);

  if (estado === "autenticado") return <Navigate to={destino} replace />;

  const entrar = async () => {
    setEnviando(true);
    await iniciarSesion(perfil);
    setEnviando(false);
  };

  return (
    <div className="acceso">
      <Seo
        titulo="Ingresar a la plataforma"
        descripcion="Acceso de actores habilitados al sistema de información del cannabis medicinal."
        ruta="/acceso"
        noIndexar
      />

      <div className="acceso__panel">
        <Link to="/" className="marca" style={{ marginBottom: "var(--e6)" }}>
          <img src="/marca/isotipo.svg" alt="" width={40} height={40} />
          <span className="marca__bloque">
            <span className="marca__texto">
              SICA<span>MED</span>
            </span>
            <span className="marca__lema">Sistema de Información del Cannabis Medicinal</span>
          </span>
        </Link>

        <h1 className="seccion__titulo" style={{ marginBottom: "var(--e2)" }}>
          Ingresar a la plataforma
        </h1>
        <p style={{ color: "var(--texto-suave)", marginBottom: "var(--e6)" }}>
          El acceso está reservado a actores registrados. La consulta de la vitrina pública no
          requiere autenticación.
        </p>

        {error ? (
          <div role="alert" className="aviso" style={{ borderColor: "#F0BFBF", background: "var(--peligro-fondo)", color: "var(--rojo-700)", marginBottom: "var(--e4)" }}>
            <Icono nombre="alerta" tamano={18} />
            <p>{error}</p>
          </div>
        ) : null}

        {esModoDemostracion ? (
          <>
            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend className="campo__etiqueta" style={{ marginBottom: "var(--e3)" }}>
                Selecciona un perfil de demostración
              </legend>
              <div className="perfiles-demo">
                {PERFILES_DEMO.map((opcion) => (
                  <button
                    key={opcion.clave}
                    type="button"
                    className="perfil-demo"
                    aria-pressed={perfil === opcion.clave}
                    onClick={() => setPerfil(opcion.clave)}
                  >
                    <span className="avatar" aria-hidden="true">
                      {iniciales(opcion.nombre)}
                    </span>
                    <span className="perfil-demo__cuerpo">
                      <span className="perfil-demo__nombre">{opcion.nombre}</span>
                      <span className="perfil-demo__rol">{opcion.rol}</span>
                      <span className="perfil-demo__rol">{opcion.descripcion}</span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <Boton
              bloque
              tamano="lg"
              cargando={enviando}
              onClick={() => void entrar()}
              className="boton--bloque"
              style={{ marginTop: "var(--e5)" }}
            >
              Entrar con este perfil
            </Boton>

            <p style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)", marginTop: "var(--e4)" }}>
              Modo de demostración con datos ficticios. En producción el acceso se realiza mediante
              Cloudflare Access u OIDC con PKCE, sin secreto de cliente en el navegador y con el
              token únicamente en memoria.
            </p>
          </>
        ) : (
          <form
            className="pila"
            style={{ gap: "var(--e4)" }}
            onSubmit={(evento) => {
              evento.preventDefault();
              void iniciarSesion();
            }}
          >
            <CampoTexto
              etiqueta="Correo institucional"
              type="email"
              autoComplete="username"
              requerido
              ayuda="Serás redirigido al proveedor de identidad configurado."
            />
            <Boton type="submit" bloque tamano="lg" cargando={estado === "cargando"}>
              Continuar
            </Boton>
          </form>
        )}

        <p style={{ marginTop: "var(--e6)" }}>
          <Link to="/vitrina">Consultar la vitrina sin ingresar</Link>
        </p>
      </div>

      <aside className="acceso__aparte">
        <p className="heroe-panel__etiqueta">Lo que verás dentro</p>
        <p className="acceso__cita">
          «Publicación rechazada por falta de habilitación vigente. Fundamento normativo: Res.
          1241/2026 Art. 13b.»
        </p>
        <p style={{ color: "rgba(255,255,255,0.75)", position: "relative" }}>
          Un rechazo que el usuario no puede explicarle a su abogado es un rechazo mal diseñado.
          SICAMED cita siempre la norma que fundamenta cada decisión del sistema.
        </p>
      </aside>
    </div>
  );
};
