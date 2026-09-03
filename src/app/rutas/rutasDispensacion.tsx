import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";
import { QueryProviderDispensacion } from "../providers/QueryProviderDispensacion";
import { Icono } from "../../shared/ui/primitivos/Icono";

export const ZonaDispensacion = ({ children }: { children: ReactNode }) => (
  <div className="zona-dispensacion">
    <Helmet>
      <meta name="robots" content="noindex, nofollow, noarchive" />
    </Helmet>
    <p className="banda-clinica">
      <Icono nombre="candado" tamano={16} />
      Zona de dispensación · el mostrador ve el seudónimo de la credencial, nunca el nombre, el
      documento ni el diagnóstico del paciente
    </p>
    <QueryProviderDispensacion>{children}</QueryProviderDispensacion>
  </div>
);
