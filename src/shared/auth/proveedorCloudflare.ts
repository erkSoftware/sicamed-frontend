import type { Permiso, ProveedorAutenticacion, Sesion } from "./tipos";
import { DURACION_SESION_MS } from "./perfiles";

type IdentidadCloudflare = {
  email?: string;
  name?: string;
  user_uuid?: string;
  custom?: Record<string, unknown>;
  groups?: readonly { id?: string; name?: string; email?: string }[];
};

const RUTA_IDENTIDAD = "/cdn-cgi/access/get-identity";
const RUTA_SALIDA = "/cdn-cgi/access/logout";

const PERMISOS_POR_GRUPO: Record<string, readonly Permiso[]> = {
  "sicamed-productores": [
    "actores:org:leer",
    "actores:org:escribir",
    "cumplimiento:atestacion:leer",
    "cumplimiento:atestacion:escribir",
    "produccion:cultivo:leer",
    "produccion:cultivo:escribir",
    "inventario:lote:leer",
    "inventario:lote:escribir",
    "vitrina:oferta:leer",
    "vitrina:oferta:publicar",
    "trazabilidad:evento:leer",
    "directorio:actor:leer",
    "reportes:tablero:leer",
    "ruedas:convocatoria:leer",
  ],
  "sicamed-clinico": [
    "actores:org:leer",
    "directorio:actor:leer",
    "clinico:atencion:leer",
    "clinico:agenda:gestionar",
    "clinico:teleconsulta:atender",
  ],
  "sicamed-institucional": [
    "actores:org:leer",
    "cumplimiento:atestacion:leer",
    "vitrina:oferta:leer",
    "trazabilidad:evento:leer",
    "reportes:tablero:leer",
    "institucional:consultar",
    "directorio:actor:leer",
  ],
};

const permisosDesdeGrupos = (identidad: IdentidadCloudflare): readonly Permiso[] => {
  const nombres = (identidad.groups ?? [])
    .map((grupo) => grupo.name ?? grupo.email ?? grupo.id ?? "")
    .map((nombre) => nombre.toLowerCase());
  const acumulado = new Set<Permiso>();
  for (const nombre of nombres) {
    for (const permiso of PERMISOS_POR_GRUPO[nombre] ?? []) acumulado.add(permiso);
  }
  return [...acumulado];
};

const textoDe = (valor: unknown, respaldo: string): string =>
  typeof valor === "string" && valor.length > 0 ? valor : respaldo;

const aSesion = (identidad: IdentidadCloudflare): Sesion => {
  const personalizado = identidad.custom ?? {};
  return {
    usuario: {
      id: textoDe(identidad.user_uuid, "usuario-cloudflare"),
      nombre: textoDe(identidad.name, textoDe(identidad.email, "Usuario SICAMED")),
      correo: textoDe(identidad.email, ""),
      rol: textoDe(personalizado.rol, "Usuario autenticado"),
      organizacionId: textoDe(personalizado.organizacion_id, ""),
      organizacion: textoDe(personalizado.organizacion, "Organización sin asignar"),
      tenantId: textoDe(personalizado.tenant_id, "sicamed-co"),
    },
    permisos: permisosDesdeGrupos(identidad),
    expiracion: Date.now() + DURACION_SESION_MS,
  };
};

export const proveedorCloudflare: ProveedorAutenticacion = {
  nombre: "cloudflare-access",

  restaurar: async () => {
    const respuesta = await fetch(RUTA_IDENTIDAD, { credentials: "include" });
    if (!respuesta.ok) return null;
    return aSesion((await respuesta.json()) as IdentidadCloudflare);
  },

  iniciarSesion: async () => {
    const respuesta = await fetch(RUTA_IDENTIDAD, { credentials: "include" });
    if (respuesta.ok) return aSesion((await respuesta.json()) as IdentidadCloudflare);
    window.location.assign(`/app?redirigido=${encodeURIComponent(window.location.pathname)}`);
    return new Promise<Sesion>(() => undefined);
  },

  cerrarSesion: async () => {
    window.location.assign(RUTA_SALIDA);
  },

  credencial: () => undefined,
};
