import { useMemo, useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { CampoArea, CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useAutor } from "../../../shared/auth/useAutor";
import { enLetras } from "../../../shared/i18n/letras";
import { fecha, numero } from "../../../shared/i18n/formato";
import { CAMPOS_DECRETO_2200 } from "../../../shared/api/mock/datosClinicos";
import { numeralesCompletos } from "../../../shared/dispensacion/decreto2200";
import { usePacientes } from "../../pacientes/hooks/usePacientes";
import { useAnularPrescripcion, useEmitirPrescripcion, usePrescripciones } from "../hooks/usePrescripciones";
import { ETIQUETA_PRESCRIPCION, OPCIONES_TIPO_USUARIO, TONO_PRESCRIPCION } from "../estados";
import type { BorradorPrescripcion } from "../../../shared/dispensacion/decreto2200";
import type { Prescripcion, TipoUsuario } from "../../../shared/api/mock/datosClinicos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";

const EN_TREINTA_DIAS = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

const BORRADOR_INICIAL: BorradorPrescripcion = {
  pacienteId: "",
  paciente: "",
  documento: "",
  historiaClinica: "",
  tipoUsuario: "CONTRIBUTIVO",
  prestador: "",
  prestadorDireccion: "",
  prestadorContacto: "",
  lugar: "",
  denominacionComun: "",
  presentacion: "",
  concentracion: "",
  formaFarmaceutica: "",
  viaAdministracion: "Oral",
  posologia: "",
  duracionDias: 30,
  cantidadTotal: 1,
  unidadFarmaceutica: "",
  indicaciones: "",
  vigenciaHasta: EN_TREINTA_DIAS,
  profesional: "",
  registroProfesional: "",
  fiscalizado: false,
};

export const Prescripciones = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [emitiendo, setEmitiendo] = useState(false);
  const [anulando, setAnulando] = useState<Prescripcion | null>(null);
  const [motivo, setMotivo] = useState("");
  const [borrador, setBorrador] = useState<BorradorPrescripcion>(BORRADOR_INICIAL);

  const autor = useAutor();
  const consulta = usePrescripciones({ busqueda, estado, pagina, porPagina: 8 });
  const pacientes = usePacientes({ porPagina: 40 });
  const emitir = useEmitirPrescripcion();
  const anular = useAnularPrescripcion();

  const completos = useMemo(() => numeralesCompletos(borrador), [borrador]);

  const cambiar = <C extends keyof BorradorPrescripcion>(clave: C, valor: BorradorPrescripcion[C]) =>
    setBorrador((previo) => ({ ...previo, [clave]: valor }));

  const elegirPaciente = (id: string) => {
    const paciente = (pacientes.data?.datos ?? []).find((item) => item.id === id);
    setBorrador((previo) => ({
      ...previo,
      pacienteId: id,
      paciente: paciente?.nombre ?? "",
      documento: paciente?.documento ?? "",
      lugar: paciente?.departamento ?? previo.lugar,
      profesional: paciente?.medicoTratante ?? previo.profesional,
    }));
  };

  const cerrarEmision = () => {
    setEmitiendo(false);
    setBorrador(BORRADOR_INICIAL);
    emitir.reset();
  };

  const cerrarAnulacion = () => {
    setAnulando(null);
    setMotivo("");
    anular.reset();
  };

  const columnas: readonly Columna<Prescripcion>[] = [
    {
      clave: "codigo",
      encabezado: "Fórmula",
      render: (prescripcion) => (
        <span>
          <strong className="mono">{prescripcion.codigo}</strong>
          <br />
          <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
            {prescripcion.paciente}
          </span>
        </span>
      ),
    },
    {
      clave: "medicamento",
      encabezado: "Medicamento",
      render: (prescripcion) => (
        <span>
          {prescripcion.denominacionComun}
          <br />
          <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
            {prescripcion.concentracion} · {prescripcion.formaFarmaceutica}
          </span>
        </span>
      ),
    },
    {
      clave: "cantidad",
      encabezado: "Cantidad total",
      numerica: true,
      render: (prescripcion) => (
        <span>
          {numero(prescripcion.cantidadTotal)}
          <br />
          <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
            {prescripcion.cantidadEnLetras}
          </span>
        </span>
      ),
    },
    { clave: "vigencia", encabezado: "Vigente hasta", render: (p) => fecha(p.vigenciaHasta) },
    {
      clave: "estado",
      encabezado: "Estado",
      render: (prescripcion) => (
        <Insignia tono={TONO_PRESCRIPCION[prescripcion.estado]}>
          {ETIQUETA_PRESCRIPCION[prescripcion.estado]}
        </Insignia>
      ),
    },
    {
      clave: "acciones",
      encabezado: "",
      render: (prescripcion) =>
        prescripcion.estado === "DISPENSADA" || prescripcion.estado === "ANULADA" ? null : (
          <Boton variante="secundario" tamano="sm" icono="cerrar" onClick={() => setAnulando(prescripcion)}>
            Anular
          </Boton>
        ),
    },
  ];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Prescripciones"
        subtitulo="Emisión de la fórmula con los catorce campos obligatorios del Decreto 2200 de 2005. Una fórmula incompleta no puede dispensarse en el punto de entrega."
        acciones={
          <Boton icono="mas" onClick={() => setEmitiendo(true)}>
            Emitir fórmula
          </Boton>
        }
      />

      <TablaConFiltros
        descripcion="Prescripciones digitales emitidas"
        columnas={columnas}
        claveFila={(prescripcion) => prescripcion.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar fórmula"
        marcadorBusqueda="Buscar por código, paciente o medicamento"
        selectores={[
          {
            clave: "estado",
            etiqueta: "Estado",
            valor: estado,
            opciones: (Object.keys(ETIQUETA_PRESCRIPCION) as (keyof typeof ETIQUETA_PRESCRIPCION)[]).map(
              (valor) => ({ valor, etiqueta: ETIQUETA_PRESCRIPCION[valor] }),
            ),
            onCambiar: (valor) => {
              setEstado(valor);
              setPagina(1);
            },
          },
        ]}
        onPagina={setPagina}
        etiquetaPlural="fórmulas"
        vacio={
          <EstadoVacio
            icono="documento"
            titulo="No hay fórmulas con esos criterios"
            texto="Emite una fórmula para que el paciente pueda retirarla en una farmacia licenciada."
          />
        }
      />

      <DialogoFormulario
        abierto={emitiendo}
        ancho
        titulo="Emitir fórmula"
        descripcion="Los catorce numerales del Art. 17 son obligatorios. La fecha y la firma las pone el sistema al emitir."
        etiquetaEnviar="Firmar y emitir"
        cargando={emitir.isPending}
        error={emitir.error}
        onCerrar={cerrarEmision}
        onLimpiarError={() => emitir.reset()}
        onEnviar={() => emitir.mutate({ ...borrador, autor }, { onSuccess: cerrarEmision })}
      >
        <div className="marcador-2200" aria-live="polite">
          <Icono nombre="documento" tamano={16} />
          <span>
            {completos.length} de {CAMPOS_DECRETO_2200.length} numerales completos
          </span>
          <ol className="marcador-2200__lista">
            {CAMPOS_DECRETO_2200.map((campo) => (
              <li
                key={campo.numeral}
                data-hecho={completos.includes(campo.numeral) ? "si" : "no"}
                title={campo.rotulo}
              >
                <span className="solo-lectores">
                  {campo.numeral}. {campo.rotulo}:{" "}
                  {completos.includes(campo.numeral) ? "completo" : "pendiente"}
                </span>
                <span aria-hidden="true">{campo.numeral}</span>
              </li>
            ))}
          </ol>
        </div>

        <CampoSelect
          etiqueta="Paciente"
          requerido
          value={borrador.pacienteId}
          vacio="Selecciona un paciente"
          ayuda="Numerales 3 y 4: el nombre, el documento y la historia clínica se toman de la ficha."
          opciones={(pacientes.data?.datos ?? []).map((paciente) => ({
            valor: paciente.id,
            etiqueta: `${paciente.nombre} · ${paciente.documento}`,
          }))}
          onChange={(evento) => elegirPaciente(evento.target.value)}
        />

        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Número de historia clínica"
            requerido
            value={borrador.historiaClinica}
            onChange={(evento) => cambiar("historiaClinica", evento.target.value)}
          />
          <CampoSelect
            etiqueta="Tipo de usuario"
            requerido
            value={borrador.tipoUsuario}
            opciones={OPCIONES_TIPO_USUARIO}
            onChange={(evento) => cambiar("tipoUsuario", evento.target.value as TipoUsuario)}
          />
          <CampoTexto
            etiqueta="Prestador que prescribe"
            requerido
            value={borrador.prestador}
            onChange={(evento) => cambiar("prestador", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Dirección del prestador"
            requerido
            value={borrador.prestadorDireccion}
            onChange={(evento) => cambiar("prestadorDireccion", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Teléfono o correo del prestador"
            requerido
            value={borrador.prestadorContacto}
            onChange={(evento) => cambiar("prestadorContacto", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Lugar de la prescripción"
            requerido
            value={borrador.lugar}
            onChange={(evento) => cambiar("lugar", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Medicamento en denominación común internacional"
            requerido
            value={borrador.denominacionComun}
            onChange={(evento) => cambiar("denominacionComun", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Presentación comercial"
            value={borrador.presentacion}
            onChange={(evento) => cambiar("presentacion", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Concentración"
            requerido
            value={borrador.concentracion}
            onChange={(evento) => cambiar("concentracion", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Forma farmacéutica"
            requerido
            value={borrador.formaFarmaceutica}
            onChange={(evento) => cambiar("formaFarmaceutica", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Vía de administración"
            requerido
            value={borrador.viaAdministracion}
            onChange={(evento) => cambiar("viaAdministracion", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Dosis y frecuencia"
            requerido
            value={borrador.posologia}
            onChange={(evento) => cambiar("posologia", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Duración del tratamiento en días"
            requerido
            type="number"
            min={1}
            value={borrador.duracionDias}
            onChange={(evento) => cambiar("duracionDias", Number(evento.target.value))}
          />
          <CampoTexto
            etiqueta="Cantidad total"
            requerido
            type="number"
            min={1}
            ayuda={`En letras: ${enLetras(borrador.cantidadTotal) || "—"}`}
            value={borrador.cantidadTotal}
            onChange={(evento) => cambiar("cantidadTotal", Number(evento.target.value))}
          />
          <CampoTexto
            etiqueta="Unidad farmacéutica"
            requerido
            value={borrador.unidadFarmaceutica}
            onChange={(evento) => cambiar("unidadFarmaceutica", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Vigencia de la prescripción"
            requerido
            type="date"
            value={borrador.vigenciaHasta.slice(0, 10)}
            onChange={(evento) => cambiar("vigenciaHasta", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Prescriptor"
            requerido
            value={borrador.profesional}
            onChange={(evento) => cambiar("profesional", evento.target.value)}
          />
          <CampoTexto
            etiqueta="Registro profesional"
            requerido
            value={borrador.registroProfesional}
            onChange={(evento) => cambiar("registroProfesional", evento.target.value)}
          />
        </div>

        <CampoArea
          etiqueta="Indicaciones del prescriptor"
          requerido
          rows={3}
          value={borrador.indicaciones}
          onChange={(evento) => cambiar("indicaciones", evento.target.value)}
        />

        <CampoSelect
          etiqueta="Clasificación del producto"
          requerido
          value={borrador.fiscalizado ? "si" : "no"}
          ayuda="El producto fiscalizado exige una ventana más larga entre entregas y retiro presencial en farmacia licenciada."
          opciones={[
            { valor: "no", etiqueta: "No fiscalizado" },
            { valor: "si", etiqueta: "Sometido a fiscalización" },
          ]}
          onChange={(evento) => cambiar("fiscalizado", evento.target.value === "si")}
        />
      </DialogoFormulario>

      <DialogoFormulario
        abierto={anulando !== null}
        titulo={`Anular la fórmula ${anulando?.codigo ?? ""}`}
        descripcion="El punto de dispensación verá el motivo cuando intente consultarla. Una fórmula ya entregada por completo no se puede anular."
        etiquetaEnviar="Anular"
        cargando={anular.isPending}
        error={anular.error}
        onCerrar={cerrarAnulacion}
        onLimpiarError={() => anular.reset()}
        onEnviar={() => {
          if (!anulando) return;
          anular.mutate({ id: anulando.id, motivo, autor }, { onSuccess: cerrarAnulacion });
        }}
      >
        <CampoArea
          etiqueta="Motivo de la anulación"
          requerido
          rows={3}
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
        />
      </DialogoFormulario>
    </div>
  );
};
