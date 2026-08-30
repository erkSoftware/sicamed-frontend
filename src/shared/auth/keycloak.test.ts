import { describe, expect, it } from "vitest";
import { mensajeDeRechazo } from "./keycloak";

describe("rechazos del emisor traducidos a la pantalla de acceso", () => {
  it("distingue la credencial equivocada de la cuenta que aun no esta habilitada", () => {
    const equivocada = mensajeDeRechazo(401, {
      error: "invalid_grant",
      error_description: "Invalid user credentials",
    });
    const pendiente = mensajeDeRechazo(400, {
      error: "invalid_grant",
      error_description: "Account is not fully set up",
    });
    expect(equivocada).toContain("no coinciden");
    expect(pendiente).toContain("todavía no está habilitada");
    expect(pendiente).not.toBe(equivocada);
  });

  it("la cuenta deshabilitada no se confunde con el bloqueo por intentos", () => {
    expect(
      mensajeDeRechazo(400, { error: "invalid_grant", error_description: "Account disabled" }),
    ).toContain("todavía no está habilitada");
    expect(
      mensajeDeRechazo(400, {
        error: "invalid_grant",
        error_description: "Account temporarily disabled",
      }),
    ).toContain("bloqueada temporalmente");
  });

  it("una mala configuracion del cliente no se le echa en cara al usuario", () => {
    expect(mensajeDeRechazo(400, { error: "unauthorized_client" })).toContain(
      "falla de configuración del servidor",
    );
  });

  it("el limite de tasa y la caida del emisor tienen mensaje propio", () => {
    expect(mensajeDeRechazo(429)).toContain("Demasiados intentos");
    expect(mensajeDeRechazo(503)).toContain("servicio de identidad");
  });

  it("un rechazo sin cuerpo no deja la pantalla en blanco", () => {
    expect(mensajeDeRechazo(400).length).toBeGreaterThan(20);
  });
});
