import { useEffect, useState } from "react";

export type MomentoDelDia = "amanecer" | "dia" | "atardecer" | "noche";

const REVISION = 300_000;

export const momentoDeLaHora = (hora: number): MomentoDelDia => {
  if (hora >= 5 && hora < 8) return "amanecer";
  if (hora >= 8 && hora < 17) return "dia";
  if (hora >= 17 && hora < 19) return "atardecer";
  return "noche";
};

export const useMomentoDelDia = (): MomentoDelDia => {
  const [momento, setMomento] = useState<MomentoDelDia>("dia");

  useEffect(() => {
    const medir = () => setMomento(momentoDeLaHora(new Date().getHours()));
    medir();
    const reloj = window.setInterval(medir, REVISION);
    return () => window.clearInterval(reloj);
  }, []);

  return momento;
};
