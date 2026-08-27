import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  ssr: {
    noExternal: true,
  },
  build: {
    target: "es2022",
    sourcemap: false,
    outDir: isSsrBuild ? "dist-servidor" : "dist",
    ssr: isSsrBuild,
    rollupOptions: {
      input: isSsrBuild
        ? { "entrada-servidor": "src/entrada-servidor.tsx", "datos-publicos": "src/datos-publicos.ts" }
        : undefined,
      output: {
        format: isSsrBuild ? "es" : undefined,
        entryFileNames: isSsrBuild ? "[name].js" : "assets/[name]-[hash].js",
        manualChunks(id) {
          if (isSsrBuild) return undefined;
          if (id.includes("features-salud")) return "zona-clinica";
          if (id.includes("node_modules/react-router")) return "enrutador";
          if (id.includes("node_modules/@tanstack")) return "consultas";
          if (id.includes("node_modules/react")) return "react";
          return undefined;
        },
      },
    },
  },
}));
