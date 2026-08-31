import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComprobacionSeguridad } from "./ComprobacionSeguridad";
import { URL_TURNSTILE, olvidarCarga } from "../../seguridad/turnstile";
import type { OpcionesWidget } from "../../seguridad/turnstile";

const opciones: OpcionesWidget[] = [];

const guionEnCabeza = (): HTMLScriptElement | null =>
  document.querySelector<HTMLScriptElement>(`script[src="${URL_TURNSTILE}"]`);

const ultimoWidget = (): OpcionesWidget => {
  const config = opciones.at(-1);
  if (!config) throw new Error("Turnstile no rindio ningun widget.");
  return config;
};

const exponerApi = () => {
  window.turnstile = {
    render: (_contenedor, config) => {
      opciones.push(config);
      return `widget-${opciones.length}`;
    },
    remove: vi.fn(),
    reset: vi.fn(),
  };
};

beforeEach(() => {
  vi.stubEnv("VITE_TURNSTILE_CLAVE_SITIO", "0xPRUEBA");
  opciones.length = 0;
  olvidarCarga();
  document.head.innerHTML = "";
  exponerApi();
});

afterEach(() => {
  cleanup();
  delete window.turnstile;
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("rescate de la comprobacion de seguridad", () => {
  it("ofrece reintentar cuando Cloudflare devuelve un codigo de error", async () => {
    const alToken = vi.fn();
    render(<ComprobacionSeguridad onToken={alToken} />);

    await waitFor(() => expect(opciones).toHaveLength(1));
    act(() => ultimoWidget()["error-callback"]("600010"));

    expect(screen.getByRole("alert")).toHaveTextContent("Cloudflare: 600010");
    expect(alToken).toHaveBeenCalledWith(null);

    await userEvent.click(screen.getByRole("button", { name: /Reintentar/ }));

    await waitFor(() => expect(opciones).toHaveLength(2));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("avisa por su cuenta si el reto se queda colgado sin responder", async () => {
    vi.useFakeTimers();
    render(<ComprobacionSeguridad onToken={vi.fn()} />);

    await vi.waitFor(() => expect(opciones).toHaveLength(1));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Cloudflare: sin respuesta");
    expect(screen.getByRole("button", { name: /Reintentar/ })).toBeTruthy();
  });

  it("no avisa cuando el reto responde a tiempo", async () => {
    vi.useFakeTimers();
    const alToken = vi.fn();
    render(<ComprobacionSeguridad onToken={alToken} />);

    await vi.waitFor(() => expect(opciones).toHaveLength(1));
    act(() => ultimoWidget().callback("token-bueno"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(alToken).toHaveBeenCalledWith("token-bueno");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("cambia el guion muerto por uno nuevo al reintentar", async () => {
    vi.useFakeTimers();
    delete window.turnstile;
    const muerto = document.createElement("script");
    muerto.src = URL_TURNSTILE;
    document.head.append(muerto);

    render(<ComprobacionSeguridad onToken={vi.fn()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Cloudflare: sin respuesta");
    expect(guionEnCabeza()).toBe(muerto);

    await act(async () => {
      screen.getByRole("button", { name: /Reintentar/ }).click();
    });

    const fresco = guionEnCabeza();
    expect(fresco).not.toBeNull();
    expect(fresco).not.toBe(muerto);
  });
});
