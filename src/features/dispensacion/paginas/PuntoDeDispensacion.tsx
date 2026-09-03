import { useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { ErrorNormativo } from "../../../shared/ui/patrones/ErrorNormativo";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { aProblema } from "../../../shared/api/problemDetails";
import { useAutor } from "../../../shared/auth/useAutor";
import { fecha, fechaHora, numero } from "../../../shared/i18n/formato";
import { DETALLE_METODO, ETIQUETA_METODO, OPCIONES_METODO } from "../../../shared/dispensacion/metodos";
import { usePuntos, useRegistrarEntrega, useVerificarCredencial } from "../hooks/useDispensacion";
import type { MetodoVerificacion, PrescripcionEnMostrador } from "../../../shared/api/mock/datosDispensacion";

const PASOS = [
  { clave: "identificar", rotulo: "Identificar la credencial" },
  { clave: "verificar", rotulo: "Verificar a la persona" },
  { clave: "entregar", rotulo: "Entregar y descontar" },
  { clave: "sellar", rotulo: "Sellar en el ledger" },
] as const;

export const PuntoDeDispensacion = () => {
  const puntos = usePuntos();
  const autor = useAutor();
  const verificacion = useVerificarCredencial();
  const entrega = useRegistrarEntrega();

  const [puntoId, setPuntoId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [metodo, setMetodo] = useState<MetodoVerificacion>("CODIGO_ROTATORIO");
  const [elegida, setElegida] = useState<PrescripcionEnMostrador | null>(null);
  const [unidades, setUnidades] = useState("1");

  const listaPuntos = puntos.data ?? [];
  const puntoActivo = puntoId || listaPuntos[0]?.id || "";
  const punto = listaPuntos.find((item) => item.id === puntoActivo);
  const credencial = verificacion.data;
  const comprobante = entrega.data;

  const pasoActual = comprobante ? 3 : credencial ? 2 : 1;

  const reiniciar = () => {
    verificacion.reset();
    entrega.reset();
    setCodigo("");
    setElegida(null);
    setUnidades("1");
  };

  const verificar = () => {
    entrega.reset();
    setElegida(null);
    verificacion.mutate({ codigo, metodo, puntoId: puntoActivo, autor });
  };

  const entregar = () => {
    if (!credencial || !elegida) return;
    entrega.mutate({
      puntoId: puntoActivo,
      seudonimo: credencial.seudonimo,
      prescripcionCodigo: elegida.codigo,
      unidades: Number(unidades),
      metodo,
      operador: autor.nombre,
      autor,
    });
  };

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Punto de dispensación"
        subtitulo="Entrega presencial contra credencial verificada. El mostrador ve el seudónimo de la persona y su fórmula, nunca su nombre, su documento ni su diagnóstico."
        acciones={
          credencial || comprobante ? (
            <Boton variante="secundario" icono="cerrar" onClick={reiniciar}>
              Atender a otra persona
            </Boton>
          ) : undefined
        }
      />

      <div className="aviso aviso--alerta">
        <Icono nombre="candado" tamano={18} />
        <p>
          <strong>El retiro es presencial.</strong> La comercialización de productos sometidos a
          fiscalización no puede hacerse por internet, correo ni medio similar (Res. 1478 de 2006,
          Art. 5 num. 4), y la Res. 1644 de 2026 lo confirmó para telemedicina. Este módulo no tiene
          —ni tendrá— entrega a domicilio.
        </p>
      </div>

      <ol className="pasos-dispensacion">
        {PASOS.map((paso, indice) => (
          <li
            key={paso.clave}
            className="pasos-dispensacion__paso"
            data-estado={indice < pasoActual ? "hecho" : indice === pasoActual ? "actual" : "pendiente"}
          >
            <span className="pasos-dispensacion__numero" aria-hidden="true">
              {indice < pasoActual ? <Icono nombre="check" tamano={14} /> : indice + 1}
            </span>
            <span>{paso.rotulo}</span>
          </li>
        ))}
      </ol>

      <EstadoConsulta
        cargando={puntos.isLoading}
        error={puntos.error}
        onReintentar={() => void puntos.refetch()}
      >
        <div className="rejilla rejilla--2">
          <Tarjeta
            titulo="Identificación en el mostrador"
            descripcion="El código rota en la credencial del paciente cada pocos minutos"
          >
            <div className="pila" style={{ gap: "var(--e4)" }}>
              <CampoSelect
                etiqueta="Punto de dispensación"
                requerido
                value={puntoActivo}
                onChange={(evento) => setPuntoId(evento.target.value)}
                opciones={listaPuntos.map((item) => ({ valor: item.id, etiqueta: item.nombre }))}
              />
              <CampoTexto
                etiqueta="Código de la credencial"
                requerido
                value={codigo}
                placeholder="ABCD-2345"
                ayuda="Pídele al paciente que abra su credencial y lea el código vigente."
                onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
              />
              <CampoSelect
                etiqueta="Verificación adicional de identidad"
                requerido
                value={metodo}
                opciones={OPCIONES_METODO}
                ayuda={DETALLE_METODO[metodo]}
                onChange={(evento) => setMetodo(evento.target.value as MetodoVerificacion)}
              />
              <Boton
                icono="escudo"
                bloque
                cargando={verificacion.isPending}
                disabled={codigo.trim().length < 4}
                onClick={verificar}
              >
                Verificar credencial
              </Boton>
              {verificacion.error ? (
                <ErrorNormativo problema={aProblema(verificacion.error)} />
              ) : null}
            </div>
          </Tarjeta>

          <Tarjeta
            titulo="Licencia del punto"
            descripcion="SICAMED no habilita al establecimiento: lee la licencia de quien la expide"
          >
            {punto ? (
              <dl className="pila" style={{ gap: "var(--e4)" }}>
                <div>
                  <dt className="kpi__etiqueta">Establecimiento</dt>
                  <dd>{punto.nombre}</dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Licencia</dt>
                  <dd className="mono">{punto.licencia}</dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Vigente hasta</dt>
                  <dd>{fecha(punto.vigenciaLicencia)}</dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Municipio</dt>
                  <dd>
                    {punto.municipio} · {punto.departamento}
                  </dd>
                </div>
              </dl>
            ) : null}
          </Tarjeta>
        </div>

        <div aria-live="polite">
          {credencial && !comprobante ? (
            <Tarjeta
              titulo={`Credencial ${credencial.seudonimo}`}
              descripcion={`Verificada por ${ETIQUETA_METODO[metodo].toLowerCase()} · vigente hasta ${fecha(credencial.vence)}`}
              acciones={<Insignia tono="exito">Verificada</Insignia>}
            >
              {credencial.prescripciones.length === 0 ? (
                <p className="texto-tenue">
                  La credencial es válida pero no hay ninguna fórmula vigente con saldo pendiente
                  para esta persona. No hay nada que entregar.
                </p>
              ) : (
                <div className="pila" style={{ gap: "var(--e4)" }}>
                  <fieldset className="formulas-mostrador">
                    <legend className="kpi__etiqueta">Fórmulas dispensables</legend>
                    {credencial.prescripciones.map((prescripcion) => (
                      <label
                        key={prescripcion.codigo}
                        className="formula-mostrador"
                        htmlFor={`formula-${prescripcion.codigo}`}
                      >
                        <input
                          id={`formula-${prescripcion.codigo}`}
                          type="radio"
                          name="formula"
                          value={prescripcion.codigo}
                          aria-label={`${prescripcion.denominacionComun} ${prescripcion.concentracion}, fórmula ${prescripcion.codigo}`}
                          checked={elegida?.codigo === prescripcion.codigo}
                          onChange={() => {
                            setElegida(prescripcion);
                            setUnidades("1");
                            entrega.reset();
                          }}
                        />
                        <span className="formula-mostrador__cuerpo">
                          <span className="formula-mostrador__titulo">
                            {prescripcion.denominacionComun} · {prescripcion.concentracion}
                            {prescripcion.fiscalizado ? (
                              <Insignia tono="alerta">Fiscalizado</Insignia>
                            ) : null}
                          </span>
                          <span className="formula-mostrador__meta mono">{prescripcion.codigo}</span>
                          <span className="formula-mostrador__meta">
                            {prescripcion.formaFarmaceutica} · vía {prescripcion.viaAdministracion.toLowerCase()} ·
                            saldo {numero(prescripcion.saldo)} de {numero(prescripcion.cantidadTotal)}{" "}
                            {prescripcion.unidadFarmaceutica}
                          </span>
                          <span className="formula-mostrador__meta">
                            Vigente hasta {fecha(prescripcion.vigenciaHasta)} · ventana entre entregas{" "}
                            {prescripcion.ventanaRecompraDias} días
                            {prescripcion.diasParaHabilitar > 0
                              ? ` · faltan ${prescripcion.diasParaHabilitar} días`
                              : ""}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  {elegida ? (
                    <div className="fila fila--fin" style={{ gap: "var(--e4)", flexWrap: "wrap" }}>
                      <CampoTexto
                        etiqueta={`Unidades a entregar (${elegida.unidadFarmaceutica})`}
                        type="number"
                        min={1}
                        max={elegida.saldo}
                        value={unidades}
                        onChange={(evento) => setUnidades(evento.target.value)}
                      />
                      <Boton
                        icono="check"
                        cargando={entrega.isPending}
                        onClick={entregar}
                        disabled={Number(unidades) < 1 || Number(unidades) > elegida.saldo}
                      >
                        Registrar entrega presencial
                      </Boton>
                    </div>
                  ) : null}

                  {entrega.error ? <ErrorNormativo problema={aProblema(entrega.error)} /> : null}
                </div>
              )}
            </Tarjeta>
          ) : null}

          {comprobante ? (
            <Tarjeta
              titulo="Entrega registrada"
              descripcion="El hecho quedó sellado en la cadena de trazabilidad y generó el cargo a la farmacia"
              acciones={<Insignia tono="exito">Sellada</Insignia>}
            >
              <dl className="rejilla rejilla--2">
                <div>
                  <dt className="kpi__etiqueta">Acto de dispensación</dt>
                  <dd className="mono">{comprobante.acto.codigo}</dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Evento en el ledger</dt>
                  <dd className="mono">{comprobante.acto.eventoId}</dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Entregado</dt>
                  <dd>
                    {numero(comprobante.acto.unidades)} {comprobante.acto.unidadFarmaceutica} de{" "}
                    {comprobante.acto.denominacionComun}
                  </dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Saldo restante</dt>
                  <dd>
                    {numero(comprobante.prescripcion.saldo)} {comprobante.prescripcion.unidadFarmaceutica}
                  </dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Fecha</dt>
                  <dd>{fechaHora(comprobante.acto.fecha)}</dd>
                </div>
                <div>
                  <dt className="kpi__etiqueta">Cargo generado</dt>
                  <dd className="mono">{comprobante.cargo.id}</dd>
                </div>
              </dl>
              <p className="texto-tenue" style={{ marginTop: "var(--e4)" }}>
                El cargo se le hace a la farmacia por el servicio de verificación y trazabilidad, no
                al paciente por el producto.
              </p>
            </Tarjeta>
          ) : null}
        </div>
      </EstadoConsulta>
    </div>
  );
};
