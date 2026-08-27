import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { ContextoAuth } from "../../shared/auth/contexto";
import { proveedorAutenticacion } from "../../shared/auth/proveedor";
import { registrarCredencial } from "../../shared/api/transporte";
import type { EstadoAuth, Sesion } from "../../shared/auth/tipos";
import { limpiarAmbasZonas } from "./clientesConsulta";

registrarCredencial(() => proveedorAutenticacion.credencial());

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [estado, setEstado] = useState<EstadoAuth>("cargando");
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const temporizador = useRef<number | undefined>(undefined);

  const finalizar = useCallback(() => {
    limpiarAmbasZonas();
    setSesion(null);
    setEstado("anonimo");
  }, []);

  useEffect(() => {
    let vigente = true;
    proveedorAutenticacion
      .restaurar()
      .then((restaurada) => {
        if (!vigente) return;
        setSesion(restaurada);
        setEstado(restaurada ? "autenticado" : "anonimo");
      })
      .catch(() => {
        if (vigente) setEstado("anonimo");
      });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(temporizador.current);
    if (!sesion) return undefined;
    const restante = sesion.expiracion - Date.now();
    if (restante <= 0) {
      finalizar();
      return undefined;
    }
    temporizador.current = window.setTimeout(finalizar, restante);
    return () => window.clearTimeout(temporizador.current);
  }, [sesion, finalizar]);

  const iniciarSesion = useCallback(async (perfilDemo?: string) => {
    setError(null);
    try {
      const nueva = await proveedorAutenticacion.iniciarSesion(perfilDemo);
      limpiarAmbasZonas();
      setSesion(nueva);
      setEstado("autenticado");
    } catch {
      setError("No fue posible iniciar sesión. Verifica tus credenciales e intenta de nuevo.");
      setEstado("anonimo");
    }
  }, []);

  const cerrarSesion = useCallback(async () => {
    await proveedorAutenticacion.cerrarSesion();
    finalizar();
  }, [finalizar]);

  const valor = useMemo(
    () => ({
      estado,
      sesion,
      permisos: sesion?.permisos ?? [],
      iniciarSesion,
      cerrarSesion,
      error,
    }),
    [estado, sesion, iniciarSesion, cerrarSesion, error],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
};
