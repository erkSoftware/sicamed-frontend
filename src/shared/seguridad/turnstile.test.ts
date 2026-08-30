import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CABECERA_CAPTCHA,
  URL_TURNSTILE,
  cargarTurnstile,
  claveDeSitio,
  exigeComprobacion,
  olvidarCarga,
} from "./turnstile";
import type { ApiTurnstile } from "./turnstile";

const guion = (): HTMLScriptElement | null =>
  document.querySelector<HTMLScriptElement>(`script[src="${URL_TURNSTILE}"]`);

beforeEach(() => {
  olvidarCarga();
  document.head.innerHTML = "";
  delete window.turnstile;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("carga de turnstile", () => {
  it("la cabecera es la que el backend declara", () => {
    expect(CABECERA_CAPTCHA).toBe("CF-Turnstile-Response");
  });

  it("pide el guion en modo explicito, una sola vez", async () => {
    const primera = cargarTurnstile();
    const segunda = cargarTurnstile();
    expect(primera).toBe(segunda);

    const etiqueta = guion();
    expect(etiqueta?.src).toBe(URL_TURNSTILE);
    expect(etiqueta?.async).toBe(true);
    expect(document.querySelectorAll("script")).toHaveLength(1);

    const api = { render: vi.fn(), remove: vi.fn(), reset: vi.fn() } satisfies ApiTurnstile;
    window.turnstile = api;
    etiqueta?.dispatchEvent(new Event("load"));
    await expect(primera).resolves.toBe(api);
  });

  it("un guion que carga sin exponer su interfaz se rechaza", async () => {
    const promesa = cargarTurnstile();
    guion()?.dispatchEvent(new Event("load"));
    await expect(promesa).rejects.toThrow(/interfaz/);
  });

  it("una descarga fallida se rechaza y no deja la carga cacheada", async () => {
    const promesa = cargarTurnstile();
    guion()?.dispatchEvent(new Event("error"));
    await expect(promesa).rejects.toThrow(/descargar/);
    expect(cargarTurnstile()).not.toBe(promesa);
  });
});

describe("cuando se exige la comprobacion", () => {
  it("la clave de sitio decide, y sin clave el tramite no se bloquea en local", () => {
    vi.stubEnv("VITE_TURNSTILE_CLAVE_SITIO", "");
    expect(exigeComprobacion()).toBe(false);

    vi.stubEnv("VITE_TURNSTILE_CLAVE_SITIO", "0x4AAAAAAEhkrb1nAez7dCTA");
    expect(claveDeSitio()).toBe("0x4AAAAAAEhkrb1nAez7dCTA");
    expect(exigeComprobacion()).toBe(true);
  });
});
