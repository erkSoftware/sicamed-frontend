import { create } from "zustand";
import type { ClaseHerramienta } from "../../../api/clienteAsistente";

export type EstadoDeAsiento = "hecho" | "rechazado" | "fallido";

export type ClaseDeAsiento = ClaseHerramienta | "pantalla";

export type AsientoDeBitacora = {
  id: string;
  instante: number;
  herramienta: string;
  etiqueta: string;
  clase: ClaseDeAsiento;
  estado: EstadoDeAsiento;
  detalle: string;
  traza?: string;
  deshacer?: () => void;
};

export const TOPE_DE_BITACORA = 20;

type EstadoBitacora = {
  asientos: readonly AsientoDeBitacora[];
  anotar: (asiento: AsientoDeBitacora) => void;
  marcarDeshecho: (id: string) => void;
  vaciar: () => void;
};

export const useBitacora = create<EstadoBitacora>((set, get) => ({
  asientos: [],
  anotar: (asiento) => set({ asientos: [asiento, ...get().asientos].slice(0, TOPE_DE_BITACORA) }),
  marcarDeshecho: (id) =>
    set({
      asientos: get().asientos.map((asiento) =>
        asiento.id === id
          ? { ...asiento, deshacer: undefined, detalle: `${asiento.detalle} · deshecho` }
          : asiento,
      ),
    }),
  vaciar: () => set({ asientos: [] }),
}));

let contador = 0;

export const anotar = (asiento: Omit<AsientoDeBitacora, "id" | "instante">): AsientoDeBitacora => {
  contador += 1;
  const completo: AsientoDeBitacora = {
    ...asiento,
    id: `asiento-${contador}`,
    instante: Date.now(),
  };
  useBitacora.getState().anotar(completo);
  return completo;
};

export const deshacerAsiento = (id: string): void => {
  const asiento = useBitacora.getState().asientos.find((registro) => registro.id === id);
  if (!asiento?.deshacer) return;
  asiento.deshacer();
  useBitacora.getState().marcarDeshecho(id);
};

export const vaciarBitacora = (): void => useBitacora.getState().vaciar();
