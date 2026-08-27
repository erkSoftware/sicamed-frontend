import { modoMock, solicitar } from "./transporte";
import { servidorMockClinico } from "./mock/servidorMock";
import type { FiltroListado } from "./mock/servidorMock";

export const apiClinica = {
  indicadores: () =>
    modoMock
      ? servidorMockClinico.indicadores()
      : solicitar<Awaited<ReturnType<typeof servidorMockClinico.indicadores>>>("clinico", "/indicadores"),

  pacientes: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMockClinico.pacientes(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMockClinico.pacientes>>>("clinico", "/pacientes", {
          parametros: {
            busqueda: filtro.busqueda,
            estado: filtro.estado,
            departamento: filtro.departamento,
            pagina: filtro.pagina,
            porPagina: filtro.porPagina,
          },
        }),

  paciente: (id: string) =>
    modoMock
      ? servidorMockClinico.paciente(id)
      : solicitar<Awaited<ReturnType<typeof servidorMockClinico.paciente>>>("clinico", `/pacientes/${id}`),

  agenda: (filtro: FiltroListado = {}) =>
    modoMock
      ? servidorMockClinico.agenda(filtro)
      : solicitar<Awaited<ReturnType<typeof servidorMockClinico.agenda>>>("clinico", "/agenda", {
          parametros: { busqueda: filtro.busqueda, estado: filtro.estado, tipo: filtro.tipo },
        }),

  teleconsultas: () =>
    modoMock
      ? servidorMockClinico.teleconsultas()
      : solicitar<Awaited<ReturnType<typeof servidorMockClinico.teleconsultas>>>("clinico", "/teleconsultas"),
};
