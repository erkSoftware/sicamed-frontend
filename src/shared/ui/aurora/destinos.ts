import { NAVEGACION } from "../../rbac/navegacion";
import { MODULOS } from "../../rbac/modulos";
import { normalizar } from "../../i18n/formato";
import type { ItemNavegacion } from "../../rbac/navegacion";
import type { Permiso } from "../../auth/tipos";

export type ResultadoDestino =
  | { ok: true; ruta: string; etiqueta: string }
  | { ok: false; motivo: string; disponibles?: readonly string[] };

const ALIAS: Readonly<Record<string, string>> = {
  inicio: "/app",
  panel: "/app",
  tablero: "/app",
  centro: "/app",
  casa: "/app",
  cultivo: "/app/produccion",
  cultivos: "/app/produccion",
  siembra: "/app/produccion",
  cosecha: "/app/beneficio",
  planta: "/app/plantas",
  mercado: "/app/vitrina",
  ofertas: "/app/vitrina",
  oferta: "/app/vitrina",
  comprar: "/app/vitrina",
  vender: "/app/vitrina",
  cumplimiento: "/app/licencias",
  licencia: "/app/licencias",
  atestaciones: "/app/licencias",
  expediente: "/app/expedientes",
  registros: "/app/solicitudes",
  solicitud: "/app/solicitudes",
  cuentas: "/app/usuarios",
  usuarios: "/app/usuarios",
  roles: "/app/usuarios",
  lotes: "/app/inventario",
  existencias: "/app/inventario",
  ledger: "/app/trazabilidad",
  reportes: "/app/reportes",
  indicadores: "/app/reportes",
  politicas: "/app/politicas",
  asistente: "/app/aurora/configuracion",
  aurora: "/app/aurora/configuracion",
  clinica: "/app/salud/pacientes",
  telemedicina: "/app/salud/pacientes",
  pacientes: "/app/salud/pacientes",
  citas: "/app/salud/agenda",
  consulta: "/app/salud/teleconsulta",
};

const VERBOS =
  /^(llevame|llevar|llevanos|vamos|voy|ir|irme|abre|abreme|abrir|ve|vete|quiero ir|quiero|necesito ir|necesito|entra|entrar|muestrame|mostrar|ensename|sacame|pasame|ponme)\b\s*/u;

const PARTICULAS = /^(a|al|el|la|los|las|de|del|mi|mis|hacia|para|por|en|the|to)\b\s*/u;

const limpiar = (destino: string): string => {
  const sinSignos = normalizar(destino)
    .replace(/[¿?¡!.,;:]/gu, "")
    .trim();
  let termino = sinSignos.replace(VERBOS, "");
  let previo = "";
  while (previo !== termino) {
    previo = termino;
    termino = termino.replace(PARTICULAS, "");
  }
  return termino.trim() === "" ? sinSignos.trim() : termino.trim();
};

const alcanzables = (permisos: readonly Permiso[]): readonly ItemNavegacion[] =>
  NAVEGACION.filter((item) => permisos.includes(item.permiso));

const porRuta = (candidatos: readonly ItemNavegacion[], ruta: string) =>
  candidatos.find((item) => normalizar(item.ruta) === ruta);

const porEtiqueta = (candidatos: readonly ItemNavegacion[], termino: string) =>
  candidatos.find((item) => normalizar(item.etiqueta) === termino);

const porModulo = (candidatos: readonly ItemNavegacion[], termino: string) => {
  const modulo = MODULOS.find(
    (opcion) => opcion.id === termino || normalizar(opcion.etiqueta) === termino,
  );
  return modulo ? candidatos.find((item) => item.modulo === modulo.id) : undefined;
};

const porAproximacion = (candidatos: readonly ItemNavegacion[], termino: string) =>
  termino.length < 4
    ? undefined
    : candidatos.find(
        (item) =>
          normalizar(item.etiqueta).includes(termino) ||
          normalizar(item.descripcion).includes(termino),
      );

const porAlias = (candidatos: readonly ItemNavegacion[], termino: string) => {
  const ruta = ALIAS[termino];
  if (!ruta) return undefined;
  if (ruta === "/app") return candidatos.find((item) => item.ruta === "/app");
  return candidatos.find((item) => item.ruta === ruta);
};

export const resolverDestino = (
  destino: string,
  permisos: readonly Permiso[],
): ResultadoDestino => {
  const termino = limpiar(destino);
  if (termino === "") return { ok: false, motivo: "no dijiste a dónde quieres ir" };

  const candidatos = alcanzables(permisos);
  const encontrado =
    porRuta(candidatos, termino) ??
    porEtiqueta(candidatos, termino) ??
    porAlias(candidatos, termino) ??
    porModulo(candidatos, termino) ??
    porAproximacion(candidatos, termino);

  if (encontrado) return { ok: true, ruta: encontrado.ruta, etiqueta: encontrado.etiqueta };

  const existeSinPermiso =
    porRuta(NAVEGACION, termino) ??
    porEtiqueta(NAVEGACION, termino) ??
    porAlias(NAVEGACION, termino) ??
    porModulo(NAVEGACION, termino) ??
    porAproximacion(NAVEGACION, termino);

  if (existeSinPermiso)
    return {
      ok: false,
      motivo: `${existeSinPermiso.etiqueta} existe pero tu rol no entra ahí`,
    };

  return {
    ok: false,
    motivo: `no hay ninguna pantalla que se llame «${destino}»`,
    disponibles: candidatos.slice(0, 8).map((item) => item.etiqueta),
  };
};

export type ResultadoNavegacion = {
  ok: boolean;
  destino?: string;
  ruta?: string;
  motivo?: string;
  disponibles?: readonly string[];
};

export const resultadoDeNavegacion = (
  destino: string,
  permisos: readonly Permiso[],
): ResultadoNavegacion => {
  const resuelto = resolverDestino(destino, permisos);
  if (resuelto.ok) return { ok: true, destino: resuelto.etiqueta, ruta: resuelto.ruta };
  return resuelto.disponibles
    ? { ok: false, motivo: resuelto.motivo, disponibles: resuelto.disponibles }
    : { ok: false, motivo: resuelto.motivo };
};
