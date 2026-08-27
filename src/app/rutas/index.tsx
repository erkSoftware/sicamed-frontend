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
import { DetallePlanta, Plantas } from "../../features/plantas";
import { Beneficio } from "../../features/beneficio";
import { Expedientes, PoliticaVerificacion } from "../../features/expedientes";
import { CierreOperacion } from "../../features/cierre";
import { Conexiones } from "../../features/interoperabilidad";

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
        path="plantas"
        element={
          <GuardaDeRuta permiso="produccion:planta:leer">
            <Plantas />
          </GuardaDeRuta>
        }
      />
      <Route
        path="plantas/:id"
        element={
          <GuardaDeRuta permiso="produccion:planta:leer">
            <DetallePlanta />
          </GuardaDeRuta>
        }
      />
      <Route
        path="beneficio"
        element={
          <GuardaDeRuta permiso="produccion:beneficio:leer">
            <Beneficio />
          </GuardaDeRuta>
        }
      />
      <Route
        path="expedientes"
        element={
          <GuardaDeRuta permiso="cumplimiento:expediente:leer">
            <Expedientes />
          </GuardaDeRuta>
        }
      />
      <Route
        path="politicas"
        element={
          <GuardaDeRuta permiso="admin:politica:gestionar">
            <PoliticaVerificacion />
          </GuardaDeRuta>
        }
      />
      <Route
        path="cierre"
        element={
          <GuardaDeRuta permiso="vitrina:oferta:leer">
            <CierreOperacion />
          </GuardaDeRuta>
        }
      />
      <Route
        path="conexiones"
        element={
          <GuardaDeRuta permiso="interoperabilidad:conexion:leer">
            <Conexiones />
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
