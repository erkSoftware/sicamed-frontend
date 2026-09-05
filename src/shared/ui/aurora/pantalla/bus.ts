import { normalizar } from "../../../i18n/formato";
import type {
  AccionDePantalla,
  EstadoDePantalla,
  PeticionDeAccion,
  ResultadoAccion,
  VerboDePantalla,
} from "./tipos";

export type Publicacion = {
  ruta: string;
  estado: EstadoDePantalla;
  acciones: readonly AccionDePantalla[];
};

type Registro = {
  ficha: number;
  publicacion: Publicacion;
  huella: string;
};

let registros: readonly Registro[] = [];
let siguienteFicha = 0;
let oyentes: readonly (() => void)[] = [];

const avisar = () => {
  oyentes.forEach((oyente) => oyente());
};

export const escucharPantalla = (oyente: () => void): (() => void) => {
  oyentes = [...oyentes, oyente];
  return () => {
    oyentes = oyentes.filter((registrado) => registrado !== oyente);
  };
};

export type Suscripcion = {
  actualizar: (publicacion: Publicacion) => void;
  retirar: () => void;
};

export const publicarPantalla = (publicacion: Publicacion): Suscripcion => {
  siguienteFicha += 1;
  const ficha = siguienteFicha;
  registros = [...registros, { ficha, publicacion, huella: huellaDePublicacion(publicacion) }];
  avisar();

  return {
    actualizar: (siguiente) => {
      const huella = huellaDePublicacion(siguiente);
      let cambiado = false;
      registros = registros.map((registro) => {
        if (registro.ficha !== ficha) return registro;
        cambiado = registro.huella !== huella;
        return { ficha, publicacion: siguiente, huella };
      });
      if (cambiado) avisar();
    },
    retirar: () => {
      const antes = registros.length;
      registros = registros.filter((registro) => registro.ficha !== ficha);
      if (registros.length !== antes) avisar();
    },
  };
};

export const vaciarPantalla = (): void => {
  registros = [];
  avisar();
};

export const publicacionesDePantalla = (ruta: string): readonly Publicacion[] =>
  registros
    .filter((registro) => registro.publicacion.ruta === ruta)
    .map((registro) => registro.publicacion);

export const accionesDePantalla = (ruta: string): readonly AccionDePantalla[] =>
  publicacionesDePantalla(ruta).flatMap((publicacion) => publicacion.acciones);

export const estadosDePantalla = (ruta: string): readonly EstadoDePantalla[] =>
  publicacionesDePantalla(ruta).map((publicacion) => publicacion.estado);

const huellaDePublicacion = (publicacion: Publicacion): string =>
  JSON.stringify([
    publicacion.ruta,
    publicacion.estado,
    publicacion.acciones.map((accion) => [
      accion.verbo,
      accion.objetivo,
      accion.etiqueta,
      accion.sinonimos ?? [],
      accion.valores ?? [],
      accion.permiso ?? "",
      accion.escribe === true,
    ]),
  ]);

const terminos = (accion: AccionDePantalla): readonly string[] =>
  [accion.objetivo, accion.etiqueta, ...(accion.sinonimos ?? [])].map(normalizar);

const coincideExacto = (accion: AccionDePantalla, buscado: string): boolean =>
  terminos(accion).includes(buscado);

const coincideParcial = (accion: AccionDePantalla, buscado: string): boolean =>
  buscado.length >= 4 && terminos(accion).some((termino) => termino.includes(buscado));

export const buscarAccion = (
  ruta: string,
  verbo: VerboDePantalla,
  objetivo: string,
): AccionDePantalla | undefined => {
  const candidatas = accionesDePantalla(ruta).filter((accion) => accion.verbo === verbo);
  if (candidatas.length === 0) return undefined;

  const buscado = normalizar(objetivo).trim();
  if (buscado === "") return candidatas.length === 1 ? candidatas[0] : undefined;

  return (
    candidatas.find((accion) => coincideExacto(accion, buscado)) ??
    candidatas.find((accion) => coincideParcial(accion, buscado))
  );
};

export const objetivosDisponibles = (ruta: string, verbo: VerboDePantalla): readonly string[] =>
  accionesDePantalla(ruta)
    .filter((accion) => accion.verbo === verbo)
    .map((accion) => accion.etiqueta);

export const ejecutarAccionDePantalla = async (
  accion: AccionDePantalla,
  peticion: PeticionDeAccion,
): Promise<ResultadoAccion> => {
  try {
    return await accion.ejecutar(peticion);
  } catch {
    return { ok: false, motivo: "la pantalla no pudo completar esa acción" };
  }
};

export const huellaDePantalla = (ruta: string): string =>
  JSON.stringify([
    ruta,
    estadosDePantalla(ruta),
    accionesDePantalla(ruta).map((accion) => [accion.verbo, accion.etiqueta, accion.valores]),
  ]);
