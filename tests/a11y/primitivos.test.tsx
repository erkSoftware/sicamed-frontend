import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Boton } from "../../src/shared/ui/primitivos/Boton";
import { CampoSelect, CampoTexto } from "../../src/shared/ui/primitivos/Campo";
import { Tabla } from "../../src/shared/ui/primitivos/Tabla";
import { ErrorNormativo } from "../../src/shared/ui/patrones/ErrorNormativo";
import { EstadoVacio } from "../../src/shared/ui/patrones/EstadoVacio";
import { Kpi } from "../../src/shared/ui/patrones/Kpi";

describe("accesibilidad de los primitivos", () => {
  it("el boton no tiene violaciones criticas ni serias", async () => {
    const { container } = render(<Boton icono="mas">Nueva oferta</Boton>);
    await expect(container).aSerAccesible();
  });

  it("el campo de texto asocia una etiqueta real, no un marcador", async () => {
    const { container } = render(
      <CampoTexto etiqueta="Título de la oferta" ayuda="Sin cantidades" requerido />,
    );
    expect(screen.getByLabelText(/Título de la oferta/)).toBeInTheDocument();
    await expect(container).aSerAccesible();
  });

  it("el campo de seleccion es accesible", async () => {
    const { container } = render(
      <CampoSelect
        etiqueta="Departamento"
        vacio="Todos"
        opciones={[{ valor: "Tolima", etiqueta: "Tolima" }]}
      />,
    );
    await expect(container).aSerAccesible();
  });

  it("la tabla de datos expone encabezados asociados", async () => {
    const { container } = render(
      <Tabla
        descripcion="Listado de lotes"
        columnas={[
          { clave: "codigo", encabezado: "Lote", render: (fila: { codigo: string }) => fila.codigo },
          { clave: "cantidad", encabezado: "Cantidad", numerica: true, render: () => "12 kg" },
        ]}
        filas={[{ codigo: "L-2026-1000" }]}
        claveFila={(fila) => fila.codigo}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Lote" })).toBeInTheDocument();
    await expect(container).aSerAccesible();
  });

  it("el error normativo se anuncia como alerta y cita la norma", async () => {
    const { container } = render(
      <MemoryRouter>
        <ErrorNormativo
          problema={{
            type: "https://sicamed.co/problemas/habilitacion-no-vigente",
            title: "Publicación rechazada por falta de habilitación vigente",
            detail: "La organización no tiene una atestación de licencia vigente.",
            status: 422,
            norma: "Res. 1241/2026 Art. 13b",
            accion: { etiqueta: "Ver mis licencias", ruta: "/app/licencias" },
          }}
        />
      </MemoryRouter>,
    );
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("Res. 1241/2026 Art. 13b");
    expect(screen.getByRole("link", { name: "Ver mis licencias" })).toBeInTheDocument();
    await expect(container).aSerAccesible();
  });

  it("el estado vacio es accesible", async () => {
    const { container } = render(
      <EstadoVacio titulo="Sin ofertas" texto="Todavía no has publicado ninguna oferta." />,
    );
    await expect(container).aSerAccesible();
  });

  it("la tarjeta de indicador es accesible como enlace", async () => {
    const { container } = render(
      <MemoryRouter>
        <Kpi etiqueta="Proveedores" valor="5.200" nota="Registrados" icono="hoja" a="/app/directorio" />
      </MemoryRouter>,
    );
    await expect(container).aSerAccesible();
  });
});
