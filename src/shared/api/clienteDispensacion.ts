import { modoMock } from "./transporte";
import { servidorDispensacion } from "./mock/servidorSensible";
import { sinContrato } from "./rest/peticiones";
import type { FiltroListado } from "./mock/protocolo";
import type { MetodoVerificacion } from "./mock/datosDispensacion";
import type { Autor } from "./mock/protocolo";

export const apiDispensacion = {
  puntos: () =>
    modoMock ? servidorDispensacion.puntos() : sinContrato("los puntos de dispensación"),

  verificar: (entrada: {
    codigo: string;
    metodo: MetodoVerificacion;
    puntoId: string;
    autor: Autor;
  }) =>
    modoMock
      ? servidorDispensacion.verificar(entrada)
      : sinContrato("la verificación de credencial en el mostrador"),

  registrarEntrega: (entrada: {
    puntoId: string;
    seudonimo: string;
    prescripcionCodigo: string;
    unidades: number;
    metodo: MetodoVerificacion;
    operador: string;
    autor: Autor;
  }) =>
    modoMock
      ? servidorDispensacion.registrarEntrega(entrada)
      : sinContrato("el registro del acto de dispensación"),

  actos: (filtro: FiltroListado & { puntoId?: string } = {}) =>
    modoMock ? servidorDispensacion.actos(filtro) : sinContrato("los actos de dispensación"),
};
