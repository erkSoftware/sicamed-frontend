import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import type { ReactNode } from "react";
import { Inicio } from "../../src/publico/paginas/Inicio";
import { VitrinaPublica } from "../../src/publico/paginas/VitrinaPublica";
import { Normativa } from "../../src/publico/paginas/Normativa";

const envolver = (nodo: ReactNode, ruta = "/") =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[ruta]}>{nodo}</MemoryRouter>
    </HelmetProvider>,
  );

describe("accesibilidad de las paginas publicas", () => {
  it("la portada tiene un unico encabezado de nivel uno y es accesible", async () => {
    const { container } = envolver(<Inicio />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await expect(container).aSerAccesible();
  });

  it("la vitrina publica es accesible y anuncia el conteo de resultados", async () => {
    const { container } = envolver(<VitrinaPublica />, "/vitrina");
    expect(screen.getByText(/ofertas publicadas/)).toBeInTheDocument();
    await expect(container).aSerAccesible();
  });

  it("la pagina de normativa es accesible", async () => {
    const { container } = envolver(<Normativa />, "/normativa");
    await expect(container).aSerAccesible();
  });
});
