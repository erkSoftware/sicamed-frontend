import { useState } from "react";
import { Link } from "react-router-dom";
import { Seo } from "../../shared/seo/Seo";
import { Tarjeta } from "../../shared/ui/primitivos/Tarjeta";
import { Boton } from "../../shared/ui/primitivos/Boton";
import { Icono } from "../../shared/ui/primitivos/Icono";
import { AsistenteRegistro, TIPOS } from "../registro/AsistenteRegistro";
import { Lamina } from "../registro/Laminas";
import { porAportar } from "../registro/requisitos";

type Radicada = { radicado: string; correo: string; faltantes: number };

const PASOS_TRAMITE = [
  "Radicas la solicitud con todos los soportes que exige tu tipo de actor.",
  "Se abre un expediente y los documentos entran en cola de verificación.",
  "Un analista documental revisa completitud, legibilidad e integridad.",
  "Un administrador institucional valida el expediente y habilita el acceso.",
  "Recibes la invitación por correo para administrar la cuenta.",
];

const LIMITES = [
  "No es una licencia: las expide MinJusticia o MinSalud según la modalidad.",
  "No es un registro sanitario: lo expide el INVIMA.",
  "No es una habilitación: SICAMED verifica evidencia documental, no autoriza.",
  "No es un canal de transacción: la vitrina divulga, no comercializa.",
];

export const Registro = () => {
  const [abierto, setAbierto] = useState(false);
  const [radicada, setRadicada] = useState<Radicada | null>(null);

  if (radicada) {
    return (
      <div className="contenedor" style={{ paddingBottom: "var(--e8)" }}>
        <Seo
          titulo="Solicitud en validación · SICAMED"
          descripcion="Tu solicitud de vinculación al Sistema de Información del Cannabis Medicinal quedó radicada y está en validación."
          ruta="/registro"
        />
        <div className="registro-espera">
          <Lamina motivo="sello" />
          <p className="seccion__etiqueta">Solicitud radicada</p>
          <h1>Ahora queda en validación</h1>
          <p className="registro-espera__radicado mono">{radicada.radicado}</p>
          <p className="registro-espera__texto">
            Recibimos tu solicitud y sus soportes. Un analista documental los revisa y un
            administrador institucional resuelve el trámite.
          </p>
          <p className="registro-espera__aviso">
            <span className="registro-espera__candado" aria-hidden="true">
              <Icono nombre="candado" tamano={16} />
            </span>
            <span>
              Todavía no puedes ingresar al sistema. El acceso se habilita cuando la validación
              termine, y te avisamos a <strong>{radicada.correo}</strong>.
            </span>
          </p>
          {radicada.faltantes > 0 ? (
            <p className="registro-espera__nota">
              Dejaste {radicada.faltantes}{" "}
              {radicada.faltantes === 1 ? "documento opcional" : "documentos opcionales"} sin
              cargar. Podrás aportarlos desde el expediente sin repetir la solicitud.
            </p>
          ) : null}
          <p className="registro-espera__nota">
            Radicar la solicitud no constituye verificación ni validación de requisitos legales,
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

      <section className="registro-portada">
        <div className="registro-portada__texto">
          <p className="seccion__etiqueta">Vinculación al sistema</p>
          <h1 className="seccion__titulo">Registrar mi organización</h1>
          <p className="seccion__texto">
            La vinculación es voluntaria y progresiva conforme al plan piloto de la Resolución 1241
            de 2026. El asistente te lleva paso a paso y te pide exactamente los soportes que la
            norma exige a tu tipo de actor.
          </p>
          <div className="registro-portada__acciones">
            <Boton tamano="lg" icono="hoja" onClick={() => setAbierto(true)}>
              Iniciar registro
            </Boton>
            <span className="registro-portada__duracion mono">5 pasos · unos 10 minutos</span>
          </div>
        </div>
        <div className="registro-portada__lamina" aria-hidden="true">
          <Lamina motivo="abanico" />
        </div>
      </section>

      <Tarjeta
        titulo="Qué soportes te va a pedir"
        descripcion="Depende del tipo de actor. Ten los archivos a mano antes de empezar."
      >
        <div className="registro-requisitos">
          {TIPOS.map((tipo) => {
            const aportar = porAportar(tipo.valor);
            return (
              <article key={tipo.valor} className="registro-requisitos__actor">
                <h3 className="registro-requisitos__nombre">{tipo.etiqueta}</h3>
                <p className="registro-requisitos__detalle">{tipo.detalle}</p>
                <ul className="registro-requisitos__lista">
                  {aportar.map((requisito) => (
                    <li key={requisito.documento} data-obligatorio={requisito.obligatorio ? "si" : "no"}>
                      <span className="registro-requisitos__marca" aria-hidden="true">
                        <Icono nombre="documento" tamano={13} />
                      </span>
                      {requisito.nombre}
                      {requisito.obligatorio ? null : (
                        <span className="registro-requisitos__opcional">opcional</span>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <p className="registro-requisitos__nota">
          El certificado de existencia y representación legal y el RUT los contrasta el sistema
          contra el RUES, además de la copia que adjuntes.
        </p>
      </Tarjeta>

      <div className="rejilla rejilla--2" style={{ marginTop: "var(--e5)" }}>
        <Tarjeta titulo="Qué pasa después" descripcion="El trámite tiene pasos y responsables definidos">
          <ol className="pila lista-numerada" style={{ gap: "var(--e3)" }}>
            {PASOS_TRAMITE.map((texto) => (
              <li key={texto}>{texto}</li>
            ))}
          </ol>
        </Tarjeta>

        <Tarjeta titulo="Lo que este registro no es" descripcion="Alcance estrictamente tecnológico">
          <ul className="pila" style={{ gap: "var(--e3)", listStyle: "none", padding: 0 }}>
            {LIMITES.map((texto) => (
              <li key={texto} className="fila" style={{ gap: "var(--e3)", alignItems: "flex-start" }}>
                <span style={{ color: "var(--rojo-600)", marginTop: 2 }}>
                  <Icono nombre="cerrar" tamano={16} />
                </span>
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      <AsistenteRegistro
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        onRadicada={(datos) => {
          setAbierto(false);
          setRadicada(datos);
        }}
      />
    </div>
  );
};
