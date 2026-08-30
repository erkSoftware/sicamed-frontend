import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { ContextoAuth } from "../../shared/auth/contexto";
import { esModoDemostracion, proveedorAutenticacion } from "../../shared/auth/proveedor";
import { registrarCredencial } from "../../shared/api/transporte";
import { fijarAlmacenPropio } from "../../shared/api/mock/almacen";
import { conPermisosDelServidor } from "../../shared/auth/sesionServidor";
import { PERFILES_DEMO, sesionDesdePerfil } from "../../shared/auth/perfiles";
import { instanteDeRenovacion } from "../../shared/auth/proveedorServidor";
import { claseDeRechazo, mensajeDelRechazo } from "../../shared/auth/rechazos";
import { esAdministrador } from "../../shared/auth/roles";
import type { ClaseDeRechazo } from "../../shared/auth/rechazos";
import type { Credenciales, EstadoAuth, Sesion } from "../../shared/auth/tipos";
import { limpiarAmbasZonas } from "./clientesConsulta";

registrarCredencial(() => proveedorAutenticacion.credencial());

const CLAVE_ADOPTADO = "sicamed.perfil-adoptado";

const leerAdoptado = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(CLAVE_ADOPTADO);
  } catch {
    return null;
  }
};

const escribirAdoptado = (clave: string | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (clave === null) window.sessionStorage.removeItem(CLAVE_ADOPTADO);
    else window.sessionStorage.setItem(CLAVE_ADOPTADO, clave);
  } catch {
    return;
  }
};

const aplicarAlcance = (adoptado: string | null): void => {
  fijarAlmacenPropio(!esModoDemostracion && adoptado === null);
};

const perfilDe = (clave: string | null) =>
  clave === null ? undefined : PERFILES_DEMO.find((perfil) => perfil.clave === clave);

aplicarAlcance(leerAdoptado());

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [estado, setEstado] = useState<EstadoAuth>("cargando");
  const [sesionReal, setSesionReal] = useState<Sesion | null>(null);
  const [adoptado, setAdoptado] = useState<string | null>(leerAdoptado());
  const [error, setError] = useState<string | null>(null);
  const [rechazo, setRechazo] = useState<ClaseDeRechazo | null>(null);
  const temporizador = useRef<number | undefined>(undefined);

  const finalizar = useCallback(() => {
    escribirAdoptado(null);
    setAdoptado(null);
    aplicarAlcance(null);
    limpiarAmbasZonas();
    setSesionReal(null);
    setEstado("anonimo");
  }, []);

  const asentar = useCallback((nueva: Sesion) => {
    const vigente = esModoDemostracion || esAdministrador(nueva) ? leerAdoptado() : null;
    if (vigente === null) escribirAdoptado(null);
    setAdoptado(vigente);
    aplicarAlcance(vigente);
    limpiarAmbasZonas();
    setSesionReal(nueva);
    setEstado("autenticado");
  }, []);

  useEffect(() => {
    let vigente = true;
    proveedorAutenticacion
      .restaurar()
      .then((restaurada) => (restaurada ? conPermisosDelServidor(restaurada) : null))
      .then((restaurada) => {
        if (!vigente) return;
        if (restaurada) asentar(restaurada);
        else setEstado("anonimo");
      })
      .catch(() => {
        if (vigente) setEstado("anonimo");
      });
    return () => {
      vigente = false;
    };
  }, [asentar]);

  useEffect(() => {
    window.clearTimeout(temporizador.current);
    if (!sesionReal) return undefined;
    const restante = sesionReal.expiracion - Date.now();
    if (restante <= 0) {
      finalizar();
      return undefined;
    }
    const renovar = proveedorAutenticacion.renovar;
    if (!renovar) {
      temporizador.current = window.setTimeout(finalizar, restante);
      return () => window.clearTimeout(temporizador.current);
    }
    temporizador.current = window.setTimeout(() => {
      void renovar()
        .then((renovada) => (renovada ? conPermisosDelServidor(renovada) : null))
        .then((renovada) => {
          if (renovada) setSesionReal(renovada);
          else finalizar();
        })
        .catch(finalizar);
    }, instanteDeRenovacion(sesionReal.expiracion));
    return () => window.clearTimeout(temporizador.current);
  }, [sesionReal, finalizar]);

  const iniciarSesion = useCallback(
    async (credenciales?: Credenciales): Promise<ClaseDeRechazo | null> => {
      setError(null);
      setRechazo(null);
      try {
        asentar(
          await conPermisosDelServidor(await proveedorAutenticacion.iniciarSesion(credenciales)),
        );
        return null;
      } catch (fallo) {
        const clase = claseDeRechazo(fallo);
        setError(mensajeDelRechazo(fallo));
        setRechazo(clase);
        setEstado("anonimo");
        return clase;
      }
    },
    [asentar],
  );

  const cerrarSesion = useCallback(async () => {
    await proveedorAutenticacion.cerrarSesion();
    finalizar();
  }, [finalizar]);

  const puedeAdoptarPerfil =
    esModoDemostracion || (sesionReal !== null && esAdministrador(sesionReal));

  const adoptarPerfil = useCallback(
    (clave: string | null) => {
      if (!puedeAdoptarPerfil) return;
      const elegido = perfilDe(clave) ? clave : null;
      escribirAdoptado(elegido);
      setAdoptado(elegido);
      aplicarAlcance(elegido);
      limpiarAmbasZonas();
    },
    [puedeAdoptarPerfil],
  );

  const sesion = useMemo(() => {
    const perfil = perfilDe(adoptado);
    if (!perfil || !sesionReal) return sesionReal;
    return { ...sesionDesdePerfil(perfil), expiracion: sesionReal.expiracion };
  }, [adoptado, sesionReal]);

  const valor = useMemo(
    () => ({
      estado,
      sesion,
      sesionReal,
      permisos: sesion?.permisos ?? [],
      iniciarSesion,
      cerrarSesion,
      error,
      rechazo,
      perfilAdoptado: adoptado,
      puedeAdoptarPerfil,
      adoptarPerfil,
    }),
    [
      estado,
      sesion,
      sesionReal,
      iniciarSesion,
      cerrarSesion,
      error,
      rechazo,
      adoptado,
      puedeAdoptarPerfil,
      adoptarPerfil,
    ],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
};
