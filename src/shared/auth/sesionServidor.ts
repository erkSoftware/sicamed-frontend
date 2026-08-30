import { modoMock } from "../api/transporte";
import { consultarSesion, aSesion } from "../api/rest/sesion";
import { quienSoy } from "../api/rest/identidad";
import { usaIdentidadDelServidor } from "./proveedor";
import { ErrorApi } from "../api/problemDetails";
import type { Sesion } from "./tipos";

export const fusionar = (local: Sesion, delServidor: Sesion): Sesion => ({
  usuario: {
    ...delServidor.usuario,
    nombre: delServidor.usuario.nombre === "" ? local.usuario.nombre : delServidor.usuario.nombre,
    correo: delServidor.usuario.correo === "" ? local.usuario.correo : delServidor.usuario.correo,
    organizacion: local.usuario.organizacion,
  },
  permisos: delServidor.permisos,
  expiracion: local.expiracion,
});

export const conPermisosDelServidor = async (local: Sesion): Promise<Sesion> => {
  if (!usaIdentidadDelServidor && modoMock) return local;
  const consultar = usaIdentidadDelServidor ? quienSoy : consultarSesion;
  try {
    return fusionar(local, aSesion(await consultar(), local.expiracion));
  } catch (error) {
    if (error instanceof ErrorApi && error.problema.status === 401) throw error;
    return local;
  }
};
