import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";

const MENSAJE_N13_COMERCIAL =
  "ON N-13 (Res. 1241/2026 Art. 24 parrafo): la zona comercial no puede importar de la zona " +
  "clinica. Si necesitas un dato, pidelo por la API de disponibilidad, que ya viene sin PII.";

const MENSAJE_N13_CLINICO =
  "ON N-13: la zona clinica no importa de la comercial. El unico puente permitido es la API " +
  "publica de vitrina.";

const MENSAJE_N24 =
  "ON N-24: la vitrina publica se sirve sin autenticacion. No puede depender de codigo " +
  "autenticado ni arrastrarlo al bundle publico.";

const MENSAJE_PERSISTENCIA =
  "Ley 1581/2012 Art. 5: los datos de salud son sensibles. Prohibida toda persistencia en el " +
  "dispositivo del usuario dentro de features-salud.";

export default tseslint.config(
  { ignores: ["dist", "coverage", "playwright-report", "test-results", "src/shared/api/generado"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/no-noninteractive-tabindex": [
        "error",
        { tags: [], roles: ["tabpanel", "group"], allowExpressionValues: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": ["error", { allow: ["error"] }],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/features-salud",
                "**/features-salud/**",
                "@/features-salud",
                "@/features-salud/**",
              ],
              message: MENSAJE_N13_COMERCIAL,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features-salud/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/features", "**/features/**", "@/features", "@/features/**"],
              message: MENSAJE_N13_CLINICO,
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "localStorage", message: MENSAJE_PERSISTENCIA },
        { name: "sessionStorage", message: MENSAJE_PERSISTENCIA },
        { name: "indexedDB", message: MENSAJE_PERSISTENCIA },
      ],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "localStorage", message: MENSAJE_PERSISTENCIA },
        { object: "window", property: "sessionStorage", message: MENSAJE_PERSISTENCIA },
        { object: "window", property: "indexedDB", message: MENSAJE_PERSISTENCIA },
      ],
    },
  },
  {
    files: ["src/publico/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/features",
                "**/features/**",
                "@/features",
                "@/features/**",
                "**/features-salud",
                "**/features-salud/**",
                "@/features-salud",
                "@/features-salud/**",
                "**/shared/auth",
                "**/shared/auth/**",
                "@/shared/auth",
                "@/shared/auth/**",
              ],
              message: MENSAJE_N24,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["tools/**/*.ts", "*.config.ts", "*.config.js"],
    languageOptions: { globals: globals.node },
    rules: { "no-console": "off" },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { "no-console": "off" },
  },
  {
    files: ["src/publico/intro/diagnostico.ts"],
    rules: { "no-console": "off" },
  },
);
