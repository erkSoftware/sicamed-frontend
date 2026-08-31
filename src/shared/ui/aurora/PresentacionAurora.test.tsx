import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  PresentacionAurora,
  marcarPresentada,
  olvidarPresentacion,
  yaSePresento,
} from "./PresentacionAurora";

const avanzar = (milisegundos: number) =>
  act(() => {
    vi.advanceTimersByTime(milisegundos);
  });

describe("PresentacionAurora", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    olvidarPresentacion();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("explica lo que se puede hacer, revelándolo en cuatro segundos", () => {
    render(<PresentacionAurora abierta onCerrar={() => undefined} />);

    expect(screen.getByRole("heading", { name: "Habla con AURORA" })).toBeInTheDocument();
    expect(screen.queryByText(/Llévame a cumplimiento/)).not.toBeInTheDocument();

    avanzar(900);
    expect(screen.getByText(/Llévame a cumplimiento/)).toBeInTheDocument();

    avanzar(1600);
    expect(screen.getByText(/¿Qué estoy viendo aquí\?/)).toBeInTheDocument();
    expect(screen.getByText(/Registra un lote/)).toBeInTheDocument();

    avanzar(900);
    expect(screen.getByText(/No tienes que aprenderte el sistema/)).toBeInTheDocument();
  });

  it("la equis sale sin cerrar a Aurora", () => {
    const cerrar = vi.fn();
    render(<PresentacionAurora abierta onCerrar={cerrar} />);

    act(() => {
      screen.getByRole("button", { name: /Salir de la presentación/ }).click();
    });

    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it("empezar a hablar también la cierra", () => {
    const cerrar = vi.fn();
    render(<PresentacionAurora abierta onCerrar={cerrar} />);

    act(() => {
      screen.getByRole("button", { name: "Empezar a hablar" }).click();
    });

    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it("cerrada no ocupa la pantalla", () => {
    render(<PresentacionAurora abierta={false} onCerrar={() => undefined} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("recuerda que ya se presentó, y se puede olvidar", () => {
    expect(yaSePresento()).toBe(false);
    marcarPresentada();
    expect(yaSePresento()).toBe(true);
    olvidarPresentacion();
    expect(yaSePresento()).toBe(false);
  });
});
