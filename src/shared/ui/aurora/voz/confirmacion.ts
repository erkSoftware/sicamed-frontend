import { create } from "zustand";

export type CampoDeFirma = {
  etiqueta: string;
  valor: string;
  anterior?: string;
};

export type SolicitudDeFirma = {
  id: string;
  herramienta: string;
  titulo: string;
  descripcion: string;
  entidad: string;
  campos: readonly CampoDeFirma[];
};

type EstadoFirma = {
  pendiente: SolicitudDeFirma | null;
  fijarPendiente: (solicitud: SolicitudDeFirma | null) => void;
};

export const useFirma = create<EstadoFirma>((set) => ({
  pendiente: null,
  fijarPendiente: (pendiente) => set({ pendiente }),
}));

let resolver: ((firmada: boolean) => void) | null = null;
let contador = 0;

const cerrar = (firmada: boolean) => {
  const pendiente = resolver;
  resolver = null;
  useFirma.getState().fijarPendiente(null);
  pendiente?.(firmada);
};

export const pedirFirma = (solicitud: Omit<SolicitudDeFirma, "id">): Promise<boolean> => {
  cerrar(false);
  contador += 1;
  useFirma.getState().fijarPendiente({ ...solicitud, id: `firma-${contador}` });
  return new Promise<boolean>((seguir) => {
    resolver = seguir;
  });
};

export const firmar = (): void => cerrar(true);

export const rechazarFirma = (): void => cerrar(false);

export const hayFirmaPendiente = (): boolean => useFirma.getState().pendiente !== null;
