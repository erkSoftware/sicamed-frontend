import { Navigate, Route, Routes } from "react-router-dom";
import { ListaPacientes } from "./pacientes/paginas/ListaPacientes";
import { DetallePaciente } from "./pacientes/paginas/DetallePaciente";
import { Agenda } from "./agenda/paginas/Agenda";
import { Teleconsulta } from "./teleconsulta/paginas/Teleconsulta";
import { ListaCredenciales } from "./credenciales/paginas/ListaCredenciales";
import { DetalleCredencial } from "./credenciales/paginas/DetalleCredencial";
import { Prescripciones } from "./prescripciones/paginas/Prescripciones";

const ModuloClinico = () => (
  <Routes>
    <Route index element={<Navigate to="pacientes" replace />} />
    <Route path="pacientes" element={<ListaPacientes />} />
    <Route path="pacientes/:id" element={<DetallePaciente />} />
    <Route path="credenciales" element={<ListaCredenciales />} />
    <Route path="credenciales/:id" element={<DetalleCredencial />} />
    <Route path="prescripciones" element={<Prescripciones />} />
    <Route path="agenda" element={<Agenda />} />
    <Route path="teleconsulta" element={<Teleconsulta />} />
  </Routes>
);

export default ModuloClinico;
