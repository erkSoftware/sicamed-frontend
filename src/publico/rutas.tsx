import { Route } from "react-router-dom";
import { LayoutPublico } from "./componentes/LayoutPublico";
import { Inicio } from "./paginas/Inicio";
import { VitrinaPublica } from "./paginas/VitrinaPublica";
import { DetalleOfertaPublica } from "./paginas/DetalleOfertaPublica";
import { ActoresPublico } from "./paginas/ActoresPublico";
import { Normativa } from "./paginas/Normativa";
import { Transparencia } from "./paginas/Transparencia";
import { Accesibilidad } from "./paginas/Accesibilidad";
import { Privacidad } from "./paginas/Privacidad";

export const RUTAS_PUBLICAS_ESTATICAS: readonly string[] = [
  "/",
  "/vitrina",
  "/actores",
  "/normativa",
  "/transparencia",
  "/accesibilidad",
  "/privacidad",
];

export const seccionPublica = () => (
  <Route element={<LayoutPublico />}>
    <Route index element={<Inicio />} />
    <Route path="vitrina" element={<VitrinaPublica />} />
    <Route path="vitrina/:id" element={<DetalleOfertaPublica />} />
    <Route path="actores" element={<ActoresPublico />} />
    <Route path="normativa" element={<Normativa />} />
    <Route path="transparencia" element={<Transparencia />} />
    <Route path="accesibilidad" element={<Accesibilidad />} />
    <Route path="privacidad" element={<Privacidad />} />
  </Route>
);
