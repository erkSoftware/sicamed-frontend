import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/configuracion.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/a11y/**/*.test.{ts,tsx}"],
    css: false,
    restoreMocks: true,
    env: {
      VITE_MODO_API: "mock",
      VITE_MODO_AUTH: "mock",
      VITE_TOKEN_DESARROLLO: "",
      VITE_TURNSTILE_CLAVE_SITIO: "",
    },
  },
});
