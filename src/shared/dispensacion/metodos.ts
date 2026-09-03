import type { MetodoVerificacion } from "../api/mock/datosDispensacion";

export const ETIQUETA_METODO: Readonly<Record<MetodoVerificacion, string>> = {
  CODIGO_ROTATORIO: "Código rotatorio",
  DOCUMENTO: "Código y cédula cotejada",
  BIOMETRICO: "Código y huella dactilar",
};

export const DETALLE_METODO: Readonly<Record<MetodoVerificacion, string>> = {
  CODIGO_ROTATORIO:
    "El paciente muestra el código que rota en su credencial. Suficiente para producto no fiscalizado.",
  DOCUMENTO:
    "Además del código, quien atiende coteja la cédula contra la persona. El número no se digita ni se guarda: queda la constancia de que se cotejó.",
  BIOMETRICO:
    "Además del código, el lector de huella del punto confirma la identidad. Solo el resultado viaja al sistema, nunca la plantilla biométrica.",
};

export const OPCIONES_METODO = (Object.keys(ETIQUETA_METODO) as MetodoVerificacion[]).map(
  (valor) => ({ valor, etiqueta: ETIQUETA_METODO[valor] }),
);
