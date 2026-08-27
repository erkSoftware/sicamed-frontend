import type { ReactNode } from "react";
import { aProblema } from "../../api/problemDetails";
import { ErrorNormativo } from "./ErrorNormativo";

type Props = {
  cargando: boolean;
  error: unknown;
  onReintentar?: () => void;
  esqueleto?: ReactNode;
  children: ReactNode;
};

export const EstadoConsulta = ({ cargando, error, onReintentar, esqueleto, children }: Props) => {
  if (error) return <ErrorNormativo problema={aProblema(error)} onReintentar={onReintentar} />;
  if (cargando)
    return (
      <>
        {esqueleto ?? (
          <div className="cargando-ruta" role="status">
            <span className="girador" />
            <span>Cargando información…</span>
          </div>
        )}
      </>
    );
  return <>{children}</>;
};
