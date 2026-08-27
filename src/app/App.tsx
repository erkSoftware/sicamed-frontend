import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { QueryProviderComercial } from "./providers/QueryProviderComercial";
import { Enrutador } from "./rutas";

const DesplazarAlNavegar = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
};

export const App = () => (
  <QueryProviderComercial>
    <AuthProvider>
      <DesplazarAlNavegar />
      <Enrutador />
    </AuthProvider>
  </QueryProviderComercial>
);
