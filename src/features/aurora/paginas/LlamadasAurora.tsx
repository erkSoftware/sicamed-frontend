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
import { aProblema } from "../../../shared/api/problemDetails";
import { useAutor } from "../../../shared/auth/useAutor";
import { fechaHora } from "../../../shared/i18n/formato";
import {
  ETIQUETA_SITUACION,
  ETIQUETA_TIPO_BLOQUEO,
  esAutomatico,
  nombreDeQuienBloqueo,
  nombreDeQuienLevanto,
  nombreDelBloqueado,
  situacionDeBloqueo,
} from "../../../shared/api/mock/llamadasAsistente";
import type { SituacionBloqueo } from "../../../shared/api/mock/llamadasAsistente";
import type { BloqueoAsistente, TipoBloqueoAsistente } from "../../../shared/api/mock/tipos";
import type { TonoInsignia } from "../../../shared/ui/primitivos/Insignia";
import { usePermiso } from "../../../shared/rbac/usePermiso";
import {
  useBloquearAurora,
  useBloqueosAurora,
  useCuentasParaBloqueo,
  useDesbloquearAurora,
} from "../hooks/useConfiguracionAurora";

const TONO_SITUACION: Record<SituacionBloqueo, TonoInsignia> = {
  activo: "peligro",
  vencido: "neutro",
  levantado: "info",
};

type Formulario = {
  usuario: string;
  usuarioNombre: string;
  motivo: string;
  tipo: TipoBloqueoAsistente;
  dias: string;
};

const INICIAL: Formulario = {
  usuario: "",
  usuarioNombre: "",
  motivo: "",
  tipo: "temporary",
  dias: "30",
};

export const LlamadasAurora = () => {
  const [soloActivos, setSoloActivos] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [levantando, setLevantando] = useState<BloqueoAsistente | null>(null);
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [yaBloqueado, setYaBloqueado] = useState<BloqueoAsistente | null>(null);
  const [destacado, setDestacado] = useState("");
  const [sigueBloqueado, setSigueBloqueado] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const puedeElegirDeLaLista = usePermiso("admin:usuario:gestionar");
  const cuentas = useCuentasParaBloqueo(busqueda, abierto && puedeElegirDeLaLista);
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
    setYaBloqueado(null);
    setBusqueda("");
    bloquear.reset();
    desbloquear.reset();
  };

  const vigenteDe = (lista: readonly BloqueoAsistente[], usuario: string) =>
    lista.find(
      (bloqueo) => bloqueo.usuario === usuario && situacionDeBloqueo(bloqueo) === "activo",
    ) ?? null;

  const abrirFormulario = () => {
    setDestacado("");
    setSigueBloqueado("");
    setAbierto(true);
  };

  const enviar = () =>
    bloquear.mutate(
      {
        usuario: valores.usuario.trim(),
        usuarioNombre: valores.usuarioNombre,
        motivo: valores.motivo,
        tipo: valores.tipo,
        dias: valores.tipo === "temporary" ? dias : 0,
        autor,
      },
      {
        onSuccess: cerrar,
        onError: (error) => {
          if (aProblema(error).status !== 422) return;
          const usuario = valores.usuario.trim();
          void consulta
            .refetch({ cancelRefetch: false })
            .then(({ data }) => setYaBloqueado(vigenteDe(data ?? [], usuario)));
        },
      },
    );

  const irAlVigente = () => {
    if (!yaBloqueado) return;
    setDestacado(yaBloqueado.id);
    setSoloActivos(true);
    cerrar();
  };

  const levantar = () => {
    if (!levantando) return;
    const objetivo = levantando;
    desbloquear.mutate(
      { id: objetivo.id, autor },
      {
        onSuccess: () =>
          consulta.refetch({ cancelRefetch: false }).then(({ data }) => {
            setSigueBloqueado(
              vigenteDe(data ?? [], objetivo.usuario) ? nombreDelBloqueado(objetivo) : "",
            );
            setDestacado("");
            cerrar();
          }),
      },
    );
  };

  const columnas: readonly Columna<BloqueoAsistente>[] = [
    {
      clave: "usuario",
      encabezado: "Usuario",
      render: (bloqueo) => (
        <div className="pila" style={{ gap: "var(--e1)" }}>
          <strong aria-current={bloqueo.id === destacado ? "true" : undefined}>
            {nombreDelBloqueado(bloqueo)}
          </strong>
          {bloqueo.id === destacado ? (
            <Insignia tono="alerta">El bloqueo que ya existía</Insignia>
          ) : null}
          {bloqueo.usuarioNombre ? (
            <span className="enlace-fila__meta mono">{bloqueo.usuario}</span>
          ) : null}
          <span className="enlace-fila__meta">
            {esAutomatico(bloqueo)
              ? "Bloqueo automático del sistema"
              : `Puesto por ${nombreDeQuienBloqueo(bloqueo)}`}
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
                {`${nombreDeQuienLevanto(bloqueo) || "Alguien"} lo levantó el ${fechaHora(
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
          <Boton icono="candado" onClick={abrirFormulario}>
            Bloquear a una persona
          </Boton>
        }
      />

      {sigueBloqueado ? (
        <div className="aviso aviso--alerta" role="alert">
          <Icono nombre="alerta" tamano={18} />
          <p>
            Se levantó el bloqueo, pero <strong>{sigueBloqueado}</strong> sigue con la voz
            bloqueada: hay otro encima, creado después del que acabas de levantar. Levanta también
            el que aparece ahora y pídele que lo intente una sola vez; si vuelve a salir uno
            automático con fecha nueva, es que algo está reintentando la apertura de sesión por su
            cuenta.
          </p>
        </div>
      ) : null}

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
            onCambiar={(valor) => {
              setDestacado("");
              setSoloActivos(valor === "activos");
            }}
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
          deshabilitado={incompleto || yaBloqueado !== null}
          cargando={bloquear.isPending}
          error={yaBloqueado ? undefined : bloquear.error}
          onCerrar={cerrar}
          onEnviar={enviar}
          onLimpiarError={() => bloquear.reset()}
        >
          {yaBloqueado ? (
            <div className="aviso aviso--alerta" role="alert">
              <Icono nombre="candado" tamano={18} />
              <div className="pila" style={{ gap: "var(--e3)" }}>
                <p>
                  <strong>{nombreDelBloqueado(yaBloqueado)} ya está bloqueada.</strong> Los
                  bloqueos no se
                  apilan: con dos encima de la misma persona, «desbloquear» aparentaría funcionar
                  sin funcionar. Motivo del que ya existe: {yaBloqueado.motivo}
                  {yaBloqueado.expiraEn ? `, hasta el ${fechaHora(yaBloqueado.expiraEn)}` : ""}.
                </p>
                <Boton variante="secundario" tamano="sm" icono="flecha" onClick={irAlVigente}>
                  Ver el bloqueo vigente
                </Boton>
              </div>
            </div>
          ) : null}

          {puedeElegirDeLaLista ? (
            <>
              <CampoTexto
                etiqueta="Buscar la persona"
                value={busqueda}
                ayuda="Filtra el listado de cuentas por nombre o correo. Lo que escribas aquí no se envía: el bloqueo se pone sobre la cuenta que elijas abajo."
                onChange={(evento) => setBusqueda(evento.target.value)}
              />
              <CampoSelect
                etiqueta="Persona a bloquear"
                requerido
                value={valores.usuario}
                error={cuentas.error ? "No se pudo leer el listado de cuentas." : undefined}
                ayuda={
                  cuentas.isPending
                    ? "Leyendo las cuentas…"
                    : "El nombre se guarda tal como está hoy: sirve para leer la fila dentro de un año, no para identificar."
                }
                opciones={[
                  { valor: "", etiqueta: "Elige a alguien del listado" },
                  ...(cuentas.data?.datos ?? []).map((cuenta) => ({
                    valor: cuenta.id,
                    etiqueta: `${cuenta.nombre} · ${cuenta.correo}`,
                  })),
                ]}
                onChange={(evento) => {
                  const elegida = (cuentas.data?.datos ?? []).find(
                    (cuenta) => cuenta.id === evento.target.value,
                  );
                  setYaBloqueado(null);
                  setValores({
                    ...valores,
                    usuario: evento.target.value,
                    usuarioNombre: elegida?.nombre ?? "",
                  });
                }}
              />
              {valores.usuario ? (
                <p className="campo__ayuda mono">{valores.usuario}</p>
              ) : null}
            </>
          ) : (
            <CampoTexto
              etiqueta="Identificador del usuario"
              requerido
              value={valores.usuario}
              ayuda="Es el sujeto del token, el mismo que aparece en el listado. Tu rol no puede leer el directorio de cuentas, así que la fila quedará con el identificador y sin nombre."
              onChange={(evento) => {
                setYaBloqueado(null);
                setValores({ ...valores, usuario: evento.target.value, usuarioNombre: "" });
              }}
            />
          )}
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
              <dd className="vista-previa">{nombreDelBloqueado(levantando)}</dd>
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
                  : nombreDeQuienBloqueo(levantando)}
              </dd>
            </div>
          </dl>
        </DialogoFormulario>
      ) : null}
    </div>
  );
};
