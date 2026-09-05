import {
  NOMBRE_DE_HERRAMIENTA,
  cuerpoDeHerramienta,
  ejecutarHerramientaAsistente,
} from "../../../api/clienteAsistente";
import { aProblema } from "../../../api/problemDetails";
import type { ErrorDeCampo } from "../../../api/problemDetails";
import type { HerramientaAsistente, RespuestaHerramienta } from "../../../api/clienteAsistente";
import { buscarAccion, ejecutarAccionDePantalla, objetivosDisponibles } from "../pantalla/bus";
import { esRutaClinica } from "../pantalla/contextoVivo";
import {
  clasificarHerramientaUi,
  destinoDeArgumentos,
  objetivoDeArgumentos,
  valorDeArgumentos,
} from "../pantalla/verbos";
import { ETIQUETA_DE_VERBO } from "../pantalla/tipos";
import type { AccionDePantalla } from "../pantalla/tipos";
import type { RespaldoDeAccion } from "../pantalla/verbos";
import { resultadoDeNavegacion } from "../destinos";
import { anotar } from "./bitacora";
import { pedirFirma } from "./confirmacion";
import { etiquetaDeArgumento, leerArgumentos, motivoDeErrores, validarArgumentos } from "./esquema";
import type { Permiso } from "../../../auth/tipos";

export type ResultadoHerramienta = {
  ok: boolean;
  resumen?: string;
  motivo?: string;
  destino?: string;
  ruta?: string;
  disponibles?: readonly string[];
  errores?: readonly ErrorDeCampo[];
};

export type EntornoDeDespacho = {
  herramientas: () => readonly HerramientaAsistente[];
  permisos: () => readonly Permiso[];
  ruta: () => string;
  llamadaId: () => string;
  navegar: (ruta: string) => void;
  alFinDeConversacion: () => void;
};

export const SIN_CONCESION = "herramienta no concedida";

export const FUERA_DE_LA_ZONA_CLINICA =
  "en la zona clínica solo navego: no leo, repito ni cambio datos de pacientes";

const NEGADA_POR_ROL = "tu cuenta no alcanza esa acción en esta pantalla";

const datosDeTraza = (datos: unknown): string | undefined => {
  if (typeof datos !== "object" || datos === null) return undefined;
  const registro = datos as Record<string, unknown>;
  for (const clave of ["eventoId", "entidadId", "codigo", "id"]) {
    const valor = registro[clave];
    if (typeof valor === "string" && valor.trim() !== "") return valor;
  }
  return undefined;
};

const camposDeFirma = (
  herramienta: HerramientaAsistente,
  argumentos: Readonly<Record<string, unknown>>,
) =>
  Object.entries(argumentos).map(([campo, valor]) => ({
    etiqueta: etiquetaDeArgumento(herramienta.parametros, campo),
    valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
  }));

const navegar = async (
  entorno: EntornoDeDespacho,
  argumentos: Readonly<Record<string, unknown>>,
): Promise<ResultadoHerramienta> => {
  const destino = destinoDeArgumentos(argumentos);
  const resuelto = resultadoDeNavegacion(destino, entorno.permisos());
  if (!resuelto.ok || !resuelto.ruta) return resuelto;

  const anterior = entorno.ruta();
  entorno.navegar(resuelto.ruta);
  anotar({
    herramienta: "navigate_to",
    etiqueta: `Te llevé a ${resuelto.destino ?? resuelto.ruta}`,
    clase: "ui",
    estado: "hecho",
    detalle: resuelto.ruta,
    deshacer: anterior === resuelto.ruta ? undefined : () => entorno.navegar(anterior),
  });
  return { ok: true, destino: resuelto.destino, ruta: resuelto.ruta };
};

const firmarAccion = async (accion: AccionDePantalla, valor: string): Promise<boolean> =>
  pedirFirma({
    herramienta: accion.verbo,
    titulo: `Aurora quiere ${ETIQUETA_DE_VERBO[accion.verbo]} «${accion.etiqueta}»`,
    descripcion: "Esta acción escribe en SICAMED. Revisa los valores antes de autorizarla.",
    entidad: accion.etiqueta,
    campos: accion.firma?.() ?? (valor === "" ? [] : [{ etiqueta: accion.etiqueta, valor }]),
  });

const porRespaldo = (
  entorno: EntornoDeDespacho,
  nombre: string,
  respaldo: RespaldoDeAccion,
): ResultadoHerramienta => {
  if (!entorno.permisos().includes(respaldo.permiso)) {
    return { ok: false, motivo: NEGADA_POR_ROL };
  }

  const anterior = entorno.ruta();
  entorno.navegar(respaldo.ruta);
  anotar({
    herramienta: nombre,
    etiqueta: "Te llevé al formulario",
    clase: "ui",
    estado: "hecho",
    detalle: respaldo.ruta,
    deshacer: () => entorno.navegar(anterior),
  });
  return { ok: true, resumen: "abrí el formulario en su pantalla" };
};

const enPantalla = async (
  entorno: EntornoDeDespacho,
  nombre: string,
  verbo: AccionDePantalla["verbo"],
  objetivoFijo: string | undefined,
  respaldo: RespaldoDeAccion | undefined,
  argumentos: Readonly<Record<string, unknown>>,
): Promise<ResultadoHerramienta> => {
  const ruta = entorno.ruta();
  const objetivo = objetivoFijo ?? objetivoDeArgumentos(argumentos);
  const accion = buscarAccion(ruta, verbo, objetivo);

  if (!accion) {
    if (respaldo) return porRespaldo(entorno, nombre, respaldo);
    const disponibles = objetivosDisponibles(ruta, verbo);
    return {
      ok: false,
      motivo:
        disponibles.length === 0
          ? `esta pantalla no deja ${ETIQUETA_DE_VERBO[verbo]}`
          : `aquí no encuentro «${objetivo}»`,
      ...(disponibles.length > 0 ? { disponibles } : {}),
    };
  }

  if (accion.permiso && !entorno.permisos().includes(accion.permiso)) {
    return { ok: false, motivo: NEGADA_POR_ROL };
  }

  const valor = valorDeArgumentos(argumentos);

  if (accion.escribe && !(await firmarAccion(accion, valor))) {
    anotar({
      herramienta: nombre,
      etiqueta: `${ETIQUETA_DE_VERBO[verbo]} «${accion.etiqueta}»`,
      clase: "ui",
      estado: "rechazado",
      detalle: "No lo autorizaste",
    });
    return { ok: false, motivo: "el usuario no autorizó esa escritura" };
  }

  const resultado = await ejecutarAccionDePantalla(accion, { objetivo, valor, argumentos });
  anotar({
    herramienta: nombre,
    etiqueta: `${ETIQUETA_DE_VERBO[verbo]} «${accion.etiqueta}»`,
    clase: "ui",
    estado: resultado.ok ? "hecho" : "fallido",
    detalle: resultado.detalle ?? resultado.motivo ?? valor,
    deshacer: resultado.deshacer,
  });

  return resultado.ok
    ? { ok: true, resumen: resultado.detalle ?? accion.etiqueta }
    : {
        ok: false,
        motivo: resultado.motivo ?? "no se pudo",
        ...(resultado.valores ? { disponibles: resultado.valores } : {}),
      };
};

const enElServidor = async (
  entorno: EntornoDeDespacho,
  herramienta: HerramientaAsistente,
  callId: string,
  argumentos: Readonly<Record<string, unknown>>,
): Promise<ResultadoHerramienta> => {
  const llamadaId = entorno.llamadaId();
  if (llamadaId === "") return { ok: false, motivo: "la llamada no está registrada" };
  if (!NOMBRE_DE_HERRAMIENTA.test(herramienta.nombre)) {
    return { ok: false, motivo: SIN_CONCESION };
  }

  if (herramienta.clase === "negocio" || herramienta.confirmacionPrevia) {
    const firmada = await pedirFirma({
      herramienta: herramienta.nombre,
      titulo: "Aurora va a escribir en SICAMED",
      descripcion: herramienta.descripcion,
      entidad: herramienta.nombre,
      campos: camposDeFirma(herramienta, argumentos),
    });
    if (!firmada) {
      anotar({
        herramienta: herramienta.nombre,
        etiqueta: herramienta.descripcion,
        clase: herramienta.clase,
        estado: "rechazado",
        detalle: "No la autorizaste",
      });
      return { ok: false, motivo: "el usuario no confirmó" };
    }
  }

  let respuesta: RespuestaHerramienta;
  try {
    respuesta = await ejecutarHerramientaAsistente(
      herramienta.nombre,
      cuerpoDeHerramienta(llamadaId, argumentos, callId),
    );
  } catch (motivo) {
    const problema = aProblema(motivo);
    if (problema.type.endsWith("asistente-llamada-desconocida")) entorno.alFinDeConversacion();
    anotar({
      herramienta: herramienta.nombre,
      etiqueta: herramienta.descripcion,
      clase: herramienta.clase,
      estado: "fallido",
      detalle: problema.detail || problema.title,
    });
    return {
      ok: false,
      motivo: problema.detail || problema.title,
      ...(problema.errores?.length ? { errores: problema.errores } : {}),
    };
  }

  const resumen = respuesta.resumen ?? "";
  anotar({
    herramienta: herramienta.nombre,
    etiqueta: herramienta.descripcion,
    clase: herramienta.clase,
    estado: respuesta.ok ? "hecho" : "fallido",
    detalle: resumen,
    traza: datosDeTraza(respuesta.datos),
  });
  return respuesta.ok
    ? { ok: true, resumen }
    : { ok: false, motivo: resumen || "no se pudo consultar" };
};

export const despachar = async (
  entorno: EntornoDeDespacho,
  nombre: string,
  callId: string,
  crudos: string | undefined,
): Promise<ResultadoHerramienta> => {
  const herramienta = entorno.herramientas().find((opcion) => opcion.nombre === nombre);
  if (!herramienta) return { ok: false, motivo: SIN_CONCESION };

  const revisados = validarArgumentos(herramienta.parametros, leerArgumentos(crudos));
  if (!revisados.ok) {
    return {
      ok: false,
      motivo: `revisa estos argumentos: ${motivoDeErrores(revisados.errores)}`,
      errores: revisados.errores,
    };
  }

  const argumentos = revisados.argumentos;

  if (herramienta.clase === "ui") {
    const accion = clasificarHerramientaUi(nombre);
    if (accion.clase === "navegar") return navegar(entorno, argumentos);
    if (esRutaClinica(entorno.ruta())) return { ok: false, motivo: FUERA_DE_LA_ZONA_CLINICA };
    if (accion.clase === "desconocida") {
      return { ok: false, motivo: "esta versión del panel no resuelve esa acción" };
    }
    return enPantalla(entorno, nombre, accion.verbo, accion.objetivo, accion.respaldo, argumentos);
  }

  if (esRutaClinica(entorno.ruta())) return { ok: false, motivo: FUERA_DE_LA_ZONA_CLINICA };

  return enElServidor(entorno, herramienta, callId, argumentos);
};
