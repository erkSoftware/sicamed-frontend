import { useMemo, useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { EstadoConsulta } from "../../../shared/ui/patrones/EstadoConsulta";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { GrupoFiltros } from "../../../shared/ui/patrones/GrupoFiltros";
import { Tabla } from "../../../shared/ui/primitivos/Tabla";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { CampoArea, CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { useAutor } from "../../../shared/auth/useAutor";
import { fechaHora } from "../../../shared/i18n/formato";
import {
  ETIQUETA_SITUACION,
  ETIQUETA_TIPO_BLOQUEO,
  esAutomatico,
  situacionDeBloqueo,
} from "../../../shared/api/mock/llamadasAsistente";
import type { SituacionBloqueo } from "../../../shared/api/mock/llamadasAsistente";
import type { BloqueoAsistente, TipoBloqueoAsistente } from "../../../shared/api/mock/tipos";
import type { TonoInsignia } from "../../../shared/ui/primitivos/Insignia";
import {
  useBloquearAurora,
  useBloqueosAurora,
  useDesbloquearAurora,
} from "../hooks/useConfiguracionAurora";

const TONO_SITUACION: Record<SituacionBloqueo, TonoInsignia> = {
  activo: "peligro",
  vencido: "neutro",
  levantado: "info",
};

type Formulario = {
  usuario: string;
  motivo: string;
  tipo: TipoBloqueoAsistente;
  dias: string;
};

const INICIAL: Formulario = { usuario: "", motivo: "", tipo: "temporary", dias: "30" };

export const LlamadasAurora = () => {
  const [soloActivos, setSoloActivos] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [levantando, setLevantando] = useState<BloqueoAsistente | null>(null);
  const [valores, setValores] = useState<Formulario>(INICIAL);

  const consulta = useBloqueosAurora(soloActivos);
  const bloquear = useBloquearAurora();
  const desbloquear = useDesbloquearAurora();
  const autor = useAutor();

  const bloqueos = useMemo(() => consulta.data ?? [], [consulta.data]);

  const dias = Number(valores.dias);
  const incompleto =
    valores.usuario.trim() === "" ||
    valores.motivo.trim() === "" ||
    (valores.tipo === "temporary" && (!Number.isInteger(dias) || dias < 1));

  const cerrar = () => {
    setAbierto(false);
    setLevantando(null);
    setValores(INICIAL);
    bloquear.reset();
    desbloquear.reset();
  };

  const enviar = () =>
    bloquear.mutate(
      {
        usuario: valores.usuario.trim(),
        motivo: valores.motivo,
        tipo: valores.tipo,
        dias: valores.tipo === "temporary" ? dias : 0,
        autor,
      },
      { onSuccess: cerrar },
    );

  const levantar = () => {
    if (!levantando) return;
    desbloquear.mutate({ id: levantando.id, autor }, { onSuccess: cerrar });
  };

  const columnas: readonly Columna<BloqueoAsistente>[] = [
    {
      clave: "usuario",
      encabezado: "Usuario",
      render: (bloqueo) => (
        <div className="pila" style={{ gap: "var(--e1)" }}>
          <strong>{bloqueo.usuario}</strong>
          <span className="enlace-fila__meta">
            {esAutomatico(bloqueo)
              ? "Bloqueo automático del sistema"
              : `Puesto por ${bloqueo.creadoPor}`}
          </span>
        </div>
      ),
    },
    { clave: "motivo", encabezado: "Motivo", render: (bloqueo) => bloqueo.motivo },
    {
      clave: "tipo",
      encabezado: "Tipo",
      render: (bloqueo) => (
        <Insignia tono={bloqueo.tipo === "permanent" ? "alerta" : "neutro"}>
          {ETIQUETA_TIPO_BLOQUEO[bloqueo.tipo]}
        </Insignia>
      ),
    },
    {
      clave: "iniciaEn",
      encabezado: "Inicio",
      render: (bloqueo) => fechaHora(bloqueo.iniciaEn),
    },
    {
      clave: "expiraEn",
      encabezado: "Vencimiento",
      render: (bloqueo) => (bloqueo.expiraEn ? fechaHora(bloqueo.expiraEn) : "—"),
    },
    {
      clave: "estado",
      encabezado: "Estado",
      render: (bloqueo) => {
        const situacion = situacionDeBloqueo(bloqueo);
        return (
          <div className="pila" style={{ gap: "var(--e1)" }}>
            <Insignia tono={TONO_SITUACION[situacion]}>{ETIQUETA_SITUACION[situacion]}</Insignia>
            {situacion === "levantado" && bloqueo.desbloqueadoEn ? (
              <span className="enlace-fila__meta">
                {`${bloqueo.desbloqueadoPor || "Alguien"} lo levantó el ${fechaHora(
                  bloqueo.desbloqueadoEn,
                )}`}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      clave: "accion",
      encabezado: "Acción",
      render: (bloqueo) =>
        situacionDeBloqueo(bloqueo) === "activo" ? (
          <Boton
            variante="secundario"
            tamano="sm"
            icono="candado"
            onClick={() => setLevantando(bloqueo)}
          >
            Desbloquear
          </Boton>
        ) : (
          <span className="enlace-fila__meta">Sin acciones</span>
        ),
    },
  ];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Llamadas de AURORA"
        subtitulo="Quién no puede abrir el micrófono, por qué y hasta cuándo. Aquí no hay nada de lo que se habló: el sistema no guarda audio ni transcripción."
        acciones={
          <Boton icono="candado" onClick={() => setAbierto(true)}>
            Bloquear a una persona
          </Boton>
        }
      />

      <div className="aviso aviso--info">
        <Icono nombre="escudo" tamano={18} />
        <p>
          Un bloqueo levantado <strong>no se borra</strong>: sigue siendo la respuesta a por qué esa
          persona no pudo llamar el mes pasado. Por eso la vista por defecto son los vigentes, y la
          de todos existe para explicar.
        </p>
      </div>

      <Tarjeta
        titulo="Usuarios bloqueados"
        descripcion="Del bloqueo más reciente al más antiguo. Los automáticos los pone el conteo de intentos; los demás, una persona."
        acciones={
          <GrupoFiltros
            etiqueta="Alcance del listado"
            valor={soloActivos ? "activos" : "todos"}
            opciones={[
              { valor: "activos", etiqueta: "Vigentes" },
              { valor: "todos", etiqueta: "Todos" },
            ]}
            onCambiar={(valor) => setSoloActivos(valor === "activos")}
          />
        }
      >
        <EstadoConsulta
          cargando={consulta.isPending}
          error={consulta.error}
          onReintentar={() => void consulta.refetch()}
        >
          <Tabla
            descripcion="Usuarios con la voz bloqueada"
            columnas={columnas}
            filas={bloqueos}
            claveFila={(bloqueo) => bloqueo.id}
            vacio={
              <EstadoVacio
                icono="escudo"
                titulo={soloActivos ? "Nadie está bloqueado" : "No hay bloqueos registrados"}
                texto={
                  soloActivos
                    ? "Ninguna cuenta tiene hoy la voz bloqueada. Cambia a «Todos» para ver los que vencieron o alguien levantó."
                    : "Esta entidad no ha bloqueado a nadie, ni a mano ni por conteo de intentos."
                }
              />
            }
          />
        </EstadoConsulta>
      </Tarjeta>

      {abierto ? (
        <DialogoFormulario
          abierto
          titulo="Bloquear la voz de una persona"
          descripcion="El bloqueo impide abrir sesiones de voz. No afecta al resto del sistema, y no se apila: si esa persona ya tiene uno activo, se rechaza."
          etiquetaEnviar="Bloquear"
          deshabilitado={incompleto}
          cargando={bloquear.isPending}
          error={bloquear.error}
          onCerrar={cerrar}
          onEnviar={enviar}
          onLimpiarError={() => bloquear.reset()}
        >
          <CampoTexto
            etiqueta="Identificador del usuario"
            requerido
            value={valores.usuario}
            ayuda="Es el sujeto del token, el mismo que aparece en el listado. No es el correo ni el nombre."
            onChange={(evento) => setValores({ ...valores, usuario: evento.target.value })}
          />
          <CampoArea
            etiqueta="Motivo"
            requerido
            rows={3}
            value={valores.motivo}
            ayuda="Queda en el registro y explica el bloqueo cuando alguien lo revise meses después."
            onChange={(evento) => setValores({ ...valores, motivo: evento.target.value })}
          />
          <CampoSelect
            etiqueta="Tipo"
            value={valores.tipo}
            opciones={[
              { valor: "temporary", etiqueta: "Temporal" },
              { valor: "permanent", etiqueta: "Permanente" },
            ]}
            onChange={(evento) =>
              setValores({ ...valores, tipo: evento.target.value as TipoBloqueoAsistente })
            }
          />
          {valores.tipo === "temporary" ? (
            <CampoTexto
              etiqueta="Días que dura"
              type="number"
              inputMode="numeric"
              min={1}
              max={3650}
              requerido
              value={valores.dias}
              ayuda="Solo cuenta en los temporales: un permanente no lleva vencimiento."
              onChange={(evento) => setValores({ ...valores, dias: evento.target.value })}
            />
          ) : null}
        </DialogoFormulario>
      ) : null}

      {levantando ? (
        <DialogoFormulario
          abierto
          titulo="Levantar el bloqueo"
          descripcion="La persona vuelve a poder abrir el micrófono. El bloqueo no se borra: queda registrado como levantado, con quién lo hizo y cuándo."
          etiquetaEnviar="Desbloquear"
          cargando={desbloquear.isPending}
          error={desbloquear.error}
          onCerrar={cerrar}
          onEnviar={levantar}
          onLimpiarError={() => desbloquear.reset()}
        >
          <dl className="pila" style={{ gap: "var(--e4)" }}>
            <div>
              <dt className="kpi__etiqueta">Usuario</dt>
              <dd className="vista-previa">{levantando.usuario}</dd>
            </div>
            <div>
              <dt className="kpi__etiqueta">Motivo del bloqueo</dt>
              <dd className="vista-previa">{levantando.motivo}</dd>
            </div>
            <div>
              <dt className="kpi__etiqueta">Lo puso</dt>
              <dd className="vista-previa">
                {esAutomatico(levantando)
                  ? "El sistema, por exceso de intentos"
                  : levantando.creadoPor}
              </dd>
            </div>
          </dl>
        </DialogoFormulario>
      ) : null}
    </div>
  );
};
