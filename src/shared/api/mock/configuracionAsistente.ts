import type { ConfiguracionAsistente, LimitesAsistente } from "./tipos";

export type CampoConfiguracionAsistente =
  | "nombre"
  | "saludo"
  | "fraseFueraDeAlcance"
  | "instruccionesExtra"
  | "promptSistema"
  | "mensajeAviso"
  | "voz"
  | "modelo";

export type CampoLimiteAsistente = keyof LimitesAsistente;

export type BorradorConfiguracionAsistente = Readonly<
  Record<CampoConfiguracionAsistente, string>
> & {
  readonly habilitado: boolean;
  readonly proveedor: string;
  readonly apiKey: string;
  readonly borrarApiKey: boolean;
  readonly limites: Readonly<LimitesAsistente>;
};

export const LIMITES_ASISTENTE: Readonly<
  Record<CampoConfiguracionAsistente, { maximo: number; obligatorio: boolean }>
> = {
  nombre: { maximo: 40, obligatorio: true },
  saludo: { maximo: 1_200, obligatorio: true },
  fraseFueraDeAlcance: { maximo: 300, obligatorio: true },
  instruccionesExtra: { maximo: 4_000, obligatorio: false },
  promptSistema: { maximo: 8_000, obligatorio: false },
  mensajeAviso: { maximo: 300, obligatorio: false },
  voz: { maximo: 40, obligatorio: false },
  modelo: { maximo: 80, obligatorio: false },
};

export const CAMPOS_ASISTENTE = Object.keys(
  LIMITES_ASISTENTE,
) as readonly CampoConfiguracionAsistente[];

export const RANGOS_LIMITES: Readonly<
  Record<CampoLimiteAsistente, { minimo: number; maximo: number }>
> = {
  duracionMaximaSegundos: { minimo: 30, maximo: 7_200 },
  avisoPrevioSegundos: { minimo: 0, maximo: 7_199 },
  limiteDiarioSegundos: { minimo: 0, maximo: 86_400 },
  intentosMaximos: { minimo: 0, maximo: 10_000 },
  ventanaIntentosHoras: { minimo: 1, maximo: 720 },
  bloqueoAutomaticoDias: { minimo: 1, maximo: 3_650 },
};

export const CAMPOS_LIMITE = Object.keys(RANGOS_LIMITES) as readonly CampoLimiteAsistente[];

export const LARGO_MINIMO_CLAVE = 20;

export const VOZ_DEL_DESPLIEGUE = "marin";

export const MODELO_DEL_DESPLIEGUE = "gpt-realtime";

export const MODELOS_DEL_DESPLIEGUE: readonly string[] = ["gpt-realtime", "gpt-realtime-mini"];

export const PROVEEDORES_ASISTENTE: readonly { valor: string; etiqueta: string }[] = [
  { valor: "openai", etiqueta: "OpenAI Realtime" },
];

export const VOCES_ASISTENTE: readonly { valor: string; etiqueta: string }[] = [
  { valor: "marin", etiqueta: "Marin · neutra y pausada" },
  { valor: "cedar", etiqueta: "Cedar · grave y sobria" },
  { valor: "alloy", etiqueta: "Alloy · clara y directa" },
  { valor: "coral", etiqueta: "Coral · cálida" },
  { valor: "sage", etiqueta: "Sage · serena" },
  { valor: "verse", etiqueta: "Verse · expresiva" },
];

export const LIMITES_DE_FABRICA: LimitesAsistente = {
  duracionMaximaSegundos: 300,
  avisoPrevioSegundos: 60,
  limiteDiarioSegundos: 600,
  intentosMaximos: 10,
  ventanaIntentosHoras: 24,
  bloqueoAutomaticoDias: 30,
};

export const CONFIGURACION_ASISTENTE_DE_FABRICA: ConfiguracionAsistente = {
  nombre: "AURORA",
  saludo:
    "Bienvenido a SICAMED. Soy AURORA, la guía del Sistema de Información del Cannabis " +
    "Medicinal. Puedo explicarle qué ve en pantalla, llevarle al módulo que necesite y " +
    "acompañarle mientras registra información. Dígame en qué está trabajando.",
  fraseFueraDeAlcance: "Solo puedo ayudarle con temas de la plataforma SICAMED.",
  instruccionesExtra: "",
  promptSistema: "",
  mensajeAviso: "Le queda aproximadamente un minuto de conversación disponible.",
  habilitado: true,
  proveedor: "openai",
  modelo: "",
  modeloEfectivo: MODELO_DEL_DESPLIEGUE,
  modelosDisponibles: MODELOS_DEL_DESPLIEGUE,
  voz: "",
  vozEfectiva: VOZ_DEL_DESPLIEGUE,
  apiKey: { configurada: false, enmascarada: "" },
  limites: { ...LIMITES_DE_FABRICA },
  deFabrica: true,
  actualizadoEn: null,
  actualizadoPor: "",
};

const RANGOS_INVISIBLES: readonly (readonly [number, number])[] = [
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x9f],
  [0xad, 0xad],
  [0x200b, 0x200f],
  [0x2028, 0x2029],
  [0x202a, 0x202e],
  [0x2060, 0x2064],
  [0xfeff, 0xfeff],
];

const esInvisible = (caracter: string): boolean => {
  const punto = caracter.codePointAt(0) ?? 0;
  return RANGOS_INVISIBLES.some(([desde, hasta]) => punto >= desde && punto <= hasta);
};

export const sanearTextoDeAsistente = (valor: string): string =>
  [...valor.replace(/\r\n?/g, "\n")]
    .filter((caracter) => !esInvisible(caracter))
    .join("")
    .trim();

export const enmascararClave = (clave: string): string =>
  clave.length <= 4 ? "•".repeat(clave.length) : `${"•".repeat(12)}${clave.slice(-4)}`;

export const minutos = (segundos: number): string => {
  if (segundos === 0) return "sin límite";
  if (segundos % 60 === 0) return `${segundos / 60} min`;
  return `${Math.floor(segundos / 60)} min ${segundos % 60} s`;
};

export const reloj = (segundos: number): string => {
  const seguro = Math.max(0, Math.round(segundos));
  const parteMinutos = Math.floor(seguro / 60)
    .toString()
    .padStart(2, "0");
  const parteSegundos = (seguro % 60).toString().padStart(2, "0");
  return `${parteMinutos}:${parteSegundos}`;
};

export const borradorDeConfiguracion = (
  configuracion: ConfiguracionAsistente,
): BorradorConfiguracionAsistente => ({
  nombre: configuracion.nombre,
  saludo: configuracion.saludo,
  fraseFueraDeAlcance: configuracion.fraseFueraDeAlcance,
  instruccionesExtra: configuracion.instruccionesExtra,
  promptSistema: configuracion.promptSistema,
  mensajeAviso: configuracion.mensajeAviso,
  voz: configuracion.voz,
  modelo: configuracion.modelo,
  habilitado: configuracion.habilitado,
  proveedor: configuracion.proveedor,
  apiKey: "",
  borrarApiKey: false,
  limites: { ...configuracion.limites },
});

const errorDeTexto = (
  campo: CampoConfiguracionAsistente,
  borrador: BorradorConfiguracionAsistente,
): readonly (readonly [string, string])[] => {
  const limite = LIMITES_ASISTENTE[campo];
  const valor = sanearTextoDeAsistente(borrador[campo]);
  if (limite.obligatorio && valor === "") return [[campo, "Este campo no puede quedar vacío."]];
  if (valor.length > limite.maximo)
    return [[campo, `Máximo ${limite.maximo.toLocaleString("es-CO")} caracteres.`]];
  return [];
};

const errorDeLimite = (
  campo: CampoLimiteAsistente,
  borrador: BorradorConfiguracionAsistente,
): readonly (readonly [string, string])[] => {
  const rango = RANGOS_LIMITES[campo];
  const valor = borrador.limites[campo];
  if (!Number.isFinite(valor) || !Number.isInteger(valor))
    return [[campo, "Escribe un número entero."]];
  if (valor < rango.minimo || valor > rango.maximo)
    return [
      [
        campo,
        `Entre ${rango.minimo.toLocaleString("es-CO")} y ${rango.maximo.toLocaleString("es-CO")}.`,
      ],
    ];
  return [];
};

export const erroresDeConfiguracion = (
  borrador: BorradorConfiguracionAsistente,
  modelosDisponibles: readonly string[] = MODELOS_DEL_DESPLIEGUE,
): Readonly<Record<string, string>> => {
  const textos = CAMPOS_ASISTENTE.flatMap((campo) => errorDeTexto(campo, borrador));
  const numeros = CAMPOS_LIMITE.flatMap((campo) => errorDeLimite(campo, borrador));

  const modelo = sanearTextoDeAsistente(borrador.modelo);
  const fueraDeCatalogo =
    modelo !== "" && !modelosDisponibles.includes(modelo)
      ? [["modelo", "Ese modelo no está en el catálogo del despliegue."] as const]
      : [];

  const aviso = borrador.limites.avisoPrevioSegundos;
  const duracion = borrador.limites.duracionMaximaSegundos;
  const avisoLargo =
    aviso > 0 && aviso >= duracion
      ? [
          [
            "avisoPrevioSegundos",
            "El aviso tiene que caber dentro de la llamada: debe ser menor que la duración máxima.",
          ] as const,
        ]
      : [];

  const avisoSinTexto =
    aviso > 0 && sanearTextoDeAsistente(borrador.mensajeAviso) === ""
      ? [["mensajeAviso", "Con aviso configurado hace falta la frase que AURORA dirá."] as const]
      : [];

  const clave = borrador.apiKey.trim();
  const claveCorta =
    clave !== "" && clave.length < LARGO_MINIMO_CLAVE
      ? [["apiKey", `La credencial tiene menos de ${LARGO_MINIMO_CLAVE} caracteres.`] as const]
      : [];

  return Object.fromEntries([
    ...textos,
    ...numeros,
    ...fueraDeCatalogo,
    ...avisoLargo,
    ...avisoSinTexto,
    ...claveCorta,
  ]);
};
