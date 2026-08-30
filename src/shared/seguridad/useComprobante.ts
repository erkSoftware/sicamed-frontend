import { useCallback, useRef, useState } from "react";
import { exigeComprobacion } from "./turnstile";

const ESPERA_MAXIMA_MS = 45_000;

const SIN_COMPROBANTE =
  "La comprobación de seguridad no respondió a tiempo. Recarga la página e inténtalo de nuevo: " +
  "sin ella el trámite no se puede ejercer.";

export type Comprobante = {
  exige: boolean;
  ronda: number;
  listo: boolean;
  recibir: (token: string | null) => void;
  consumir: () => Promise<string | undefined>;
};

export const useComprobante = (): Comprobante => {
  const exige = exigeComprobacion();
  const [ronda, setRonda] = useState(0);
  const [listo, setListo] = useState(!exige);
  const vigente = useRef<string | null>(null);
  const enEspera = useRef<((token: string) => void)[]>([]);

  const renovar = useCallback(() => {
    vigente.current = null;
    setListo(false);
    setRonda((previa) => previa + 1);
  }, []);

  const recibir = useCallback((token: string | null) => {
    if (token === null) {
      vigente.current = null;
      setListo(false);
      return;
    }
    const pendientes = enEspera.current.splice(0);
    if (pendientes.length > 0) {
      for (const resolver of pendientes) resolver(token);
      vigente.current = null;
      setListo(false);
      setRonda((previa) => previa + 1);
      return;
    }
    vigente.current = token;
    setListo(true);
  }, []);

  const consumir = useCallback((): Promise<string | undefined> => {
    if (!exige) return Promise.resolve(undefined);
    const actual = vigente.current;
    if (actual !== null) {
      renovar();
      return Promise.resolve(actual);
    }
    return new Promise<string | undefined>((resolver, rechazar) => {
      let reloj = 0;
      const anotar = (token: string) => {
        clearTimeout(reloj);
        resolver(token);
      };
      reloj = window.setTimeout(() => {
        enEspera.current = enEspera.current.filter((espera) => espera !== anotar);
        rechazar(new Error(SIN_COMPROBANTE));
      }, ESPERA_MAXIMA_MS);
      enEspera.current.push(anotar);
    });
  }, [exige, renovar]);

  return { exige, ronda, listo, recibir, consumir };
};
