import { createContext } from "react";
import type { EstadoAuth, Permiso, Sesion } from "./tipos";

export type ValorAuth = {
  estado: EstadoAuth;
  sesion: Sesion | null;
  permisos: readonly Permiso[];
  iniciarSesion: (perfilDemo?: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  error: string | null;
};

export const ContextoAuth = createContext<ValorAuth | null>(null);
