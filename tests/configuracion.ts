import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";
import { configureAxe } from "./ejes";

if (!window.matchMedia) {
  window.matchMedia = (consulta: string) =>
    ({
      matches: false,
      media: consulta,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function abrirModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function cerrarModal(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

afterEach(() => {
  cleanup();
});

expect.extend({
  async aSerAccesible(recibido: HTMLElement) {
    const resultados = await configureAxe(recibido);
    const graves = resultados.violations.filter(
      (violacion) => violacion.impact === "critical" || violacion.impact === "serious",
    );
    return {
      pass: graves.length === 0,
      message: () =>
        graves.length === 0
          ? "Se esperaban violaciones de accesibilidad y no se encontraron"
          : `Violaciones de accesibilidad criticas o serias:\n${graves
              .map((violacion) => `- [${violacion.impact}] ${violacion.id}: ${violacion.help}`)
              .join("\n")}`,
    };
  },
});

declare module "vitest" {
  interface Assertion {
    aSerAccesible(): Promise<void>;
  }
}
