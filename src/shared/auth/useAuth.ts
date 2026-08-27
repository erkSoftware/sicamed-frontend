import { useContext } from "react";
import { ContextoAuth } from "./contexto";
import type { ValorAuth } from "./contexto";

export const useAuth = (): ValorAuth => {
  const valor = useContext(ContextoAuth);
  if (!valor) throw new Error("useAuth requiere AuthProvider en el árbol de componentes");
  return valor;
};
