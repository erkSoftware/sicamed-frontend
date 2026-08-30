import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proveedorContrasena } from "./proveedorContrasena";

const carga = (reclamaciones: Record<string, unknown>): string =>
  ["cabecera", btoa(JSON.stringify(reclamaciones)), "firma"].join(".");

const token = (reclamaciones: Record<string, unknown>, renovacion?: string) => ({
  access_token: carga(reclamaciones),
  expires_in: 300,
  ...(renovacion ? { refresh_token: renovacion } : {}),
});

const responder = (cuerpo: unknown, ok = true) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(cuerpo), {
      status: ok ? 200 : 401,
      headers: { "Content-Type": "application/json" },
    }),
  );

const identidad = {
  sub: "u-1",
  name: "Marcela Ospina",
  email: "marcela@cannalia.co",
  permisos: ["vitrina:oferta:leer"],
};

beforeEach(async () => {
  await proveedorContrasena.cerrarSesion();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("acceso con usuario y contraseña", () => {
  it("canjea las credenciales por un token y las manda como password grant", async () => {
    const peticion = responder(token(identidad, "renovacion-1"));
    const sesion = await proveedorContrasena.iniciarSesion({
      usuario: "  marcela@cannalia.co  ",
      clave: "secreta",
    });

    const cuerpo = new URLSearchParams(String(peticion.mock.calls[0]?.[1]?.body));
    expect(cuerpo.get("grant_type")).toBe("password");
    expect(cuerpo.get("username")).toBe("marcela@cannalia.co");
    expect(cuerpo.get("password")).toBe("secreta");
    expect(cuerpo.get("client_secret")).toBeNull();
    expect(sesion.usuario.nombre).toBe("Marcela Ospina");
    expect(sesion.permisos).toEqual(["vitrina:oferta:leer"]);
    expect(proveedorContrasena.credencial()).toBe(carga(identidad));
  });

  it("no sale a la red sin usuario o sin contraseña", async () => {
    const peticion = responder({});
    await expect(proveedorContrasena.iniciarSesion({ usuario: "ana" })).rejects.toThrow(
      /credenciales/,
    );
    await expect(proveedorContrasena.iniciarSesion()).rejects.toThrow(/credenciales/);
    expect(peticion).not.toHaveBeenCalled();
  });

  it("un rechazo del emisor no deja credencial en memoria", async () => {
    responder({ error_description: "Invalid user credentials" }, false);
    await expect(
      proveedorContrasena.iniciarSesion({ usuario: "ana", clave: "mala" }),
    ).rejects.toThrow(/Invalid user credentials/);
    expect(proveedorContrasena.credencial()).toBeUndefined();
  });

  it("sin renovacion en memoria no molesta al emisor", async () => {
    const peticion = responder({});
    expect(await proveedorContrasena.restaurar()).toBeNull();
    expect(peticion).not.toHaveBeenCalled();
  });

  it("la renovacion vive en memoria y nunca en el navegador", async () => {
    responder(token(identidad, "renovacion-1"));
    await proveedorContrasena.iniciarSesion({ usuario: "marcela", clave: "secreta" });

    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);

    const renovar = responder(token(identidad, "renovacion-2"));
    await proveedorContrasena.restaurar();
    const cuerpo = new URLSearchParams(String(renovar.mock.calls[0]?.[1]?.body));
    expect(cuerpo.get("grant_type")).toBe("refresh_token");
    expect(cuerpo.get("refresh_token")).toBe("renovacion-1");
  });

  it("cerrar sesion olvida la credencial y revoca la renovacion", async () => {
    responder(token(identidad, "renovacion-1"));
    await proveedorContrasena.iniciarSesion({ usuario: "marcela", clave: "secreta" });

    const salida = responder({});
    await proveedorContrasena.cerrarSesion();
    expect(proveedorContrasena.credencial()).toBeUndefined();
    const cuerpo = new URLSearchParams(String(salida.mock.calls[0]?.[1]?.body));
    expect(cuerpo.get("refresh_token")).toBe("renovacion-1");
  });
});
