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
  },
}));

const listar = vi.mocked(apiComercial.bloqueosAsistente);
const bloquear = vi.mocked(apiComercial.bloquearAsistente);
const desbloquear = vi.mocked(apiComercial.desbloquearAsistente);

const AUTOMATICO: BloqueoAsistente = {
  id: "BLQ-0001",
  usuario: "USR-0007",
  motivo: "Exceso de intentos de llamada",
  tipo: "temporary",
  iniciaEn: "2026-08-29T14:02:00Z",
  expiraEn: "2026-09-28T14:02:00Z",
  activo: true,
  creadoPor: "sistema",
  creadoEn: "2026-08-29T14:02:00Z",
  desbloqueadoEn: null,
  desbloqueadoPor: "",
};

const PERMANENTE: BloqueoAsistente = {
  ...AUTOMATICO,
  id: "BLQ-0002",
  usuario: "USR-0012",
  motivo: "Uso indebido",
  tipo: "permanent",
  expiraEn: null,
  creadoPor: "Diego Fernando Marín",
};

const LEVANTADO: BloqueoAsistente = {
  ...AUTOMATICO,
  id: "BLQ-0003",
  usuario: "USR-0004",
  activo: false,
  desbloqueadoEn: "2026-08-30T09:00:00Z",
  desbloqueadoPor: "Diego Fernando Marín",
};

const autorizacion = {
  estado: "autenticado",
  sesion: null,
  permisos: ["asistente:llamadas:gestionar"],
} as unknown as ValorAuth;

const montar = () => {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const envoltorio = ({ children }: { children: ReactNode }) => (
    <ContextoAuth.Provider value={autorizacion}>
      <QueryClientProvider client={cliente}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </ContextoAuth.Provider>
  );
  return render(<LlamadasAurora />, { wrapper: envoltorio });
};

beforeEach(() => {
  listar.mockReset();
  bloquear.mockReset();
  desbloquear.mockReset();
});

describe("LlamadasAurora", () => {
  it("abre con los vigentes y distingue el bloqueo automático del que puso una persona", async () => {
    listar.mockResolvedValue([AUTOMATICO, PERMANENTE]);
    montar();

    expect(await screen.findByText("USR-0007")).toBeInTheDocument();
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
});
