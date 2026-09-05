import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { publicarPantalla } from "./bus";
import { esRutaClinica } from "./contextoVivo";
import type { Publicacion, Suscripcion } from "./bus";
import type { AccionDePantalla, EstadoDePantalla } from "./tipos";

const SIN_PANTALLA: Publicacion = { ruta: "", estado: { pantalla: "" }, acciones: [] };

export const usePantallaDeAurora = (
  estado: EstadoDePantalla | null,
  acciones: readonly AccionDePantalla[],
): void => {
  const { pathname } = useLocation();
  const activa = estado !== null && !esRutaClinica(pathname);
  const vigente = useRef<Publicacion>(SIN_PANTALLA);
  const suscripcion = useRef<Suscripcion | null>(null);
  if (estado) vigente.current = { ruta: pathname, estado, acciones };

  useEffect(() => {
    if (!activa) return undefined;
    const abierta = publicarPantalla(vigente.current);
    suscripcion.current = abierta;
    return () => {
      abierta.retirar();
      suscripcion.current = null;
    };
  }, [pathname, activa]);

  useEffect(() => {
    suscripcion.current?.actualizar(vigente.current);
  });
};
