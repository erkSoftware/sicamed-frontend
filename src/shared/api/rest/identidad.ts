import { solicitar } from "../transporte";
import { CABECERA_CAPTCHA } from "../../seguridad/turnstile";
import type { RolApi, SesionApi } from "./contrato";

export type CuentaDeAccesoApi = {
  id: string;
  nombre: string;
  correo: string;
  rol: RolApi;
  organizacionId: string | null;
};

export type AccesoApi = {
  acceso: string;
  expiraEn: number;
  cuenta: CuentaDeAccesoApi;
  tipo: string;
};

export type EntradaAcceso = {
  correo: string;
  clave: string;
  captcha?: string | undefined;
};

export type EntradaCambioDeClave = {
  correo: string;
  claveActual: string;
  claveNueva: string;
  captcha?: string | undefined;
};

const conCaptcha = (captcha?: string) =>
  captcha ? { cabeceras: { [CABECERA_CAPTCHA]: captcha } } : {};

export const entrar = ({ correo, clave, captcha }: EntradaAcceso): Promise<AccesoApi> =>
  solicitar<AccesoApi>("identidad", "/login", {
    metodo: "POST",
    cuerpo: { correo, clave },
    ...conCaptcha(captcha),
  });

export const refrescar = (): Promise<AccesoApi> =>
  solicitar<AccesoApi>("identidad", "/refresh", { metodo: "POST" });

export const quienSoy = (): Promise<SesionApi> => solicitar<SesionApi>("identidad", "/yo");

export const salir = (todas = false): Promise<void> =>
  solicitar<void>("identidad", "/logout", {
    metodo: "POST",
    ...(todas ? { parametros: { todas: true } } : {}),
  });

export const cambiarClave = ({
  correo,
  claveActual,
  claveNueva,
  captcha,
}: EntradaCambioDeClave): Promise<void> =>
  solicitar<void>("identidad", "/cambiar-clave", {
    metodo: "POST",
    cuerpo: { correo, claveActual, claveNueva },
    ...conCaptcha(captcha),
  });
