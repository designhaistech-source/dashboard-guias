import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/**
 * Design system guardrails: bloqueiam cores fixas e tamanhos arbitrários
 * em classes utilitárias. Mantidos em sincronia com
 * scripts/visual/check-design-tokens.mjs (usado no CI).
 */
const TAILWIND_PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const DS_PATTERNS = [
  {
    source: String.raw`(?:bg|text|border|fill|stroke|ring|shadow|from|via|to)-\[#[0-9a-fA-F]{3,8}\]`,
    message: "Cor hexadecimal inline — use um token semântico de src/styles.css.",
  },
  {
    source: String.raw`(?:bg|text|border|fill|stroke|ring|shadow|from|via|to)-\[(?:rgb|rgba|hsl|hsla|oklch|lab|color-mix)\(`,
    message: "Cor literal inline — use um token semântico de src/styles.css.",
  },
  {
    source: String.raw`(?:^|\s|")(?:bg|text|border|fill|stroke|ring)-(?:white|black)(?:\/\d{1,3})?(?:$|\s|")`,
    message:
      "Branco/preto absoluto — use background, card, foreground ou foreground/50.",
  },
  {
    source: String.raw`(?:bg|text|border|fill|stroke|ring|from|via|to)-(?:${TAILWIND_PALETTE})-\d{2,3}(?:\/\d{1,3})?`,
    message:
      "Cor da paleta padrão do Tailwind — use tokens semânticos (primary, success, warning, cat-1...).",
  },
  {
    source: String.raw`text-\[\d+(?:\.\d+)?(?:px|rem|em)\]`,
    message: "Tamanho de fonte arbitrário — use a escala (text-xs, text-sm, text-base...).",
  },
  {
    source: String.raw`(?:w|h|size|min-w|min-h|max-w|max-h|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|rounded|leading|tracking)-\[-?\d+(?:\.\d+)?(?:px|rem|em)\]`,
    message:
      "Tamanho arbitrário — use a escala de espaçamento/raio (ex.: w-45, min-h-100, rounded-lg).",
  },
];

const designSystemRestrictions = DS_PATTERNS.flatMap(({ source, message }) => [
  { selector: `Literal[value=/${source}/]`, message },
  { selector: `TemplateElement[value.raw=/${source}/]`, message },
]);

/** Arquivos onde valores literais são legítimos (primitivos, docs, fac-símiles de impressão). */
const DS_EXEMPT_FILES = [
  "src/components/ui/**",
  "src/components/form-field.tsx",
  "src/components/app-tabs.ts",
  "src/features/design-system/**",
  "src/lib/error-page.ts",
  "src/routes/emitir.tsx",
  "src/features/guides/components/guide-print-primitives.tsx",
  "src/features/guides/**/*-guide-preview.tsx",
  "scripts/**",
  "e2e/**",
];

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
    files: DS_EXEMPT_FILES,
    rules: { "no-restricted-syntax": "off" },
  },
  eslintPluginPrettier,
);
