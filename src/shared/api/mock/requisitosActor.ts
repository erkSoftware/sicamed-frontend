import type { DocumentoRequeridoApi, RequisitosActorApi } from "../rest/contrato";
import type { TipoActor } from "./tipos";

const COMUNES: readonly DocumentoRequeridoApi[] = [
  { tipo: "RUT", etiqueta: "Registro Único Tributario", obligatorio: false },
  {
    tipo: "CAMARA_COMERCIO",
    etiqueta: "Certificado de existencia y representación",
    obligatorio: false,
  },
  {
    tipo: "CEDULA_REPRESENTANTE",
    etiqueta: "Documento del representante legal",
    obligatorio: false,
  },
];

const PROPIOS: Readonly<Record<TipoActor, readonly DocumentoRequeridoApi[]>> = {
  CULTIVADOR: [
    {
      tipo: "LICENCIA_CULTIVO",
      etiqueta: "Licencia de cultivo de la autoridad competente",
      obligatorio: true,
    },
    {
      tipo: "CERTIFICADO_PREDIO",
      etiqueta: "Certificado de tradición o tenencia del predio",
      obligatorio: false,
    },
    { tipo: "PLAN_MANEJO_AMBIENTAL", etiqueta: "Plan de manejo ambiental", obligatorio: false },
  ],
  TRANSFORMADOR: [
    {
      tipo: "LICENCIA_FABRICACION",
      etiqueta: "Licencia de fabricación de derivados",
      obligatorio: true,
    },
    {
      tipo: "CERTIFICADO_BPM",
      etiqueta: "Certificado de buenas prácticas de manufactura",
      obligatorio: false,
    },
    { tipo: "FICHA_TECNICA_PROCESO", etiqueta: "Ficha técnica del proceso", obligatorio: false },
  ],
  DISPENSADOR: [
    {
      tipo: "HABILITACION_DISPENSACION",
      etiqueta: "Habilitación del servicio de dispensación",
      obligatorio: true,
    },
    { tipo: "CONCEPTO_SANITARIO", etiqueta: "Concepto sanitario favorable", obligatorio: false },
    { tipo: "DIRECTOR_TECNICO", etiqueta: "Designación del director técnico", obligatorio: false },
  ],
  LABORATORIO: [
    {
      tipo: "AUTORIZACION_ENSAYOS",
      etiqueta: "Autorización para ensayos de laboratorio",
      obligatorio: true,
    },
    { tipo: "ACREDITACION_ONAC", etiqueta: "Acreditación ONAC", obligatorio: false },
    {
      tipo: "ALCANCE_ACREDITACION",
      etiqueta: "Alcance de la acreditación",
      obligatorio: false,
    },
  ],
  IPS: [
    { tipo: "HABILITACION_REPS", etiqueta: "Habilitación en el REPS", obligatorio: true },
    { tipo: "CONCEPTO_SANITARIO", etiqueta: "Concepto sanitario favorable", obligatorio: false },
    {
      tipo: "REGISTRO_PROFESIONALES",
      etiqueta: "Registro de profesionales adscritos",
      obligatorio: false,
    },
  ],
};

export const requisitosDeActor = (tipoActor: TipoActor): RequisitosActorApi => ({
  tipoActor,
  documentos: [...COMUNES, ...(PROPIOS[tipoActor] ?? [])],
});
