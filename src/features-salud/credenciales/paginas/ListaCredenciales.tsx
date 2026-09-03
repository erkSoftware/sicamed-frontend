import { useState } from "react";
import { Link } from "react-router-dom";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { CampoArea, CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { useAutor } from "../../../shared/auth/useAutor";
import { fecha } from "../../../shared/i18n/formato";
import { usePacientes } from "../../pacientes/hooks/usePacientes";
import { useCambiarEstadoCredencial, useCredenciales, useEmitirCredencial } from "../hooks/useCredenciales";
import { ETIQUETA_CREDENCIAL, ETIQUETA_NIVEL, OPCIONES_NIVEL, TONO_CREDENCIAL } from "../estados";
import type { CredencialPaciente, NivelVerificacion } from "../../../shared/api/mock/datosClinicos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";

export const ListaCredenciales = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [emitiendo, setEmitiendo] = useState(false);
  const [suspendiendo, setSuspendiendo] = useState<CredencialPaciente | null>(null);
  const [pacienteId, setPacienteId] = useState("");
  const [nivel, setNivel] = useState<NivelVerificacion>("PRESENCIAL");
  const [motivo, setMotivo] = useState("");

  const autor = useAutor();
  const consulta = useCredenciales({ busqueda, estado, pagina, porPagina: 8 });
  const pacientes = usePacientes({ porPagina: 40 });
  const emitir = useEmitirCredencial();
  const cambiar = useCambiarEstadoCredencial();

  const cerrarEmision = () => {
    setEmitiendo(false);
    setPacienteId("");
    emitir.reset();
  };

  const cerrarSuspension = () => {
    setSuspendiendo(null);
    setMotivo("");
    cambiar.reset();
  };

  const elegido = (pacientes.data?.datos ?? []).find((paciente) => paciente.id === pacienteId);

  const columnas: readonly Columna<CredencialPaciente>[] = [
    {
      clave: "seudonimo",
      encabezado: "Credencial",
      render: (credencial) => (
        <Link to={`/app/salud/credenciales/${credencial.id}`} className="enlace-tabla">
          <strong className="mono">{credencial.seudonimo}</strong>
          <br />
          <span style={{ fontSize: "var(--texto-xs)", color: "var(--texto-tenue)" }}>
            {credencial.paciente}
          </span>
        </Link>
      ),
    },
    {
      clave: "estado",
      encabezado: "Estado",
      render: (credencial) => (
        <Insignia tono={TONO_CREDENCIAL[credencial.estado]}>
          {ETIQUETA_CREDENCIAL[credencial.estado]}
        </Insignia>
      ),
    },
    {
      clave: "nivel",
      encabezado: "Verificación",
      render: (credencial) => ETIQUETA_NIVEL[credencial.nivelVerificacion],
    },
    { clave: "vence", encabezado: "Vence", render: (credencial) => fecha(credencial.vence) },
    {
      clave: "entregas",
      encabezado: "Entregas en ventana",
      numerica: true,
      render: (credencial) => credencial.entregasEnVentana,
    },
    {
      clave: "acciones",
      encabezado: "",
      render: (credencial) =>
        credencial.estado === "ACTIVA" ? (
          <Boton
            variante="secundario"
            tamano="sm"
            icono="candado"
            onClick={() => setSuspendiendo(credencial)}
          >
            Suspender
          </Boton>
        ) : null,
    },
  ];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Credenciales de paciente"
        subtitulo="El identificador digital que la persona presenta en la farmacia. Fuera de esta zona solo viaja el seudónimo: el punto de dispensación nunca recibe el nombre ni el documento."
        acciones={
          <Boton icono="mas" onClick={() => setEmitiendo(true)}>
            Emitir credencial
          </Boton>
        }
      />

      <div className="aviso aviso--info">
        <Icono nombre="escudo" tamano={18} />
        <p>
          Emitir una credencial genera un cargo anual al paciente por el servicio de identidad. No
          es un cobro por el producto ni por la dispensación: eso se le cobra a la farmacia.
        </p>
      </div>

      <TablaConFiltros
        descripcion="Credenciales digitales emitidas"
        columnas={columnas}
        claveFila={(credencial) => credencial.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar credencial"
        marcadorBusqueda="Buscar por seudónimo o por paciente"
        selectores={[
          {
            clave: "estado",
            etiqueta: "Estado",
            valor: estado,
            opciones: (Object.keys(ETIQUETA_CREDENCIAL) as (keyof typeof ETIQUETA_CREDENCIAL)[]).map(
              (valor) => ({ valor, etiqueta: ETIQUETA_CREDENCIAL[valor] }),
            ),
            onCambiar: (valor) => {
              setEstado(valor);
              setPagina(1);
            },
          },
        ]}
        onPagina={setPagina}
        etiquetaPlural="credenciales"
        vacio={
          <EstadoVacio
            icono="escudo"
            titulo="No hay credenciales con esos criterios"
            texto="Emite la credencial de un paciente para que pueda retirar su fórmula en una farmacia licenciada."
          />
        }
      />

      <DialogoFormulario
        abierto={emitiendo}
        titulo="Emitir credencial digital"
        descripcion="La credencial vincula al paciente con un seudónimo estable. Solo puede haber una activa por persona: dos romperían el control de recompras."
        etiquetaEnviar="Emitir"
        cargando={emitir.isPending}
        deshabilitado={pacienteId.length === 0}
        error={emitir.error}
        onCerrar={cerrarEmision}
        onLimpiarError={() => emitir.reset()}
        onEnviar={() => {
          if (!elegido) return;
          emitir.mutate(
            {
              pacienteId: elegido.id,
              paciente: elegido.nombre,
              nivelVerificacion: nivel,
              autor,
            },
            { onSuccess: cerrarEmision },
          );
        }}
      >
        <CampoSelect
          etiqueta="Paciente"
          requerido
          value={pacienteId}
          vacio="Selecciona un paciente"
          opciones={(pacientes.data?.datos ?? []).map((paciente) => ({
            valor: paciente.id,
            etiqueta: `${paciente.nombre} · ${paciente.documento}`,
          }))}
          onChange={(evento) => setPacienteId(evento.target.value)}
        />
        <CampoSelect
          etiqueta="Nivel de verificación de identidad"
          requerido
          value={nivel}
          opciones={OPCIONES_NIVEL}
          ayuda="Determina qué comprobación adicional puede exigir el mostrador al momento de la entrega."
          onChange={(evento) => setNivel(evento.target.value as NivelVerificacion)}
        />
      </DialogoFormulario>

      <DialogoFormulario
        abierto={suspendiendo !== null}
        titulo={`Suspender la credencial ${suspendiendo?.seudonimo ?? ""}`}
        descripcion="Mientras esté suspendida, el punto de dispensación rechazará cualquier intento de entrega y el rechazo quedará en el ledger."
        etiquetaEnviar="Suspender"
        cargando={cambiar.isPending}
        error={cambiar.error}
        onCerrar={cerrarSuspension}
        onLimpiarError={() => cambiar.reset()}
        onEnviar={() => {
          if (!suspendiendo) return;
          cambiar.mutate(
            { id: suspendiendo.id, estado: "SUSPENDIDA", motivo, autor },
            { onSuccess: cerrarSuspension },
          );
        }}
      >
        <CampoTexto etiqueta="Paciente" value={suspendiendo?.paciente ?? ""} readOnly />
        <CampoArea
          etiqueta="Motivo de la suspensión"
          requerido
          rows={3}
          value={motivo}
          ayuda="Queda en la ficha de la credencial y es lo que verá quien la consulte."
          onChange={(evento) => setMotivo(evento.target.value)}
        />
      </DialogoFormulario>
    </div>
  );
};
