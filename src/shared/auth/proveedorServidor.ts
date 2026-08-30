import { entrar, refrescar, salir } from "../api/rest/identidad";
import type { AccesoApi } from "../api/rest/identidad";
import { aRolPlataforma } from "../api/rest/mapeadores";
import { etiquetaDeRol } from "../api/rest/sesion";
import { permisosDeRolConocido } from "./permisosDeRol";
import type { Credenciales, ProveedorAutenticacion, Sesion } from "./tipos";

const NOMBRE_CERROJO = "sicamed.refresco";

const MARGEN_RENOVACION_MS = 60_000;

let credencialEnMemoria: string | undefined;
let renovacionEnCurso: Promise<Sesion | null> | null = null;

export const aSesionDeAcceso = (api: AccesoApi): Sesion => ({
  usuario: {
    id: api.cuenta.id,
    nombre: api.cuenta.nombre,
    correo: api.cuenta.correo,
    rol: etiquetaDeRol(api.cuenta.rol),
    rolPlataforma: aRolPlataforma(api.cuenta.rol),
    organizacionId: api.cuenta.organizacionId ?? "",
    organizacion: "",
    tenantId: "sicamed-co",
  },
  permisos: permisosDeRolConocido(api.cuenta.rol),
  expiracion: Date.now() + api.expiraEn * 1000,
});

export const instanteDeRenovacion = (expiracion: number): number =>
  Math.max(0, expiracion - Date.now() - MARGEN_RENOVACION_MS);

type Cerrojos = { request: <T>(nombre: string, tarea: () => Promise<T>) => Promise<T> };

const cerrojos = (): Cerrojos | undefined =>
  typeof navigator === "undefined"
    ? undefined
    : (navigator as Navigator & { locks?: Cerrojos }).locks;

const enExclusiva = <T,>(tarea: () => Promise<T>): Promise<T> => {
  const gestor = cerrojos();
  return gestor ? gestor.request(NOMBRE_CERROJO, tarea) : tarea();
};

const guardar = (api: AccesoApi): Sesion => {
  credencialEnMemoria = api.acceso;
  return aSesionDeAcceso(api);
};

const renovar = (): Promise<Sesion | null> => {
  if (renovacionEnCurso) return renovacionEnCurso;
  renovacionEnCurso = enExclusiva(async () => {
    try {
      return guardar(await refrescar());
    } catch {
      credencialEnMemoria = undefined;
      return null;
    }
  }).finally(() => {
    renovacionEnCurso = null;
  });
  return renovacionEnCurso;
};

export const proveedorServidor: ProveedorAutenticacion = {
  nombre: "sicamed-identidad",

  restaurar: () => renovar(),

  renovar,

  iniciarSesion: async (credenciales?: Credenciales) => {
    const correo = credenciales?.usuario?.trim() ?? "";
    const clave = credenciales?.clave ?? "";
    if (!correo || !clave) throw new Error("Escribe tu correo y tu contraseña para continuar.");
    return guardar(await entrar({ correo, clave, captcha: credenciales?.captcha }));
  },

  cerrarSesion: async () => {
    if (credencialEnMemoria !== undefined) await salir().catch(() => undefined);
    credencialEnMemoria = undefined;
  },

  credencial: () => credencialEnMemoria,
};
