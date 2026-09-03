import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { PuntoDeDispensacion } from "../../src/features/dispensacion";
import { CredencialPublica } from "../../src/publico/paginas/CredencialPublica";
import { almacenSensible } from "../../src/shared/api/mock/almacenSensible";
import { AuthProvider } from "../../src/app/providers/AuthProvider";

const envolver = (nodo: ReactNode) =>
  render(
    <HelmetProvider>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter>
          <AuthProvider>{nodo}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );

const credencialActiva = () => {
  const credencial = almacenSensible.credenciales.find((item) => item.estado === "ACTIVA");
  if (!credencial) throw new Error("la semilla no trae credenciales activas");
  return credencial;
};

describe("accesibilidad del punto de dispensación", () => {
  it("el mostrador es accesible y advierte que el retiro es presencial", async () => {
    const { container } = envolver(<PuntoDeDispensacion />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Punto de dispensación");
    expect(screen.getByText(/El retiro es presencial/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/Punto de dispensación/)).toBeInTheDocument(),
    );
    await expect(container).aSerAccesible();
  });

  it("no ofrece ninguna forma de entrega a domicilio", async () => {
    envolver(<PuntoDeDispensacion />);
    await waitFor(() => expect(screen.getByLabelText(/Punto de dispensación/)).toBeInTheDocument());
    expect(document.body.textContent).not.toMatch(/domicilio\s+disponible|enviar a casa/i);
    expect(screen.queryByRole("button", { name: /domicilio/i })).toBeNull();
  });

  it("rechaza un código inexistente con un mensaje que no confirma la existencia", async () => {
    const usuario = userEvent.setup();
    envolver(<PuntoDeDispensacion />);
    await waitFor(() => expect(screen.getByLabelText(/Punto de dispensación/)).toBeInTheDocument());
    await usuario.type(screen.getByLabelText(/Código de la credencial/), "ZZZZ-0000");
    await usuario.click(screen.getByRole("button", { name: /Verificar credencial/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/No hay ninguna credencial/);
  });
});

describe("accesibilidad de la credencial pública", () => {
  it("la página del paciente es accesible", async () => {
    const { container } = envolver(<CredencialPublica />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tu credencial de paciente");
    await expect(container).aSerAccesible();
  });

  it("muestra el estado sin revelar el nombre ni el documento del paciente", async () => {
    const usuario = userEvent.setup();
    const credencial = credencialActiva();
    envolver(<CredencialPublica />);
    await usuario.type(screen.getByLabelText(/Código de tu credencial/), credencial.codigoRotatorio);
    await usuario.click(screen.getByRole("button", { name: /Consultar estado/ }));
    expect(await screen.findByText(credencial.seudonimo)).toBeInTheDocument();
    expect(screen.queryByText(credencial.paciente)).toBeNull();
    expect(document.body.textContent).not.toContain("CC ");
  });
});
