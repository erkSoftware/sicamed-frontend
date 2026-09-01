import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { LlamadasAurora } from "./LlamadasAurora";
import { apiComercial } from "../../../shared/api/clienteComercial";
import { ErrorApi } from "../../../shared/api/problemDetails";
import { ContextoAuth } from "../../../shared/auth/contexto";
import type { ValorAuth } from "../../../shared/auth/contexto";
import type { BloqueoAsistente } from "../../../shared/api/mock/tipos";

vi.mock("../../../shared/api/clienteComercial", () => ({
  apiComercial: {
    bloqueosAsistente: vi.fn(),
    bloquearAsistente: vi.fn(),
    desbloquearAsistente: vi.fn(),
    cuentas: vi.fn(),
  },
}));

const listar = vi.mocked(apiComercial.bloqueosAsistente);
const bloquear = vi.mocked(apiComercial.bloquearAsistente);
const desbloquear = vi.mocked(apiComercial.desbloquearAsistente);
const listarCuentas = vi.mocked(apiComercial.cuentas);

const AUTOMATICO: BloqueoAsistente = {
  id: "BLQ-0001",
  usuario: "USR-0007",
  usuarioNombre: "Laura Restrepo Ossa",
  motivo: "Exceso de intentos de llamada",
  tipo: "temporary",
  iniciaEn: "2026-08-29T14:02:00Z",
  expiraEn: "2026-09-28T14:02:00Z",
  activo: true,
  creadoPor: "sistema",
  creadoPorNombre: "",
  creadoEn: "2026-08-29T14:02:00Z",
  desbloqueadoEn: null,
  desbloqueadoPor: "",
  desbloqueadoPorNombre: "",
};

const PERMANENTE: BloqueoAsistente = {
  ...AUTOMATICO,
  id: "BLQ-0002",
  usuario: "USR-0012",
  usuarioNombre: "",
  motivo: "Uso indebido",
  tipo: "permanent",
  expiraEn: null,
  creadoPor: "USR-0001",
  creadoPorNombre: "Diego Fernando Marín",
};

const LEVANTADO: BloqueoAsistente = {
  ...AUTOMATICO,
  id: "BLQ-0003",
  usuario: "USR-0004",
  usuarioNombre: "Marta Lucía Gil",
  activo: false,
  desbloqueadoEn: "2026-08-30T09:00:00Z",
  desbloqueadoPor: "USR-0001",
  desbloqueadoPorNombre: "Diego Fernando Marín",
};

const autorizacionDe = (permisos: readonly string[]) =>
  ({ estado: "autenticado", sesion: null, permisos }) as unknown as ValorAuth;

const montar = (permisos: readonly string[] = ["asistente:llamadas:gestionar"]) => {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const envoltorio = ({ children }: { children: ReactNode }) => (
    <ContextoAuth.Provider value={autorizacionDe(permisos)}>
      <QueryClientProvider client={cliente}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </ContextoAuth.Provider>
  );
  return render(<LlamadasAurora />, { wrapper: envoltorio });
};

const CUENTAS = {
  datos: [
    {
      id: "defc1184-c39b-4c0b-83b6-5bd00a2b3192",
      nombre: "Cristian Machado",
      correo: "cristian@erk.co",
    },
  ],
  total: 1,
  pagina: 1,
  porPagina: 20,
};

beforeEach(() => {
  listar.mockReset();
  bloquear.mockReset();
  desbloquear.mockReset();
  listarCuentas.mockReset().mockResolvedValue(CUENTAS as never);
});

describe("LlamadasAurora", () => {
  it("abre con los vigentes y distingue el bloqueo automático del que puso una persona", async () => {
    listar.mockResolvedValue([AUTOMATICO, PERMANENTE]);
    montar();

    expect(await screen.findByText("Laura Restrepo Ossa")).toBeInTheDocument();
    expect(screen.getByText("USR-0007")).toBeInTheDocument();
    expect(screen.getByText(/Bloqueo automático del sistema/)).toBeInTheDocument();
    expect(screen.getByText(/Puesto por Diego Fernando Marín/)).toBeInTheDocument();
    expect(listar).toHaveBeenCalledWith({ soloActivos: true });
  });

  it("un permanente no inventa una fecha de vencimiento", async () => {
    listar.mockResolvedValue([PERMANENTE]);
    montar();

    await screen.findByText("USR-0012");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("«todos» separa lo levantado de lo vencido y no ofrece desbloquear lo que ya no aplica", async () => {
    listar.mockResolvedValue([LEVANTADO]);
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Todos" }));
    await waitFor(() => expect(listar).toHaveBeenCalledWith({ soloActivos: false }));

    expect(await screen.findByText("Levantado")).toBeInTheDocument();
    expect(screen.getByText(/Diego Fernando Marín lo levantó/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desbloquear" })).not.toBeInTheDocument();
  });

  it("bloquear a mano manda usuario, motivo, tipo y días", async () => {
    listar.mockResolvedValue([]);
    bloquear.mockResolvedValue(PERMANENTE);
    montar();

    await userEvent.click(await screen.findByRole("button", { name: /Bloquear a una persona/ }));
    await userEvent.type(await screen.findByLabelText(/Identificador del usuario/), "USR-0099");
    await userEvent.type(screen.getByLabelText(/Motivo/), "Uso indebido");
    await userEvent.click(screen.getByRole("button", { name: "Bloquear" }));

    await waitFor(() => expect(bloquear).toHaveBeenCalledTimes(1));
    expect(bloquear.mock.calls[0]?.[0]).toMatchObject({
      usuario: "USR-0099",
      motivo: "Uso indebido",
      tipo: "temporary",
      dias: 30,
    });
  });

  it("un bloqueo que ya existe se explica, no se apila", async () => {
    listar.mockResolvedValue([]);
    bloquear.mockRejectedValue(
      new ErrorApi({
        type: "https://sicamed.co/problemas/asistente-bloqueo-invalido",
        title: "Esa persona ya tiene un bloqueo activo",
        detail: "Los bloqueos no se apilan: levanta el que ya existe en vez de crear otro.",
        status: 422,
      }),
    );
    montar();

    await userEvent.click(await screen.findByRole("button", { name: /Bloquear a una persona/ }));
    await userEvent.type(await screen.findByLabelText(/Identificador del usuario/), "USR-0007");
    await userEvent.type(screen.getByLabelText(/Motivo/), "Otra vez");
    await userEvent.click(screen.getByRole("button", { name: "Bloquear" }));

    expect(await screen.findByText(/Los bloqueos no se apilan/)).toBeInTheDocument();
  });

  it("desbloquear pide confirmación y manda el identificador del bloqueo", async () => {
    listar.mockResolvedValue([AUTOMATICO]);
    desbloquear.mockResolvedValue({ ...AUTOMATICO, activo: false });
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Desbloquear" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Desbloquear" }));

    await waitFor(() => expect(desbloquear).toHaveBeenCalledTimes(1));
    expect(desbloquear.mock.calls[0]?.[0]?.id).toBe("BLQ-0001");
  });

  it("un 422 sobre alguien ya bloqueado lleva a la fila que existe, no repite el error crudo", async () => {
    listar.mockResolvedValue([AUTOMATICO]);
    bloquear.mockRejectedValue(
      new ErrorApi({
        type: "https://sicamed.co/problemas/asistente-bloqueo-invalido",
        title: "Esa persona ya tiene un bloqueo activo",
        detail: "Los bloqueos no se apilan: levanta el que ya existe en vez de crear otro.",
        status: 422,
      }),
    );
    montar();

    await userEvent.click(await screen.findByRole("button", { name: /Bloquear a una persona/ }));
    await userEvent.type(await screen.findByLabelText(/Identificador del usuario/), "USR-0007");
    await userEvent.type(screen.getByLabelText(/Motivo/), "Otra vez");
    await userEvent.click(screen.getByRole("button", { name: "Bloquear" }));

    expect(await screen.findByText(/Laura Restrepo Ossa ya está bloqueada/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bloquear" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /Ver el bloqueo vigente/ }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByText("El bloqueo que ya existía")).toBeInTheDocument();
  });

  it("después de desbloquear recarga la lista y avisa si la persona sigue bloqueada", async () => {
    listar.mockResolvedValueOnce([AUTOMATICO]);
    listar.mockResolvedValue([{ ...AUTOMATICO, id: "BLQ-0009" }]);
    desbloquear.mockResolvedValue({ ...AUTOMATICO, activo: false });
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Desbloquear" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Desbloquear" }));

    expect(await screen.findByText(/sigue con la voz\s+bloqueada/)).toBeInTheDocument();
    expect(listar.mock.calls.length).toBeGreaterThan(1);
  });

  it("cuando el desbloqueo sí surtió efecto no aparece ninguna advertencia", async () => {
    listar.mockResolvedValueOnce([AUTOMATICO]);
    listar.mockResolvedValue([]);
    desbloquear.mockResolvedValue({ ...AUTOMATICO, activo: false });
    montar();

    await userEvent.click(await screen.findByRole("button", { name: "Desbloquear" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Desbloquear" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText(/sigue con la voz/)).not.toBeInTheDocument();
  });
  it("una fila antigua sin nombre guardado sigue leyéndose por su identificador", async () => {
    listar.mockResolvedValue([PERMANENTE]);
    montar();

    expect(await screen.findByText("USR-0012")).toBeInTheDocument();
    expect(screen.getByText(/Puesto por Diego Fernando Marín/)).toBeInTheDocument();
  });

  it("quien puede leer el directorio elige a la persona de la lista y manda su nombre", async () => {
    listar.mockResolvedValue([]);
    bloquear.mockResolvedValue(PERMANENTE);
    montar(["asistente:llamadas:gestionar", "admin:usuario:gestionar"]);

    await userEvent.click(await screen.findByRole("button", { name: /Bloquear a una persona/ }));

    const lista = await screen.findByLabelText(/Persona a bloquear/);
    await waitFor(() =>
      expect(within(lista).getByText(/Cristian Machado/)).toBeInTheDocument(),
    );
    await userEvent.selectOptions(lista, "defc1184-c39b-4c0b-83b6-5bd00a2b3192");
    await userEvent.type(screen.getByLabelText(/Motivo/), "Uso indebido");
    await userEvent.click(screen.getByRole("button", { name: "Bloquear" }));

    await waitFor(() => expect(bloquear).toHaveBeenCalledTimes(1));
    expect(bloquear.mock.calls[0]?.[0]).toMatchObject({
      usuario: "defc1184-c39b-4c0b-83b6-5bd00a2b3192",
      usuarioNombre: "Cristian Machado",
    });
    expect(screen.queryByLabelText(/Identificador del usuario/)).not.toBeInTheDocument();
  });

  it("sin acceso al directorio no se pide un nombre que el administrador teclee", async () => {
    listar.mockResolvedValue([]);
    bloquear.mockResolvedValue(PERMANENTE);
    montar();

    await userEvent.click(await screen.findByRole("button", { name: /Bloquear a una persona/ }));
    await userEvent.type(await screen.findByLabelText(/Identificador del usuario/), "USR-0099");
    await userEvent.type(screen.getByLabelText(/Motivo/), "Uso indebido");
    await userEvent.click(screen.getByRole("button", { name: "Bloquear" }));

    await waitFor(() => expect(bloquear).toHaveBeenCalledTimes(1));
    expect(bloquear.mock.calls[0]?.[0]).toMatchObject({ usuario: "USR-0099", usuarioNombre: "" });
    expect(listarCuentas).not.toHaveBeenCalled();
  });
});
