import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType } from "react";

let Acceso: ComponentType;
let CambiarClave: ComponentType;
let AuthProvider: ComponentType<{ children: React.ReactNode }>;

const problema = (tipo: string, status: number, detail: string): Response =>
  new Response(
    JSON.stringify({
      type: `https://sicamed.co/problemas/${tipo}`,
      title: "Acceso rechazado",
      detail,
      status,
    }),
    { status, headers: { "Content-Type": "application/problem+json" } },
  );

const responder = (login: () => Response) =>
  vi.spyOn(globalThis, "fetch").mockImplementation((entrada) => {
    const url = String(entrada);
    if (url.endsWith("/auth/login")) return Promise.resolve(login());
    return Promise.resolve(problema("sesion-invalida", 401, "No hay sesión."));
  });

const pintar = () =>
  render(
    <HelmetProvider>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter initialEntries={["/acceso"]}>
          <AuthProvider>
            <Routes>
              <Route path="/acceso" element={<Acceso />} />
              <Route path="/acceso/clave" element={<CambiarClave />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );

const entrar = async () => {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText(/Correo institucional/), "ana@cultivos.co");
  await usuario.type(screen.getByLabelText(/^Contraseña/), "la-contrasena");
  await usuario.click(screen.getByRole("button", { name: "Entrar" }));
};

beforeAll(async () => {
  vi.stubEnv("VITE_MODO_AUTH", "servidor");
  vi.resetModules();
  Acceso = (await import("./Acceso")).Acceso;
  CambiarClave = (await import("./CambiarClave")).CambiarClave;
  AuthProvider = (await import("../providers/AuthProvider")).AuthProvider;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("el ingreso real contra el servicio de identidad", () => {
  it("una contrasena de transito lleva a cambiarla y no dice que este equivocada", async () => {
    responder(() =>
      problema("clave-de-transito", 403, "Debe cambiar la contraseña antes de entrar."),
    );
    pintar();
    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled());
    await entrar();
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Cambiar la contraseña",
    );
  });

  it("un registro en revision se queda en el acceso y muestra lo que dijo el servidor", async () => {
    responder(() =>
      problema("registro-en-revision", 403, "Su registro sigue en trámite ante el analista."),
    );
    pintar();
    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled());
    await entrar();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Su registro sigue en trámite ante el analista.",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ingresar a la plataforma");
  });

  it("no ofrece perfiles de demostracion cuando la identidad es real", async () => {
    responder(() => problema("credencial-invalida", 401, "Correo o contraseña incorrectos."));
    pintar();
    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled());
    expect(screen.queryByText("Perfiles de demostración")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cambiar mi contraseña" })).toBeInTheDocument();
  });
});
