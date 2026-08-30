import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useContext } from "react";
import type { ComponentType } from "react";
import type { ValorAuth } from "../../shared/auth/contexto";

let AuthProvider: ComponentType<{ children: React.ReactNode }>;
let ContextoAuth: React.Context<ValorAuth | null>;
let usaAlmacenPropio: () => boolean;

const cuenta = (rol: string) => ({
  acceso: "eyJ",
  expiraEn: 900,
  tipo: "Bearer",
  cuenta: {
    id: "9381",
    nombre: "Ana Ruiz",
    correo: "ana@cultivos.co",
    rol,
    organizacionId: "28b5",
  },
});

const yo = (rol: string) => ({
  sujeto: "9381",
  nombre: "Ana Ruiz",
  correo: "ana@cultivos.co",
  tenantId: "018e",
  organizacionId: "28b5",
  roles: [rol],
  permisos: [] as string[],
  zonaClinica: false,
});

const json = (cuerpo: unknown): Response =>
  new Response(JSON.stringify(cuerpo), { headers: { "Content-Type": "application/json" } });

const servidorCon = (rol: string) =>
  vi.spyOn(globalThis, "fetch").mockImplementation((entrada) => {
    const url = String(entrada);
    if (url.endsWith("/auth/refresh")) return Promise.resolve(json(cuenta(rol)));
    if (url.endsWith("/auth/yo")) return Promise.resolve(json(yo(rol)));
    return Promise.resolve(new Response(null, { status: 204 }));
  });

const Sonda = () => {
  const auth = useContext(ContextoAuth);
  if (!auth) return null;
  return (
    <div>
      <span data-testid="estado">{auth.estado}</span>
      <span data-testid="rol">{auth.sesion?.usuario.rol ?? ""}</span>
      <span data-testid="puede">{String(auth.puedeAdoptarPerfil)}</span>
      <span data-testid="propio">{String(usaAlmacenPropio())}</span>
      <span data-testid="permisos">{auth.permisos.length}</span>
      <button type="button" onClick={() => auth.adoptarPerfil("OPERARIO_CAMPO")}>
        adoptar
      </button>
      <button type="button" onClick={() => auth.adoptarPerfil(null)}>
        soltar
      </button>
    </div>
  );
};

const pintar = () =>
  render(
    <AuthProvider>
      <Sonda />
    </AuthProvider>,
  );

const listo = async () =>
  waitFor(() => expect(screen.getByTestId("estado")).toHaveTextContent("autenticado"));

beforeAll(async () => {
  vi.stubEnv("VITE_MODO_AUTH", "servidor");
  vi.resetModules();
  AuthProvider = (await import("./AuthProvider")).AuthProvider;
  ContextoAuth = (await import("../../shared/auth/contexto")).ContextoAuth;
  usaAlmacenPropio = (await import("../../shared/api/mock/almacen")).usaAlmacenPropio;
});

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("quien puede cambiar de perfil desde dentro", () => {
  it("una sesion real arranca sobre datos propios, no sobre los de demostracion", async () => {
    servidorCon("PRODUCTOR");
    pintar();
    await listo();
    expect(screen.getByTestId("propio")).toHaveTextContent("true");
    expect(screen.getByTestId("rol")).toHaveTextContent("Productor");
  });

  it("quien no administra no puede adoptar otro perfil ni aunque lo pida", async () => {
    servidorCon("PRODUCTOR");
    pintar();
    await listo();
    expect(screen.getByTestId("puede")).toHaveTextContent("false");
    await userEvent.setup().click(screen.getByRole("button", { name: "adoptar" }));
    expect(screen.getByTestId("rol")).toHaveTextContent("Productor");
    expect(screen.getByTestId("propio")).toHaveTextContent("true");
  });

  it("un administrador adopta un perfil, ve sus permisos y vuelve a su cuenta", async () => {
    servidorCon("SUPER_ADMIN");
    pintar();
    await listo();
    expect(screen.getByTestId("puede")).toHaveTextContent("true");

    const usuario = userEvent.setup();
    await usuario.click(screen.getByRole("button", { name: "adoptar" }));
    await waitFor(() =>
      expect(screen.getByTestId("rol")).toHaveTextContent("Operario de campo · Cultivador"),
    );
    expect(screen.getByTestId("propio")).toHaveTextContent("false");
    expect(Number(screen.getByTestId("permisos").textContent)).toBeGreaterThan(0);

    await usuario.click(screen.getByRole("button", { name: "soltar" }));
    await waitFor(() => expect(screen.getByTestId("rol")).toHaveTextContent("Super administrador"));
    expect(screen.getByTestId("propio")).toHaveTextContent("true");
  });
});
