import { Navigate, Route, Routes } from "react-router-dom";
import { seccionPublica } from "../../publico/rutas";
import { NoEncontrado } from "../../publico/paginas/NoEncontrado";
import { Acceso } from "../paginas/Acceso";
import { SinPermiso } from "../paginas/SinPermiso";
import { LayoutApp } from "../layouts/LayoutApp";
import { GuardaDeRuta } from "../../shared/auth/GuardaDeRuta";
import { ZonaClinica } from "./rutasClinicas";
import { Tablero } from "../../features/tablero";
import { DirectorioActores } from "../../features/directorio";
import { ListaOfertas, CrearOferta, DetalleOferta } from "../../features/vitrina";
import { MiOrganizacion } from "../../features/organizaciones";
import { Licencias } from "../../features/cumplimiento";
import { Produccion } from "../../features/produccion";
import { Inventario } from "../../features/inventario";
import { Trazabilidad } from "../../features/trazabilidad";
import { Reportes } from "../../features/reportes";
import { RuedasNegocio } from "../../features/ruedas-negocio";

export const Enrutador = () => (
  <Routes>
    {seccionPublica()}

    <Route path="acceso" element={<Acceso />} />

    <Route
      path="app"
      element={
        <GuardaDeRuta>
          <LayoutApp />
        </GuardaDeRuta>
      }
    >
      <Route index element={<Tablero />} />
      <Route path="directorio" element={<DirectorioActores />} />
      <Route
        path="vitrina"
        element={
          <GuardaDeRuta permiso="vitrina:oferta:leer">
            <ListaOfertas />
          </GuardaDeRuta>
        }
      />
      <Route
        path="vitrina/nueva"
        element={
          <GuardaDeRuta permiso="vitrina:oferta:publicar">
            <CrearOferta />
          </GuardaDeRuta>
        }
      />
      <Route
        path="vitrina/:id"
        element={
          <GuardaDeRuta permiso="vitrina:oferta:leer">
            <DetalleOferta />
          </GuardaDeRuta>
        }
      />
      <Route
        path="organizacion"
        element={
          <GuardaDeRuta permiso="actores:org:leer">
            <MiOrganizacion />
          </GuardaDeRuta>
        }
      />
      <Route
        path="organizacion/:id"
        element={
          <GuardaDeRuta permiso="actores:org:leer">
            <MiOrganizacion />
          </GuardaDeRuta>
        }
      />
      <Route
        path="licencias"
        element={
          <GuardaDeRuta permiso="cumplimiento:atestacion:leer">
            <Licencias />
          </GuardaDeRuta>
        }
      />
      <Route
        path="produccion"
        element={
          <GuardaDeRuta permiso="produccion:cultivo:leer">
            <Produccion />
          </GuardaDeRuta>
        }
      />
      <Route
        path="inventario"
        element={
          <GuardaDeRuta permiso="inventario:lote:leer">
            <Inventario />
          </GuardaDeRuta>
        }
      />
      <Route
        path="trazabilidad"
        element={
          <GuardaDeRuta permiso="trazabilidad:evento:leer">
            <Trazabilidad />
          </GuardaDeRuta>
        }
      />
      <Route
        path="reportes"
        element={
          <GuardaDeRuta permiso="reportes:tablero:leer">
            <Reportes />
          </GuardaDeRuta>
        }
      />
      <Route
        path="ruedas-negocio"
        element={
          <GuardaDeRuta permiso="ruedas:convocatoria:leer">
            <RuedasNegocio />
          </GuardaDeRuta>
        }
      />
      <Route path="salud/*" element={<ZonaClinica />} />
      <Route path="sin-permiso" element={<SinPermiso />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Route>

    <Route path="*" element={<NoEncontrado />} />
  </Routes>
);
