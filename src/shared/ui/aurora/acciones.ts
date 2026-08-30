export type AccionAurora =
  | "reposo"
  | "saludo"
  | "hablar"
  | "escuchar"
  | "senalar"
  | "guiar"
  | "pensar"
  | "asentir"
  | "negar"
  | "celebrar"
  | "alerta"
  | "escribir"
  | "descanso";

export type FichaAccion = {
  clave: AccionAurora;
  etiqueta: string;
  proposito: string;
  frase: string;
  tono: "neutro" | "guia" | "atencion" | "logro";
};

const REPOSO: FichaAccion = {
  clave: "reposo",
  etiqueta: "Reposo",
  proposito: "Estado por defecto mientras nadie la interpela",
  frase: "Aquí estoy cuando me necesites.",
  tono: "neutro",
};

export const ACCIONES: readonly FichaAccion[] = [
  REPOSO,
  {
    clave: "saludo",
    etiqueta: "Saludo",
    proposito: "Entrada al tablero y primer contacto de la sesión",
    frase: "Hola, soy Aurora. Te acompaño en SICAMED.",
    tono: "guia",
  },
  {
    clave: "hablar",
    etiqueta: "Hablar",
    proposito: "Respuesta hablada o lectura de una explicación larga",
    frase: "Un lote de producto terminado necesita su acta de transformación antes de publicarse.",
    tono: "neutro",
  },
  {
    clave: "escuchar",
    etiqueta: "Escuchar",
    proposito: "El usuario dicta o escribe y ella espera",
    frase: "Te escucho, dime qué necesitas registrar.",
    tono: "neutro",
  },
  {
    clave: "senalar",
    etiqueta: "Señalar",
    proposito: "Dirigir la mirada del usuario a un campo o a un panel",
    frase: "Ese es el campo de cupo asignado por el MICC.",
    tono: "guia",
  },
  {
    clave: "guiar",
    etiqueta: "Guiar",
    proposito: "Llevar al usuario a otro módulo del sistema",
    frase: "Vamos a Trazabilidad, ahí queda el registro encadenado.",
    tono: "guia",
  },
  {
    clave: "pensar",
    etiqueta: "Pensar",
    proposito: "Consulta en curso, espera activa",
    frase: "Déjame revisar el expediente…",
    tono: "neutro",
  },
  {
    clave: "asentir",
    etiqueta: "Asentir",
    proposito: "Confirmación de un dato correcto",
    frase: "Correcto, ese número de licencia es válido.",
    tono: "logro",
  },
  {
    clave: "negar",
    etiqueta: "Negar",
    proposito: "Dato inválido o acción no permitida por el rol",
    frase: "Ese trámite no corresponde a tu rol en la organización.",
    tono: "atencion",
  },
  {
    clave: "celebrar",
    etiqueta: "Celebrar",
    proposito: "Registro completado con éxito",
    frase: "Listo, el registro quedó firmado en el ledger.",
    tono: "logro",
  },
  {
    clave: "alerta",
    etiqueta: "Alerta",
    proposito: "Vencimiento, faltante documental o riesgo de cumplimiento",
    frase: "Tienes una licencia que vence en once días.",
    tono: "atencion",
  },
  {
    clave: "escribir",
    etiqueta: "Escribir",
    proposito: "Acompañar el diligenciamiento de un formulario",
    frase: "Voy anotando lo que me dictas del cultivo.",
    tono: "guia",
  },
  {
    clave: "descanso",
    etiqueta: "Descanso",
    proposito: "Sesión inactiva, ella baja la energía",
    frase: "Quedo en espera.",
    tono: "neutro",
  },
];

export const ACCION_INICIAL: AccionAurora = "reposo";

export const fichaDeAccion = (clave: AccionAurora): FichaAccion =>
  ACCIONES.find((ficha) => ficha.clave === clave) ?? REPOSO;
