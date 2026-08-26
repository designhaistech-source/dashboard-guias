import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

import { DESIGN_SYSTEM_RULES, ESLINT_EXEMPT_GLOBS } from "./scripts/visual/design-system-rules.mjs";

/**
 * Guardrails do design system: bloqueiam cores fixas e tamanhos arbitrários
 * em classes utilitárias. As regras vêm do mesmo módulo usado no CI.
 */
const designSystemRestrictions = DESIGN_SYSTEM_RULES.filter(
  (rule) => rule.id !== "native-control",
).flatMap(({ source, msg }) => {
  const message = `Design system: ${msg}.`;
  return [
    { selector: `Literal[value=/${source}/]`, message },
    { selector: `TemplateElement[value.raw=/${source}/]`, message },
  ];
});

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "no-restricted-syntax": ["error", ...designSystemRestrictions],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: [...ESLINT_EXEMPT_GLOBS, "**/*.test.{ts,tsx}"],
    rules: { "no-restricted-syntax": "off" },
  },
  eslintPluginPrettier,
);
