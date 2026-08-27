import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import { QueryProviderClinico } from "../providers/QueryProviderClinico";
import { GuardaDeRuta } from "../../shared/auth/GuardaDeRuta";
import { Icono } from "../../shared/ui/primitivos/Icono";

const ModuloClinico = lazy(() => import("../../features-salud"));

export const ZonaClinica = () => (
  <GuardaDeRuta permiso="clinico:atencion:leer">
    <div className="zona-clinica">
      <Helmet>
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </Helmet>
      <p className="banda-clinica">
        <Icono nombre="candado" tamano={16} />
        Zona clínica · datos sensibles · sin caché, sin persistencia local, sin observabilidad
      </p>
      <QueryProviderClinico>
        <Suspense
          fallback={
            <div className="cargando-ruta" role="status">
              <span className="girador" />
              <span>Cargando el módulo clínico…</span>
            </div>
          }
        >
          <ModuloClinico />
        </Suspense>
      </QueryProviderClinico>
    </div>
  </GuardaDeRuta>
);
