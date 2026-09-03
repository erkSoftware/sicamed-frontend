import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Seo } from "../../shared/seo/Seo";
import { CodigoQr } from "../../shared/ui/patrones/CodigoQr";
import { ErrorNormativo } from "../../shared/ui/patrones/ErrorNormativo";
import { CampoTexto } from "../../shared/ui/primitivos/Campo";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { Insignia } from "../../shared/ui/primitivos/Insignia";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { apiPublica } from "../../shared/api/clientePublico";
import { aProblema } from "../../shared/api/problemDetails";
import { fecha, fechaHora } from "../../shared/i18n/formato";

const TONO = {
  ACTIVA: "exito",
  SUSPENDIDA: "alerta",
  VENCIDA: "neutro",
  REVOCADA: "peligro",
} as const;

const ETIQUETA = {
  ACTIVA: "Activa",
  SUSPENDIDA: "Suspendida",
  VENCIDA: "Vencida",
  REVOCADA: "Revocada",
} as const;

const NIVEL = {
  DOCUMENTO: "documento cotejado",
  PRESENCIAL: "verificación presencial en la IPS",
  BIOMETRICO: "verificación biométrica",
} as const;

export const CredencialPublica = () => {
  const [codigo, setCodigo] = useState("");
  const consulta = useMutation({ mutationFn: apiPublica.credencial });
  const credencial = consulta.data;

  return (
    <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
      <Seo
        titulo="Tu credencial de paciente"
        descripcion="Consulta el estado de tu credencial digital de SICAMED y el código que debes presentar en la farmacia."
        ruta="/paciente"
      />

      <nav aria-label="Ruta de navegación">
        <ol className="migas">
          <li>
            <Link to="/">Inicio</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Tu credencial</li>
        </ol>
      </nav>

      <div className="prosa">
        <h1 className="seccion__titulo">Tu credencial de paciente</h1>
        <p>
          La credencial es tu identificador digital ante las farmacias licenciadas. La presentas en
          el mostrador cuando vas a retirar tu fórmula: quien te atiende comprueba que está activa y
          registra la entrega, sin ver tu diagnóstico ni tu historia clínica.
        </p>
        <p>
          <strong>El retiro es siempre presencial.</strong> Los medicamentos sometidos a
          fiscalización no pueden comercializarse por internet, correo ni medio similar, y ningún
          servicio de domicilio está habilitado para ellos.
        </p>
      </div>

      <div className="credencial-publica">
        <form
          className="credencial-publica__consulta"
          onSubmit={(evento) => {
            evento.preventDefault();
            consulta.mutate(codigo);
          }}
        >
          <CampoTexto
            etiqueta="Código de tu credencial"
            requerido
            value={codigo}
            placeholder="ABCD-2345"
            ayuda="Aparece en la aplicación con la que te registraste. Cambia cada cierto tiempo."
            onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
          />
          <Boton type="submit" icono="buscar" cargando={consulta.isPending}>
            Consultar estado
          </Boton>
        </form>

        <div aria-live="polite" className="credencial-publica__resultado">
          {consulta.error ? <ErrorNormativo problema={aProblema(consulta.error)} /> : null}

          {credencial ? (
            <div className="credencial-publica__ficha">
              <CodigoQr
                valor={credencial.codigoRotatorio}
                etiqueta={`Código de la credencial ${credencial.seudonimo}`}
                tamano={200}
              />
              <dl className="pila" style={{ gap: "var(--e4)" }}>
                <div>
                  <dt className="kpi__etiqueta">Identificador</dt>
                  <dd className="mono">{credencial.seudonimo}</dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Estado</dt>
                  <dd>
                    <Insignia tono={TONO[credencial.estado]}>{ETIQUETA[credencial.estado]}</Insignia>
                  </dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Vigente hasta</dt>
                  <dd>{fecha(credencial.vence)}</dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Nivel de verificación</dt>
                  <dd>Emitida con {NIVEL[credencial.nivelVerificacion]}</dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Código vigente desde</dt>
                  <dd>{fechaHora(credencial.ultimaRotacion)}</dd>
                </div>
                {credencial.motivo ? (
                  <div>
                    <dt className="kpi__etiqueta">Nota</dt>
                    <dd>{credencial.motivo}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}
        </div>
      </div>

      <div className="aviso aviso--info">
        <Icono nombre="candado" tamano={18} />
        <p>
          En esta página no aparece tu nombre, tu documento ni tu diagnóstico. SICAMED trabaja con
          un identificador que no revela quién eres: tu historia clínica queda con tu médico
          tratante y nunca sale de la zona clínica.
        </p>
      </div>
    </div>
  );
};
