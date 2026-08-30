import { describe, expect, it } from "vitest";
import { ErrorApi } from "../api/problemDetails";
import { claseDeRechazo, exigeCambioDeClave, mensajeDelRechazo } from "./rechazos";

const problema = (tipo: string, status: number, detail = "") =>
  new ErrorApi({
    type: `https://sicamed.co/problemas/${tipo}`,
    title: "Acceso rechazado",
    detail,
    status,
  });

describe("el rechazo se enruta por type y nunca por title ni por detail", () => {
  it("distingue la clave de transito de una credencial equivocada", () => {
    expect(claseDeRechazo(problema("clave-de-transito", 403))).toBe("transito");
    expect(claseDeRechazo(problema("credencial-invalida", 401))).toBe("credencial");
    expect(exigeCambioDeClave(problema("clave-de-transito", 403))).toBe(true);
    expect(exigeCambioDeClave(problema("credencial-invalida", 401))).toBe(false);
  });

  it("los tres 403 de cuenta no son el mismo caso", () => {
    expect(claseDeRechazo(problema("registro-en-revision", 403))).toBe("revision");
    expect(claseDeRechazo(problema("credencial-suspendida", 403))).toBe("suspendida");
    expect(claseDeRechazo(problema("clave-de-transito", 403))).toBe("transito");
  });

  it("un type desconocido cae al respaldo por estado", () => {
    expect(claseDeRechazo(problema("algo-nuevo", 401))).toBe("credencial");
    expect(claseDeRechazo(problema("algo-nuevo", 429))).toBe("bloqueada");
    expect(claseDeRechazo(problema("algo-nuevo", 418))).toBe("otro");
  });

  it("una caida del emisor no se le achaca al usuario", () => {
    expect(claseDeRechazo(problema("error-inesperado", 503))).toBe("servicio");
    expect(claseDeRechazo(problema("servicio-inalcanzable", 0))).toBe("servicio");
  });

  it("muestra el detail del servidor, que viene redactado para la pantalla", () => {
    expect(
      mensajeDelRechazo(problema("cuenta-bloqueada", 429, "Vuelva a intentarlo en 14 minutos.")),
    ).toBe("Vuelva a intentarlo en 14 minutos.");
  });
});
