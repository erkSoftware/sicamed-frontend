import { useMemo, useState } from "react";
import { EncabezadoPagina } from "../../../shared/ui/patrones/EncabezadoPagina";
import { TablaConFiltros } from "../../../shared/ui/patrones/TablaConFiltros";
import { EstadoVacio } from "../../../shared/ui/patrones/EstadoVacio";
import { DialogoFormulario } from "../../../shared/ui/patrones/DialogoFormulario";
import { ErrorNormativo } from "../../../shared/ui/patrones/ErrorNormativo";
import { RegionDesplazable } from "../../../shared/ui/patrones/RegionDesplazable";
import { Kpi } from "../../../shared/ui/patrones/Kpi";
import { Tarjeta } from "../../../shared/ui/primitivos/Tarjeta";
import { Insignia } from "../../../shared/ui/primitivos/Insignia";
import { Boton } from "../../../shared/ui/primitivos/Boton";
import { Icono } from "../../../shared/ui/primitivos/Icono";
import { CampoSelect, CampoTexto } from "../../../shared/ui/primitivos/Campo";
import { SiTienePermiso } from "../../../shared/rbac/SiTienePermiso";
import { useAutor } from "../../../shared/auth/useAutor";
import { aProblema } from "../../../shared/api/problemDetails";
import { ALCANCE_ROL, ETIQUETA_ROL } from "../../../shared/api/mock/datosGobierno";
import { fechaCorta, iniciales, numero } from "../../../shared/i18n/formato";
import type { CuentaUsuario, EstadoCuenta, RolPlataforma } from "../../../shared/api/mock/tipos";
import type { Columna } from "../../../shared/ui/primitivos/Tabla";
import {
  useCambiarCuenta,
  useCuentas,
  useInvitarCuenta,
  useOrganizaciones,
} from "../hooks/useCuentas";

const TONO_ESTADO = {
  ACTIVA: "exito",
  INVITADA: "info",
  SUSPENDIDA: "alerta",
  INACTIVA: "neutro",
} as const;

const ETIQUETA_ESTADO = {
  ACTIVA: "Activa",
  INVITADA: "Invitada",
  SUSPENDIDA: "Suspendida",
  INACTIVA: "Inactiva",
} as const;

const ROLES: readonly RolPlataforma[] = [
  "SUPER_ADMIN",
  "ADMIN_INSTITUCIONAL",
  "ANALISTA_DOCUMENTAL",
  "REPRESENTANTE_LEGAL",
  "OPERARIO_CAMPO",
  "EQUIPO_CLINICO",
  "OBSERVADOR_INSTITUCIONAL",
];

const SIGUIENTE_ESTADO: Record<EstadoCuenta, EstadoCuenta> = {
  ACTIVA: "SUSPENDIDA",
  SUSPENDIDA: "ACTIVA",
  INVITADA: "ACTIVA",
  INACTIVA: "ACTIVA",
};

type Formulario = { nombre: string; correo: string; rol: RolPlataforma; organizacionId: string };

const INICIAL: Formulario = {
  nombre: "",
  correo: "",
  rol: "REPRESENTANTE_LEGAL",
  organizacionId: "",
};

export const Usuarios = () => {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [rol, setRol] = useState("");
  const [pagina, setPagina] = useState(1);
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState<Formulario>(INICIAL);
  const [errores, setErrores] = useState<Partial<Record<keyof Formulario, string>>>({});

  const consulta = useCuentas({ busqueda, estado, tipo: rol, pagina, porPagina: 10 });
  const organizaciones = useOrganizaciones();
  const invitar = useInvitarCuenta();
  const cambiar = useCambiarCuenta();
  const autor = useAutor();

  const visibles = consulta.data?.datos ?? [];
  const nombresDeOrganizacion = useMemo(
    () =>
      new Map(
        (organizaciones.data?.datos ?? []).map((organizacion) => [
          organizacion.id,
          organizacion.nombre,
        ]),
      ),
    [organizaciones.data],
  );
  const activas = visibles.filter((cuenta) => cuenta.estado === "ACTIVA").length;
  const invitadas = visibles.filter((cuenta) => cuenta.estado === "INVITADA").length;
  const sinAcceso = visibles.filter((cuenta) => cuenta.ultimoAcceso === null).length;

  const cerrar = () => {
    setAbierto(false);
    setValores(INICIAL);
    setErrores({});
    invitar.reset();
  };

  const enviar = () => {
    const encontrados: Partial<Record<keyof Formulario, string>> = {};
    if (valores.nombre.trim().length < 5) encontrados.nombre = "Indica el nombre completo.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valores.correo))
      encontrados.correo = "Indica un correo institucional válido.";
    if (!valores.organizacionId) encontrados.organizacionId = "Selecciona la organización.";
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    invitar.mutate({ ...valores, autor }, { onSuccess: cerrar });
  };

  const columnas: readonly Columna<CuentaUsuario>[] = [
    {
      clave: "persona",
      encabezado: "Persona",
      render: (cuenta) => (
        <span className="fila" style={{ gap: "var(--e3)", alignItems: "center" }}>
          <span className="avatar avatar--pequeno" aria-hidden="true">
            {iniciales(cuenta.nombre)}
          </span>
          <span>
            <strong>{cuenta.nombre}</strong>
            <br />
            <span className="enlace-fila__meta mono">{cuenta.correo}</span>
          </span>
        </span>
      ),
    },
    {
      clave: "organizacion",
      encabezado: "Organización",
      render: (cuenta) => nombresDeOrganizacion.get(cuenta.organizacionId) ?? cuenta.organizacion,
    },
    {
      clave: "rol",
      encabezado: "Rol",
      render: (cuenta) => (
        <SiTienePermiso
          permiso="admin:usuario:gestionar"
          alternativa={<Insignia tono="neutro">{ETIQUETA_ROL[cuenta.rol]}</Insignia>}
        >
          <select
            className="campo__control campo__control--compacto"
            aria-label={`Rol de ${cuenta.nombre}`}
            value={cuenta.rol}
            onChange={(evento) =>
              cambiar.mutate({
                id: cuenta.id,
                rol: evento.target.value as RolPlataforma,
                autor,
              })
            }
          >
            {ROLES.map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETA_ROL[valor]}
              </option>
            ))}
          </select>
        </SiTienePermiso>
      ),
    },
    {
      clave: "estado",
      encabezado: "Estado",
      render: (cuenta) => (
        <Insignia tono={TONO_ESTADO[cuenta.estado]}>{ETIQUETA_ESTADO[cuenta.estado]}</Insignia>
      ),
    },
    {
      clave: "acceso",
      encabezado: "Último acceso",
      render: (cuenta) =>
        cuenta.ultimoAcceso ? (
          <span className="dato">{fechaCorta(cuenta.ultimoAcceso)}</span>
        ) : (
          <span className="enlace-fila__meta">Nunca ha ingresado</span>
        ),
    },
    {
      clave: "invitada",
      encabezado: "Invitada por",
      render: (cuenta) => (
        <span>
          {cuenta.invitadaPor || "—"}
          <br />
          <span className="enlace-fila__meta">{fechaCorta(cuenta.creada)}</span>
        </span>
      ),
    },
    {
      clave: "acciones",
      encabezado: "Acceso",
      render: (cuenta) => (
        <SiTienePermiso permiso="admin:usuario:gestionar">
          <Boton
            variante={cuenta.estado === "ACTIVA" ? "fantasma" : "secundario"}
            tamano="sm"
            icono={cuenta.estado === "ACTIVA" ? "candado" : "check"}
            cargando={cambiar.isPending && cambiar.variables?.id === cuenta.id}
            onClick={() =>
              cambiar.mutate({ id: cuenta.id, estado: SIGUIENTE_ESTADO[cuenta.estado], autor })
            }
          >
            {cuenta.estado === "ACTIVA" ? "Suspender" : "Activar"}
          </Boton>
        </SiTienePermiso>
      ),
    },
  ];

  return (
    <div className="pagina">
      <EncabezadoPagina
        titulo="Cuentas y roles"
        subtitulo="Quién accede al sistema, con qué rol y bajo qué organización. El plan piloto opera con vinculación progresiva y controlada: no hay autoservicio abierto."
        acciones={
          <SiTienePermiso permiso="admin:usuario:gestionar">
            <Boton icono="mas" onClick={() => setAbierto(true)}>
              Invitar cuenta
            </Boton>
          </SiTienePermiso>
        }
      />

      <div className="rejilla-kpi">
        <Kpi etiqueta="Cuentas registradas" valor={numero(consulta.data?.total ?? 0)} icono="usuario" />
        <Kpi etiqueta="Activas en esta página" valor={numero(activas)} icono="check" />
        <Kpi etiqueta="Invitaciones pendientes" valor={numero(invitadas)} icono="reloj" nota="Aún no aceptadas" />
        <Kpi
          etiqueta="Sin primer acceso"
          valor={numero(sinAcceso)}
          icono="alerta"
          nota="Candidatas a revisión"
        />
      </div>

      <div className="aviso aviso--info">
        <Icono nombre="candado" tamano={18} />
        <p>
          Las contraseñas no viven aquí: la identidad la resuelve el proveedor OIDC. SICAMED define
          quién existe, con qué rol y sobre qué organización. Cada cambio de rol o de estado queda
          como evento de trazabilidad con el administrador que lo hizo.
        </p>
      </div>

      {cambiar.error ? (
        <ErrorNormativo problema={aProblema(cambiar.error)} onReintentar={() => cambiar.reset()} />
      ) : null}

      <TablaConFiltros
        descripcion="Cuentas de usuario de la plataforma"
        columnas={columnas}
        claveFila={(cuenta) => cuenta.id}
        consulta={consulta}
        busqueda={busqueda}
        onBusqueda={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        etiquetaBusqueda="Buscar cuenta"
        marcadorBusqueda="Buscar por nombre, correo u organización"
        segmentos={{
          etiqueta: "Filtrar por estado",
          valor: estado,
          onCambiar: (valor) => {
            setEstado(valor);
            setPagina(1);
          },
          opciones: [
            { valor: "", etiqueta: "Todas" },
            { valor: "ACTIVA", etiqueta: "Activas" },
            { valor: "INVITADA", etiqueta: "Invitadas" },
            { valor: "SUSPENDIDA", etiqueta: "Suspendidas" },
            { valor: "INACTIVA", etiqueta: "Inactivas" },
          ],
        }}
        selectores={[
          {
            clave: "rol",
            etiqueta: "Rol",
            valor: rol,
            opciones: ROLES.map((valor) => ({ valor, etiqueta: ETIQUETA_ROL[valor] })),
            onCambiar: (valor) => {
              setRol(valor);
              setPagina(1);
            },
          },
        ]}
        onPagina={setPagina}
        etiquetaPlural="cuentas"
        vacio={
          <EstadoVacio
            icono="usuario"
            titulo="No hay cuentas con esos criterios"
            texto="Invita a una persona indicando su rol y la organización a la que pertenece."
          />
        }
      />

      <Tarjeta
        titulo="Qué puede hacer cada rol"
        descripcion="La separación de funciones no es una convención: el servidor la impone"
        sinRelleno
        pie={
          <p className="pie-region mono">
            El super administrador define la política pero no verifica expedientes
          </p>
        }
      >
        <RegionDesplazable etiqueta="Alcance de cada rol" alto={280}>
          <ul className="ficha-lista">
            {ROLES.map((valor) => (
              <li key={valor} className="ficha-lista__item">
                <span className="ficha-lista__cuerpo">
                  <strong>{ETIQUETA_ROL[valor]}</strong>
                  <span className="ficha-lista__meta">{ALCANCE_ROL[valor]}</span>
                </span>
                <Insignia tono={valor === "SUPER_ADMIN" ? "alerta" : "neutro"}>
                  {numero(visibles.filter((cuenta) => cuenta.rol === valor).length)} en página
                </Insignia>
              </li>
            ))}
          </ul>
        </RegionDesplazable>
      </Tarjeta>

      <DialogoFormulario
        abierto={abierto}
        titulo="Invitar cuenta"
        descripcion="La persona recibirá una invitación y aparecerá como INVITADA hasta que ingrese por primera vez. La autenticación la resuelve el proveedor de identidad, no SICAMED."
        etiquetaEnviar="Enviar invitación"
        cargando={invitar.isPending}
        error={invitar.error}
        ancho
        onCerrar={cerrar}
        onEnviar={enviar}
        onLimpiarError={() => invitar.reset()}
      >
        <div className="rejilla rejilla--2">
          <CampoTexto
            etiqueta="Nombre completo"
            requerido
            value={valores.nombre}
            error={errores.nombre}
            onChange={(evento) =>
              setValores((previos) => ({ ...previos, nombre: evento.target.value }))
            }
          />
          <CampoTexto
            etiqueta="Correo institucional"
            requerido
            type="email"
            value={valores.correo}
            error={errores.correo}
            onChange={(evento) =>
              setValores((previos) => ({ ...previos, correo: evento.target.value }))
            }
          />
        </div>
        <CampoSelect
          etiqueta="Organización"
          requerido
          vacio="Selecciona la organización"
          value={valores.organizacionId}
          error={errores.organizacionId}
          opciones={(organizaciones.data?.datos ?? []).map((organizacion) => ({
            valor: organizacion.id,
            etiqueta: `${organizacion.nombre} · ${organizacion.nit}`,
          }))}
          onChange={(evento) =>
            setValores((previos) => ({ ...previos, organizacionId: evento.target.value }))
          }
        />
        <CampoSelect
          etiqueta="Rol"
          requerido
          value={valores.rol}
          ayuda={ALCANCE_ROL[valores.rol]}
          opciones={ROLES.map((valor) => ({ valor, etiqueta: ETIQUETA_ROL[valor] }))}
          onChange={(evento) =>
            setValores((previos) => ({ ...previos, rol: evento.target.value as RolPlataforma }))
          }
        />
      </DialogoFormulario>
    </div>
  );
};
