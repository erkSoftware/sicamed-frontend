import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Acceso, modoDesdeParametro } from "../../src/app/paginas/Acceso";
import { AuthProvider } from "../../src/app/providers/AuthProvider";

const UBICACION = {
  success: true,
  city: "Cali",
  region: "Departamento del Valle del Cauca",
  country: "Colombia",
  country_code: "CO",
  latitude: 3.43,
  longitude: -76.52,
};

const envolver = (nodo: ReactNode, ruta: string) =>
  render(
    <HelmetProvider>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter initialEntries={[ruta]}>
          <AuthProvider>{nodo}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(UBICACION), { headers: { "Content-Type": "application/json" } }),
  );
});

describe("acceso con vista de telemedicina", () => {
  it("lee el parametro de la url que pide la vista de las IPS", () => {
    expect(modoDesdeParametro("true")).toBe("telemedicina");
    expect(modoDesdeParametro("1")).toBe("telemedicina");
    expect(modoDesdeParametro(" TRUE ")).toBe("telemedicina");
    expect(modoDesdeParametro("false")).toBe("operacion");
    expect(modoDesdeParametro(null)).toBe("operacion");
  });

  it("con is_ips=true abre directo en telemedicina sin tocar el formulario", async () => {
    envolver(<Acceso />, "/acceso?is_ips=true");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ingresar a la consulta");
    expect(screen.getByRole("button", { name: "Telemedicina" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText(/Correo institucional/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Explorar el recorrido/ })).toBeInTheDocument();
  });

  it("el selector cambia de vista en las dos direcciones", async () => {
    const usuario = userEvent.setup();
    envolver(<Acceso />, "/acceso");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ingresar a la plataforma");

    await usuario.click(screen.getByRole("button", { name: "Telemedicina" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ingresar a la consulta");

    await usuario.click(screen.getByRole("button", { name: "SICAMED en operación" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ingresar a la plataforma");
  });

  it("resalta la region que devuelve la consulta por IP", async () => {
    envolver(<Acceso />, "/acceso?is_ips=true");
    expect(
      await screen.findByRole("img", { name: /Valle del Cauca resaltado/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Detectamos tu ubicación")).toBeInTheDocument();
    expect(screen.getAllByText(/Valle del Cauca/).length).toBeGreaterThan(1);
  });

  it("las dos vistas del acceso son accesibles", async () => {
    const operacion = envolver(<Acceso />, "/acceso");
    await expect(operacion.container).aSerAccesible();
    operacion.unmount();

    const telemedicina = envolver(<Acceso />, "/acceso?is_ips=true");
    await screen.findByRole("button", { name: /Explorar el recorrido/ });
    await expect(telemedicina.container).aSerAccesible();
  });
});
