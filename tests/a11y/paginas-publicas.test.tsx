import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProveedorIdioma } from "../../src/shared/i18n/ProveedorIdioma";
import type { ReactNode } from "react";
import { Inicio } from "../../src/publico/paginas/Inicio";
import { VitrinaPublica } from "../../src/publico/paginas/VitrinaPublica";
import { Normativa } from "../../src/publico/paginas/Normativa";

const envolver = (nodo: ReactNode, ruta = "/") =>
  render(
    <HelmetProvider>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={[ruta]}>{nodo}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );

describe("accesibilidad de las paginas publicas", () => {
  it("la portada tiene un unico encabezado de nivel uno y es accesible", async () => {
    const { container } = envolver(<Inicio />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await expect(container).aSerAccesible();
  });

  it("la vitrina publica es accesible y anuncia el conteo de resultados", async () => {
    const { container } = envolver(
      <ProveedorIdioma>
        <VitrinaPublica />
      </ProveedorIdioma>,
      "/vitrina?modo=resultados",
    );
    expect((await screen.findAllByRole("article", undefined, { timeout: 4000 })).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ofertas publicadas/).length).toBeGreaterThan(0);
    await expect(container).aSerAccesible();
  });

  it("la vitrina publica no expone vocabulario transaccional ni datos reservados", async () => {
    envolver(
      <ProveedorIdioma>
        <VitrinaPublica />
      </ProveedorIdioma>,
      "/vitrina?modo=resultados",
    );
    await screen.findAllByRole("article", undefined, { timeout: 4000 });
    expect(screen.queryByText(/comprar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/verificad[ao]s? por SICAMED/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Manifestar interés/ }).length).toBeGreaterThan(0);
  });

  it("la pagina de normativa es accesible", async () => {
    const { container } = envolver(<Normativa />, "/normativa");
    await expect(container).aSerAccesible();
  });
});
