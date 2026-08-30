import { createContext } from "react";
import type { ClaseDeRechazo } from "./rechazos";
import type { Credenciales, EstadoAuth, Permiso, Sesion } from "./tipos";

export type ValorAuth = {
  estado: EstadoAuth;
  sesion: Sesion | null;
  sesionReal: Sesion | null;
  permisos: readonly Permiso[];
  iniciarSesion: (credenciales?: Credenciales) => Promise<ClaseDeRechazo | null>;
  cerrarSesion: () => Promise<void>;
  error: string | null;
  rechazo: ClaseDeRechazo | null;
  perfilAdoptado: string | null;
  puedeAdoptarPerfil: boolean;
  adoptarPerfil: (clave: string | null) => void;
};

export const ContextoAuth = createContext<ValorAuth | null>(null);
