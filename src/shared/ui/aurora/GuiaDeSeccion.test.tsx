import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GuiaDeSeccion, olvidarSeccionesAnunciadas } from "./GuiaDeSeccion";
import { contextoDeRuta } from "./contextoDeSeccion";
import { PERMISOS_PLATAFORMA, PERMISOS_CAMPO } from "../../auth/permisosDeRol";

const montar = (ruta: string, extras: Partial<Parameters<typeof GuiaDeSeccion>[0]> = {}) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <GuiaDeSeccion
        activa
        permisos={PERMISOS_PLATAFORMA}
        puedeHablar
        cierre={null}
        onHablar={() => undefined}
        onCierreVisto={() => undefined}
        {...extras}
      />
    </MemoryRouter>,
  );

const avanzar = (milisegundos: number) =>
  act(() => {
    vi.advanceTimersByTime(milisegundos);
  });

describe("contextoDeRuta", () => {
  it("dice dónde estás y qué se hace ahí", () => {
    const contexto = contextoDeRuta("/app/inventario", PERMISOS_PLATAFORMA);
    expect(contexto?.frase).toBe(
      "Estás en Inventario. Aquí puedo ayudarte a consultar existencias y movimientos.",
    );
  });

  it("una ruta de detalle hereda la sección que la contiene", () => {
    expect(contextoDeRuta("/app/plantas/PLA-0001", PERMISOS_PLATAFORMA)?.ruta).toBe("/app/plantas");
  });

  it("no habla de secciones a las que el rol no entra", () => {
    expect(contextoDeRuta("/app/usuarios", PERMISOS_CAMPO)).toBeNull();
  });
});

describe("GuiaDeSeccion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    olvidarSeccionesAnunciadas();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aparece al entrar a la sección y se retira sola", () => {
    montar("/app/produccion");
    expect(screen.queryByText(/Estás en Producción/)).not.toBeInTheDocument();

    avanzar(800);
    expect(screen.getByText(/Estás en Producción/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hablar" })).toBeInTheDocument();

    avanzar(9000);
    expect(screen.queryByText(/Estás en Producción/)).not.toBeInTheDocument();
  });

  it("no repite la misma sección dos veces en la sesión", () => {
    const primera = montar("/app/produccion");
    avanzar(800);
    expect(screen.getByText(/Estás en Producción/)).toBeInTheDocument();
    primera.unmount();

    montar("/app/produccion");
    avanzar(800);
    expect(screen.queryByText(/Estás en Producción/)).not.toBeInTheDocument();
  });

  it("sin permiso de voz informa igual, pero no ofrece hablar", () => {
    montar("/app/produccion", { puedeHablar: false });
    avanzar(800);
    expect(screen.getByText(/Estás en Producción/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hablar" })).not.toBeInTheDocument();
  });

  it("el cierre de la conversación se anuncia y se va solo", () => {
    const visto = vi.fn();
    montar("/app/produccion", { cierre: "Encontré 24 cultivos activos.", onCierreVisto: visto });

    expect(screen.getByText("Encontré 24 cultivos activos.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hablar" })).not.toBeInTheDocument();

    avanzar(5400);
    expect(visto).toHaveBeenCalledTimes(1);
  });

  it("apagada en escritorio no dice nada", () => {
    montar("/app/produccion", { activa: false });
    avanzar(2000);
    expect(screen.queryByText(/Estás en Producción/)).not.toBeInTheDocument();
  });
});
