import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { ConfiguracionAurora } from "./ConfiguracionAurora";
import { apiComercial } from "../../../shared/api/clienteComercial";
import { ErrorApi } from "../../../shared/api/problemDetails";
import { CONFIGURACION_ASISTENTE_DE_FABRICA } from "../../../shared/api/mock/configuracionAsistente";
import { ContextoAuth } from "../../../shared/auth/contexto";
import type { ValorAuth } from "../../../shared/auth/contexto";

vi.mock("../../../shared/api/clienteComercial", () => ({
  apiComercial: {
    configuracionAsistente: vi.fn(),
    guardarConfiguracionAsistente: vi.fn(),
    probarConexionAsistente: vi.fn(),
  },
}));

const leer = vi.mocked(apiComercial.configuracionAsistente);
const guardar = vi.mocked(apiComercial.guardarConfiguracionAsistente);
const probar = vi.mocked(apiComercial.probarConexionAsistente);

const PROPIA = {
  ...CONFIGURACION_ASISTENTE_DE_FABRICA,
  saludo: "Bienvenido al SICAMED del Cauca.",
  instruccionesExtra: "El contacto de soporte es soporte@ejemplo.co.",
  voz: "cedar",
  vozEfectiva: "cedar",
  apiKey: { configurada: true, enmascarada: "••••••••••••9876" },
  deFabrica: false,
  actualizadoEn: "2026-08-20T15:04:00Z",
  actualizadoPor: "Diego Fernando Marín",
};

const autorizacion = {
  estado: "autenticado",
  sesion: null,
  permisos: ["asistente:configuracion:gestionar"],
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
  return render(<ConfiguracionAurora />, { wrapper: envoltorio });
};

beforeEach(() => {
  leer.mockReset();
  guardar.mockReset();
  probar.mockReset();
});

describe("ConfiguracionAurora", () => {
  it("cada caja muestra lo vigente sin abrir nada", async () => {
    leer.mockResolvedValue(PROPIA);
    montar();

    expect(await screen.findByText(PROPIA.saludo)).toBeInTheDocument();
    expect(screen.getByText(PROPIA.instruccionesExtra)).toBeInTheDocument();
    expect(screen.getByText(/Diego Fernando Marín/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Restaurar de fábrica/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Saludo de apertura/)).not.toBeInTheDocument();
  });

  it("una configuración de fábrica no ofrece restaurar", async () => {
    leer.mockResolvedValue(CONFIGURACION_ASISTENTE_DE_FABRICA);
    montar();

    expect(
      await screen.findByText(/Nadie ha tocado esta configuración todavía/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Restaurar de fábrica/ })).not.toBeInTheDocument();
  });

  it("guardar manda el formulario entero, incluidos los campos que nadie tocó", async () => {
    leer.mockResolvedValue(PROPIA);
    guardar.mockResolvedValue({ ...PROPIA, nombre: "GUÍA" });
    montar();

    const editar = await screen.findAllByRole("button", { name: "Editar" });
    await userEvent.click(editar[0] as HTMLElement);

    const nombre = await screen.findByLabelText(/Nombre del asistente/);
    await userEvent.clear(nombre);
    await userEvent.type(nombre, "GUÍA");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    expect(guardar.mock.calls[0]?.[0]?.borrador).toEqual({
      nombre: "GUÍA",
      saludo: PROPIA.saludo,
      fraseFueraDeAlcance: PROPIA.fraseFueraDeAlcance,
      instruccionesExtra: PROPIA.instruccionesExtra,
      promptSistema: PROPIA.promptSistema,
      mensajeAviso: PROPIA.mensajeAviso,
      voz: PROPIA.voz,
      modelo: PROPIA.modelo,
      habilitado: PROPIA.habilitado,
      proveedor: PROPIA.proveedor,
      apiKey: "",
      borrarApiKey: false,
      limites: PROPIA.limites,
    });
  });

  it("el campo de la credencial nace vacío y el enmascarado solo es ayuda", async () => {
    leer.mockResolvedValue(PROPIA);
    montar();

    const editar = await screen.findAllByRole("button", { name: "Editar" });
    await userEvent.click(editar[4] as HTMLElement);

    const clave = await screen.findByLabelText(/API Key del proveedor/);
    expect(clave).toHaveValue("");
    expect(clave).toHaveAttribute("placeholder", PROPIA.apiKey.enmascarada);
  });

  it("quitar la credencial es un campo aparte, no un campo vacío", async () => {
    leer.mockResolvedValue(PROPIA);
    guardar.mockResolvedValue({ ...PROPIA, apiKey: { configurada: false, enmascarada: "" } });
    montar();

    const editar = await screen.findAllByRole("button", { name: "Editar" });
    await userEvent.click(editar[4] as HTMLElement);
    await userEvent.click(await screen.findByRole("button", { name: /Quitar credencial/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Quitar credencial" }));

    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    expect(guardar.mock.calls[0]?.[0]?.borrador.borrarApiKey).toBe(true);
    expect(guardar.mock.calls[0]?.[0]?.borrador.apiKey).toBe("");
  });

  it("un aviso que no cabe en la llamada no llega a viajar", async () => {
    leer.mockResolvedValue(PROPIA);
    montar();

    const editar = await screen.findAllByRole("button", { name: "Editar" });
    await userEvent.click(editar[5] as HTMLElement);

    const aviso = await screen.findByLabelText(/Aviso antes de que termine/);
    await userEvent.clear(aviso);
    await userEvent.type(aviso, "9");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(guardar).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/El aviso tiene que caber dentro de la llamada/),
    ).toBeInTheDocument();
  });

  it("el asistente apagado en el despliegue es un estado de la pantalla, no un error de red", async () => {
    leer.mockRejectedValue(
      new ErrorApi({
        type: "https://sicamed.co/problemas/asistente-desactivado",
        title: "El asistente está desactivado",
        detail: "SICAMED_ASISTENTE_HABILITADO=false",
        status: 503,
      }),
    );
    montar();

    expect(
      await screen.findByText(/El asistente está desactivado en este despliegue/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
  });
});
