import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { ComprobacionSeguridad } from "../../shared/ui/patrones/ComprobacionSeguridad";
import { useComprobante } from "../../shared/seguridad/useComprobante";
import { apiComercial } from "../../shared/api/clienteComercial";
import { aProblema } from "../../shared/api/problemDetails";
import type { ProblemDetail } from "../../shared/api/problemDetails";
import { Lamina } from "./Laminas";

type Estado =
  | { fase: "comprobando" }
  | { fase: "verificado"; mensaje: string }
  | { fase: "caducado"; problema: ProblemDetail }
  | { fase: "fallido"; problema: ProblemDetail };

const CADUCADO = "enlace-de-verificacion-caducado";

export const VerificacionCorreo = () => {
  const [parametros] = useSearchParams();
  const solicitud = parametros.get("solicitud") ?? "";
  const token = parametros.get("token") ?? "";
  const comprobante = useComprobante();
  const [estado, setEstado] = useState<Estado>({ fase: "comprobando" });
  const lanzado = useRef(false);

  useEffect(() => {
    if (lanzado.current) return;
    if (!solicitud || !token) {
      lanzado.current = true;
      setEstado({
        fase: "fallido",
        problema: {
          type: "https://sicamed.co/problemas/verificacion-de-correo-invalida",
          title: "El enlace está incompleto",
          detail:
            "Le faltan el número de solicitud o el token. Ábrelo tal como llegó al correo, sin " +
            "recortarlo ni copiarlo a trozos.",
          status: 400,
        },
      });
      return;
    }
    if (comprobante.exige && !comprobante.listo) return;

    lanzado.current = true;
    void (async () => {
      try {
        const resultado = await apiComercial.verificarCorreo({
          solicitudId: solicitud,
          token,
          captcha: await comprobante.consumir(),
        });
        setEstado({ fase: "verificado", mensaje: resultado.mensaje });
      } catch (error) {
        const problema = aProblema(error);
        setEstado({
          fase: problema.status === 410 || problema.type.endsWith(CADUCADO) ? "caducado" : "fallido",
          problema,
        });
      }
    })();
  }, [comprobante, solicitud, token]);

  return (
    <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
      <Seo
        titulo="Verificación del correo · SICAMED"
        descripcion="Confirmación del correo de contacto de una solicitud de vinculación radicada en SICAMED."
        ruta="/registro/verificacion"
        noIndexar
      />

      <div className="registro-espera">
        <Lamina motivo="sello" />
        <p className="seccion__etiqueta">Verificación del correo</p>

        {estado.fase === "comprobando" ? (
          <>
            <h1>Comprobando el enlace</h1>
            <p className="registro-espera__texto">
              Estamos confirmando el correo de la solicitud <span className="mono">{solicitud}</span>
              .
            </p>
            {comprobante.exige ? (
              <ComprobacionSeguridad
                key={comprobante.ronda}
                accion="verificar-correo"
                onToken={comprobante.recibir}
              />
            ) : null}
          </>
        ) : null}

        {estado.fase === "verificado" ? (
          <>
            <h1>Correo verificado</h1>
            <p className="registro-espera__radicado mono">{solicitud}</p>
            <p className="registro-espera__texto">{estado.mensaje}</p>
            <p className="registro-espera__nota">
              Esto no acelera el trámite ni lo desbloquea: la solicitud ya estaba en cola desde que
              la radicaste. Solo marca una casilla que el analista ve al abrir el expediente.
            </p>
          </>
        ) : null}

        {estado.fase === "caducado" ? (
          <>
            <h1>El enlace ya caducó</h1>
            <p className="registro-espera__radicado mono">{solicitud}</p>
            <p className="registro-espera__texto">{estado.problema.detail}</p>
            <p className="registro-espera__aviso">
              <span className="registro-espera__candado" aria-hidden="true">
                <Icono nombre="candado" tamano={16} />
              </span>
              <span>
                Tu solicitud sigue viva y en cola. Todavía no hay reenvío del enlace: el correo se
                verifica en la revisión del expediente.
              </span>
            </p>
          </>
        ) : null}

        {estado.fase === "fallido" ? (
          <>
            <h1>{estado.problema.title}</h1>
            <p className="registro-espera__texto">{estado.problema.detail}</p>
            {estado.problema.solicitudId ? (
              <p className="registro-espera__nota mono">{estado.problema.solicitudId}</p>
            ) : null}
          </>
        ) : null}

        <div className="fila" style={{ gap: "var(--e3)", justifyContent: "center" }}>
          <Link className="boton boton--primario" to="/">
            Volver al inicio
          </Link>
          <Link className="boton boton--secundario" to="/acceso">
            Ir al acceso
          </Link>
        </div>
      </div>
    </div>
  );
};
