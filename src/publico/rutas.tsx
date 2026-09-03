import { Outlet, Route } from "react-router-dom";
import { LayoutPublico } from "./componentes/LayoutPublico";
import { ProveedorIdioma } from "../shared/i18n/ProveedorIdioma";
import { Inicio } from "./paginas/Inicio";
import { VitrinaPublica } from "./paginas/VitrinaPublica";
import { DetalleOfertaPublica } from "./paginas/DetalleOfertaPublica";
import { ActoresPublico } from "./paginas/ActoresPublico";
import { Normativa } from "./paginas/Normativa";
import { Transparencia } from "./paginas/Transparencia";
import { Accesibilidad } from "./paginas/Accesibilidad";
import { Privacidad } from "./paginas/Privacidad";
import { Registro } from "./paginas/Registro";
import { VerificacionCorreo } from "./registro/VerificacionCorreo";
import { CredencialPublica } from "./paginas/CredencialPublica";

export const RUTAS_PUBLICAS_ESTATICAS: readonly string[] = [
  "/",
  "/vitrina",
  "/actores",
  "/normativa",
  "/transparencia",
  "/accesibilidad",
  "/privacidad",
  "/registro",
  "/paciente",
];

export const seccionPublica = () => (
  <Route element={<LayoutPublico />}>
    <Route index element={<Inicio />} />
    <Route
      path="vitrina"
      element={
        <ProveedorIdioma>
          <Outlet />
        </ProveedorIdioma>
      }
    >
      <Route index element={<VitrinaPublica />} />
      <Route path=":id" element={<DetalleOfertaPublica />} />
    </Route>
    <Route path="actores" element={<ActoresPublico />} />
    <Route path="normativa" element={<Normativa />} />
    <Route path="transparencia" element={<Transparencia />} />
    <Route path="accesibilidad" element={<Accesibilidad />} />
    <Route path="privacidad" element={<Privacidad />} />
    <Route path="paciente" element={<CredencialPublica />} />
    <Route path="registro" element={<Registro />} />
    <Route path="registro/verificacion" element={<VerificacionCorreo />} />
  </Route>
);
