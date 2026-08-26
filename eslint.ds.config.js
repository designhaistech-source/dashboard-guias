/**
 * Configuração enxuta usada no CI (`bun run lint:ds`): aplica apenas os
 * guardrails do design system, sem as regras de estilo/prettier do lint geral.
 */
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

import {
  DESIGN_SYSTEM_RULES,
  ESLINT_EXEMPT_GLOBS,
} from "./scripts/visual/design-system-rules.mjs";

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
  { ignores: ["dist", ".output", ".vinxi", "node_modules"] },
  {
    // Plugins registrados apenas para que diretivas eslint-disable existentes
    // no código não sejam reportadas como regras desconhecidas.
    plugins: { "react-hooks": reactHooks },
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" },
    },
    rules: { "no-restricted-syntax": ["error", ...designSystemRestrictions] },
  },
  {
    files: [...ESLINT_EXEMPT_GLOBS, "**/*.test.{ts,tsx}"],
    rules: { "no-restricted-syntax": "off" },
  },
);
