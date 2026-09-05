import { normalizar } from "../../../i18n/formato";
import { usePantallaDeAurora } from "./usePantallaDeAurora";
import { senalarElemento } from "./senalar";
import type { AccionDePantalla, EstadoDePantalla, ResultadoAccion } from "./tipos";
import type { OpcionSeleccionable } from "./useTablaDeAurora";
import type { Permiso } from "../../../auth/tipos";

export type CampoDeFormulario = {
  clave: string;
  etiqueta: string;
  sinonimos?: readonly string[];
  valor: string;
  opciones?: readonly OpcionSeleccionable[];
  error?: string;
  obligatorio?: boolean;
  fijar: (valor: string) => void;
};

export type FormularioDeAurora = {
  pantalla: string;
  etiqueta: string;
  objetivo: string;
  abierto: boolean;
  anclaje?: string;
  permiso?: Permiso;
  abrir: () => void;
  cerrar?: () => void;
  enviar: () => void;
  campos: readonly CampoDeFormulario[];
};

const valorAdmitido = (campo: CampoDeFormulario, dicho: string): string | null => {
  if (!campo.opciones || campo.opciones.length === 0) return dicho;
  const buscado = normalizar(dicho).trim();
  const opcion =
    campo.opciones.find((admitida) => normalizar(admitida.etiqueta) === buscado) ??
    campo.opciones.find((admitida) => normalizar(admitida.valor) === buscado) ??
    (buscado.length >= 4
      ? campo.opciones.find((admitida) => normalizar(admitida.etiqueta).includes(buscado))
      : undefined);
  return opcion?.valor ?? null;
};

const accionDeApertura = (formulario: FormularioDeAurora): AccionDePantalla => ({
  verbo: "abrir-formulario",
  objetivo: formulario.objetivo,
  etiqueta: formulario.etiqueta,
  permiso: formulario.permiso,
  ejecutar: (): ResultadoAccion => {
    if (formulario.abierto) return { ok: true, detalle: "Ya estaba abierto" };
    formulario.abrir();
    return {
      ok: true,
      detalle: `Abrí ${formulario.etiqueta}`,
      deshacer: formulario.cerrar,
    };
  },
});

const accionDeCampo = (
  formulario: FormularioDeAurora,
  campo: CampoDeFormulario,
  verbo: "prellenar-campo" | "senalar-campo",
): AccionDePantalla => ({
  verbo,
  objetivo: campo.clave,
  etiqueta: campo.etiqueta,
  sinonimos: campo.sinonimos,
  valores: campo.opciones?.map((opcion) => opcion.etiqueta),
  permiso: verbo === "prellenar-campo" ? formulario.permiso : undefined,
  ejecutar: ({ valor }): ResultadoAccion => {
    if (verbo === "senalar-campo") {
      const ancla = formulario.anclaje
        ? document
            .getElementById(formulario.anclaje)
            ?.querySelector(`[data-campo="${campo.clave}"]`)
        : document.querySelector(`[data-campo="${campo.clave}"]`);
      return senalarElemento(ancla)
        ? { ok: true, detalle: `Señalé ${campo.etiqueta}` }
        : { ok: false, motivo: "ese campo no está a la vista" };
    }

    if (!formulario.abierto) return { ok: false, motivo: "el formulario todavía no está abierto" };

    const admitido = valorAdmitido(campo, valor);
    if (admitido === null) {
      return {
        ok: false,
        motivo: `«${valor}» no es una opción de ${campo.etiqueta}`,
        valores: campo.opciones?.map((opcion) => opcion.etiqueta),
      };
    }

    const anterior = campo.valor;
    campo.fijar(admitido);
    return {
      ok: true,
      detalle: `${campo.etiqueta}: ${admitido}`,
      deshacer: () => campo.fijar(anterior),
    };
  },
});

const accionDeEnvio = (formulario: FormularioDeAurora): AccionDePantalla => ({
  verbo: "enviar",
  objetivo: formulario.objetivo,
  etiqueta: formulario.etiqueta,
  permiso: formulario.permiso,
  escribe: true,
  firma: () =>
    formulario.campos.map((campo) => ({
      etiqueta: campo.etiqueta,
      valor: campo.valor === "" ? "—" : campo.valor,
    })),
  ejecutar: (): ResultadoAccion => {
    if (!formulario.abierto) return { ok: false, motivo: "el formulario no está abierto" };
    formulario.enviar();
    return { ok: true, detalle: `Envié ${formulario.etiqueta}` };
  },
});

const estadoDelFormulario = (formulario: FormularioDeAurora): EstadoDePantalla => ({
  pantalla: formulario.pantalla,
  formulario: formulario.abierto
    ? {
        etiqueta: formulario.etiqueta,
        campos: formulario.campos.map((campo) => ({
          etiqueta: campo.etiqueta,
          diligenciado: campo.valor.trim() !== "",
          ...(campo.error ? { error: campo.error } : {}),
        })),
      }
    : null,
});

export const useFormularioDeAurora = (formulario: FormularioDeAurora | null): void => {
  const acciones: readonly AccionDePantalla[] = formulario
    ? [
        accionDeApertura(formulario),
        ...formulario.campos.map((campo) => accionDeCampo(formulario, campo, "senalar-campo")),
        ...formulario.campos.map((campo) => accionDeCampo(formulario, campo, "prellenar-campo")),
        accionDeEnvio(formulario),
      ]
    : [];

  usePantallaDeAurora(formulario ? estadoDelFormulario(formulario) : null, acciones);
};
